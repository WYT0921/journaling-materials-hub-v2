package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.dto.WeChatOfficialMessage;
import com.journaling.hub.entity.WeChatMessageProbe;
import com.journaling.hub.mapper.WeChatMessageProbeMapper;
import com.journaling.hub.util.WeChatOfficialSignature;
import com.journaling.hub.util.WeChatXmlParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

@Slf4j
@Service
public class WeChatMessageProbeService {
    private final WeChatMessageProbeMapper mapper;
    private final WeChatMessageProbeProcessor processor;
    private final Executor executor;

    public WeChatMessageProbeService(WeChatMessageProbeMapper mapper, WeChatMessageProbeProcessor processor,
                                     @Qualifier("wechatMediaProbeExecutor") Executor executor) {
        this.mapper = mapper; this.processor = processor; this.executor = executor;
    }

    public WeChatMessageProbe accept(String rawXml, boolean simulated) {
        WeChatOfficialMessage message = WeChatXmlParser.parse(rawXml);
        String deliveryKey = WeChatOfficialSignature.sha1("probe") + sha256(
                message.getMsgId() == null || message.getMsgId().isBlank() ? rawXml : "msg:" + message.getMsgId());
        deliveryKey = sha256(deliveryKey);
        String traceId = message.getMsgId() == null || message.getMsgId().isBlank()
                ? (simulated ? "sim-" : "") + UUID.randomUUID() : message.getMsgId();
        WeChatMessageProbe probe = toEntity(message, deliveryKey, traceId);
        try {
            mapper.insert(probe);
        } catch (DuplicateKeyException e) {
            WeChatMessageProbe existing = mapper.selectOne(new LambdaQueryWrapper<WeChatMessageProbe>()
                    .eq(WeChatMessageProbe::getDeliveryKey, deliveryKey));
            log.info("微信消息重复推送，跳过下载 traceId={}, msgType={}", traceId, message.getMsgType());
            return existing;
        }
        log.info("收到微信消息探针 traceId={}, msgType={}, openid={}", traceId, message.getMsgType(), mask(message.getFromUserName()));
        if (message.getMediaId() == null || message.getMediaId().isBlank()) {
            probe.setDownloadStatus("UNSUPPORTED");
            probe.setDownloadError("消息不包含MediaId");
            mapper.updateById(probe);
            return probe;
        }
        try {
            executor.execute(() -> processor.process(probe.getId()));
        } catch (RejectedExecutionException e) {
            processor.markRejected(probe.getId());
            probe.setDownloadStatus("FAILED"); probe.setDownloadError("任务队列已满");
        }
        return probe;
    }

    public Page<WeChatMessageProbe> page(int page, int limit) {
        return mapper.selectPage(new Page<>(page, limit), new LambdaQueryWrapper<WeChatMessageProbe>()
                .orderByDesc(WeChatMessageProbe::getCreatedAt));
    }
    public WeChatMessageProbe get(Long id) { return mapper.selectById(id); }

    private static WeChatMessageProbe toEntity(WeChatOfficialMessage m, String key, String traceId) {
        WeChatMessageProbe p = new WeChatMessageProbe();
        p.setMsgId(blankToNull(m.getMsgId())); p.setDeliveryKey(key); p.setFromOpenid(m.getFromUserName());
        p.setToUsername(m.getToUserName()); p.setMessageCreateTime(m.getCreateTime()); p.setMsgType(m.getMsgType());
        p.setEventType(m.getEvent()); p.setEventKey(m.getEventKey()); p.setMediaId(m.getMediaId());
        p.setPicUrl(m.getPicUrl()); p.setContent(m.getContent()); p.setFormat(m.getFormat());
        p.setRecognition(m.getRecognition()); p.setRawXml(m.getRawXml()); p.setSignatureValid(true);
        p.setDownloadStatus("RECEIVED"); p.setTraceId(traceId); return p;
    }
    public static String mask(String value) {
        if (value == null || value.isBlank()) return value;
        if (value.length() <= 8) return "****";
        return value.substring(0, 4) + "****" + value.substring(value.length() - 4);
    }
    public static String maskRawXml(String xml, String openid) {
        return xml == null || openid == null ? xml : xml.replace(openid, mask(openid));
    }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value; }
    private static String sha256(String value) {
        try { return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
