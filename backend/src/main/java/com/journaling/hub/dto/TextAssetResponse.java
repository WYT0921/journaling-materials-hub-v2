package com.journaling.hub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class TextAssetResponse {
    private Long id;
    private String content;
    private String type;
    private String category;
    private List<String> tags;
}
