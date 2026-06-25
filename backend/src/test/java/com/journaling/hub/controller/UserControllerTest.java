package com.journaling.hub.controller;

import com.journaling.hub.util.WeChatUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * UserController 测试
 */
@DisplayName("UserController")
class UserControllerTest extends ControllerTestBase {

    @MockBean
    private WeChatUtil weChatUtil;

    @BeforeEach
    void setUpPhoneMock() {
        // 默认 mock 返回一个测试手机号
        when(weChatUtil.getPhoneNumber("test-phone-code")).thenReturn("13800138000");
        when(weChatUtil.getPhoneNumber("invalid-code")).thenReturn(null);
    }

    @Test
    @DisplayName("GET /api/user/profile — 正常获取个人信息")
    void getProfile_shouldReturnUserInfo() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("测试用户"));
    }

    @Test
    @DisplayName("GET /api/user/profile — 无 Token 返回 401")
    void getProfile_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/user/premium-status — 普通用户返回非会员")
    void getPremiumStatus_normalUser_shouldReturnFalse() throws Exception {
        mockMvc.perform(get("/api/user/premium-status")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPremium").value(false));
    }

    @Test
    @DisplayName("GET /api/user/premium-status — 会员用户返回会员")
    void getPremiumStatus_premiumUser_shouldReturnTrue() throws Exception {
        mockMvc.perform(get("/api/user/premium-status")
                        .header("Authorization", premiumUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPremium").value(true));
    }

    @Test
    @DisplayName("GET /api/user/stats — 返回用户统计数据")
    void getStats_shouldReturnStats() throws Exception {
        mockMvc.perform(get("/api/user/stats")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.downloadCount").isNumber())
                .andExpect(jsonPath("$.data.collectionCount").isNumber());
    }

    @Test
    @DisplayName("PUT /api/user/profile — 更新昵称")
    void updateProfile_shouldSucceed() throws Exception {
        String body = "{\"nickname\":\"新昵称\"}";
        mockMvc.perform(put("/api/user/profile")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/user/bind-phone — 无 Token 返回 401")
    void bindPhone_withoutToken_shouldReturn401() throws Exception {
        String body = "{\"code\":\"test-phone-code\"}";
        mockMvc.perform(post("/api/user/bind-phone")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/user/bind-phone — code 为空返回 400")
    void bindPhone_emptyCode_shouldReturn400() throws Exception {
        String body = "{\"code\":\"\"}";
        mockMvc.perform(post("/api/user/bind-phone")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/user/bind-phone — 成功绑定手机号")
    void bindPhone_shouldSucceed() throws Exception {
        String body = "{\"code\":\"test-phone-code\"}";
        mockMvc.perform(post("/api/user/bind-phone")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("13800138000"));
    }
}
