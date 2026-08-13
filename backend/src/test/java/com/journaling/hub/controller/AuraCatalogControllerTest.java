package com.journaling.hub.controller;

import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuraCatalogControllerTest extends ControllerTestBase {
    @Test
    void catalogIsPublicAndOnlyContainsPublishedItems() throws Exception {
        mockMvc.perform(get("/api/v2/aura/catalog"))
                .andExpect(status().isOk())
                .andExpect(header().exists("ETag"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.schemaVersion").value(1))
                .andExpect(jsonPath("$.data.templates", hasSize(1)))
                .andExpect(jsonPath("$.data.templates[0].key").value("fresh-rounded"))
                .andExpect(jsonPath("$.data.assets", hasSize(1)))
                .andExpect(jsonPath("$.data.assets[0].key").value("sparkle-soft"));
    }

    @Test
    void catalogReturnsNotModifiedForMatchingEtag() throws Exception {
        String etag = mockMvc.perform(get("/api/v2/aura/catalog"))
                .andReturn().getResponse().getHeader("ETag");
        mockMvc.perform(get("/api/v2/aura/catalog").header("If-None-Match", etag))
                .andExpect(status().isNotModified());
    }
}
