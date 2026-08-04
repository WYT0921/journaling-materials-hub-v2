package com.journaling.hub.controller;

import com.journaling.hub.service.WeChatMessageProbeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminWeChatProbeControllerTest extends ControllerTestBase {
    @Autowired private WeChatMessageProbeService service;

    @Test
    void requiresAdminAndReturnsMaskedProbeData() throws Exception {
        String xml = "<xml><ToUserName><![CDATA[to]]></ToUserName><FromUserName><![CDATA[openid-abcdefgh]]></FromUserName>"
                + "<CreateTime>123</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[hello]]></Content><MsgId>91001</MsgId></xml>";
        Long id = service.accept(xml, true).getId();

        mockMvc.perform(get("/api/v2/admin/wechat-probe/messages"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v2/admin/wechat-probe/messages").header("Authorization", adminJwtToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.list[0].fromOpenid").value("open****efgh"))
                .andExpect(jsonPath("$.data.list[0].rawXml").doesNotExist())
                .andExpect(jsonPath("$.data.total").value(1));
        mockMvc.perform(get("/api/v2/admin/wechat-probe/messages/{id}", id).header("Authorization", adminJwtToken())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rawXml", containsString("open****efgh")))
                .andExpect(jsonPath("$.data.rawXml", not(containsString("openid-abcdefgh"))));
    }
}
