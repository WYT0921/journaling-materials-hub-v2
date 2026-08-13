package com.journaling.hub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.dto.CollectorRunRequest;
import com.journaling.hub.entity.CollectorRun;
import com.journaling.hub.mapper.CollectorRunMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CollectorRunServiceTest {
    private CollectorRunMapper mapper;
    private RedisTemplate<String, Object> redis;
    private ValueOperations<String, Object> values;
    private CollectorRunService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        mapper = mock(CollectorRunMapper.class);
        redis = mock(RedisTemplate.class);
        values = mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        service = new CollectorRunService(mapper, redis, new ObjectMapper());
    }

    @Test
    void startUsesFourHourRedisLock() {
        when(values.setIfAbsent(eq("collector:daily:lock"), eq("lock-1"), eq(Duration.ofHours(4)))).thenReturn(true);
        CollectorRunRequest request = new CollectorRunRequest();
        request.setTriggerType("manual");
        request.setLockToken("lock-1");

        CollectorRun run = service.start(request);

        assertEquals("running", run.getStatus());
        verify(mapper).insert(run);
    }

    @Test
    void concurrentStartIsRejected() {
        when(values.setIfAbsent(anyString(), any(), any(Duration.class))).thenReturn(false);
        CollectorRunRequest request = new CollectorRunRequest();
        request.setTriggerType("scheduled");
        request.setLockToken("lock-2");

        assertThrows(BusinessException.class, () -> service.start(request));
        verifyNoInteractions(mapper);
    }

    @Test
    void failedRunInsertReleasesOnlyItsOwnLock() {
        when(values.setIfAbsent(anyString(), eq("lock-3"), any(Duration.class))).thenReturn(true);
        when(values.get("collector:daily:lock")).thenReturn("lock-3");
        doThrow(new IllegalStateException("db offline")).when(mapper).insert(any());
        CollectorRunRequest request = new CollectorRunRequest();
        request.setTriggerType("manual");
        request.setLockToken("lock-3");

        assertThrows(IllegalStateException.class, () -> service.start(request));
        verify(redis).delete("collector:daily:lock");
    }
}
