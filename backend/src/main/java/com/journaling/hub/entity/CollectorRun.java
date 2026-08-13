package com.journaling.hub.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("collector_runs")
public class CollectorRun {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String triggerType;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer collectedCount;
    private Integer candidateCount;
    private Integer filteredCount;
    private Integer duplicateCount;
    private Integer insertedCount;
    private Integer aiFailedCount;
    private String sourceStats;
    private String errorSummary;
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
