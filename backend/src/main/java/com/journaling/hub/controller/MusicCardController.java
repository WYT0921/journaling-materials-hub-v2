package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.service.MusicCardService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 音乐卡片 — 公开接口（模板/素材）+ 用户作品
 */
@RestController
@RequestMapping("/api/music-card")
public class MusicCardController {

    private final MusicCardService service;

    public MusicCardController(MusicCardService service) { this.service = service; }

    // ---- 公开：模板 ----
    @GetMapping("/templates")
    public Result<?> listTemplates() { return Result.ok(service.listTemplates()); }

    // ---- 公开：装饰素材 ----
    @GetMapping("/assets")
    public Result<?> listAssets(@RequestParam(required = false) String type, @RequestParam(required = false) String category) {
        return Result.ok(service.listAssets(type, category));
    }

    // ---- 需登录：用户作品 ----
    @PostMapping("/creations")
    public Result<?> saveCreation(HttpServletRequest request, @RequestBody Map<String, Object> body) {
        Long userId = (Long) request.getAttribute("userId");
        String title = (String) body.getOrDefault("title", "");
        String canvasSnapshot = (String) body.get("canvasSnapshot");
        String exportUrl = (String) body.getOrDefault("exportUrl", null);
        if (canvasSnapshot == null || canvasSnapshot.isBlank()) return Result.error("缺少画布数据", 400);
        return Result.ok(service.saveCreation(userId, title, canvasSnapshot, exportUrl));
    }

    @GetMapping("/creations")
    public Result<?> listCreations(HttpServletRequest request,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "10") int limit) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.ok(service.listUserCreations(userId, page, limit));
    }

    @DeleteMapping("/creations/{id}")
    public Result<?> deleteCreation(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        service.deleteCreation(userId, id);
        return Result.ok();
    }
}
