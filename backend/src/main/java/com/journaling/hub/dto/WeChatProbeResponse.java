package com.journaling.hub.dto;

import com.journaling.hub.entity.WeChatMessageProbe;
import com.journaling.hub.service.WeChatMessageProbeService;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WeChatProbeResponse {
    private Long id;
    private String msgId;
    private String fromOpenid;
    private String toUsername;
    private Long messageCreateTime;
    private String msgType;
    private String eventType;
    private String eventKey;
    private boolean hasMediaId;
    private boolean hasPicUrl;
    private String content;
    private String format;
    private String recognition;
    private String rawXml;
    private String downloadStatus;
    private Integer downloadHttpStatus;
    private String downloadError;
    private String detectedFileType;
    private String detectedMimeType;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private Boolean isAnimated;
    private Integer frameCount;
    private String fileSha256;
    private String probeObjectKey;
    private String traceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WeChatProbeResponse from(WeChatMessageProbe p, boolean detail) {
        return WeChatProbeResponse.builder()
                .id(p.getId()).msgId(p.getMsgId()).fromOpenid(WeChatMessageProbeService.mask(p.getFromOpenid()))
                .toUsername(p.getToUsername()).messageCreateTime(p.getMessageCreateTime()).msgType(p.getMsgType())
                .eventType(p.getEventType()).eventKey(p.getEventKey())
                .hasMediaId(p.getMediaId() != null && !p.getMediaId().isBlank())
                .hasPicUrl(p.getPicUrl() != null && !p.getPicUrl().isBlank())
                .content(p.getContent()).format(p.getFormat()).recognition(p.getRecognition())
                .rawXml(detail ? WeChatMessageProbeService.maskRawXml(p.getRawXml(), p.getFromOpenid()) : null)
                .downloadStatus(p.getDownloadStatus()).downloadHttpStatus(p.getDownloadHttpStatus())
                .downloadError(p.getDownloadError()).detectedFileType(p.getDetectedFileType())
                .detectedMimeType(p.getDetectedMimeType()).fileSize(p.getFileSize()).width(p.getWidth())
                .height(p.getHeight()).isAnimated(p.getIsAnimated()).frameCount(p.getFrameCount())
                .fileSha256(p.getFileSha256()).probeObjectKey(p.getProbeObjectKey()).traceId(p.getTraceId())
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }
}
