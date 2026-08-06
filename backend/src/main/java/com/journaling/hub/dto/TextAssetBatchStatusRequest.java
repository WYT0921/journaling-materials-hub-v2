package com.journaling.hub.dto;

import lombok.Data;
import java.util.List;

@Data
public class TextAssetBatchStatusRequest {
    private List<Long> ids;
    private Integer status;
}
