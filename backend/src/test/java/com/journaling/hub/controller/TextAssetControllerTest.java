package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("TextAssetController")
class TextAssetControllerTest extends ControllerTestBase {
    @Test
    void publicListDoesNotRequireLoginAndOnlyReturnsPublished() throws Exception {
        mockMvc.perform(get("/api/text-assets").param("type", "kaomoji"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].content").value("(｡･ω･｡)"))
                .andExpect(jsonPath("$.data.list[0].source").doesNotExist());
    }

    @Test
    void categoriesIncludePublishedCounts() throws Exception {
        mockMvc.perform(get("/api/text-assets/categories").param("type", "emoji"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("爱心"))
                .andExpect(jsonPath("$.data[0].count").value(1));
    }

    @Test
    void invalidTypeReturnsBusinessError() throws Exception {
        mockMvc.perform(get("/api/text-assets").param("type", "other"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }
}
