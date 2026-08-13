package com.journaling.hub.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class InternalCollectorControllerTest extends ControllerTestBase {
    private static final String TOKEN = "test-collector-token-at-least-32-characters";

    @Test
    void rejectsMissingCollectorToken() throws Exception {
        mockMvc.perform(post("/api/v2/internal/collector/import").contentType(MediaType.APPLICATION_JSON).content("{\"items\":[]}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void importsThreadsItemsAsPendingAndPreservesAiMetadata() throws Exception {
        String body = "{\"items\":[{\"content\":\"☾⋆⁺₊✧ 𐙚 ୨୧\",\"type\":\"emoji\",\"category\":\"装饰\",\"source\":\"threads\",\"status\":1,\"aiModel\":\"test\",\"aiConfidence\":0.92,\"reviewNote\":\"有效\"}]}";
        mockMvc.perform(post("/api/v2/internal/collector/import").header("X-Collector-Token", TOKEN)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.inserted").value(1));
        mockMvc.perform(get("/api/v2/admin/text-assets").header("Authorization", adminJwtToken()).param("source", "threads"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.list[0].status").value(0))
                .andExpect(jsonPath("$.data.list[0].aiModel").value("test"));
    }

    @Test
    void adminCanListCollectorRuns() throws Exception {
        mockMvc.perform(get("/api/v2/admin/collector-runs").header("Authorization", adminJwtToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.total").value(0));
    }
}
