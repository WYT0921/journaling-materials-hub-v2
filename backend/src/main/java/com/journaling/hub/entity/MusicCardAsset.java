package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("music_card_assets")
public class MusicCardAsset {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String type;
    private String name;
    private String category;
    private String previewUrl;
    private String config;
    private String tags;
    private Integer status;
    private Integer sortOrder;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
