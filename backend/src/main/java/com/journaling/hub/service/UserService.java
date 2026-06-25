package com.journaling.hub.service;

import com.journaling.hub.entity.User;

import java.util.Map;

/**
 * 用户服务接口
 */
public interface UserService {

    /**
     * 根据 openid 查找用户
     */
    User findByOpenid(String openid);

    /**
     * 根据 openid 查找或创建用户
     */
    User findOrCreateByOpenid(String openid);

    /**
     * 获取用户资料
     */
    User getProfile(Long userId);

    /**
     * 更新用户资料
     */
    User updateProfile(Long userId, String nickname, String avatarUrl, String phone);

    /**
     * 获取会员状态
     */
    User getPremiumStatus(Long userId);

    /**
     * 获取用户统计信息
     */
    Map<String, Object> getUserStats(Long userId);

    /**
     * 激活会员
     */
    User activatePremium(Long userId, String type, int durationDays);

    /**
     * 增加下载次数
     */
    void incrementDownloadCount(Long userId);

    /**
     * 绑定手机号
     * @param userId 用户 ID
     * @param phone 手机号
     * @return 更新后的用户
     */
    User bindPhone(Long userId, String phone);
}
