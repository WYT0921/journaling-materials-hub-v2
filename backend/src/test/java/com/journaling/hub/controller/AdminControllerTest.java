package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AdminController 测试
 * 管理员用户 ID=1（配置于 application-test.yml）
 */
@DisplayName("AdminController")
class AdminControllerTest extends ControllerTestBase {

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/materials 返回全部素材")
    void listMaterials_admin_shouldReturnAll() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("非管理员 — GET /api/v2/admin/materials 返回 403")
    void listMaterials_nonAdmin_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", premiumUserToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/materials/{id} 编辑素材")
    void updateMaterial_admin_shouldSucceed() throws Exception {
        String body = "{\"title\":\"管理员修改后的标题\"}";
        mockMvc.perform(put("/api/v2/admin/materials/1")
                        .header("Authorization", adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/materials/{id}/status 上下架")
    void updateMaterialStatus_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/materials/1/status")
                        .header("Authorization", adminToken())
                        .param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — DELETE /api/v2/admin/materials/{id} 删除素材")
    void deleteMaterial_admin_shouldSucceed() throws Exception {
        mockMvc.perform(delete("/api/v2/admin/materials/3")
                        .header("Authorization", adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/users 返回用户列表")
    void listUsers_admin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/v2/admin/users")
                        .header("Authorization", adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/users/{id}/status 禁用用户")
    void updateUserStatus_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/users/2/status")
                        .header("Authorization", adminToken())
                        .param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
