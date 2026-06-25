package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ToolController 测试
 */
@DisplayName("ToolController")
class ToolControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("GET /api/v2/tools — 返回工具列表（含默认工具）")
    void getAllTools_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/v2/tools")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("POST /api/v2/tools — 添加自定义工具")
    void addTool_shouldSucceed() throws Exception {
        String body = "{\"name\":\"测试工具\",\"description\":\"测试描述\",\"icon\":\"🔧\",\"url\":\"https://test.com\"}";
        mockMvc.perform(post("/api/v2/tools")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("测试工具"));
    }

    @Test
    @DisplayName("DELETE /api/v2/tools/{id} — 删除自定义工具")
    void removeTool_shouldSucceed() throws Exception {
        // 先添加
        String body = "{\"name\":\"待删除\",\"description\":\"desc\",\"icon\":\"🗑\",\"url\":\"https://del.com\"}";
        var result = mockMvc.perform(post("/api/v2/tools")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn();
        String id = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.id").toString();

        // 再删除
        mockMvc.perform(delete("/api/v2/tools/" + id)
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
