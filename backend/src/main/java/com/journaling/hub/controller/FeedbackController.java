package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.dto.FeedbackRequest;
import com.journaling.hub.entity.Feedback;
import com.journaling.hub.service.FeedbackService;
import com.journaling.hub.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 反馈控制器
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private static final String BEARER_PREFIX = "Bearer ";

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 提交反馈，允许匿名
     */
    @PostMapping
    public Result<?> submit(@Valid @RequestBody FeedbackRequest feedbackRequest,
                            HttpServletRequest request) {
        Long userId = resolveOptionalUserId(request);
        Feedback feedback = feedbackService.submit(userId, feedbackRequest.getContent());

        Map<String, Object> result = new HashMap<>();
        result.put("id", feedback.getId());
        if (feedback.getUserId() != null) {
            result.put("userId", feedback.getUserId());
        }
        result.put("content", feedback.getContent());
        result.put("status", feedback.getStatus());
        return Result.ok(result);
    }

    /** 查询当前登录用户提交的反馈及管理员回复。 */
    @GetMapping("/my")
    public Result<List<Feedback>> listMine(HttpServletRequest request) {
        Long userId = resolveOptionalUserId(request);
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return Result.ok(feedbackService.listByUserId(userId));
    }

    private Long resolveOptionalUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }

        try {
            Claims claims = jwtUtil.parseToken(authHeader.substring(BEARER_PREFIX.length()));
            return claims.get("userId", Long.class);
        } catch (Exception ignored) {
            return null;
        }
    }
}
