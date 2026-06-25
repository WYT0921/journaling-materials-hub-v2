package com.journaling.hub.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 手机号绑定请求
 */
@Data
public class BindPhoneRequest {

    @NotBlank(message = "手机号授权 code 不能为空")
    private String code;
}
