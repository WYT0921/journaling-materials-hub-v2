package com.journaling.hub.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

/**
 * 统一响应包装类
 * 格式与现有 Node.js 后端保持一致
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> {

    private boolean success;
    private T data;
    private ErrorInfo error;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorInfo {
        private String message;
        private int statusCode;

        public ErrorInfo(String message, int statusCode) {
            this.message = message;
            this.statusCode = statusCode;
        }
    }

    /**
     * 成功响应
     */
    public static <T> Result<T> ok(T data) {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        result.setData(data);
        return result;
    }

    /**
     * 成功响应（无数据）
     */
    public static <T> Result<T> ok() {
        Result<T> result = new Result<>();
        result.setSuccess(true);
        return result;
    }

    /**
     * 错误响应
     */
    public static <T> Result<T> error(String message, int statusCode) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setError(new ErrorInfo(message, statusCode));
        return result;
    }

    /**
     * 错误响应（使用 ErrorCode）
     */
    public static <T> Result<T> error(ErrorCode errorCode) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setError(new ErrorInfo(errorCode.getMessage(), errorCode.getCode()));
        return result;
    }

    /**
     * 错误响应（自定义消息，使用 ErrorCode 的状态码）
     */
    public static <T> Result<T> error(ErrorCode errorCode, String message) {
        Result<T> result = new Result<>();
        result.setSuccess(false);
        result.setError(new ErrorInfo(message, errorCode.getCode()));
        return result;
    }
}
