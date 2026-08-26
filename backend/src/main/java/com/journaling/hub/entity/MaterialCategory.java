package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("material_categories")
public class MaterialCategory {
    private Long materialId;
    private String category;
    private Integer sortOrder;
}
