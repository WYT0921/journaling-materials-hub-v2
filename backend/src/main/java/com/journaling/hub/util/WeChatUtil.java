package com.journaling.hub.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信小程序工具类
 */
@Slf4j
@Component
public class WeChatUtil {

    @Value("${wechat.appid}")
    private String appid;

    @Value("${wechat.secret}")
    private String secret;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String JSCODE2SESSION_URL =
            "https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code";

    private static final String ACCESS_TOKEN_URL =
            "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s";

    private static final String GET_PHONE_NUMBER_URL =
            "https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=%s";

    private volatile String cachedAccessToken;
    private volatile long accessTokenExpireTime;

    /**
     * 获取微信 access_token（带内存缓存）
     */
    private String getAccessToken() {
        if (cachedAccessToken != null && System.currentTimeMillis() < accessTokenExpireTime) {
            return cachedAccessToken;
        }

        String url = String.format(ACCESS_TOKEN_URL, appid, secret);
        try {
            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);

            log.info("微信 access_token 响应: {}", response);

            if (jsonNode.has("errcode") && jsonNode.get("errcode").asInt() != 0) {
                String errMsg = jsonNode.has("errmsg") ? jsonNode.get("errmsg").asText() : "未知错误";
                log.error("获取微信 access_token 失败: {}", errMsg);
                return null;
            }

            String token = jsonNode.get("access_token").asText();
            int expiresIn = jsonNode.get("expires_in").asInt();

            // 提前 60 秒过期，安全余量
            cachedAccessToken = token;
            accessTokenExpireTime = System.currentTimeMillis() + (expiresIn - 60) * 1000L;

            return token;
        } catch (Exception e) {
            log.error("微信 access_token 请求异常: ", e);
            return null;
        }
    }

    /**
     * 调用微信 getuserphonenumber 接口获取手机号
     * @param code 前端 wx.getPhoneNumber() 返回的动态令牌
     * @return 纯手机号（不含国家代码），失败返回 null
     */
    public String getPhoneNumber(String code) {
        String accessToken = getAccessToken();
        if (accessToken == null) {
            log.error("获取手机号失败: access_token 为空");
            return null;
        }

        String url = String.format(GET_PHONE_NUMBER_URL, accessToken);
        try {
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("code", code);

            String response = restTemplate.postForObject(url, requestBody, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);

            log.info("微信 getuserphonenumber 响应: {}", response);

            if (jsonNode.has("errcode") && jsonNode.get("errcode").asInt() != 0) {
                String errMsg = jsonNode.has("errmsg") ? jsonNode.get("errmsg").asText() : "未知错误";
                log.error("获取微信手机号失败: {}", errMsg);
                return null;
            }

            JsonNode phoneInfo = jsonNode.get("phone_info");
            if (phoneInfo != null && phoneInfo.has("purePhoneNumber")) {
                return phoneInfo.get("purePhoneNumber").asText();
            }

            log.error("获取微信手机号失败: 响应中无 phone_info");
            return null;
        } catch (Exception e) {
            log.error("微信 getuserphonenumber 请求异常: ", e);
            return null;
        }
    }

    /**
     * 调用微信 jscode2session 接口获取 openid
     */
    public Map<String, String> jscode2session(String code) {
        String url = String.format(JSCODE2SESSION_URL, appid, secret, code);

        try {
            String response = restTemplate.getForObject(url, String.class);
            JsonNode jsonNode = objectMapper.readTree(response);

            log.info("微信 jscode2session 响应: {}", response);

            if (jsonNode.has("errcode") && jsonNode.get("errcode").asInt() != 0) {
                String errMsg = jsonNode.has("errmsg") ? jsonNode.get("errmsg").asText() : "未知错误";
                log.error("微信 jscode2session 失败: {}", errMsg);
                return null;
            }

            Map<String, String> result = new HashMap<>();
            result.put("openid", jsonNode.get("openid").asText());
            result.put("session_key", jsonNode.get("session_key").asText());

            if (jsonNode.has("unionid")) {
                result.put("unionid", jsonNode.get("unionid").asText());
            }

            return result;
        } catch (Exception e) {
            log.error("微信 jscode2session 请求异常: ", e);
            return null;
        }
    }
}
