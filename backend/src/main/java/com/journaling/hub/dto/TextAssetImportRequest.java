package com.journaling.hub.dto;

import lombok.Data;
import java.util.List;

@Data
public class TextAssetImportRequest {
    private List<TextAssetRequest> items;
}
