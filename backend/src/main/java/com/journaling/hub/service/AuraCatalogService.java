package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.dto.AuraAssetRequest;
import com.journaling.hub.dto.AuraTemplateRequest;
import com.journaling.hub.entity.AuraAsset;
import com.journaling.hub.entity.AuraTemplate;
import com.journaling.hub.mapper.AuraAssetMapper;
import com.journaling.hub.mapper.AuraTemplateMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class AuraCatalogService {
    private static final Set<String> RATIOS = Set.of("1:1", "4:3", "9:16");
    private static final Set<String> LAYER_TYPES = Set.of("background", "photo", "player", "text", "decoration", "texture");
    private static final Set<String> ASSET_TYPES = Set.of("decoration", "texture", "font");
    private static final Set<String> STYLES = Set.of("fresh", "cute", "vintage", "vinyl", "waveform");
    private static final Set<Integer> STATUSES = Set.of(0, 1);
    private static final Pattern KEY = Pattern.compile("^[a-z0-9][a-z0-9-]{1,63}$");
    private static final Pattern SHA256 = Pattern.compile("^[a-f0-9]{64}$");
    private static final Set<String> CONFIG_FIELDS = Set.of("canvas", "layers", "defaults");
    private static final Set<String> LAYER_FIELDS = Set.of("id", "type", "x", "y", "width", "height", "style", "assetKey", "role", "options");
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {};
    private static final TypeReference<Map<String, Object>> OBJECT_MAP = new TypeReference<>() {};

    private final AuraTemplateMapper templateMapper;
    private final AuraAssetMapper assetMapper;
    private final ObjectMapper objectMapper;

    public AuraCatalogService(AuraTemplateMapper templateMapper, AuraAssetMapper assetMapper, ObjectMapper objectMapper) {
        this.templateMapper = templateMapper;
        this.assetMapper = assetMapper;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> publicCatalog() {
        List<Map<String, Object>> templates = templateMapper.selectList(new LambdaQueryWrapper<AuraTemplate>()
                        .eq(AuraTemplate::getStatus, 1).orderByAsc(AuraTemplate::getSortOrder).orderByAsc(AuraTemplate::getId))
                .stream().map(this::templateResponse).toList();
        List<Map<String, Object>> assets = assetMapper.selectList(new LambdaQueryWrapper<AuraAsset>()
                        .eq(AuraAsset::getStatus, 1).orderByAsc(AuraAsset::getSortOrder).orderByAsc(AuraAsset::getId))
                .stream().map(this::assetResponse).toList();
        Map<String, Object> catalog = new LinkedHashMap<>();
        catalog.put("schemaVersion", 1);
        catalog.put("catalogVersion", catalogVersion(templates, assets));
        catalog.put("generatedAt", Instant.now().toString());
        catalog.put("templates", templates);
        catalog.put("assets", assets);
        return catalog;
    }

    public String etag(Map<String, Object> catalog) {
        return "\"" + catalog.get("catalogVersion") + "\"";
    }

    public List<AuraTemplate> listTemplatesAdmin() {
        return templateMapper.selectList(new LambdaQueryWrapper<AuraTemplate>().orderByAsc(AuraTemplate::getSortOrder).orderByAsc(AuraTemplate::getId));
    }

    public List<AuraAsset> listAssetsAdmin(String type) {
        LambdaQueryWrapper<AuraAsset> wrapper = new LambdaQueryWrapper<AuraAsset>().orderByAsc(AuraAsset::getSortOrder).orderByAsc(AuraAsset::getId);
        if (StringUtils.hasText(type)) {
            validateAssetType(type);
            wrapper.eq(AuraAsset::getType, type);
        }
        return assetMapper.selectList(wrapper);
    }

    @Transactional
    public AuraTemplate createTemplate(AuraTemplateRequest request) {
        AuraTemplate item = new AuraTemplate();
        applyTemplate(item, request, true);
        insert(() -> templateMapper.insert(item), "模板键已存在");
        return item;
    }

    @Transactional
    public AuraTemplate updateTemplate(Long id, AuraTemplateRequest request) {
        AuraTemplate item = requireTemplate(id);
        applyTemplate(item, request, false);
        insert(() -> templateMapper.updateById(item), "模板键已存在");
        return item;
    }

    public AuraTemplate setTemplateStatus(Long id, Integer status) {
        validateStatus(status);
        AuraTemplate item = requireTemplate(id);
        item.setStatus(status);
        templateMapper.updateById(item);
        return item;
    }

    public void deleteTemplate(Long id) {
        if (templateMapper.deleteById(id) == 0) throw new BusinessException(ErrorCode.NOT_FOUND);
    }

    @Transactional
    public AuraAsset createAsset(AuraAssetRequest request) {
        AuraAsset item = new AuraAsset();
        applyAsset(item, request, true);
        insert(() -> assetMapper.insert(item), "资源键已存在");
        return item;
    }

    @Transactional
    public AuraAsset updateAsset(Long id, AuraAssetRequest request) {
        AuraAsset item = requireAsset(id);
        applyAsset(item, request, false);
        insert(() -> assetMapper.updateById(item), "资源键已存在");
        return item;
    }

    public AuraAsset setAssetStatus(Long id, Integer status) {
        validateStatus(status);
        AuraAsset item = requireAsset(id);
        item.setStatus(status);
        assetMapper.updateById(item);
        return item;
    }

    public void deleteAsset(Long id) {
        if (assetMapper.deleteById(id) == 0) throw new BusinessException(ErrorCode.NOT_FOUND);
    }

    private void applyTemplate(AuraTemplate item, AuraTemplateRequest request, boolean creating) {
        if (request == null) bad("请求不能为空");
        String key = choose(request.getTemplateKey(), item.getTemplateKey(), creating);
        String name = choose(request.getName(), item.getName(), creating);
        String style = choose(request.getStyle(), item.getStyle(), creating);
        if (!StringUtils.hasText(key) || !KEY.matcher(key).matches()) bad("模板键只能包含小写字母、数字和连字符");
        if (!StringUtils.hasText(name) || name.length() > 100) bad("模板名称长度必须为 1 到 100 个字符");
        if (!STYLES.contains(style)) bad("模板风格无效");
        List<String> ratios = request.getSupportedRatios() != null ? request.getSupportedRatios() : read(item.getSupportedRatios(), STRING_LIST, List.of());
        if (ratios.isEmpty() || !RATIOS.containsAll(ratios)) bad("支持比例必须来自 1:1、4:3、9:16");
        Map<String, Object> config = request.getConfig() != null ? request.getConfig() : read(item.getConfigJson(), OBJECT_MAP, Map.of());
        validateConfig(config);
        item.setTemplateKey(key);
        item.setName(name);
        item.setStyle(style);
        item.setPreviewUrl(request.getPreviewUrl() != null ? request.getPreviewUrl() : item.getPreviewUrl());
        item.setSupportedRatios(write(new ArrayList<>(new LinkedHashSet<>(ratios))));
        item.setConfigJson(write(config));
        item.setConfigVersion(orDefault(request.getConfigVersion(), item.getConfigVersion(), 1));
        item.setStatus(orDefault(request.getStatus(), item.getStatus(), 0));
        item.setSortOrder(orDefault(request.getSortOrder(), item.getSortOrder(), 0));
        validatePositive(item.getConfigVersion(), "配置版本");
        validateStatus(item.getStatus());
    }

    private void applyAsset(AuraAsset item, AuraAssetRequest request, boolean creating) {
        if (request == null) bad("请求不能为空");
        String key = choose(request.getAssetKey(), item.getAssetKey(), creating);
        String name = choose(request.getName(), item.getName(), creating);
        String type = choose(request.getType(), item.getType(), creating);
        String fileUrl = choose(request.getFileUrl(), item.getFileUrl(), creating);
        String sha = choose(request.getSha256(), item.getSha256(), creating);
        if (!StringUtils.hasText(key) || !KEY.matcher(key).matches()) bad("资源键只能包含小写字母、数字和连字符");
        if (!StringUtils.hasText(name) || name.length() > 100) bad("资源名称长度必须为 1 到 100 个字符");
        validateAssetType(type);
        if (!StringUtils.hasText(fileUrl) || fileUrl.length() > 512) bad("资源地址无效");
        if (!StringUtils.hasText(sha) || !SHA256.matcher(sha).matches()) bad("SHA-256 必须为 64 位小写十六进制");
        item.setAssetKey(key);
        item.setName(name);
        item.setType(type);
        item.setFileUrl(fileUrl);
        item.setPreviewUrl(request.getPreviewUrl() != null ? request.getPreviewUrl() : item.getPreviewUrl());
        item.setSha256(sha);
        item.setResourceVersion(orDefault(request.getResourceVersion(), item.getResourceVersion(), 1));
        item.setMetadataJson(request.getMetadata() != null ? write(request.getMetadata()) : item.getMetadataJson());
        item.setStatus(orDefault(request.getStatus(), item.getStatus(), 0));
        item.setSortOrder(orDefault(request.getSortOrder(), item.getSortOrder(), 0));
        validatePositive(item.getResourceVersion(), "资源版本");
        validateStatus(item.getStatus());
    }

    @SuppressWarnings("unchecked")
    private void validateConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) bad("模板配置不能为空");
        if (!CONFIG_FIELDS.containsAll(config.keySet())) bad("模板配置包含未知字段");
        Object layersValue = config.get("layers");
        if (!(layersValue instanceof List<?>)) bad("模板必须包含 1 到 50 个图层");
        List<?> layers = (List<?>) layersValue;
        if (layers.isEmpty() || layers.size() > 50) bad("模板必须包含 1 到 50 个图层");
        Set<String> ids = new HashSet<>();
        for (Object value : layers) {
            if (!(value instanceof Map<?, ?>)) bad("图层格式无效");
            Map<?, ?> raw = (Map<?, ?>) value;
            Map<String, Object> layer = (Map<String, Object>) raw;
            if (!LAYER_FIELDS.containsAll(layer.keySet())) bad("图层包含未知字段");
            String id = Objects.toString(layer.get("id"), "");
            String type = Objects.toString(layer.get("type"), "");
            if (!KEY.matcher(id).matches() || !ids.add(id)) bad("图层 id 无效或重复");
            if (!LAYER_TYPES.contains(type)) bad("图层类型无效");
            for (String coordinate : List.of("x", "y", "width", "height")) {
                Object number = layer.get(coordinate);
                if (number != null && (!(number instanceof Number) || ((Number) number).doubleValue() < 0 || ((Number) number).doubleValue() > 1)) {
                    bad("图层坐标必须位于 0 到 1");
                }
            }
        }
    }

    private Map<String, Object> templateResponse(AuraTemplate item) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("key", item.getTemplateKey());
        value.put("name", item.getName());
        value.put("style", item.getStyle());
        value.put("previewUrl", item.getPreviewUrl());
        value.put("supportedRatios", read(item.getSupportedRatios(), STRING_LIST, List.of()));
        value.put("configVersion", item.getConfigVersion());
        value.put("config", read(item.getConfigJson(), OBJECT_MAP, Map.of()));
        return value;
    }

    private Map<String, Object> assetResponse(AuraAsset item) {
        Map<String, Object> value = new LinkedHashMap<>();
        value.put("key", item.getAssetKey());
        value.put("name", item.getName());
        value.put("type", item.getType());
        value.put("fileUrl", item.getFileUrl());
        value.put("previewUrl", item.getPreviewUrl());
        value.put("sha256", item.getSha256());
        value.put("resourceVersion", item.getResourceVersion());
        value.put("metadata", read(item.getMetadataJson(), OBJECT_MAP, Map.of()));
        return value;
    }

    private String catalogVersion(List<Map<String, Object>> templates, List<Map<String, Object>> assets) {
        try {
            String payload = objectMapper.writeValueAsString(List.of(templates, assets));
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8))).substring(0, 16);
        } catch (JsonProcessingException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private AuraTemplate requireTemplate(Long id) {
        AuraTemplate item = templateMapper.selectById(id);
        if (item == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        return item;
    }

    private AuraAsset requireAsset(Long id) {
        AuraAsset item = assetMapper.selectById(id);
        if (item == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        return item;
    }

    private void validateAssetType(String type) { if (!ASSET_TYPES.contains(type)) bad("资源类型必须为 decoration、texture 或 font"); }
    private void validateStatus(Integer status) { if (status == null || !STATUSES.contains(status)) bad("状态必须为 0 或 1"); }
    private void validatePositive(Integer value, String label) { if (value == null || value < 1) bad(label + "必须大于 0"); }
    private void bad(String message) { throw new BusinessException(ErrorCode.BAD_REQUEST, message); }
    private String choose(String value, String existing, boolean creating) { return value != null || creating ? value : existing; }
    private Integer orDefault(Integer value, Integer existing, Integer fallback) { return value != null ? value : existing != null ? existing : fallback; }
    private String write(Object value) { try { return objectMapper.writeValueAsString(value); } catch (JsonProcessingException exception) { bad("JSON 格式错误"); return "{}"; } }
    private <T> T read(String value, TypeReference<T> type, T fallback) { try { return StringUtils.hasText(value) ? objectMapper.readValue(value, type) : fallback; } catch (JsonProcessingException exception) { return fallback; } }
    private void insert(Runnable operation, String message) { try { operation.run(); } catch (DuplicateKeyException exception) { bad(message); } }
}
