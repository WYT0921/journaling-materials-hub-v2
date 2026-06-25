package com.journaling.hub.service;

import java.util.Map;

/**
 * 兑换码服务接口
 */
public interface RedeemCodeService {

    /**
     * 验证兑换码
     */
    Map<String, Object> verifyCode(String code);

    /**
     * 使用兑换码激活会员
     */
    Map<String, Object> activate(Long userId, String code);
}
