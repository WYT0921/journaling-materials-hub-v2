package com.journaling.hub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 兑换码请求
 */
@Data
public class RedeemRequest {

    @NotBlank(message = "兑换码不能为空")
    private String code;
}
