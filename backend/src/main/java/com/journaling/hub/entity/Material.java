package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
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

    @TableField("category")
    private String category;

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
