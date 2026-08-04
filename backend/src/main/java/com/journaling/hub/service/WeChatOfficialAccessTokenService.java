package com.journaling.hub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.config.WeChatOfficialProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeChatOfficialAccessTokenService {
    private final WeChatOfficialProperties properties;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private volatile CachedToken localCache;

    public String getToken() {
        validateCredentials();
        String cached = readRedis();
        if (cached != null) return cached;
        CachedToken local = localCache;
        if (local != null && local.expiresAt().isAfter(Instant.now())) return local.value();
        return refreshWithLock();
    }

    public void invalidate() {
        localCache = null;
        try { redisTemplate.delete(tokenKey()); }
        catch (Exception e) { log.warn("公众号AccessToken Redis缓存清理失败，将继续使用进程内降级策略"); }
    }

    private String refreshWithLock() {
        String lockValue = UUID.randomUUID().toString();
        boolean locked = false;
        try {
            locked = Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(lockKey(), lockValue, 15, TimeUnit.SECONDS));
            if (!locked) {
                for (int i = 0; i < 10; i++) {
                    Thread.sleep(100);
                    String cached = readRedis();
                    if (cached != null) return cached;
                }
            }
        } catch (Exception e) {
            log.warn("Redis不可用，公众号AccessToken临时降级为进程内缓存");
        }
        try {
            synchronized (this) {
                CachedToken local = localCache;
                if (local != null && local.expiresAt().isAfter(Instant.now())) return local.value();
                TokenResponse response = requestToken();
                long ttl = Math.max(60, response.expiresIn() - 300);
                localCache = new CachedToken(response.token(), Instant.now().plusSeconds(ttl));
                try { redisTemplate.opsForValue().set(tokenKey(), response.token(), ttl, TimeUnit.SECONDS); }
                catch (Exception e) { log.warn("AccessToken写入Redis失败，已使用进程内缓存降级"); }
                return response.token();
            }
        } finally {
            if (locked) {
                try {
                    Object current = redisTemplate.opsForValue().get(lockKey());
                    if (lockValue.equals(current)) redisTemplate.delete(lockKey());
                } catch (Exception ignored) { }
            }
        }
    }

    private TokenResponse requestToken() {
        try {
            String uri = properties.getApiBaseUrl() + "/cgi-bin/token?grant_type=client_credential&appid="
                    + encode(properties.getAppId()) + "&secret=" + encode(properties.getAppSecret());
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMillis())).build();
            HttpRequest request = HttpRequest.newBuilder(URI.create(uri))
                    .timeout(Duration.ofMillis(properties.getReadTimeoutMillis())).GET().build();
            JsonNode json = objectMapper.readTree(client.send(request, HttpResponse.BodyHandlers.ofString()).body());
            if (!json.hasNonNull("access_token")) {
                throw new IllegalStateException("公众号AccessToken获取失败，微信错误码=" + json.path("errcode").asInt(-1));
            }
            return new TokenResponse(json.get("access_token").asText(), json.path("expires_in").asLong(7200));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("公众号AccessToken请求被中断", e);
        } catch (Exception e) {
            if (e instanceof IllegalStateException state) throw state;
            throw new IllegalStateException("公众号AccessToken获取失败", e);
        }
    }

    private String readRedis() {
        try {
            Object value = redisTemplate.opsForValue().get(tokenKey());
            return value instanceof String text && !text.isBlank() ? text : null;
        } catch (Exception e) {
            log.warn("Redis不可用，读取公众号AccessToken缓存失败");
            return null;
        }
    }

    private void validateCredentials() {
        if (properties.getAppId().isBlank() || properties.getAppSecret().isBlank()) {
            throw new IllegalStateException("未配置微信公众号WECHAT_OFFICIAL_APP_ID或WECHAT_OFFICIAL_APP_SECRET");
        }
    }
    private String tokenKey() { return "wechat:official:access-token:" + properties.getAppId(); }
    private String lockKey() { return tokenKey() + ":lock"; }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private record CachedToken(String value, Instant expiresAt) {}
    private record TokenResponse(String token, long expiresIn) {}
}
