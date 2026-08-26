package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("TextDecorationController")
class TextDecorationControllerTest extends ControllerTestBase {
    @Test
    void templatesArePublicAndOnlyReturnEnabledRows() throws Exception {
        mockMvc.perform(get("/api/text-decoration/templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].name").value("Soft Heart"));
    }

    @Test
    void templatesCanBeFilteredByCategory() throws Exception {
        mockMvc.perform(get("/api/text-decoration/templates").param("category", "frame"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].type").value("multiline"));
    }

    @Test
    void randomRendersInlineTemplate() throws Exception {
        mockMvc.perform(get("/api/text-decoration/random")
                        .param("text", "晚安")
                        .param("category", "heart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.result").value("♡ 晚安 ♡"))
                .andExpect(jsonPath("$.data.template.id").value(1));
    }

    @Test
    void randomRejectsEmptyText() throws Exception {
        mockMvc.perform(get("/api/text-decoration/random").param("text", " "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }
}
