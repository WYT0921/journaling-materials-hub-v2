package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("text_assets")
public class TextAsset {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String content;
    @TableField("content_hash")
    private String contentHash;
    private String type;
    private String category;
    private String tags;
    private String source;
    @TableField("source_url")
    private String sourceUrl;
    @TableField("risk_level")
    private String riskLevel;
    @TableField("ai_model")
    private String aiModel;
    @TableField("ai_confidence")
    private java.math.BigDecimal aiConfidence;
    @TableField("review_note")
    private String reviewNote;
    private Integer status;
    @TableField("sort_order")
    private Integer sortOrder;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
