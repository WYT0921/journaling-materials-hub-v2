package com.journaling.hub.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class AuraTemplateRequest {
    private String templateKey;
    private String name;
    private String style;
    private String previewUrl;
    private List<String> supportedRatios;
    private Map<String, Object> config;
    private Integer configVersion;
    private Integer status;
    private Integer sortOrder;
}
