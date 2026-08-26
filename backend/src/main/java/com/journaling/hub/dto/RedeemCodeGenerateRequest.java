package com.journaling.hub.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Admin request for generating one-time redeem codes.
 */
@Data
public class RedeemCodeGenerateRequest {

    private String type;

    private Integer count;

    private LocalDateTime expireTime;
}
