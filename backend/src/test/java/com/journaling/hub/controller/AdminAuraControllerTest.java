package com.journaling.hub.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminAuraControllerTest extends ControllerTestBase {
    @Test
    void adminEndpointsRequireAdminToken() throws Exception {
        mockMvc.perform(get("/api/v2/admin/aura/templates"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminCanListAllTemplates() throws Exception {
        mockMvc.perform(get("/api/v2/admin/aura/templates").header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    void rejectsUnknownLayerFields() throws Exception {
        String payload = """
                {"templateKey":"bad-template","name":"错误模板","style":"fresh",
                 "supportedRatios":["1:1"],"configVersion":1,"status":0,"sortOrder":3,
                 "config":{"layers":[{"id":"photo-main","type":"photo","script":"alert(1)"}]}}
                """;
        mockMvc.perform(post("/api/v2/admin/aura/templates")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value("图层包含未知字段"));
    }

    @Test
    void adminCanCreateAndPublishAsset() throws Exception {
        String payload = """
                {"assetKey":"paper-soft","name":"柔和纸张","type":"texture",
                 "fileUrl":"https://example.com/paper.png","sha256":"cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                 "resourceVersion":1,"metadata":{"width":512},"status":0,"sortOrder":3}
                """;
        mockMvc.perform(post("/api/v2/admin/aura/assets")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.assetKey").value("paper-soft"));
    }

    @Test
    void uploadRejectsSpoofedMimeTypeBeforeStorage() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", "not-an-image".getBytes());
        mockMvc.perform(multipart("/api/v2/admin/aura/assets/upload")
                        .file(file).header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message").value("文件内容与 MIME 类型不匹配"));
    }
}
