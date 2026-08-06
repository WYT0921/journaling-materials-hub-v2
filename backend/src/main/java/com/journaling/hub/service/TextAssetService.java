package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.dto.TextAssetRequest;
import com.journaling.hub.dto.TextAssetResponse;
import com.journaling.hub.entity.Category;
import com.journaling.hub.entity.TextAsset;
import com.journaling.hub.mapper.CategoryMapper;
import com.journaling.hub.mapper.TextAssetMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class TextAssetService {
    private static final Set<String> TYPES = Set.of("kaomoji", "emoji");
    private static final Set<String> SOURCES = Set.of("manual", "cuteinternet", "emojidb");
    private static final Set<String> RISK_LEVELS = Set.of("safe", "mild");
    private static final Set<Integer> STATUSES = Set.of(0, 1, 2, 3);
    private static final Pattern URL_PATTERN = Pattern.compile("(?i)(https?://|www\\.)\\S+");
    private static final Pattern FORBIDDEN_CONTROL = Pattern.compile("[\\p{Cc}&&[^\\n\\t]]");
    private static final Pattern BLOCKED_TERMS = Pattern.compile(
            "(?i)(porn|nude|sex|suicide|self[- ]?harm|kill yourself|nazi|terrorist|色情|裸照|性爱|自杀|自残|纳粹|恐怖主义)");
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};

    private final TextAssetMapper textAssetMapper;
    private final CategoryMapper categoryMapper;
    private final ObjectMapper objectMapper;

    public TextAssetService(TextAssetMapper textAssetMapper, CategoryMapper categoryMapper, ObjectMapper objectMapper) {
        this.textAssetMapper = textAssetMapper;
        this.categoryMapper = categoryMapper;
        this.objectMapper = objectMapper;
    }

    public PageResult<TextAssetResponse> listPublished(String type, String category, String keyword, int page, int limit) {
        validateType(type);
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        LambdaQueryWrapper<TextAsset> wrapper = buildFilter(type, category, keyword, 1, null, null);
        wrapper.orderByAsc(TextAsset::getSortOrder).orderByDesc(TextAsset::getId);
        IPage<TextAsset> result = textAssetMapper.selectPage(new Page<>(safePage, safeLimit), wrapper);
        List<TextAssetResponse> responses = result.getRecords().stream().map(this::toPublicResponse).toList();
        return new PageResult<>(responses, result.getTotal(), result.getCurrent(), result.getSize());
    }

    public List<Map<String, Object>> listCategoryCounts(String type) {
        validateType(type);
        List<Category> categories = categoryMapper.selectList(new LambdaQueryWrapper<Category>()
                .eq(Category::getType, type).eq(Category::getStatus, 1).orderByAsc(Category::getSortOrder));
        return categories.stream().map(category -> {
            long count = textAssetMapper.selectCount(new LambdaQueryWrapper<TextAsset>()
                    .eq(TextAsset::getType, type).eq(TextAsset::getCategory, category.getName()).eq(TextAsset::getStatus, 1));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", category.getName());
            item.put("count", count);
            item.put("sortOrder", category.getSortOrder());
            return item;
        }).toList();
    }

    public PageResult<TextAsset> listAdmin(String type, String category, String keyword, Integer status,
                                           String source, String riskLevel, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        if (StringUtils.hasText(type)) validateType(type);
        LambdaQueryWrapper<TextAsset> wrapper = buildFilter(type, category, keyword, status, source, riskLevel);
        wrapper.orderByDesc(TextAsset::getCreatedAt);
        return PageResult.from(textAssetMapper.selectPage(new Page<>(safePage, safeLimit), wrapper));
    }

    @Transactional
    public TextAsset create(TextAssetRequest request, boolean forcePending) {
        TextAsset asset = new TextAsset();
        apply(asset, request, true);
        if (forcePending) asset.setStatus(0);
        try {
            textAssetMapper.insert(asset);
        } catch (DuplicateKeyException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "内容已存在");
        }
        return asset;
    }

    @Transactional
    public TextAsset update(Long id, TextAssetRequest request) {
        TextAsset asset = requireAsset(id);
        apply(asset, request, false);
        try {
            textAssetMapper.updateById(asset);
        } catch (DuplicateKeyException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "内容已存在");
        }
        return asset;
    }

    public TextAsset updateStatus(Long id, Integer status) {
        validateStatus(status);
        TextAsset asset = requireAsset(id);
        asset.setStatus(status);
        textAssetMapper.updateById(asset);
        return asset;
    }

    public int batchUpdateStatus(List<Long> ids, Integer status) {
        validateStatus(status);
        if (ids == null || ids.isEmpty() || ids.size() > 500) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "请选择 1 到 500 条数据");
        }
        int updated = 0;
        for (Long id : new LinkedHashSet<>(ids)) {
            if (id != null && textAssetMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<TextAsset>()
                    .eq(TextAsset::getId, id).set(TextAsset::getStatus, status)) > 0) updated++;
        }
        return updated;
    }

    public void delete(Long id) {
        if (textAssetMapper.deleteById(id) == 0) throw new BusinessException(ErrorCode.NOT_FOUND);
    }

    public Map<String, Object> importItems(List<TextAssetRequest> items) {
        if (items == null || items.isEmpty() || items.size() > 500) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "每批必须包含 1 到 500 条数据");
        }
        int inserted = 0, duplicates = 0, filtered = 0, failed = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        for (int index = 0; index < items.size(); index++) {
            TextAssetRequest item = items.get(index);
            try {
                String normalized = normalize(item == null ? null : item.getContent());
                String rejection = rejectionReason(normalized);
                if (rejection != null) {
                    filtered++;
                    errors.add(error(index, rejection));
                    continue;
                }
                if (textAssetMapper.selectCount(new LambdaQueryWrapper<TextAsset>().eq(TextAsset::getContentHash, hash(normalized))) > 0) {
                    duplicates++;
                    continue;
                }
                create(item, true);
                inserted++;
            } catch (BusinessException exception) {
                failed++;
                errors.add(error(index, exception.getMessage()));
            } catch (Exception exception) {
                failed++;
                errors.add(error(index, "导入失败"));
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("inserted", inserted);
        result.put("duplicates", duplicates);
        result.put("filtered", filtered);
        result.put("failed", failed);
        result.put("errors", errors);
        return result;
    }

    public String normalize(String content) {
        if (content == null) return "";
        return Normalizer.normalize(content.replace("\r\n", "\n").replace('\r', '\n'), Normalizer.Form.NFC).trim();
    }

    public String hash(String normalizedContent) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(normalizedContent.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private void apply(TextAsset asset, TextAssetRequest request, boolean creating) {
        if (request == null) throw new BusinessException(ErrorCode.BAD_REQUEST, "请求不能为空");
        String content = request.getContent() != null || creating ? normalize(request.getContent()) : asset.getContent();
        String type = request.getType() != null || creating ? request.getType() : asset.getType();
        String category = request.getCategory() != null || creating ? request.getCategory() : asset.getCategory();
        String source = request.getSource() != null ? request.getSource() : creating ? "manual" : asset.getSource();
        String riskLevel = request.getRiskLevel() != null ? request.getRiskLevel() : creating ? "safe" : asset.getRiskLevel();

        String rejection = rejectionReason(content);
        if (rejection != null) throw new BusinessException(ErrorCode.BAD_REQUEST, rejection);
        validateType(type);
        validateCategory(type, category);
        if (!SOURCES.contains(source)) throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的来源");
        if (!RISK_LEVELS.contains(riskLevel)) throw new BusinessException(ErrorCode.BAD_REQUEST, "风险等级必须为 safe 或 mild");
        validateTags(request.getTags());

        asset.setContent(content);
        asset.setContentHash(hash(content));
        asset.setType(type);
        asset.setCategory(category);
        asset.setTags(request.getTags() != null ? writeTags(request.getTags()) : creating ? "[]" : asset.getTags());
        asset.setSource(source);
        asset.setSourceUrl(request.getSourceUrl() != null ? request.getSourceUrl() : creating ? null : asset.getSourceUrl());
        asset.setRiskLevel(riskLevel);
        asset.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : creating ? 0 : asset.getSortOrder());
        Integer status = request.getStatus() != null ? request.getStatus() : creating ? 0 : asset.getStatus();
        validateStatus(status);
        asset.setStatus(status);
    }

    private LambdaQueryWrapper<TextAsset> buildFilter(String type, String category, String keyword, Integer status,
                                                       String source, String riskLevel) {
        LambdaQueryWrapper<TextAsset> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(type)) wrapper.eq(TextAsset::getType, type);
        if (StringUtils.hasText(category)) wrapper.eq(TextAsset::getCategory, category);
        if (status != null) wrapper.eq(TextAsset::getStatus, status);
        if (StringUtils.hasText(source)) wrapper.eq(TextAsset::getSource, source);
        if (StringUtils.hasText(riskLevel)) wrapper.eq(TextAsset::getRiskLevel, riskLevel);
        if (StringUtils.hasText(keyword)) {
            String value = keyword.trim();
            wrapper.and(query -> query.like(TextAsset::getContent, value).or().like(TextAsset::getCategory, value).or().like(TextAsset::getTags, value));
        }
        return wrapper;
    }

    private String rejectionReason(String content) {
        if (!StringUtils.hasText(content)) return "内容不能为空";
        if (content.codePointCount(0, content.length()) > 1000) return "内容不能超过 1000 个字符";
        if (URL_PATTERN.matcher(content).find()) return "内容不能包含 URL";
        if (FORBIDDEN_CONTROL.matcher(content).find()) return "内容包含非法控制字符";
        if (BLOCKED_TERMS.matcher(content).find()) return "内容包含禁止主题";
        long letters = content.codePoints().filter(cp -> Character.isLetter(cp) || Character.isDigit(cp)).count();
        if (content.codePointCount(0, content.length()) > 120 && letters * 100 / content.codePointCount(0, content.length()) > 75) {
            return "普通长段落不属于颜文字或 Emoji 素材";
        }
        return null;
    }

    private void validateType(String type) {
        if (!TYPES.contains(type)) throw new BusinessException(ErrorCode.BAD_REQUEST, "类型必须为 kaomoji 或 emoji");
    }

    private void validateCategory(String type, String category) {
        if (!StringUtils.hasText(category)) throw new BusinessException(ErrorCode.BAD_REQUEST, "分类不能为空");
        long count = categoryMapper.selectCount(new LambdaQueryWrapper<Category>()
                .eq(Category::getType, type).eq(Category::getName, category).eq(Category::getStatus, 1));
        if (count == 0) throw new BusinessException(ErrorCode.BAD_REQUEST, "分类不存在或未启用");
    }

    private void validateTags(List<String> tags) {
        if (tags == null) return;
        if (tags.size() > 20) throw new BusinessException(ErrorCode.BAD_REQUEST, "标签不能超过 20 个");
        if (tags.stream().anyMatch(tag -> tag == null || tag.codePointCount(0, tag.length()) > 32)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "单个标签不能超过 32 个字符");
        }
    }

    private void validateStatus(Integer status) {
        if (status == null || !STATUSES.contains(status)) throw new BusinessException(ErrorCode.BAD_REQUEST, "状态值无效");
    }

    private TextAsset requireAsset(Long id) {
        TextAsset asset = textAssetMapper.selectById(id);
        if (asset == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        return asset;
    }

    private String writeTags(List<String> tags) {
        try {
            return objectMapper.writeValueAsString(tags.stream().map(String::trim).filter(StringUtils::hasText).distinct().toList());
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "标签格式错误");
        }
    }

    private List<String> readTags(String tags) {
        if (!StringUtils.hasText(tags)) return List.of();
        try { return objectMapper.readValue(tags, STRING_LIST); }
        catch (JsonProcessingException exception) { return List.of(); }
    }

    private TextAssetResponse toPublicResponse(TextAsset asset) {
        return new TextAssetResponse(asset.getId(), asset.getContent(), asset.getType(), asset.getCategory(), readTags(asset.getTags()));
    }

    private Map<String, Object> error(int index, String message) {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("index", index);
        error.put("message", message);
        return error;
    }
}
