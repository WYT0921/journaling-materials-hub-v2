package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.journaling.hub.entity.Feedback;
import com.journaling.hub.mapper.FeedbackMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * FeedbackController tests.
 */
@DisplayName("FeedbackController")
class FeedbackControllerTest extends ControllerTestBase {

    @Autowired
    private FeedbackMapper feedbackMapper;

    @Test
    @DisplayName("POST /api/feedback accepts anonymous feedback")
    void submit_anonymous_shouldSucceed() throws Exception {
        String body = "{\"content\":\"希望增加更多贴纸素材\"}";

        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("希望增加更多贴纸素材"))
                .andExpect(jsonPath("$.data.userId").doesNotExist());

        Feedback feedback = feedbackMapper.selectOne(
                new LambdaQueryWrapper<Feedback>()
                        .eq(Feedback::getContent, "希望增加更多贴纸素材")
        );
        assertNull(feedback.getUserId());
    }

    @Test
    @DisplayName("POST /api/feedback records user id when token exists")
    void submit_withToken_shouldRecordUserId() throws Exception {
        String body = "{\"content\":\"下载流程可以再快一点\"}";

        mockMvc.perform(post("/api/feedback")
                        .header("Authorization", normalUserToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(1));

        Feedback feedback = feedbackMapper.selectOne(
                new LambdaQueryWrapper<Feedback>()
                        .eq(Feedback::getContent, "下载流程可以再快一点")
        );
        assertEquals(1L, feedback.getUserId());
    }

    @Test
    @DisplayName("POST /api/feedback rejects empty content")
    void submit_emptyContent_shouldFail() throws Exception {
        String body = "{\"content\":\"\"}";

        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
