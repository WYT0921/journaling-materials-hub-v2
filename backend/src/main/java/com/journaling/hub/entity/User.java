package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("openid")
    private String openid;

    @TableField("nickname")
    private String nickname;

    @TableField("avatar_url")
    private String avatarUrl;

    @TableField("phone")
    private String phone;

    @TableField("member_type")
    private String memberType;

    @TableField("member_expire_time")
    private LocalDateTime memberExpireTime;

    @TableField("points")
    private Integer points;

    @TableField("download_count")
    private Integer downloadCount;

    @TableField("status")
    private Integer status;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 判断是否为会员
     */
    public boolean isPremium() {
        if (memberType == null || "normal".equals(memberType)) {
            return false;
        }
        // 永久会员
        if ("permanent".equals(memberType)) {
            return true;
        }
        // 检查是否过期
        if (memberExpireTime != null && memberExpireTime.isBefore(LocalDateTime.now())) {
            return false;
        }
        return true;
    }

    /**
     * 获取会员类型文本
     */
    public String getMemberTypeText() {
        if (memberType == null || "normal".equals(memberType)) {
            return "普通用户";
        }
        switch (memberType) {
            case "monthly":
                return "月度会员";
            case "yearly":
                return "年度会员";
            case "permanent":
                return "永久会员";
            default:
                return "普通用户";
        }
    }
}
