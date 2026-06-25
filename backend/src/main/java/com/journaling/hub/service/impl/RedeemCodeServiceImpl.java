package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.dto.LoginResponse;
import com.journaling.hub.entity.RedeemCode;
import com.journaling.hub.entity.User;
import com.journaling.hub.mapper.RedeemCodeMapper;
import com.journaling.hub.service.RedeemCodeService;
import com.journaling.hub.service.UserService;
import com.journaling.hub.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 兑换码服务实现
 */
@Slf4j
@Service
public class RedeemCodeServiceImpl implements RedeemCodeService {

    @Autowired
    private RedeemCodeMapper redeemCodeMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Map<String, Object> verifyCode(String code) {
        RedeemCode redeemCode = redeemCodeMapper.selectOne(
                new LambdaQueryWrapper<RedeemCode>()
                        .eq(RedeemCode::getCode, code)
        );

        Map<String, Object> result = new HashMap<>();

        if (redeemCode == null) {
            result.put("valid", false);
            result.put("message", "兑换码不存在");
            return result;
        }

        if (redeemCode.getStatus() == 1) {
            result.put("valid", false);
            result.put("message", "兑换码已被使用");
            return result;
        }

        result.put("valid", true);
        result.put("type", redeemCode.getType());
        result.put("message", "兑换码有效");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> activate(Long userId, String code) {
        // 查找兑换码
        RedeemCode redeemCode = redeemCodeMapper.selectOne(
                new LambdaQueryWrapper<RedeemCode>()
                        .eq(RedeemCode::getCode, code)
        );

        if (redeemCode == null) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_NOT_FOUND);
        }

        if (redeemCode.getStatus() == 1) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_USED);
        }

        // 获取会员类型和时长
        String type = redeemCode.getType();
        int durationDays;
        switch (type) {
            case "monthly":
                durationDays = 30;
                break;
            case "yearly":
                durationDays = 365;
                break;
            case "permanent":
                durationDays = 0; // 永久
                break;
            default:
                throw new BusinessException(ErrorCode.REDEEM_CODE_INVALID);
        }

        // 激活会员
        User user = userService.activatePremium(userId, type, durationDays);

        // 更新兑换码状态
        redeemCode.setStatus(1);
        redeemCode.setUserId(userId);
        redeemCode.setUsedTime(LocalDateTime.now());
        redeemCodeMapper.updateById(redeemCode);

        // 生成新 Token（包含更新后的会员状态）
        String token = jwtUtil.generateToken(user.getId(), user.getOpenid(), user.isPremium());

        log.info("兑换码激活成功: userId={}, code={}, type={}", userId, code, type);

        // 构建响应
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userInfo", LoginResponse.UserInfo.fromUser(user));
        result.put("isPremium", user.isPremium());
        result.put("memberType", user.getMemberType());
        result.put("memberExpireTime",
                user.getMemberExpireTime() != null ?
                        user.getMemberExpireTime().toString() : null);

        return result;
    }
}
