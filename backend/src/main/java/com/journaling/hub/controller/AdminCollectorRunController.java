package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.service.CollectorRunService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/admin/collector-runs")
public class AdminCollectorRunController {
    private final CollectorRunService service;
    public AdminCollectorRunController(CollectorRunService service) { this.service = service; }

    @GetMapping
    public Result<?> list(@RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(service.list(page, limit));
    }
}
