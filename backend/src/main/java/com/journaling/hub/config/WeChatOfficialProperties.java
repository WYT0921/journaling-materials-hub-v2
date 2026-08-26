package com.journaling.hub.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "wechat.official")
public class WeChatOfficialProperties {
    private String appId = "";
    private String appSecret = "";
    private String token = "";
    private String callbackPath = "/api/wechat/official/callback";
    private String messageMode = "plaintext";
    private boolean probeApiEnabled = false;
    private long maxFileSize = 10 * 1024 * 1024L;
    private int connectTimeoutMillis = 5000;
    private int readTimeoutMillis = 15000;
    private int maxRedirects = 3;
    private int executorCorePoolSize = 2;
    private int executorMaxPoolSize = 4;
    private int executorQueueCapacity = 100;
    private String apiBaseUrl = "https://api.weixin.qq.com";
}
