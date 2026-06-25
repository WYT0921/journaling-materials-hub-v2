package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 收藏实体
 */
@Data
@TableName("favorites")
public class Favorite {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("material_id")
    private Long materialId;

    @TableField("created_at")
    private LocalDateTime createdAt;

    /** 关联的素材信息（非数据库字段） */
    @TableField(exist = false)
    private Material material;
}
