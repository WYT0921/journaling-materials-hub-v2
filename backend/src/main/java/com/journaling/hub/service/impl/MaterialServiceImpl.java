package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.Category;
import com.journaling.hub.entity.Material;
import com.journaling.hub.mapper.CategoryMapper;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.service.MaterialService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 素材服务实现
 */
@Slf4j
@Service
public class MaterialServiceImpl implements MaterialService {

    @Autowired
    private MaterialMapper materialMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public IPage<Material> listMaterials(int page, int limit, String materialType, String category,
                                         String keyword, String sortBy, Integer issueYear, Integer issueNumber) {
        Page<Material> pageParam = new Page<>(page, limit);
        String normalizedKeyword = normalizeOptionalKeyword(keyword);
        validateIssue(issueYear, issueNumber);

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Material::getStatus, 1);

        if (materialType != null && !materialType.isEmpty()) {
            validateMaterialType(materialType);
            wrapper.eq(Material::getMaterialType, materialType);
        }

        if (category != null && !category.isEmpty()) {
            wrapper.eq(Material::getCategory, category);
        }

        if (issueYear != null) {
            wrapper.eq(Material::getIssueYear, issueYear)
                    .eq(Material::getIssueNumber, issueNumber);
        }

        // 多关键词搜索（空格分隔，AND 关系提高精度）
        if (normalizedKeyword != null) {
            String[] keywords = normalizedKeyword.split("\\s+");
            wrapper.and(w -> {
                for (int i = 0; i < keywords.length; i++) {
                    final String kw = keywords[i];
                    if (i == 0) {
                        w.like(Material::getTitle, kw)
                                .or().like(Material::getDescription, kw);
                    } else {
                        w.and(w2 -> w2
                                .like(Material::getTitle, kw)
                                .or()
                                .like(Material::getDescription, kw)
                        );
                    }
                }
            });
        }

        // 动态排序
        if ("downloads".equals(sortBy)) {
            wrapper.orderByDesc(Material::getDownloadCount)
                    .orderByDesc(Material::getCreatedAt);
        } else if ("newest".equals(sortBy)) {
            wrapper.orderByDesc(Material::getCreatedAt);
        } else {
            // default: 综合排序（按 sort_order 再按时间）
            wrapper.orderByDesc(Material::getSortOrder)
                    .orderByDesc(Material::getCreatedAt);
        }

        return materialMapper.selectPage(pageParam, wrapper);
    }

    @Override
    public Material getDetail(Long id) {
        Material material = materialMapper.selectById(id);
        if (material == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        if (material.getStatus() != 1) {
            throw new BusinessException(ErrorCode.MATERIAL_OFFLINE);
        }
        return material;
    }

    @Override
    public IPage<Material> searchMaterials(String keyword, int page, int limit) {
        Page<Material> pageParam = new Page<>(page, limit);
        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Material::getStatus, 1);
        if (keyword != null && !keyword.trim().isEmpty()) {
            wrapper.and(w -> w
                    .like(Material::getTitle, keyword)
                    .or()
                    .like(Material::getDescription, keyword));
        }
        wrapper.orderByDesc(Material::getSortOrder)
               .orderByDesc(Material::getCreatedAt);
        return materialMapper.selectPage(pageParam, wrapper);
    }

    @Override
    public List<Map<String, Object>> getCategories(String materialType) {
        if (materialType != null && !materialType.isEmpty()) {
            validateMaterialType(materialType);
        }

        List<Category> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getType, "material")
                        .eq(Category::getStatus, 1)
                        .orderByAsc(Category::getSortOrder)
        );

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<Material>()
                .eq(Material::getStatus, 1)
                .select(Material::getCategory);

        if (materialType != null && !materialType.isEmpty()) {
            wrapper.eq(Material::getMaterialType, materialType);
        }

        Map<String, Long> categoryCounts = materialMapper.selectList(wrapper).stream()
                .filter(material -> material.getCategory() != null && !material.getCategory().isEmpty())
                .collect(Collectors.groupingBy(Material::getCategory, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        categories.forEach(category -> {
            Map<String, Object> item = new HashMap<>();
            item.put("category", category.getName());
            item.put("name", category.getName());
            item.put("count", categoryCounts.getOrDefault(category.getName(), 0L));
            result.add(item);
        });
        return result;
    }

    @Override
    public List<Map<String, Object>> getIssues(String materialType) {
        if (materialType != null && !materialType.isEmpty()) {
            validateMaterialType(materialType);
        }

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<Material>()
                .eq(Material::getStatus, 1)
                .isNotNull(Material::getIssueYear)
                .isNotNull(Material::getIssueNumber)
                .select(Material::getIssueYear, Material::getIssueNumber);
        if (materialType != null && !materialType.isEmpty()) {
            wrapper.eq(Material::getMaterialType, materialType);
        }

        Map<String, Long> counts = materialMapper.selectList(wrapper).stream()
                .collect(Collectors.groupingBy(
                        material -> material.getIssueYear() + ":" + material.getIssueNumber(),
                        Collectors.counting()));

        return counts.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split(":");
                    int year = Integer.parseInt(parts[0]);
                    int number = Integer.parseInt(parts[1]);
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("issueYear", year);
                    item.put("issueNumber", number);
                    item.put("label", year + "年第" + toChineseNumber(number) + "期");
                    item.put("count", entry.getValue());
                    return item;
                })
                .sorted(Comparator
                        .comparing((Map<String, Object> item) -> (Integer) item.get("issueYear")).reversed()
                        .thenComparing(item -> (Integer) item.get("issueNumber"), Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    private void validateMaterialType(String materialType) {
        if (!"single".equals(materialType) && !"bundle".equals(materialType)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "素材类型必须为 single 或 bundle");
        }
    }

    private void validateIssue(Integer issueYear, Integer issueNumber) {
        if ((issueYear == null) != (issueNumber == null)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "年份和期号必须同时提供");
        }
        if (issueYear != null && (issueYear < 1000 || issueYear > 9999)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "年份必须为四位数字");
        }
        if (issueNumber != null && issueNumber <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "期号必须大于 0");
        }
    }

    private String toChineseNumber(int number) {
        String[] digits = {"零", "一", "二", "三", "四", "五", "六", "七", "八", "九"};
        String[] units = {"", "十", "百", "千", "万", "十", "百", "千", "亿"};
        String value = String.valueOf(number);
        StringBuilder result = new StringBuilder();
        boolean pendingZero = false;
        for (int i = 0; i < value.length(); i++) {
            int digit = value.charAt(i) - '0';
            int position = value.length() - i - 1;
            if (digit == 0) {
                pendingZero = result.length() > 0;
                continue;
            }
            if (pendingZero) {
                result.append(digits[0]);
                pendingZero = false;
            }
            if (!(digit == 1 && position == 1 && result.length() == 0)) {
                result.append(digits[digit]);
            }
            result.append(units[position]);
        }
        return result.toString();
    }

    private String normalizeOptionalKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String normalized = keyword.trim();
        if (normalized.isEmpty()
                || "undefined".equalsIgnoreCase(normalized)
                || "null".equalsIgnoreCase(normalized)) {
            return null;
        }
        return normalized;
    }
}
