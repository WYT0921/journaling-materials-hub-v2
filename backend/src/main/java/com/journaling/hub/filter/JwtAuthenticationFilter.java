package com.journaling.hub.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.Result;
import com.journaling.hub.util.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * JWT 认证拦截器
 */
@Slf4j
@Component
public class JwtAuthenticationFilter implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS 请求直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            sendError(response, "未提供认证 Token", 401);
            return false;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            Claims claims = jwtUtil.parseToken(token);

            // 将用户信息存入请求属性
            request.setAttribute("userId", claims.get("userId", Long.class));
            request.setAttribute("openid", claims.get("openid", String.class));
            request.setAttribute("isPremium", claims.get("isPremium", Boolean.class));

            return true;
        } catch (ExpiredJwtException e) {
            sendError(response, "Token 已过期", 401);
            return false;
        } catch (JwtException e) {
            sendError(response, "Token 无效", 401);
            return false;
        }
    }

    /**
     * 发送错误响应
     */
    private void sendError(HttpServletResponse response, String message, int statusCode) throws IOException {
        response.setStatus(statusCode);
        response.setContentType("application/json;charset=UTF-8");
        Result<?> result = Result.error(message, statusCode);
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}
