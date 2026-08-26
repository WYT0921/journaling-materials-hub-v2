package com.journaling.hub.dto;

import lombok.Data;
import java.util.List;

@Data
public class MaterialRequest {
    private String title;
    private String description;
    private String imageUrl;
    private String thumbnailUrl;
    private String category;
    private List<String> categories;
    private String materialType;
    private String mediaType;
    private String contentHash;
    private String mimeType;
    private Long fileSize;
    private Integer width;
    private Integer height;
    private Integer durationMs;
    private Integer frameCount;
    private Integer issueYear;
    private Integer issueNumber;
    private boolean issueYearSpecified;
    private boolean issueNumberSpecified;
    private String tags;
    private Boolean isPremium;
    private Integer status;
    private Integer sortOrder;

    public void setIssueYear(Integer issueYear) { this.issueYear = issueYear; this.issueYearSpecified = true; }
    public void setIssueNumber(Integer issueNumber) { this.issueNumber = issueNumber; this.issueNumberSpecified = true; }
}
