package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 兑换码实体
 */
@Data
@TableName("redeem_codes")
public class RedeemCode {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("code")
    private String code;

    @TableField("type")
    private String type;

    /**
     * 0=未使用, 1=已使用
     */
    @TableField("status")
    private Integer status;

    @TableField("user_id")
    private Long userId;

    @TableField("used_time")
    private LocalDateTime usedTime;

    @TableField("expire_time")
    private LocalDateTime expireTime;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
