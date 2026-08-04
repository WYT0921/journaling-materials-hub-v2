package com.journaling.hub.util;

import com.journaling.hub.dto.WeChatOfficialMessage;
import org.w3c.dom.Document;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

public final class WeChatXmlParser {
    private WeChatXmlParser() {}

    public static WeChatOfficialMessage parse(String xml) {
        if (xml == null || xml.isBlank()) {
            throw new IllegalArgumentException("XML消息不能为空");
        }
        if (xml.getBytes(StandardCharsets.UTF_8).length > 65535) {
            throw new IllegalArgumentException("XML消息超过验证记录上限");
        }
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
            factory.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
            Document document = factory.newDocumentBuilder().parse(
                    new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
            return WeChatOfficialMessage.builder()
                    .toUserName(text(document, "ToUserName"))
                    .fromUserName(text(document, "FromUserName"))
                    .createTime(longValue(text(document, "CreateTime")))
                    .msgType(text(document, "MsgType"))
                    .msgId(text(document, "MsgId"))
                    .mediaId(text(document, "MediaId"))
                    .picUrl(text(document, "PicUrl"))
                    .content(limit(text(document, "Content"), 2048))
                    .event(text(document, "Event"))
                    .eventKey(text(document, "EventKey"))
                    .format(text(document, "Format"))
                    .recognition(limit(text(document, "Recognition"), 2048))
                    .rawXml(xml)
                    .build();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("无法解析微信XML消息", e);
        }
    }

    private static String text(Document document, String tag) {
        var nodes = document.getElementsByTagName(tag);
        return nodes.getLength() == 0 ? null : nodes.item(0).getTextContent();
    }

    private static Long longValue(String value) {
        try { return value == null || value.isBlank() ? null : Long.valueOf(value); }
        catch (NumberFormatException e) { return null; }
    }

    private static String limit(String value, int max) {
        return value != null && value.length() > max ? value.substring(0, max) : value;
    }
}
