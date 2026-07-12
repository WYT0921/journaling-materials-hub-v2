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
 * Redeem code service.
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
        RedeemCode redeemCode = findByCode(code);
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

        if (redeemCode.getStatus() == 2) {
            result.put("valid", false);
            result.put("message", "兑换码已作废");
            return result;
        }

        if (isExpired(redeemCode)) {
            result.put("valid", false);
            result.put("message", "兑换码已过期");
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
        RedeemCode redeemCode = findByCode(code);

        if (redeemCode == null) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_NOT_FOUND);
        }

        if (redeemCode.getStatus() == 1) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_USED);
        }

        if (redeemCode.getStatus() == 2) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_INVALID, "兑换码已作废");
        }

        if (isExpired(redeemCode)) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_EXPIRED);
        }

        String type = redeemCode.getType();
        int durationDays = switch (type) {
            case "monthly" -> 30;
            case "yearly" -> 365;
            case "permanent" -> 0;
            default -> throw new BusinessException(ErrorCode.REDEEM_CODE_INVALID);
        };

        User user = userService.activatePremium(userId, type, durationDays);

        redeemCode.setStatus(1);
        redeemCode.setUserId(userId);
        redeemCode.setUsedTime(LocalDateTime.now());
        redeemCodeMapper.updateById(redeemCode);

        String token = jwtUtil.generateToken(user.getId(), user.getOpenid(), user.isPremium());

        log.info("兑换码激活成功: userId={}, code={}, type={}", userId, redeemCode.getCode(), type);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userInfo", LoginResponse.UserInfo.fromUser(user));
        result.put("isPremium", user.isPremium());
        result.put("memberType", user.getMemberType());
        result.put("memberExpireTime",
                user.getMemberExpireTime() != null ? user.getMemberExpireTime().toString() : null);

        return result;
    }

    private RedeemCode findByCode(String code) {
        return redeemCodeMapper.selectOne(new LambdaQueryWrapper<RedeemCode>()
                .eq(RedeemCode::getCode, normalizeCode(code)));
    }

    private String normalizeCode(String code) {
        if (code == null) {
            return "";
        }
        String raw = code.replace("-", "").replaceAll("\\s+", "").toUpperCase();
        if (raw.length() == 12) {
            return raw.substring(0, 4) + "-" + raw.substring(4, 8) + "-" + raw.substring(8);
        }
        return code.trim().toUpperCase();
    }

    private boolean isExpired(RedeemCode redeemCode) {
        return redeemCode.getExpireTime() != null && redeemCode.getExpireTime().isBefore(LocalDateTime.now());
    }
}
