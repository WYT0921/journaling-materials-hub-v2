package com.journaling.hub.dto;

import lombok.Data;

import java.util.List;

@Data
public class TextAssetRequest {
    private String content;
    private String type;
    private String category;
    private List<String> tags;
    private String source;
    private String sourceUrl;
    private String riskLevel;
    private Integer sortOrder;
    private Integer status;
}
