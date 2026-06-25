package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工具实体
 */
@Data
@TableName("tools")
public class Tool {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("name")
    private String name;

    @TableField("description")
    private String description;

    @TableField("icon")
    private String icon;

    @TableField("url")
    private String url;

    /** 排序序号 */
    @TableField("sort_order")
    private Integer sortOrder;

    /** 是否为默认工具（默认工具不可删除） */
    @TableField("is_default")
    private Boolean isDefault;

    /** 所属用户（自定义工具关联用户，默认工具为 null） */
    @TableField("user_id")
    private Long userId;

    @TableField("status")
    private Integer status;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
