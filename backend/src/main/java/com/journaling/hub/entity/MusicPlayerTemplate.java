package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("music_player_templates")
public class MusicPlayerTemplate {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
    private java.math.BigDecimal coverSize;
    private Integer showProgress;
    private Integer showControls;
    private Integer showWaveform;
    private Integer showVinyl;
    private Integer albumArtBorderRadius;
    private String fontFamily;
    private Integer titleSize;
    private Integer artistSize;
    private java.math.BigDecimal padding;
    private String colors;
    private Integer status;
    private Integer sortOrder;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
