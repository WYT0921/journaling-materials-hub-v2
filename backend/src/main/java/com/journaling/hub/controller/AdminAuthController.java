package com.journaling.hub.controller;

import cn.hutool.crypto.digest.BCrypt;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.Result;
import com.journaling.hub.dto.AdminLoginRequest;
import com.journaling.hub.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理员认证控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/admin/auth")
public class AdminAuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password-hash}")
    private String adminPasswordHash;

    /**
     * 管理员账号密码登录
     */
    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody AdminLoginRequest request) {
        // 检查是否配置了管理员账号
        if (adminPasswordHash == null || adminPasswordHash.isBlank()) {
            throw new BusinessException(ErrorCode.ADMIN_NOT_CONFIGURED);
        }

        // 校验用户名
        if (!adminUsername.equals(request.getUsername())) {
            log.warn("管理员登录失败: 用户名错误 username={}", request.getUsername());
            throw new BusinessException(ErrorCode.ADMIN_LOGIN_FAILED);
        }

        // 校验密码
        if (!BCrypt.checkpw(request.getPassword(), adminPasswordHash)) {
            log.warn("管理员登录失败: 密码错误 username={}", request.getUsername());
            throw new BusinessException(ErrorCode.ADMIN_LOGIN_FAILED);
        }

        // 生成管理员 token
        String token = jwtUtil.generateAdminToken(adminUsername);

        log.info("管理员登录成功: username={}", adminUsername);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("username", adminUsername);
        return Result.ok(result);
    }
}
