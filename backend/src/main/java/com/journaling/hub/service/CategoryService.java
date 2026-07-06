package com.journaling.hub.service;

import com.journaling.hub.entity.Category;

import java.util.List;

/**
 * 分类服务接口
 */
public interface CategoryService {

    /**
     * 获取所有分类（按类型筛选）
     */
    List<Category> listByType(String type);

    /**
     * 获取所有启用的分类
     */
    List<Category> listActiveByType(String type);

    /**
     * 根据 ID 获取分类
     */
    Category getById(Long id);

    /**
     * 新增分类
     */
    Category create(Category category);

    /**
     * 更新分类
     */
    Category update(Long id, Category category);

    /**
     * 删除分类
     */
    void delete(Long id);
}
