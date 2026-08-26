package com.journaling.hub.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WeChatOfficialMessage {
    private String toUserName;
    private String fromUserName;
    private Long createTime;
    private String msgType;
    private String msgId;
    private String mediaId;
    private String picUrl;
    private String content;
    private String event;
    private String eventKey;
    private String format;
    private String recognition;
    private String rawXml;
}
