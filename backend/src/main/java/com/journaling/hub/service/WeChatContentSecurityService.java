package com.journaling.hub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.util.WeChatUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class WeChatContentSecurityService {

    private static final String MSG_SEC_CHECK_URL =
            "https://api.weixin.qq.com/wxa/msg_sec_check?access_token=%s";
    private static final String IMG_SEC_CHECK_URL =
            "https://api.weixin.qq.com/wxa/img_sec_check?access_token=%s";
    private static final String RISK_MESSAGE = "所发布内容含违规信息";

    private final WeChatUtil weChatUtil;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public WeChatContentSecurityService(WeChatUtil weChatUtil, ObjectMapper objectMapper) {
        this.weChatUtil = weChatUtil;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

    public void checkProfileText(String content, String openid) {
        if (content == null || content.isBlank()) return;
        String token = requireAccessToken();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", content);
        body.put("version", 2);
        body.put("scene", 1);
        body.put("openid", openid);
        verifyResponse(postJson(String.format(MSG_SEC_CHECK_URL, token), body), "msgSecCheck");
    }

    public void checkAvatar(MultipartFile file) {
        String token = requireAccessToken();
        try {
            ByteArrayResource media = new ByteArrayResource(file.getBytes()) {
                @Override public String getFilename() {
                    return file.getOriginalFilename() == null ? "avatar.png" : file.getOriginalFilename();
                }
            };
            HttpHeaders partHeaders = new HttpHeaders();
            partHeaders.setContentType(MediaType.parseMediaType(
                    file.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.getContentType()));
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("media", new HttpEntity<>(media, partHeaders));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            String response = restTemplate.postForObject(
                    String.format(IMG_SEC_CHECK_URL, token), new HttpEntity<>(body, headers), String.class);
            verifyResponse(response, "imgSecCheck");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("微信头像内容安全检测异常", e);
            throw new BusinessException(ErrorCode.CONTENT_SECURITY_UNAVAILABLE, "内容安全检测失败，请稍后重试");
        }
    }

    protected String postJson(String url, Map<String, Object> body) {
        try {
            return restTemplate.postForObject(url, body, String.class);
        } catch (Exception e) {
            log.error("微信文本内容安全检测异常", e);
            throw new BusinessException(ErrorCode.CONTENT_SECURITY_UNAVAILABLE, "内容安全检测失败，请稍后重试");
        }
    }

    private String requireAccessToken() {
        String token = weChatUtil.getAccessToken();
        if (token == null || token.isBlank()) {
            throw new BusinessException(ErrorCode.CONTENT_SECURITY_UNAVAILABLE, "内容安全检测失败，请稍后重试");
        }
        return token;
    }

    private void verifyResponse(String response, String operation) {
        try {
            JsonNode root = objectMapper.readTree(response);
            int errcode = root.path("errcode").asInt(-1);
            String suggest = root.path("result").path("suggest").asText("");
            if (errcode == 87014 || "risky".equalsIgnoreCase(suggest)) {
                throw new BusinessException(ErrorCode.CONTENT_SECURITY_RISK, RISK_MESSAGE);
            }
            if (errcode != 0 || (!suggest.isEmpty() && !"pass".equalsIgnoreCase(suggest))) {
                log.warn("微信内容安全接口失败: operation={}, errcode={}", operation, errcode);
                throw new BusinessException(ErrorCode.CONTENT_SECURITY_UNAVAILABLE, "内容安全检测失败，请稍后重试");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("微信内容安全响应解析失败: operation={}", operation, e);
            throw new BusinessException(ErrorCode.CONTENT_SECURITY_UNAVAILABLE, "内容安全检测失败，请稍后重试");
        }
    }
}
