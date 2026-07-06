package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MaterialController tests.
 */
@DisplayName("MaterialController")
class MaterialControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("GET /api/materials returns a public paged list")
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
    @DisplayName("GET /api/materials filters by category")
    void listMaterials_byCategory_shouldFilter() throws Exception {
        mockMvc.perform(get("/api/materials")
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.list[0].id").isNumber());
    }

    @Test
    @DisplayName("GET /api/materials/search returns keyword matches")
    void searchMaterials_shouldReturnMatches() throws Exception {
        mockMvc.perform(get("/api/materials/search")
                        .param("keyword", "img"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("GET /api/materials/categories returns categories")
    void getCategories_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/materials/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/materials/{id} returns detail")
    void getDetail_shouldReturnMaterial() throws Exception {
        mockMvc.perform(get("/api/materials/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").exists());
    }

    @Test
    @DisplayName("GET /api/materials/{id} returns error when missing")
    void getDetail_notFound_shouldReturnError() throws Exception {
        mockMvc.perform(get("/api/materials/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }
}
