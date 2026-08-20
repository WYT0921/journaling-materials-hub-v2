package com.journaling.hub.service;

import com.journaling.hub.entity.Feedback;
import java.util.List;

/**
 * 反馈服务
 */
public interface FeedbackService {

    /**
     * 提交反馈
     */
    Feedback submit(Long userId, String content);

    List<Feedback> listByUserId(Long userId);
}
