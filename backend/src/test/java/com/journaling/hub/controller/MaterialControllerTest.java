package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MaterialController 测试
 */
@DisplayName("MaterialController")
class MaterialControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("GET /api/materials — 分页列表（无需登录）")
    void listMaterials_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/materials")
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.total").isNumber());
    }

    @Test
    @DisplayName("GET /api/materials — 按分类筛选")
    void listMaterials_byCategory_shouldFilter() throws Exception {
        mockMvc.perform(get("/api/materials")
                        .param("category", "贴纸"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list.length()").value(1));
    }

    @Test
    @DisplayName("GET /api/materials/search — 关键词搜索")
    void searchMaterials_shouldReturnMatches() throws Exception {
        mockMvc.perform(get("/api/materials/search")
                        .param("keyword", "贴纸"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("GET /api/materials/categories — 返回分类列表")
    void getCategories_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/materials/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/materials/{id} — 获取素材详情")
    void getDetail_shouldReturnMaterial() throws Exception {
        mockMvc.perform(get("/api/materials/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("春日花园贴纸"));
    }

    @Test
    @DisplayName("GET /api/materials/{id} — 素材不存在返回错误")
    void getDetail_notFound_shouldReturnError() throws Exception {
        mockMvc.perform(get("/api/materials/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }
}
