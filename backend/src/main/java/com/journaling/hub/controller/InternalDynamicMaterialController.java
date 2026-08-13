package com.journaling.hub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaling.hub.common.Result;
import com.journaling.hub.dto.DynamicMaterialImportRequest;
import com.journaling.hub.service.DynamicMaterialImportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/v2/internal/dynamic-materials")
@RequiredArgsConstructor
public class InternalDynamicMaterialController {
    private final DynamicMaterialImportService service;
    private final ObjectMapper objectMapper;
    @Value("${collector.token:}") private String collectorToken;

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public Result<?> importGif(@RequestPart("gif") MultipartFile gif,
                               @RequestPart("cover") MultipartFile cover,
                               @RequestPart("metadata") String metadata,
                               HttpServletRequest http) throws Exception {
        authorize(http);
        return Result.ok(service.importGif(gif, cover, objectMapper.readValue(metadata, DynamicMaterialImportRequest.class)));
    }

    private void authorize(HttpServletRequest request) {
        byte[] expected = collectorToken.getBytes(StandardCharsets.UTF_8);
        String supplied = request.getHeader("X-Collector-Token");
        byte[] actual = supplied == null ? new byte[0] : supplied.getBytes(StandardCharsets.UTF_8);
        if (expected.length < 32 || !MessageDigest.isEqual(expected, actual)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "采集器 Token 无效");
        }
    }
}
