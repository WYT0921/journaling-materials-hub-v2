package com.journaling.hub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.config.WeChatOfficialProperties;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class WeChatOfficialAccessTokenServiceTest {
    @Test
    void fallsBackToInProcessCacheWhenRedisUnavailable() throws Exception {
        AtomicInteger requests = new AtomicInteger();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/cgi-bin/token", exchange -> {
            requests.incrementAndGet();
            byte[] body = "{\"access_token\":\"cached-token\",\"expires_in\":7200}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length); exchange.getResponseBody().write(body); exchange.close();
        });
        server.start();
        try {
            WeChatOfficialProperties p = new WeChatOfficialProperties();
            p.setAppId("app"); p.setAppSecret("secret");
            p.setApiBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
            @SuppressWarnings("unchecked") RedisTemplate<String, Object> redis = mock(RedisTemplate.class);
            when(redis.opsForValue()).thenThrow(new RuntimeException("redis down"));
            var service = new WeChatOfficialAccessTokenService(p, redis, new ObjectMapper());
            assertEquals("cached-token", service.getToken());
            assertEquals("cached-token", service.getToken());
            assertEquals(1, requests.get());
        } finally { server.stop(0); }
    }
}
