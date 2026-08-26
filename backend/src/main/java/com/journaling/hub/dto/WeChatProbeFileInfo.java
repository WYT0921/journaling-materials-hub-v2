package com.journaling.hub.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WeChatProbeFileInfo {
    private String fileType;
    private String mimeType;
    private String extension;
    private long fileSize;
    private Integer width;
    private Integer height;
    private Boolean animated;
    private Integer frameCount;
    private String sha256;
}
