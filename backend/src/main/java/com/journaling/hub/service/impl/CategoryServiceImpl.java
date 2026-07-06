package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.Category;
import com.journaling.hub.mapper.CategoryMapper;
import com.journaling.hub.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 分类服务实现
 */
@Slf4j
@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<Category> listByType(String type) {
        return categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getType, type)
                        .orderByAsc(Category::getSortOrder)
        );
    }

    @Override
    public List<Category> listActiveByType(String type) {
        return categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getType, type)
                        .eq(Category::getStatus, 1)
                        .orderByAsc(Category::getSortOrder)
        );
    }

    @Override
    public Category getById(Long id) {
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return category;
    }

    @Override
    public Category create(Category category) {
        categoryMapper.insert(category);
        log.info("分类创建成功: id={}, name={}, type={}", category.getId(), category.getName(), category.getType());
        return category;
    }

    @Override
    public Category update(Long id, Category category) {
        Category existing = getById(id);
        if (category.getName() != null) {
            existing.setName(category.getName());
        }
        if (category.getStatus() != null) {
            existing.setStatus(category.getStatus());
        }
        if (category.getSortOrder() != null) {
            existing.setSortOrder(category.getSortOrder());
        }
        categoryMapper.updateById(existing);
        return existing;
    }

    @Override
    public void delete(Long id) {
        Category existing = getById(id);
        categoryMapper.deleteById(existing.getId());
        log.info("分类删除成功: id={}, name={}", id, existing.getName());
    }
}
