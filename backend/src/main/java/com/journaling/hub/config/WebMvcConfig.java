package com.journaling.hub.config;

import com.journaling.hub.filter.AdminInterceptor;
import com.journaling.hub.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private AdminInterceptor adminInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // JWT 认证拦截器
        registry.addInterceptor(jwtAuthenticationFilter)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/user/login",
                        "/api/user/dev-login",
                        "/api/materials",
                        "/api/materials/search",
                        "/api/materials/categories",
                        "/api/materials/{id}",
                        "/api/redeem/verify",
                        "/actuator/**"
                );

        // 管理员权限拦截器
        registry.addInterceptor(adminInterceptor)
                .addPathPatterns("/api/v2/admin/**");
    }
}
