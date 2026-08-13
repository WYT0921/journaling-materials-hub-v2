package com.journaling.hub.dto;

import lombok.Data;

@Data
public class CollectorRunRequest {
    private String triggerType;
    private String status;
    private Integer collectedCount;
    private Integer candidateCount;
    private Integer filteredCount;
    private Integer duplicateCount;
    private Integer insertedCount;
    private Integer aiFailedCount;
    private Object sourceStats;
    private String errorSummary;
    private String lockToken;
}
