package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * FavoriteController 测试
 */
@DisplayName("FavoriteController")
class FavoriteControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("POST /api/v2/favorites/toggle — 收藏素材")
    void toggleFavorite_add_shouldReturnTrue() throws Exception {
        mockMvc.perform(post("/api/v2/favorites/toggle")
                        .header("Authorization", normalUserToken())
                        .param("materialId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isFavorited").value(true));
    }

    @Test
    @DisplayName("POST /api/v2/favorites/toggle — 取消收藏")
    void toggleFavorite_remove_shouldReturnFalse() throws Exception {
        // 先收藏一个不同的素材
        mockMvc.perform(post("/api/v2/favorites/toggle")
                        .header("Authorization", normalUserToken())
                        .param("materialId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFavorited").value(true));
        // 再取消
        mockMvc.perform(post("/api/v2/favorites/toggle")
                        .header("Authorization", normalUserToken())
                        .param("materialId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFavorited").value(false));
    }

    @Test
    @DisplayName("POST /api/v2/favorites/toggle — 无 Token 返回 401")
    void toggleFavorite_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(post("/api/v2/favorites/toggle")
                        .param("materialId", "1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v2/favorites/check/{materialId} — 未收藏返回 false")
    void checkFavorite_notFavorited_shouldReturnFalse() throws Exception {
        mockMvc.perform(get("/api/v2/favorites/check/3")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFavorited").value(false));
    }

    @Test
    @DisplayName("GET /api/v2/favorites — 获取收藏列表")
    void getFavorites_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/v2/favorites")
                        .header("Authorization", normalUserToken())
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.total").isNumber());
    }
}
