package com.journaling.hub.dto;

import lombok.Data;

@Data
public class DynamicMaterialImportRequest {
    private String title;
    private String description;
    private String category;
    private String materialType;
    private String tags;
    private Boolean isPremium;
    private String source;
    private String sourceUrl;
    private String contentHash;
    private Integer durationMs;
    private Integer frameCount;
    private Integer width;
    private Integer height;
}
