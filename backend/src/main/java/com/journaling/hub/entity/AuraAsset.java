package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("aura_assets")
public class AuraAsset {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String assetKey;
    private String name;
    private String type;
    private String fileUrl;
    private String previewUrl;
    private String sha256;
    private Integer resourceVersion;
    private String metadataJson;
    private Integer status;
    private Integer sortOrder;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
