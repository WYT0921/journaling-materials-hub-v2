package com.journaling.hub.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WeChatXmlParserTest {
    @Test
    void parsesImageMessage() {
        var message = WeChatXmlParser.parse(xml("image", "<PicUrl><![CDATA[https://example.test/a.jpg]]></PicUrl><MediaId><![CDATA[m1]]></MediaId><MsgId>99</MsgId>"));
        assertEquals("image", message.getMsgType());
        assertEquals("m1", message.getMediaId());
        assertEquals("99", message.getMsgId());
    }

    @Test
    void parsesTextAndEventMessages() {
        assertEquals("hello", WeChatXmlParser.parse(xml("text", "<Content><![CDATA[hello]]></Content><MsgId>1</MsgId>")).getContent());
        var event = WeChatXmlParser.parse(xml("event", "<Event><![CDATA[subscribe]]></Event><EventKey><![CDATA[k]]></EventKey>"));
        assertEquals("subscribe", event.getEvent());
        assertEquals("k", event.getEventKey());
    }

    @Test
    void rejectsDoctypeAndExternalEntity() {
        String malicious = "<!DOCTYPE xml [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><xml><Content>&xxe;</Content></xml>";
        assertThrows(IllegalArgumentException.class, () -> WeChatXmlParser.parse(malicious));
    }

    private String xml(String type, String body) {
        return "<xml><ToUserName><![CDATA[to]]></ToUserName><FromUserName><![CDATA[from-openid-1234]]></FromUserName>"
                + "<CreateTime>123</CreateTime><MsgType><![CDATA[" + type + "]]></MsgType>" + body + "</xml>";
    }
}
