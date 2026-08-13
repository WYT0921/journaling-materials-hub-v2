package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 素材实体
 */
@Data
@TableName("materials")
public class Material {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("title")
    private String title;

    @TableField("description")
    private String description;

    @TableField("image_url")
    private String imageUrl;

    @TableField("thumbnail_url")
    private String thumbnailUrl;

    @TableField("content_hash")
    private String contentHash;

    @TableField("mime_type")
    private String mimeType;

    @TableField("file_size")
    private Long fileSize;

    private Integer width;
    private Integer height;

    @TableField("duration_ms")
    private Integer durationMs;

    @TableField("frame_count")
    private Integer frameCount;

    private String source;

    @TableField("source_url")
    private String sourceUrl;

    @TableField("collected_at")
    private LocalDateTime collectedAt;

    @TableField("category")
    private String category;

    @TableField("material_type")
    private String materialType;

    @TableField("media_type")
    private String mediaType;

    @TableField("issue_year")
    private Integer issueYear;

    @TableField("issue_number")
    private Integer issueNumber;

    @JsonIgnore
    @TableField(exist = false)
    private boolean issueYearSpecified;

    @JsonIgnore
    @TableField(exist = false)
    private boolean issueNumberSpecified;

    public void setIssueYear(Integer issueYear) {
        this.issueYear = issueYear;
        this.issueYearSpecified = true;
    }

    public void setIssueNumber(Integer issueNumber) {
        this.issueNumber = issueNumber;
        this.issueNumberSpecified = true;
    }

    /**
     * 标签，数据库中存储为 JSON 字符串
     */
    @TableField("tags")
    private String tags;

    @TableField("is_premium")
    private Boolean isPremium;

    @TableField("download_count")
    private Integer downloadCount;

    @TableField("status")
    private Integer status;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
