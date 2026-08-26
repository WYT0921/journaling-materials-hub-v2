package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * DownloadController 测试
 */
@DisplayName("DownloadController")
class DownloadControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("GET /api/download/{materialId} — 会员下载成功")
    void download_premiumUser_shouldSucceed() throws Exception {
        mockMvc.perform(get("/api/download/1")
                        .header("Authorization", premiumUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists());
    }

    @Test
    @DisplayName("GET /api/download/{materialId} — 普通用户可下载任意在线素材")
    void download_normalUserWithinFreeQuota_shouldSucceed() throws Exception {
        mockMvc.perform(get("/api/download/2")
                        .header("Authorization", freeQuotaUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists());
    }

    @Test
    @DisplayName("GET /api/download/{materialId} — 原额度用完的普通用户仍可下载")
    void download_normalUserWithoutQuotaLimit_shouldSucceed() throws Exception {
        mockMvc.perform(get("/api/download/2")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").exists());
    }

    @Test
    @DisplayName("GET /api/download/{materialId} — 素材不存在返回错误")
    void download_notFound_shouldReturnError() throws Exception {
        mockMvc.perform(get("/api/download/999")
                        .header("Authorization", premiumUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("GET /api/download/records — 返回下载记录")
    void getRecords_shouldReturnList() throws Exception {
        mockMvc.perform(get("/api/download/records")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }
}
