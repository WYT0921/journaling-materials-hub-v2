package com.journaling.hub.dto;

import lombok.Data;

/**
 * 用户资料更新请求
 */
@Data
public class UserProfileUpdateRequest {

    private String nickname;
    private String avatarUrl;
    private String phone;
}
