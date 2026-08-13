package com.journaling.hub.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.dto.CollectorRunRequest;
import com.journaling.hub.entity.CollectorRun;
import com.journaling.hub.mapper.CollectorRunMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Set;

@Service
public class CollectorRunService {
    private static final String LOCK_KEY = "collector:daily:lock";
    private static final Set<String> TRIGGERS = Set.of("scheduled", "manual", "dry-run");
    private static final Set<String> STATUSES = Set.of("running", "succeeded", "partial", "failed");
    private final CollectorRunMapper mapper;
    private final RedisTemplate<String, Object> redis;
    private final ObjectMapper objectMapper;

    public CollectorRunService(CollectorRunMapper mapper, RedisTemplate<String, Object> redis, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public CollectorRun start(CollectorRunRequest request) {
        String trigger = request == null ? null : request.getTriggerType();
        String lockToken = request == null ? null : request.getLockToken();
        if (!TRIGGERS.contains(trigger) || lockToken == null || lockToken.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "运行参数无效");
        }
        Boolean acquired = redis.opsForValue().setIfAbsent(LOCK_KEY, lockToken, Duration.ofHours(4));
        if (!Boolean.TRUE.equals(acquired)) throw new BusinessException(ErrorCode.BAD_REQUEST, "采集任务正在运行");
        try {
            CollectorRun run = new CollectorRun();
            run.setTriggerType(trigger);
            run.setStatus("running");
            run.setStartedAt(LocalDateTime.now());
            run.setCollectedCount(0); run.setCandidateCount(0); run.setFilteredCount(0);
            run.setDuplicateCount(0); run.setInsertedCount(0); run.setAiFailedCount(0);
            mapper.insert(run);
            return run;
        } catch (RuntimeException exception) {
            Object current = redis.opsForValue().get(LOCK_KEY);
            if (lockToken.equals(String.valueOf(current))) redis.delete(LOCK_KEY);
            throw exception;
        }
    }

    public CollectorRun finish(Long id, CollectorRunRequest request) {
        CollectorRun run = mapper.selectById(id);
        if (run == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        if (request == null || !STATUSES.contains(request.getStatus()) || "running".equals(request.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "结束状态无效");
        }
        run.setStatus(request.getStatus());
        run.setFinishedAt(LocalDateTime.now());
        run.setCollectedCount(number(request.getCollectedCount()));
        run.setCandidateCount(number(request.getCandidateCount()));
        run.setFilteredCount(number(request.getFilteredCount()));
        run.setDuplicateCount(number(request.getDuplicateCount()));
        run.setInsertedCount(number(request.getInsertedCount()));
        run.setAiFailedCount(number(request.getAiFailedCount()));
        run.setSourceStats(json(request.getSourceStats()));
        run.setErrorSummary(trim(request.getErrorSummary(), 1000));
        mapper.updateById(run);
        Object current = redis.opsForValue().get(LOCK_KEY);
        if (request.getLockToken() != null && request.getLockToken().equals(String.valueOf(current))) redis.delete(LOCK_KEY);
        return run;
    }

    public PageResult<CollectorRun> list(int page, int limit) {
        return PageResult.from(mapper.selectPage(new Page<>(Math.max(1, page), Math.min(100, Math.max(1, limit))),
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<CollectorRun>()
                        .orderByDesc(CollectorRun::getStartedAt)));
    }

    private int number(Integer value) { return value == null ? 0 : Math.max(0, value); }
    private String trim(String value, int max) { return value == null ? null : value.substring(0, Math.min(max, value.length())); }
    private String json(Object value) {
        if (value == null) return null;
        try { return objectMapper.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new BusinessException(ErrorCode.BAD_REQUEST, "来源统计格式错误"); }
    }
}
