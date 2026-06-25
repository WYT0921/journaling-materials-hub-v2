package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.dto.BindPhoneRequest;
import com.journaling.hub.dto.LoginRequest;
import com.journaling.hub.dto.LoginResponse;
import com.journaling.hub.dto.UserProfileUpdateRequest;
import com.journaling.hub.entity.User;
import com.journaling.hub.service.UserService;
import com.journaling.hub.util.JwtUtil;
import com.journaling.hub.util.WeChatUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private WeChatUtil weChatUtil;

    /**
     * 微信登录
     */
    @PostMapping("/login")
    public Result<?> login(@Valid @RequestBody LoginRequest request) {
        // 调用微信 jscode2session
        Map<String, String> wechatResult = weChatUtil.jscode2session(request.getCode());
        if (wechatResult == null) {
            return Result.error("微信登录失败", 400);
        }

        String openid = wechatResult.get("openid");

        // 查找或创建用户
        User user = userService.findOrCreateByOpenid(openid);

        // 生成 JWT Token
        String token = jwtUtil.generateToken(user.getId(), user.getOpenid(), user.isPremium());

        // 构建响应
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserInfo(LoginResponse.UserInfo.fromUser(user));
        response.setPremium(user.isPremium());

        return Result.ok(response);
    }

    /**
     * 获取用户资料
     */
    @GetMapping("/profile")
    public Result<?> getProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        User user = userService.getProfile(userId);
        return Result.ok(LoginResponse.UserInfo.fromUser(user));
    }

    /**
     * 更新用户资料
     */
    @PutMapping("/profile")
    public Result<?> updateProfile(HttpServletRequest request,
                                   @RequestBody UserProfileUpdateRequest updateRequest) {
        Long userId = (Long) request.getAttribute("userId");
        User user = userService.updateProfile(
                userId,
                updateRequest.getNickname(),
                updateRequest.getAvatarUrl(),
                updateRequest.getPhone()
        );
        return Result.ok(LoginResponse.UserInfo.fromUser(user));
    }

    /**
     * 获取会员状态
     */
    @GetMapping("/premium-status")
    public Result<?> getPremiumStatus(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        User user = userService.getPremiumStatus(userId);

        Map<String, Object> status = new HashMap<>();
        status.put("isPremium", user.isPremium());
        status.put("memberType", user.getMemberType());
        status.put("memberTypeText", user.getMemberTypeText());
        status.put("memberExpireTime",
                user.getMemberExpireTime() != null ?
                        user.getMemberExpireTime().toString() : null);

        return Result.ok(status);
    }

    /**
     * 获取用户统计信息
     */
    @GetMapping("/stats")
    public Result<?> getStats(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Map<String, Object> stats = userService.getUserStats(userId);
        return Result.ok(stats);
    }

    /**
     * 绑定手机号（微信手机号授权）
     */
    @PostMapping("/bind-phone")
    public Result<?> bindPhone(HttpServletRequest request,
                               @Valid @RequestBody BindPhoneRequest bindRequest) {
        Long userId = (Long) request.getAttribute("userId");

        // 通过微信 code 换取手机号
        String phoneNumber = weChatUtil.getPhoneNumber(bindRequest.getCode());
        if (phoneNumber == null) {
            return Result.error("获取手机号失败，请重试", 400);
        }

        // 绑定手机号
        User user = userService.bindPhone(userId, phoneNumber);
        return Result.ok(LoginResponse.UserInfo.fromUser(user));
    }

    /**
     * 开发环境测试登录（无需微信 code）
     */
    @PostMapping("/dev-login")
    public Result<?> devLogin(@RequestBody Map<String, Object> body) {
        String openid = (String) body.getOrDefault("openid", "dev-test-openid");
        Boolean isPremium = (Boolean) body.getOrDefault("isPremium", false);

        // 查找或创建用户
        User user = userService.findOrCreateByOpenid(openid);

        // 如果请求会员状态，激活会员
        if (isPremium && !user.isPremium()) {
            user = userService.activatePremium(user.getId(), "yearly", 365);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getOpenid(), user.isPremium());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("openid", user.getOpenid());
        result.put("isPremium", user.isPremium());
        result.put("nickname", user.getNickname());

        log.info("Dev login: userId={}, isPremium={}", user.getId(), user.isPremium());
        return Result.ok(result);
    }
}
