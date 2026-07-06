package com.journaling.hub.controller;

import com.journaling.hub.BaseTest;
import com.journaling.hub.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Controller 测试基类
 * 提供 MockMvc + JWT 辅助方法
 */
@AutoConfigureMockMvc
public abstract class ControllerTestBase extends BaseTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JwtUtil jwtUtil;

    /** 普通用户 ID=1 */
    protected String normalUserToken() {
        return "Bearer " + jwtUtil.generateToken(1L, "test-openid-normal", false);
    }

    /** 会员用户 ID=2 */
    protected String premiumUserToken() {
        return "Bearer " + jwtUtil.generateToken(2L, "test-openid-premium", true);
    }

    /** 禁用用户 ID=3 */
    protected String disabledUserToken() {
        return "Bearer " + jwtUtil.generateToken(3L, "test-openid-disabled", false);
    }

    /** 普通用户，剩余 1 次免费额度 ID=4 */
    protected String freeQuotaUserToken() {
        return "Bearer " + jwtUtil.generateToken(4L, "test-openid-free-quota", false);
    }

    /** 管理员用户 ID=1 */
    protected String adminToken() {
        return normalUserToken();
    }

    /** 管理员 JWT token（role=admin） */
    protected String adminJwtToken() {
        return "Bearer " + jwtUtil.generateAdminToken("admin");
    }
}
