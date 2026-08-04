package com.journaling.hub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.config.WeChatOfficialProperties;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WeChatOfficialMediaClientTest {
    private HttpServer server;

    @AfterEach void stop() { if (server != null) server.stop(0); }

    @Test
    void refreshesExpiredTokenOnlyOnceThenDownloads() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        start(exchange -> {
            byte[] body = calls.incrementAndGet() == 1
                    ? "{\"errcode\":40014,\"errmsg\":\"invalid token\"}".getBytes(StandardCharsets.UTF_8)
                    : new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0};
            exchange.sendResponseHeaders(200, body.length); exchange.getResponseBody().write(body); exchange.close();
        });
        WeChatOfficialAccessTokenService tokens = mock(WeChatOfficialAccessTokenService.class);
        when(tokens.getToken()).thenReturn("old", "new");
        var result = new WeChatOfficialMediaClient(props(1024), tokens, new ObjectMapper()).download("media");
        assertEquals(4, result.bytes().length);
        verify(tokens, times(1)).invalidate();
        assertEquals(2, calls.get());
    }

    @Test
    void exposesWechatJsonErrorAndRejectsOversizedBody() throws Exception {
        start(exchange -> {
            byte[] body = "{\"errcode\":45001,\"errmsg\":\"too large\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length); exchange.getResponseBody().write(body); exchange.close();
        });
        var tokens = mock(WeChatOfficialAccessTokenService.class); when(tokens.getToken()).thenReturn("token");
        var error = assertThrows(WeChatMediaDownloadException.class,
                () -> new WeChatOfficialMediaClient(props(1024), tokens, new ObjectMapper()).download("media"));
        assertEquals(45001, error.getWechatErrorCode());
        server.stop(0);

        start(exchange -> {
            byte[] body = new byte[32]; exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body); exchange.close();
        });
        assertThrows(WeChatMediaDownloadException.class,
                () -> new WeChatOfficialMediaClient(props(8), tokens, new ObjectMapper()).download("media"));
    }

    private WeChatOfficialProperties props(long max) {
        var p = new WeChatOfficialProperties();
        p.setApiBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        p.setMaxFileSize(max); p.setConnectTimeoutMillis(1000); p.setReadTimeoutMillis(2000); return p;
    }
    private void start(com.sun.net.httpserver.HttpHandler handler) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/cgi-bin/media/get", handler); server.start();
    }
}
