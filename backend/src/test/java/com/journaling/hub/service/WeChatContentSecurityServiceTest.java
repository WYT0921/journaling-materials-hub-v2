package com.journaling.hub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.util.WeChatUtil;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WeChatContentSecurityServiceTest {

    @Test
    void msgSecCheckPassesSafeProfileText() {
        WeChatUtil util = mock(WeChatUtil.class);
        when(util.getAccessToken()).thenReturn("token");
        TestService service = new TestService(util, "{\"errcode\":0,\"result\":{\"suggest\":\"pass\"}}");
        assertDoesNotThrow(() -> service.checkProfileText("安全昵称", "openid"));
        assertEquals(2, service.body.get("version"));
        assertEquals(1, service.body.get("scene"));
        assertEquals("openid", service.body.get("openid"));
    }

    @Test
    void msgSecCheckRejectsRiskyProfileTextWithReviewSafeMessage() {
        WeChatUtil util = mock(WeChatUtil.class);
        when(util.getAccessToken()).thenReturn("token");
        TestService service = new TestService(util, "{\"errcode\":0,\"result\":{\"suggest\":\"risky\"}}");
        BusinessException error = assertThrows(BusinessException.class,
                () -> service.checkProfileText("违规昵称", "openid"));
        assertEquals("所发布内容含违规信息", error.getMessage());
    }

    private static class TestService extends WeChatContentSecurityService {
        private final String response;
        private Map<String, Object> body;

        TestService(WeChatUtil util, String response) {
            super(util, new ObjectMapper());
            this.response = response;
        }

        @Override
        protected String postJson(String url, Map<String, Object> body) {
            this.body = body;
            return response;
        }
    }
}
