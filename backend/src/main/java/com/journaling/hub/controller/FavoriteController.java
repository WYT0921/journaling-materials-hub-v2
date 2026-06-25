package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Favorite;
import com.journaling.hub.service.FavoriteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 收藏控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    /**
     * 切换收藏（POST /api/v2/favorites/toggle?materialId=xxx）
     */
    @PostMapping("/toggle")
    public Result<?> toggleFavorite(
            @RequestParam Long materialId,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return Result.error("请先登录", 401);
        }
        boolean isFavorited = favoriteService.toggleFavorite(userId, materialId);
        Map<String, Object> result = new HashMap<>();
        result.put("isFavorited", isFavorited);
        result.put("materialId", materialId);
        return Result.ok(result);
    }

    /**
     * 检查是否已收藏
     */
    @GetMapping("/check/{materialId}")
    public Result<?> checkFavorite(
            @PathVariable Long materialId,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return Result.ok(new HashMap<String, Object>() {{
                put("isFavorited", false);
            }});
        }
        boolean isFavorited = favoriteService.isFavorited(userId, materialId);
        Map<String, Object> result = new HashMap<>();
        result.put("isFavorited", isFavorited);
        return Result.ok(result);
    }

    /**
     * 获取收藏列表（分页）
     */
    @GetMapping
    public Result<?> getFavorites(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return Result.error("请先登录", 401);
        }
        IPage<Favorite> favorites = favoriteService.getUserFavorites(userId, page, limit);
        return Result.ok(PageResult.from(favorites));
    }
}
