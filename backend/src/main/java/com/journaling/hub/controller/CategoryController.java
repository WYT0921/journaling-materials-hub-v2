package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Category;
import com.journaling.hub.service.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类公共控制器（无需管理员权限）
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 获取启用的分类列表
     */
    @GetMapping
    public Result<?> listActive(@RequestParam String type) {
        List<Category> categories = categoryService.listActiveByType(type);
        return Result.ok(categories);
    }
}
