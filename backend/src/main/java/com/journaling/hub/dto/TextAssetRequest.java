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
    private String aiModel;
    private java.math.BigDecimal aiConfidence;
    private String reviewNote;
    private Integer sortOrder;
    private Integer status;
}
