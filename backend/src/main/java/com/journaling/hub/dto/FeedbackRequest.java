package com.journaling.hub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 反馈提交请求
 */
@Data
public class FeedbackRequest {

    @NotBlank(message = "反馈内容不能为空")
    @Size(max = 1000, message = "反馈内容不能超过 1000 字")
    private String content;
}
