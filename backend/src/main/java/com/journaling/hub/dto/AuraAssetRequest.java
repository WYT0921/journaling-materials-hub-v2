package com.journaling.hub.dto;

import lombok.Data;

import java.util.Map;

@Data
public class AuraAssetRequest {
    private String assetKey;
    private String name;
    private String type;
    private String fileUrl;
    private String previewUrl;
    private String sha256;
    private Integer resourceVersion;
    private Map<String, Object> metadata;
    private Integer status;
    private Integer sortOrder;
}
