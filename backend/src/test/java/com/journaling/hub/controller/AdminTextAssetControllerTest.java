package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("AdminTextAssetController")
class AdminTextAssetControllerTest extends ControllerTestBase {
    @Test
    void adminCanListAndFilter() throws Exception {
        mockMvc.perform(get("/api/v2/admin/text-assets")
                        .header("Authorization", adminJwtToken()).param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    void importIsPendingAndIdempotent() throws Exception {
        String body = "{\"items\":[{\"content\":\"(≧▽≦)\",\"type\":\"kaomoji\",\"category\":\"可爱\",\"tags\":[\"开心\"],\"source\":\"cuteinternet\"},{\"content\":\"(≧▽≦)\",\"type\":\"kaomoji\",\"category\":\"可爱\",\"tags\":[],\"source\":\"cuteinternet\"}]}";
        mockMvc.perform(post("/api/v2/admin/text-assets/import")
                        .header("Authorization", adminJwtToken()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.inserted").value(1))
                .andExpect(jsonPath("$.data.duplicates").value(1));
    }

    @Test
    void blockedContentIsFiltered() throws Exception {
        String body = "{\"items\":[{\"content\":\"suicide\",\"type\":\"kaomoji\",\"category\":\"可爱\"}]}";
        mockMvc.perform(post("/api/v2/admin/text-assets/import")
                        .header("Authorization", adminJwtToken()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.filtered").value(1));
    }

    @Test
    void batchStatusPublishesSelectedItems() throws Exception {
        mockMvc.perform(put("/api/v2/admin/text-assets/batch-status")
                        .header("Authorization", adminJwtToken()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[2],\"status\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.updated").value(1));
    }

    @Test
    void nonAdminIsRejected() throws Exception {
        mockMvc.perform(get("/api/v2/admin/text-assets").header("Authorization", premiumUserToken()))
                .andExpect(status().isForbidden());
    }
}
