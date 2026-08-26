package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("text_decoration_templates")
public class TextDecorationTemplate {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String category;
    private String type;
    private String prefix;
    private String suffix;
    private String template;
    @TableField("preview_text")
    private String previewText;
    @TableField("unicode_level")
    private String unicodeLevel;
    private Boolean enabled;
    @TableField("sort_order")
    private Integer sortOrder;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
