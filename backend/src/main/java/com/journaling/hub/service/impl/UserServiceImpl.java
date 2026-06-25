package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.Download;
import com.journaling.hub.entity.User;
import com.journaling.hub.mapper.DownloadMapper;
import com.journaling.hub.mapper.UserMapper;
import com.journaling.hub.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户服务实现
 */
@Slf4j
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private DownloadMapper downloadMapper;

    @Autowired
    private com.journaling.hub.mapper.FavoriteMapper favoriteMapper;

    @Autowired
    private com.journaling.hub.mapper.MaterialMapper materialMapper;

    @Override
    public User findByOpenid(String openid) {
        return userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getOpenid, openid)
                        .eq(User::getStatus, 1)
        );
    }

    @Override
    @Transactional
    public User findOrCreateByOpenid(String openid) {
        User user = findByOpenid(openid);
        if (user != null) {
            return user;
        }

        // 创建新用户
        user = new User();
        user.setOpenid(openid);
        user.setNickname("用户" + openid.substring(openid.length() - 6));
        user.setMemberType("normal");
        user.setPoints(0);
        user.setDownloadCount(0);
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(user);
        log.info("创建新用户: id={}, openid={}", user.getId(), openid);

        return user;
    }

    @Override
    public User getProfile(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getStatus() != 1) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return user;
    }

    @Override
    @Transactional
    public User updateProfile(Long userId, String nickname, String avatarUrl, String phone) {
        User user = getProfile(userId);

        if (nickname != null) {
            user.setNickname(nickname);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        if (phone != null) {
            user.setPhone(phone);
        }
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.updateById(user);
        return user;
    }

    @Override
    public User getPremiumStatus(Long userId) {
        return getProfile(userId);
    }

    @Override
    public Map<String, Object> getUserStats(Long userId) {
        User user = getProfile(userId);

        // 统计下载次数
        Long downloadCount = downloadMapper.selectCount(
                new LambdaQueryWrapper<Download>()
                        .eq(Download::getUserId, userId)
        );

        Map<String, Object> stats = new HashMap<>();
        stats.put("points", user.getPoints());
        stats.put("downloadCount", downloadCount.intValue());

        // 统计收藏数
        Long collectionCount = favoriteMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.journaling.hub.entity.Favorite>()
                        .eq(com.journaling.hub.entity.Favorite::getUserId, userId)
        );
        stats.put("collectionCount", collectionCount.intValue());

        // 素材总数
        Long materialCount = materialMapper.selectCount(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.journaling.hub.entity.Material>()
                        .eq(com.journaling.hub.entity.Material::getStatus, 1)
        );
        stats.put("materialCount", materialCount.intValue());

        return stats;
    }

    @Override
    @Transactional
    public User activatePremium(Long userId, String type, int durationDays) {
        User user = getProfile(userId);

        user.setMemberType(type);

        if (durationDays > 0) {
            LocalDateTime expireTime = LocalDateTime.now().plusDays(durationDays);
            user.setMemberExpireTime(expireTime);
        }
        // 永久会员不设置过期时间

        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);

        log.info("用户激活会员: userId={}, type={}, durationDays={}", userId, type, durationDays);
        return user;
    }

    @Override
    public void incrementDownloadCount(Long userId) {
        User user = userMapper.selectById(userId);
        if (user != null) {
            user.setDownloadCount(user.getDownloadCount() + 1);
            userMapper.updateById(user);
        }
    }

    @Override
    @Transactional
    public User bindPhone(Long userId, String phone) {
        User user = getProfile(userId);
        user.setPhone(phone);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateById(user);
        log.info("用户绑定手机号: userId={}, phone={}", userId, phone);
        return user;
    }
}
