package com.journaling.hub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.config.WeChatOfficialProperties;
import com.journaling.hub.dto.WeChatMediaDownload;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class WeChatOfficialMediaClient {
    private final WeChatOfficialProperties properties;
    private final WeChatOfficialAccessTokenService tokenService;
    private final ObjectMapper objectMapper;

    public WeChatMediaDownload download(String mediaId) {
        try {
            return downloadOnce(mediaId, tokenService.getToken(), 0);
        } catch (WeChatMediaDownloadException e) {
            if (e.getWechatErrorCode() != null && (e.getWechatErrorCode() == 40014 || e.getWechatErrorCode() == 42001)) {
                tokenService.invalidate();
                return downloadOnce(mediaId, tokenService.getToken(), 0);
            }
            throw e;
        }
    }

    private WeChatMediaDownload downloadOnce(String mediaId, String token, int redirects) {
        if (redirects > properties.getMaxRedirects()) {
            throw new WeChatMediaDownloadException("素材下载重定向次数过多", null, null);
        }
        URI uri = URI.create(properties.getApiBaseUrl() + "/cgi-bin/media/get?access_token="
                + encode(token) + "&media_id=" + encode(mediaId));
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMillis()))
                    .followRedirects(HttpClient.Redirect.NEVER).build();
            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofMillis(properties.getReadTimeoutMillis())).GET().build();
            HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
            int status = response.statusCode();
            if (status >= 300 && status < 400) {
                String location = response.headers().firstValue("location")
                        .orElseThrow(() -> new WeChatMediaDownloadException("素材下载重定向缺少Location", status, null));
                return downloadUri(URI.create(location), mediaId, redirects + 1);
            }
            byte[] bytes = readLimited(response.body());
            JsonNode error = parseJsonError(bytes);
            if (error != null && error.has("errcode")) {
                int code = error.path("errcode").asInt(-1);
                throw new WeChatMediaDownloadException("微信素材接口错误: " + code + " "
                        + error.path("errmsg").asText(""), status, code);
            }
            if (status < 200 || status >= 300) {
                throw new WeChatMediaDownloadException("素材下载HTTP状态异常: " + status, status, null);
            }
            return new WeChatMediaDownload(bytes, status);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new WeChatMediaDownloadException("素材下载被中断", null, null);
        } catch (WeChatMediaDownloadException e) {
            throw e;
        } catch (Exception e) {
            throw new WeChatMediaDownloadException("素材下载失败: " + e.getClass().getSimpleName(), null, null);
        }
    }

    private WeChatMediaDownload downloadUri(URI uri, String mediaId, int redirects) {
        // 微信重定向目标不需要再次拼接AccessToken；仍采用同一受限下载逻辑。
        if (redirects > properties.getMaxRedirects()) throw new WeChatMediaDownloadException("素材下载重定向次数过多", null, null);
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMillis()))
                    .followRedirects(HttpClient.Redirect.NEVER).build();
            HttpResponse<InputStream> response = client.send(HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofMillis(properties.getReadTimeoutMillis())).GET().build(), HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() >= 300 && response.statusCode() < 400) {
                URI next = uri.resolve(response.headers().firstValue("location")
                        .orElseThrow(() -> new WeChatMediaDownloadException("素材下载重定向缺少Location", response.statusCode(), null)));
                return downloadUri(next, mediaId, redirects + 1);
            }
            byte[] bytes = readLimited(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300)
                throw new WeChatMediaDownloadException("素材下载HTTP状态异常: " + response.statusCode(), response.statusCode(), null);
            return new WeChatMediaDownload(bytes, response.statusCode());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new WeChatMediaDownloadException("素材下载被中断", null, null);
        } catch (WeChatMediaDownloadException e) { throw e; }
        catch (Exception e) { throw new WeChatMediaDownloadException("素材下载失败: " + e.getClass().getSimpleName(), null, null); }
    }

    private byte[] readLimited(InputStream input) throws Exception {
        try (input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int read; long total = 0;
            while ((read = input.read(buffer)) >= 0) {
                total += read;
                if (total > properties.getMaxFileSize())
                    throw new WeChatMediaDownloadException("素材超过大小限制", 200, null);
                out.write(buffer, 0, read);
            }
            return out.toByteArray();
        }
    }

    private JsonNode parseJsonError(byte[] bytes) {
        int i = 0; while (i < bytes.length && Character.isWhitespace(bytes[i])) i++;
        if (i >= bytes.length || bytes[i] != '{') return null;
        try { return objectMapper.readTree(bytes); }
        catch (Exception e) { return null; }
    }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
}
