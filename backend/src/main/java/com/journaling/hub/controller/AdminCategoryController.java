package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Category;
import com.journaling.hub.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员分类管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/admin/categories")
public class AdminCategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 分类列表（可按类型筛选）
     */
    @GetMapping
    public Result<?> list(@RequestParam(required = false) String type) {
        List<Category> categories;
        if (type != null && !type.isBlank()) {
            categories = categoryService.listByType(type);
        } else {
            // 不传 type 返回所有
            List<Category> material = categoryService.listByType("material");
            List<Category> tool = categoryService.listByType("tool");
            material.addAll(tool);
            categories = material;
        }
        return Result.ok(categories);
    }

    /**
     * 获取启用的分类（供前端表单下拉选择）
     */
    @GetMapping("/active")
    public Result<?> listActive(@RequestParam String type) {
        List<Category> categories = categoryService.listActiveByType(type);
        return Result.ok(categories);
    }

    /**
     * 新增分类
     */
    @PostMapping
    public Result<?> create(@RequestBody Category category) {
        Category created = categoryService.create(category);
        return Result.ok(created);
    }

    /**
     * 编辑分类
     */
    @PutMapping("/{id}")
    public Result<?> update(@PathVariable Long id, @RequestBody Category category) {
        Category updated = categoryService.update(id, category);
        return Result.ok(updated);
    }

    /**
     * 删除分类
     */
    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return Result.ok(null);
    }
}
