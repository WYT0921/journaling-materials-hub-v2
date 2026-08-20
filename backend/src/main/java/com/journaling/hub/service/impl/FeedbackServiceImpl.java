package com.journaling.hub.service.impl;

import com.journaling.hub.entity.Feedback;
import com.journaling.hub.mapper.FeedbackMapper;
import com.journaling.hub.service.FeedbackService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 反馈服务实现
 */
@Slf4j
@Service
public class FeedbackServiceImpl implements FeedbackService {

    @Autowired
    private FeedbackMapper feedbackMapper;

    @Override
    public Feedback submit(Long userId, String content) {
        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setContent(content.trim());
        feedback.setStatus(0);
        feedbackMapper.insert(feedback);

        log.info("反馈提交成功: id={}, userId={}", feedback.getId(), userId);
        return feedback;
    }

    @Override
    public List<Feedback> listByUserId(Long userId) {
        return feedbackMapper.selectList(new LambdaQueryWrapper<Feedback>()
                .eq(Feedback::getUserId, userId)
                .orderByDesc(Feedback::getCreatedAt));
    }
}
