package com.journaling.hub.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 管理员权限拦截器
 * 拦截 /api/v2/admin/** 路径，校验用户是否为管理员
 */
@Slf4j
@Component
public class AdminInterceptor implements HandlerInterceptor {

    @Value("${admin.user-ids:}")
    private String adminUserIds;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS 请求直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            sendError(response, "请先登录", 401);
            return false;
        }

        Set<Long> adminIds = parseAdminIds();
        if (!adminIds.contains(userId)) {
            log.warn("非管理员用户尝试访问管理接口: userId={}, path={}", userId, request.getRequestURI());
            sendError(response, "无管理员权限", 403);
            return false;
        }

        return true;
    }

    private Set<Long> parseAdminIds() {
        Set<Long> ids = new HashSet<>();
        if (adminUserIds == null || adminUserIds.isBlank()) {
            return ids;
        }
        Arrays.stream(adminUserIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .forEach(s -> {
                    try {
                        ids.add(Long.parseLong(s));
                    } catch (NumberFormatException e) {
                        log.warn("无效的管理员用户 ID 配置: {}", s);
                    }
                });
        return ids;
    }

    private void sendError(HttpServletResponse response, String message, int statusCode) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json;charset=UTF-8");
        Result<?> result = Result.error(message, statusCode);
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
