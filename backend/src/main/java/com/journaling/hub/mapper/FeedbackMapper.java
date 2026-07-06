package com.journaling.hub.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.journaling.hub.entity.Feedback;
import org.apache.ibatis.annotations.Mapper;

/**
 * 反馈 Mapper
 */
@Mapper
public interface FeedbackMapper extends BaseMapper<Feedback> {
}
