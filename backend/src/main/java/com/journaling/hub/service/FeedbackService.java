package com.journaling.hub.service;

import com.journaling.hub.entity.Feedback;

/**
 * 反馈服务
 */
public interface FeedbackService {

    /**
     * 提交反馈
     */
    Feedback submit(Long userId, String content);
}
