package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * RedeemController 测试
 */
@DisplayName("RedeemController")
class RedeemControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("POST /api/redeem/verify — 验证有效兑换码")
    void verifyCode_valid_shouldReturnInfo() throws Exception {
        String body = "{\"code\":\"TEST-VALID-CODE\"}";
        mockMvc.perform(post("/api/redeem/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.type").value("yearly"));
    }

    @Test
    @DisplayName("POST /api/redeem/verify — 无效兑换码返回 valid=false")
    void verifyCode_invalid_shouldReturnError() throws Exception {
        String body = "{\"code\":\"INVALID-CODE\"}";
        mockMvc.perform(post("/api/redeem/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valid").value(false));
    }

    @Test
    @DisplayName("POST /api/redeem/verify — 已使用兑换码返回 valid=false")
    void verifyCode_used_shouldReturnError() throws Exception {
        String body = "{\"code\":\"TEST-USED-CODE\"}";
        mockMvc.perform(post("/api/redeem/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valid").value(false));
    }

    @Test
    @DisplayName("POST /api/redeem/activate — 激活兑换码成功")
    void activateCode_valid_shouldSucceed() throws Exception {
        String body = "{\"code\":\"TEST-VALID-CODE\"}";
        mockMvc.perform(post("/api/redeem/activate")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/redeem/activate — 无 Token 返回 401")
    void activateCode_withoutToken_shouldReturn401() throws Exception {
        String body = "{\"code\":\"TEST-VALID-CODE\"}";
        mockMvc.perform(post("/api/redeem/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
