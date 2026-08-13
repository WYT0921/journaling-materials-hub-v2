package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.dto.CollectorRunRequest;
import com.journaling.hub.dto.TextAssetImportRequest;
import com.journaling.hub.service.CollectorRunService;
import com.journaling.hub.service.TextAssetService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/v2/internal/collector")
public class InternalCollectorController {
    private final CollectorRunService runService;
    private final TextAssetService assetService;
    private final byte[] expectedToken;

    public InternalCollectorController(CollectorRunService runService, TextAssetService assetService,
                                       @Value("${collector.token:}") String token) {
        this.runService = runService;
        this.assetService = assetService;
        this.expectedToken = token.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping("/runs/start")
    public Result<?> start(@RequestBody CollectorRunRequest request, HttpServletRequest http) {
        authorize(http); return Result.ok(runService.start(request));
    }

    @PutMapping("/runs/{id}")
    public Result<?> finish(@PathVariable Long id, @RequestBody CollectorRunRequest request, HttpServletRequest http) {
        authorize(http); return Result.ok(runService.finish(id, request));
    }

    @PostMapping("/import")
    public Result<?> importItems(@RequestBody TextAssetImportRequest request, HttpServletRequest http) {
        authorize(http);
        return Result.ok(assetService.importItems(request == null ? null : request.getItems()));
    }

    private void authorize(HttpServletRequest request) {
        String suppliedToken = request.getHeader("X-Collector-Token");
        byte[] actual = suppliedToken == null ? new byte[0] : suppliedToken.getBytes(StandardCharsets.UTF_8);
        if (expectedToken.length < 32 || !MessageDigest.isEqual(expectedToken, actual)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "采集器 Token 无效");
        }
    }
}
