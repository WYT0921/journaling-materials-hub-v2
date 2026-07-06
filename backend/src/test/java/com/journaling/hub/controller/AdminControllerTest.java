package com.journaling.hub.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * AdminController 测试
 */
@DisplayName("AdminController")
class AdminControllerTest extends ControllerTestBase {

    // ==================== 素材管理 ====================

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/materials 返回全部素材")
    void listMaterials_admin_shouldReturnAll() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/materials 支持分类筛选")
    void listMaterials_filterByCategory() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .param("category", "贴纸"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — POST /api/v2/admin/materials 新增素材")
    void createMaterial_admin_shouldSucceed() throws Exception {
        String body = "{"
                + "\"title\":\"管理员新增素材\","
                + "\"description\":\"描述文本\","
                + "\"imageUrl\":\"https://example.com/img.png\","
                + "\"thumbnailUrl\":\"https://example.com/thumb.png\","
                + "\"category\":\"贴纸\","
                + "\"isPremium\":false,"
                + "\"status\":1"
                + "}";
        mockMvc.perform(post("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("管理员新增素材"));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/materials/{id} 编辑素材")
    void updateMaterial_admin_shouldSucceed() throws Exception {
        String body = "{\"title\":\"管理员修改后的标题\"}";
        mockMvc.perform(put("/api/v2/admin/materials/1")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/materials/{id}/status 上下架")
    void updateMaterialStatus_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/materials/1/status")
                        .header("Authorization", adminJwtToken())
                        .param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — DELETE /api/v2/admin/materials/{id} 删除素材")
    void deleteMaterial_admin_shouldSucceed() throws Exception {
        mockMvc.perform(delete("/api/v2/admin/materials/3")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== 工具管理 ====================

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/tools 返回工具列表")
    void listTools_admin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/v2/admin/tools")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("管理员 — POST /api/v2/admin/tools 新增工具")
    void createTool_admin_shouldSucceed() throws Exception {
        String body = "{"
                + "\"name\":\"新工具\","
                + "\"description\":\"工具描述\","
                + "\"icon\":\"🔧\","
                + "\"url\":\"https://newtool.com\","
                + "\"category\":\"写作与项目\""
                + "}";
        mockMvc.perform(post("/api/v2/admin/tools")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("新工具"));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/tools/{id} 编辑工具")
    void updateTool_admin_shouldSucceed() throws Exception {
        String body = "{\"name\":\"修改后的工具\"}";
        mockMvc.perform(put("/api/v2/admin/tools/1")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/tools/{id}/status 上下架工具")
    void updateToolStatus_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/tools/1/status")
                        .header("Authorization", adminJwtToken())
                        .param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — DELETE /api/v2/admin/tools/{id} 删除工具")
    void deleteTool_admin_shouldSucceed() throws Exception {
        mockMvc.perform(delete("/api/v2/admin/tools/3")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== 用户管理 ====================

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/users 返回用户列表")
    void listUsers_admin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/v2/admin/users")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/users 支持关键词搜索")
    void listUsers_filterByKeyword() throws Exception {
        mockMvc.perform(get("/api/v2/admin/users")
                        .header("Authorization", adminJwtToken())
                        .param("keyword", "测试"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/users/{id}/status 禁用用户")
    void updateUserStatus_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/users/2/status")
                        .header("Authorization", adminJwtToken())
                        .param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/users/{id}/member 调整会员")
    void updateUserMember_admin_shouldSucceed() throws Exception {
        String body = "{\"memberType\":\"yearly\",\"memberExpireTime\":\"2027-07-04T00:00:00\"}";
        mockMvc.perform(put("/api/v2/admin/users/1/member")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== 反馈管理 ====================

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/feedbacks 返回反馈列表")
    void listFeedbacks_admin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/v2/admin/feedbacks")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/feedbacks 支持状态筛选")
    void listFeedbacks_filterByStatus() throws Exception {
        mockMvc.perform(get("/api/v2/admin/feedbacks")
                        .header("Authorization", adminJwtToken())
                        .param("status", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/feedbacks/{id}/status 标记已处理")
    void updateFeedbackStatus_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/feedbacks/1/status")
                        .header("Authorization", adminJwtToken())
                        .param("status", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — DELETE /api/v2/admin/feedbacks/{id} 删除反馈")
    void deleteFeedback_admin_shouldSucceed() throws Exception {
        mockMvc.perform(delete("/api/v2/admin/feedbacks/3")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== 权限校验 ====================

    @Test
    @DisplayName("非管理员 — GET /api/v2/admin/materials 返回 403")
    void listMaterials_nonAdmin_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", premiumUserToken()))
                .andExpect(status().isForbidden());
    }
}
