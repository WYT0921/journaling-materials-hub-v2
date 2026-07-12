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
    public IPage<Material> listMaterials(int page, int limit, String materialType, String category, String keyword, String sortBy) {
        Page<Material> pageParam = new Page<>(page, limit);

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Material::getStatus, 1);

        if (materialType != null && !materialType.isEmpty()) {
            validateMaterialType(materialType);
            wrapper.eq(Material::getMaterialType, materialType);
        }

        if (category != null && !category.isEmpty()) {
            wrapper.eq(Material::getCategory, category);
        }

        // 多关键词搜索（空格分隔，AND 关系提高精度）
        if (keyword != null && !keyword.isEmpty()) {
            String[] keywords = keyword.trim().split("\\s+");
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

    private void validateMaterialType(String materialType) {
        if (!"single".equals(materialType) && !"bundle".equals(materialType)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "素材类型必须为 single 或 bundle");
        }
    }
}
