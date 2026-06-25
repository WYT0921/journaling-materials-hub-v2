package com.journaling.hub.dto;

import com.journaling.hub.entity.User;
import lombok.Data;

/**
 * 登录响应
 */
@Data
public class LoginResponse {

    private String token;
    private UserInfo userInfo;
    private boolean isPremium;

    @Data
    public static class UserInfo {
        private Long id;
        private String nickname;
        private String avatarUrl;
        private String phone;
        private String memberType;
        private String memberTypeText;
        private String memberExpireTime;
        private Integer points;
        private Integer downloadCount;

        public static UserInfo fromUser(User user) {
            UserInfo info = new UserInfo();
            info.setId(user.getId());
            info.setNickname(user.getNickname());
            info.setAvatarUrl(user.getAvatarUrl());
            info.setPhone(user.getPhone());
            info.setMemberType(user.getMemberType());
            info.setMemberTypeText(user.getMemberTypeText());
            info.setMemberExpireTime(
                    user.getMemberExpireTime() != null ?
                            user.getMemberExpireTime().toString() : null
            );
            info.setPoints(user.getPoints());
            info.setDownloadCount(user.getDownloadCount());
            return info;
        }
    }
}
