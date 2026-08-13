package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_music_cards")
public class UserMusicCard {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String title;
    private String canvasSnapshot;
    private String exportUrl;
    private Integer status;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
