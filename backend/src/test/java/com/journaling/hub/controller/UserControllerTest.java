package com.journaling.hub.controller;

import com.journaling.hub.service.FileService;
import com.journaling.hub.util.WeChatUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UserController tests.
 */
@DisplayName("UserController")
class UserControllerTest extends ControllerTestBase {

    @MockBean
    private WeChatUtil weChatUtil;

    @MockBean
    private FileService fileService;

    @BeforeEach
    void setUpPhoneMock() {
        when(weChatUtil.getPhoneNumber("test-phone-code")).thenReturn("13800138000");
        when(weChatUtil.getPhoneNumber("invalid-code")).thenReturn(null);
        when(fileService.upload(any(), startsWith("users/avatar/1/")))
                .thenReturn("http://minio.test/materials/users/avatar/1/avatar.png");
    }

    @Test
    @DisplayName("GET /api/user/profile returns user info")
    void getProfile_shouldReturnUserInfo() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.nickname").exists());
    }

    @Test
    @DisplayName("GET /api/user/profile returns 401 without token")
    void getProfile_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/user/premium-status returns false for normal user")
    void getPremiumStatus_normalUser_shouldReturnFalse() throws Exception {
        mockMvc.perform(get("/api/user/premium-status")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPremium").value(false));
    }

    @Test
    @DisplayName("GET /api/user/premium-status returns true for premium user")
    void getPremiumStatus_premiumUser_shouldReturnTrue() throws Exception {
        mockMvc.perform(get("/api/user/premium-status")
                        .header("Authorization", premiumUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPremium").value(true));
    }

    @Test
    @DisplayName("GET /api/user/stats returns stats")
    void getStats_shouldReturnStats() throws Exception {
        mockMvc.perform(get("/api/user/stats")
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.downloadCount").isNumber())
                .andExpect(jsonPath("$.data.collectionCount").isNumber());
    }

    @Test
    @DisplayName("PUT /api/user/profile updates nickname")
    void updateProfile_shouldSucceed() throws Exception {
        String body = "{\"nickname\":\"NewNick\"}";
        mockMvc.perform(put("/api/user/profile")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("NewNick"));
    }

    @Test
    @DisplayName("POST /api/user/avatar uploads avatar for current user")
    void uploadAvatar_shouldSucceed() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                "avatar".getBytes()
        );

        mockMvc.perform(multipart("/api/user/avatar")
                        .file(file)
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").value("http://minio.test/materials/users/avatar/1/avatar.png"));
    }

    @Test
    @DisplayName("POST /api/user/avatar rejects non-image file")
    void uploadAvatar_nonImage_shouldReturn400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "not-image".getBytes()
        );

        mockMvc.perform(multipart("/api/user/avatar")
                        .file(file)
                        .header("Authorization", normalUserToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/user/bind-phone returns 401 without token")
    void bindPhone_withoutToken_shouldReturn401() throws Exception {
        String body = "{\"code\":\"test-phone-code\"}";
        mockMvc.perform(post("/api/user/bind-phone")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/user/bind-phone returns 400 when code is empty")
    void bindPhone_emptyCode_shouldReturn400() throws Exception {
        String body = "{\"code\":\"\"}";
        mockMvc.perform(post("/api/user/bind-phone")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/user/bind-phone succeeds")
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
