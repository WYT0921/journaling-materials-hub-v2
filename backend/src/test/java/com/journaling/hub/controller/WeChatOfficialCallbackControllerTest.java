package com.journaling.hub.controller;

import com.journaling.hub.util.WeChatOfficialSignature;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class WeChatOfficialCallbackControllerTest extends ControllerTestBase {
    @Autowired private com.journaling.hub.service.WeChatMessageProbeService probeService;
    @Test
    void verifiesGetAndRejectsBadSignature() throws Exception {
        String signature = signature();
        mockMvc.perform(get("/api/wechat/official/callback").param("signature", signature)
                        .param("timestamp", "123").param("nonce", "nonce").param("echostr", "echo"))
                .andExpect(status().isOk()).andExpect(content().string("echo"));
        mockMvc.perform(get("/api/wechat/official/callback").param("signature", "bad")
                        .param("timestamp", "123").param("nonce", "nonce").param("echostr", "echo"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validatesPostAndPersistsTextMessageIdempotently() throws Exception {
        String xml = "<xml><ToUserName><![CDATA[to]]></ToUserName><FromUserName><![CDATA[openid-abcdefgh]]></FromUserName>"
                + "<CreateTime>123</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[hello]]></Content><MsgId>90001</MsgId></xml>";
        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/wechat/official/callback").param("signature", signature())
                            .param("timestamp", "123").param("nonce", "nonce")
                            .contentType(MediaType.TEXT_XML).content(xml))
                    .andExpect(status().isOk()).andExpect(content().string("success"));
        }
        mockMvc.perform(post("/api/wechat/official/callback").param("signature", "bad")
                        .param("timestamp", "123").param("nonce", "nonce")
                        .contentType(MediaType.TEXT_XML).content(xml)).andExpect(status().isForbidden());
    }

    @Test
    void deduplicatesIdenticalEventWithoutMsgId() {
        String xml = "<xml><ToUserName><![CDATA[to]]></ToUserName><FromUserName><![CDATA[openid-event]]></FromUserName>"
                + "<CreateTime>123</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[subscribe]]></Event></xml>";
        assertEquals(probeService.accept(xml, true).getId(), probeService.accept(xml, true).getId());
    }

    private String signature() { return WeChatOfficialSignature.sha1("123mock-official-tokennonce"); }
}
