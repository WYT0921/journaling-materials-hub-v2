package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AdminCategoryController 测试
 */
@DisplayName("AdminCategoryController")
class AdminCategoryControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("管理员 JWT — GET /api/v2/admin/categories 返回分类列表")
    void listCategories_shouldReturnAll() throws Exception {
        mockMvc.perform(get("/api/v2/admin/categories")
                        .header("Authorization", adminJwtToken())
                        .param("type", "material"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("管理员 JWT — GET /api/v2/admin/categories/active 返回启用分类")
    void listActive_shouldReturnOnlyActive() throws Exception {
        mockMvc.perform(get("/api/v2/admin/categories/active")
                        .header("Authorization", adminJwtToken())
                        .param("type", "material"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("管理员 JWT — POST /api/v2/admin/categories 新增分类")
    void create_shouldSucceed() throws Exception {
        String body = "{\"name\":\"新分类\",\"type\":\"material\",\"status\":1,\"sortOrder\":10}";
        mockMvc.perform(post("/api/v2/admin/categories")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("新分类"));
    }

    @Test
    @DisplayName("管理员 JWT — PUT /api/v2/admin/categories/{id} 编辑分类")
    void update_shouldSucceed() throws Exception {
        String body = "{\"name\":\"修改后的分类\"}";
        mockMvc.perform(put("/api/v2/admin/categories/1")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 JWT — DELETE /api/v2/admin/categories/{id} 删除分类")
    void delete_shouldSucceed() throws Exception {
        // 删除分类 ID=5（已禁用分类）
        mockMvc.perform(delete("/api/v2/admin/categories/5")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("无 token — 分类接口返回 401")
    void noToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v2/admin/categories")
                        .param("type", "material"))
                .andExpect(status().isUnauthorized());
    }
}
