package com.journaling.hub.common;

import lombok.Getter;

/**
 * 错误码枚举
 */
@Getter
public enum ErrorCode {

    // 通用错误
    SUCCESS(200, "成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权"),
    FORBIDDEN(403, "禁止访问"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_ERROR(500, "服务器内部错误"),

    // 用户相关错误 (1xxx)
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_DISABLED(1002, "用户已被禁用"),
    USER_ALREADY_EXISTS(1003, "用户已存在"),
    LOGIN_FAILED(1004, "登录失败"),
    TOKEN_EXPIRED(1005, "Token 已过期"),
    TOKEN_INVALID(1006, "Token 无效"),
    PHONE_ALREADY_BOUND(1007, "手机号已绑定"),
    PHONE_BIND_FAILED(1008, "手机号绑定失败"),

    // 素材相关错误 (2xxx)
    MATERIAL_NOT_FOUND(2001, "素材不存在"),
    MATERIAL_OFFLINE(2002, "素材已下架"),
    MATERIAL_PREMIUM_REQUIRED(2003, "此素材需要会员权限"),

    // 兑换码相关错误 (3xxx)
    REDEEM_CODE_NOT_FOUND(3001, "兑换码不存在"),
    REDEEM_CODE_USED(3002, "兑换码已被使用"),
    REDEEM_CODE_INVALID(3003, "兑换码无效"),
    REDEEM_CODE_EXPIRED(3004, "兑换码已过期"),

    // 下载相关错误 (4xxx)
    DOWNLOAD_FAILED(4001, "下载失败"),
    DOWNLOAD_NOT_FOUND(4002, "下载记录不存在"),
    DOWNLOAD_ALREADY_EXISTS(4003, "已下载过此素材"),

    // 收藏相关错误 (5xxx)
    FAVORITE_ALREADY_EXISTS(5001, "已收藏此素材"),
    FAVORITE_NOT_FOUND(5002, "收藏记录不存在"),

    // 管理员相关错误 (9xxx)
    ADMIN_REQUIRED(9001, "需要管理员权限");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
