package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Material;
import com.journaling.hub.dto.MaterialPublicResponse;
import com.journaling.hub.service.MaterialService;
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
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "default") String sortBy,
            @RequestParam(required = false) Integer issueYear,
            @RequestParam(required = false) Integer issueNumber,
            @RequestParam(required = false) String mediaType) {

        IPage<Material> materials = materialService.listMaterials(
                page, limit, materialType, category, keyword, sortBy, issueYear, issueNumber, mediaType);

        return Result.ok(PageResult.from(materials.convert(MaterialPublicResponse::from)));
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
        return Result.ok(PageResult.from(materials.convert(MaterialPublicResponse::from)));
    }

    /**
     * 获取所有分类
     */
    @GetMapping("/categories")
    public Result<?> getCategories(@RequestParam(required = false) String materialType) {
        List<Map<String, Object>> categories = materialService.getCategories(materialType);
        return Result.ok(categories);
    }

    /**
     * 获取已有上传期数
     */
    @GetMapping("/issues")
    public Result<?> getIssues(@RequestParam(required = false) String materialType) {
        return Result.ok(materialService.getIssues(materialType));
    }

    /**
     * 获取素材详情
     */
    @GetMapping("/{id}")
    public Result<?> getDetail(@PathVariable Long id) {
        Material material = materialService.getDetail(id);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", material.getId());
        result.put("title", material.getTitle());
        result.put("description", material.getDescription());
        result.put("imageUrl", material.getImageUrl());
        result.put("thumbnailUrl", material.getThumbnailUrl());
        result.put("category", material.getCategory());
        result.put("categories", material.getCategories());
        result.put("materialType", material.getMaterialType());
        result.put("mediaType", material.getMediaType());
        result.put("issueYear", material.getIssueYear());
        result.put("issueNumber", material.getIssueNumber());
        result.put("tags", material.getTags());
        result.put("isPremium", material.getIsPremium());
        result.put("downloadCount", material.getDownloadCount());
        result.put("createdAt", material.getCreatedAt());

        result.put("isBlurred", false);

        return Result.ok(result);
    }
}
