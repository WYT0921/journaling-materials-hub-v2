package com.journaling.hub.service;

import com.journaling.hub.entity.Material;
import com.journaling.hub.entity.MaterialCategory;
import com.journaling.hub.mapper.MaterialCategoryMapper;
import com.journaling.hub.mapper.CategoryMapper;
import com.journaling.hub.entity.Category;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaterialCategoryService {
    private final MaterialCategoryMapper mapper;
    private final CategoryMapper categoryMapper;

    public void hydrate(Material material) {
        if (material == null || material.getId() == null) return;
        List<String> categories = mapper.selectByMaterialId(material.getId()).stream().map(MaterialCategory::getCategory).toList();
        if (categories.isEmpty() && material.getCategory() != null && !material.getCategory().isBlank()) categories = List.of(material.getCategory());
        material.setCategories(categories);
    }

    public void hydrate(List<Material> materials) { materials.forEach(this::hydrate); }

    @Transactional
    public List<String> sync(Long materialId, List<String> requested, String legacyCategory) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (requested != null) requested.stream().filter(v -> v != null && !v.isBlank()).map(String::trim).forEach(normalized::add);
        if (normalized.isEmpty() && legacyCategory != null && !legacyCategory.isBlank()) normalized.add(legacyCategory.trim());
        if (normalized.isEmpty()) throw new BusinessException(ErrorCode.BAD_REQUEST, "请至少选择一个分类");
        long validCount = categoryMapper.selectCount(new LambdaQueryWrapper<Category>()
                .eq(Category::getType, "material")
                .eq(Category::getStatus, 1)
                .in(Category::getName, normalized));
        if (validCount != normalized.size()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "分类不存在或未启用");
        }
        mapper.deleteByMaterialId(materialId);
        int index = 0;
        for (String category : normalized) mapper.insert(new MaterialCategory(materialId, category, index++));
        return new ArrayList<>(normalized);
    }
}
