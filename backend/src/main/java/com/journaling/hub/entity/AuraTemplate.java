package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("aura_templates")
public class AuraTemplate {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String templateKey;
    private String name;
    private String style;
    private String previewUrl;
    private String supportedRatios;
    private String configJson;
    private Integer configVersion;
    private Integer status;
    private Integer sortOrder;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
