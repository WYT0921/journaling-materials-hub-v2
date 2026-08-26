package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.entity.MusicCardAsset;
import com.journaling.hub.entity.MusicPlayerTemplate;
import com.journaling.hub.service.MusicCardService;
import org.springframework.web.bind.annotation.*;

/**
 * 管理后台 — 音乐卡片模板 / 素材 / 作品管理
 */
@RestController
@RequestMapping("/api/v2/admin/music-card")
public class AdminMusicCardController {

    private final MusicCardService service;

    public AdminMusicCardController(MusicCardService service) { this.service = service; }

    // ---- 模板管理 ----
    @GetMapping("/templates")
    public Result<?> listTemplates(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(service.listTemplatesAdmin(page, limit));
    }

    @PostMapping("/templates")
    public Result<?> createTemplate(@RequestBody MusicPlayerTemplate template) {
        return Result.ok(service.createTemplate(template));
    }

    @PutMapping("/templates/{id}")
    public Result<?> updateTemplate(@PathVariable Long id, @RequestBody MusicPlayerTemplate template) {
        return Result.ok(service.updateTemplate(id, template));
    }

    @PutMapping("/templates/{id}/status")
    public Result<?> updateTemplateStatus(@PathVariable Long id, @RequestParam Integer status) {
        service.updateTemplateStatus(id, status);
        return Result.ok();
    }

    @DeleteMapping("/templates/{id}")
    public Result<?> deleteTemplate(@PathVariable Long id) {
        service.deleteTemplate(id);
        return Result.ok();
    }

    // ---- 素材管理 ----
    @GetMapping("/assets")
    public Result<?> listAssets(@RequestParam(required = false) String type,
                                @RequestParam(required = false) String category,
                                @RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(service.listAssetsAdmin(type, category, page, limit));
    }

    @PostMapping("/assets")
    public Result<?> createAsset(@RequestBody MusicCardAsset asset) {
        return Result.ok(service.createAsset(asset));
    }

    @PutMapping("/assets/{id}")
    public Result<?> updateAsset(@PathVariable Long id, @RequestBody MusicCardAsset asset) {
        return Result.ok(service.updateAsset(id, asset));
    }

    @PutMapping("/assets/{id}/status")
    public Result<?> updateAssetStatus(@PathVariable Long id, @RequestParam Integer status) {
        service.updateAssetStatus(id, status);
        return Result.ok();
    }

    @DeleteMapping("/assets/{id}")
    public Result<?> deleteAsset(@PathVariable Long id) {
        service.deleteAsset(id);
        return Result.ok();
    }

    // ---- 用户作品 ----
    @GetMapping("/creations")
    public Result<?> listCreations(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(service.listAllCreationsAdmin(page, limit));
    }
}
