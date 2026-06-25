package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Material;
import com.journaling.hub.service.MaterialService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 素材控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    @Autowired
    private MaterialService materialService;

    /**
     * 获取素材列表
     */
    @GetMapping
    public Result<?> listMaterials(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "default") String sortBy,
            HttpServletRequest request) {

        IPage<Material> materials = materialService.listMaterials(page, limit, category, keyword, sortBy);

        // 处理付费内容模糊化
        Boolean isPremium = (Boolean) request.getAttribute("isPremium");
        boolean premium = isPremium != null && isPremium;

        materials.getRecords().forEach(material -> {
            if (Boolean.TRUE.equals(material.getIsPremium()) && !premium) {
                // 非会员看到模糊化的缩略图
                material.setImageUrl(material.getThumbnailUrl());
            }
        });

        return Result.ok(PageResult.from(materials));
    }

    /**
     * 搜索素材
     */
    @GetMapping("/search")
    public Result<?> searchMaterials(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        IPage<Material> materials = materialService.searchMaterials(keyword, page, limit);
        return Result.ok(PageResult.from(materials));
    }

    /**
     * 获取所有分类
     */
    @GetMapping("/categories")
    public Result<?> getCategories() {
        List<Map<String, Object>> categories = materialService.getCategories();
        return Result.ok(categories);
    }

    /**
     * 获取素材详情
     */
    @GetMapping("/{id}")
    public Result<?> getDetail(@PathVariable Long id, HttpServletRequest request) {
        Material material = materialService.getDetail(id);

        // 处理付费内容模糊化
        Boolean isPremium = (Boolean) request.getAttribute("isPremium");
        boolean premium = isPremium != null && isPremium;

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", material.getId());
        result.put("title", material.getTitle());
        result.put("description", material.getDescription());
        result.put("imageUrl", material.getImageUrl());
        result.put("thumbnailUrl", material.getThumbnailUrl());
        result.put("category", material.getCategory());
        result.put("tags", material.getTags());
        result.put("isPremium", material.getIsPremium());
        result.put("downloadCount", material.getDownloadCount());
        result.put("createdAt", material.getCreatedAt());

        // 标记是否需要模糊化
        boolean isBlurred = Boolean.TRUE.equals(material.getIsPremium()) && !premium;
        result.put("isBlurred", isBlurred);

        if (isBlurred) {
            result.put("imageUrl", material.getThumbnailUrl());
        }

        return Result.ok(result);
    }
}
