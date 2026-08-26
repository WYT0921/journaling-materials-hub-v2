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
                        .param("category", "sticker"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/materials 支持素材类型筛选")
    void listMaterials_filterByMaterialType() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .param("materialType", "bundle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list[0].materialType").value("bundle"));
    }

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/materials 支持期数筛选")
    void listMaterials_filterByIssue() throws Exception {
        mockMvc.perform(get("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .param("issueYear", "2026")
                        .param("issueNumber", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2));
    }

    @Test
    @DisplayName("管理员 — POST /api/v2/admin/materials 新增素材")
    void createMaterial_admin_shouldSucceed() throws Exception {
        String body = "{"
                + "\"title\":\"管理员新增素材\","
                + "\"description\":\"描述文本\","
                + "\"imageUrl\":\"https://example.com/img.png\","
                + "\"thumbnailUrl\":\"https://example.com/thumb.png\","
                + "\"category\":\"sticker\","
                + "\"materialType\":\"bundle\","
                + "\"isPremium\":false,"
                + "\"status\":1"
                + "}";
        mockMvc.perform(post("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("管理员新增素材"))
                .andExpect(jsonPath("$.data.materialType").value("bundle"));
    }

    @Test
    @DisplayName("管理员 — POST /api/v2/admin/materials 拒绝不完整期数")
    void createMaterial_withPartialIssue_shouldFail() throws Exception {
        String body = "{\"title\":\"错误期数\",\"imageUrl\":\"https://example.com/img.png\",\"issueYear\":2026}";
        mockMvc.perform(post("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("管理员 — POST /api/v2/admin/materials 拒绝非法期数")
    void createMaterial_withInvalidIssue_shouldFail() throws Exception {
        String body = "{\"title\":\"错误期数\",\"imageUrl\":\"https://example.com/img.png\",\"issueYear\":999,\"issueNumber\":0}";
        mockMvc.perform(post("/api/v2/admin/materials")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
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
    @DisplayName("管理员 — PUT /api/v2/admin/materials/{id} 可清空期数")
    void updateMaterial_canClearIssue() throws Exception {
        mockMvc.perform(put("/api/v2/admin/materials/1")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"issueYear\":null,\"issueNumber\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/materials/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.issueYear").doesNotExist())
                .andExpect(jsonPath("$.data.issueNumber").doesNotExist());
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

    // ==================== 兑换码管理 ====================

    @Test
    @DisplayName("管理员 — GET /api/v2/admin/redeem-codes 返回兑换码列表")
    void listRedeemCodes_admin_shouldReturnPage() throws Exception {
        mockMvc.perform(get("/api/v2/admin/redeem-codes")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    @DisplayName("管理员 — POST /api/v2/admin/redeem-codes/generate 批量生成兑换码")
    void generateRedeemCodes_admin_shouldSucceed() throws Exception {
        String body = "{\"type\":\"monthly\",\"count\":3,\"expireTime\":\"2027-12-31T00:00:00\"}";
        mockMvc.perform(post("/api/v2/admin/redeem-codes/generate")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(3))
                .andExpect(jsonPath("$.data.list[0].type").value("monthly"))
                .andExpect(jsonPath("$.data.list[0].status").value(0));
    }

    @Test
    @DisplayName("管理员 — PUT /api/v2/admin/redeem-codes/{id}/disable 作废未使用兑换码")
    void disableRedeemCode_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/redeem-codes/1/disable")
                        .header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value(2));
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
    @DisplayName("管理员 — PUT /api/v2/admin/feedbacks/{id}/reply 回复并标记已处理")
    void replyFeedback_admin_shouldSucceed() throws Exception {
        mockMvc.perform(put("/api/v2/admin/feedbacks/1/reply")
                        .header("Authorization", adminJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reply\":\"感谢反馈，我们已经安排优化。\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.reply").value("感谢反馈，我们已经安排优化。"))
                .andExpect(jsonPath("$.data.status").value(1))
                .andExpect(jsonPath("$.data.repliedAt").exists());
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
