package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.dto.RedeemRequest;
import com.journaling.hub.service.RedeemCodeService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 兑换码控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/redeem")
public class RedeemController {

    @Autowired
    private RedeemCodeService redeemCodeService;

    /**
     * 验证兑换码
     */
    @PostMapping("/verify")
    public Result<?> verifyCode(@Valid @RequestBody RedeemRequest request) {
        Map<String, Object> result = redeemCodeService.verifyCode(request.getCode());
        return Result.ok(result);
    }

    /**
     * 使用兑换码激活会员
     */
    @PostMapping("/activate")
    public Result<?> activate(HttpServletRequest request,
                              @Valid @RequestBody RedeemRequest redeemRequest) {
        Long userId = (Long) request.getAttribute("userId");
        Map<String, Object> result = redeemCodeService.activate(userId, redeemRequest.getCode());
        return Result.ok(result);
    }
}
