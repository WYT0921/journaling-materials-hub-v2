package com.journaling.hub.controller;

import cn.hutool.crypto.digest.BCrypt;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AdminAuthController 测试
 */
@DisplayName("AdminAuthController")
class AdminAuthControllerTest extends ControllerTestBase {

    @Autowired
    private AdminAuthController adminAuthController;

    private static final String TEST_PASSWORD = "testAdmin123!";
    private static String testPasswordHash;

    @BeforeAll
    static void setupTestHash() {
        testPasswordHash = BCrypt.hashpw(TEST_PASSWORD);
    }

    @org.junit.jupiter.api.BeforeEach
    void injectTestHash() {
        // 动态注入测试用 BCrypt hash
        ReflectionTestUtils.setField(adminAuthController, "adminPasswordHash", testPasswordHash);
        ReflectionTestUtils.setField(adminAuthController, "adminUsername", "admin");
    }

    @Test
    @DisplayName("管理员登录 — 正确用户名和密码返回 token")
    void login_validCredentials_shouldReturnToken() throws Exception {
        String body = "{\"username\":\"admin\",\"password\":\"" + TEST_PASSWORD + "\"}";
        mockMvc.perform(post("/api/v2/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString());
    }

    @Test
    @DisplayName("管理员登录 — 错误密码返回 9002")
    void login_wrongPassword_shouldReturnError() throws Exception {
        String body = "{\"username\":\"admin\",\"password\":\"wrongpassword\"}";
        mockMvc.perform(post("/api/v2/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("管理员登录 — 错误用户名返回 9002")
    void login_wrongUsername_shouldReturnError() throws Exception {
        String body = "{\"username\":\"nonexistent\",\"password\":\"" + TEST_PASSWORD + "\"}";
        mockMvc.perform(post("/api/v2/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("管理员登录 — 缺少用户名返回 400")
    void login_missingUsername_shouldReturn400() throws Exception {
        String body = "{\"password\":\"" + TEST_PASSWORD + "\"}";
        mockMvc.perform(post("/api/v2/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("管理员 JWT — 可访问管理接口")
    void adminJwt_canAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 JWT — 非 /auth/login 的路径无 token 返回 401")
    void noToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials"))
                .andExpect(status().isUnauthorized());
    }
}
