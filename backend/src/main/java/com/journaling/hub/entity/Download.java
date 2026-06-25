package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 下载记录实体
 */
@Data
@TableName("downloads")
public class Download {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("material_id")
    private Long materialId;

    @TableField("downloaded_at")
    private LocalDateTime downloadedAt;

    /**
     * 关联的素材信息（非数据库字段，用于查询时填充）
     */
    @TableField(exist = false)
    private Material material;
}
