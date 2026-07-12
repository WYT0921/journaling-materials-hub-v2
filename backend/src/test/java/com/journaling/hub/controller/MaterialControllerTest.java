package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
                        .param("category", "sticker")
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.list[0].category").value("sticker"));
    }

    @Test
    @DisplayName("GET /api/materials filters by material type")
    void listMaterials_byMaterialType_shouldFilter() throws Exception {
        mockMvc.perform(get("/api/materials")
                        .param("materialType", "bundle")
                        .param("page", "1")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray())
                .andExpect(jsonPath("$.data.list[0].materialType").value("bundle"));
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
    @DisplayName("GET /api/materials/categories returns category-table entries")
    void getCategories_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/materials/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].category").value("sticker"))
                .andExpect(jsonPath("$.data[0].name").value("sticker"))
                .andExpect(jsonPath("$.data[0].count").isNumber())
                .andExpect(jsonPath("$.data[3].category").value("tape"))
                .andExpect(jsonPath("$.data[3].count").value(0));
    }

    @Test
    @DisplayName("GET /api/materials/categories filters counts by material type")
    void getCategories_byMaterialType_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/materials/categories")
                        .param("materialType", "bundle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].category").value("sticker"))
                .andExpect(jsonPath("$.data[0].count").value(1))
                .andExpect(jsonPath("$.data[1].category").value("background"))
                .andExpect(jsonPath("$.data[1].count").value(0))
                .andExpect(jsonPath("$.data[3].category").value("tape"))
                .andExpect(jsonPath("$.data[3].count").value(0));
    }

    @Test
    @DisplayName("GET /api/materials/{id} returns detail")
    void getDetail_shouldReturnMaterial() throws Exception {
        mockMvc.perform(get("/api/materials/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.title").exists())
                .andExpect(jsonPath("$.data.materialType").value("single"));
    }

    @Test
    @DisplayName("GET /api/materials/{id} returns error when missing")
    void getDetail_notFound_shouldReturnError() throws Exception {
        mockMvc.perform(get("/api/materials/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }
}
