package com.journaling.hub.service;

import lombok.Getter;

@Getter
public class WeChatMediaDownloadException extends RuntimeException {
    private final Integer httpStatus;
    private final Integer wechatErrorCode;

    public WeChatMediaDownloadException(String message, Integer httpStatus, Integer wechatErrorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.wechatErrorCode = wechatErrorCode;
    }
}
