package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.dto.TextAssetBatchStatusRequest;
import com.journaling.hub.dto.TextAssetImportRequest;
import com.journaling.hub.dto.TextAssetRequest;
import com.journaling.hub.service.TextAssetService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/admin/text-assets")
public class AdminTextAssetController {
    private final TextAssetService textAssetService;

    public AdminTextAssetController(TextAssetService textAssetService) {
        this.textAssetService = textAssetService;
    }

    @GetMapping
    public Result<?> list(@RequestParam(required = false) String type,
                          @RequestParam(required = false) String category,
                          @RequestParam(required = false) String keyword,
                          @RequestParam(required = false) Integer status,
                          @RequestParam(required = false) String source,
                          @RequestParam(required = false) String riskLevel,
                          @RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "20") int limit) {
        return Result.ok(textAssetService.listAdmin(type, category, keyword, status, source, riskLevel, page, limit));
    }

    @PostMapping
    public Result<?> create(@RequestBody TextAssetRequest request) {
        return Result.ok(textAssetService.create(request, false));
    }

    @PutMapping("/{id}")
    public Result<?> update(@PathVariable Long id, @RequestBody TextAssetRequest request) {
        return Result.ok(textAssetService.update(id, request));
    }

    @PutMapping("/{id}/status")
    public Result<?> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        return Result.ok(textAssetService.updateStatus(id, status));
    }

    @PutMapping("/batch-status")
    public Result<?> batchStatus(@RequestBody TextAssetBatchStatusRequest request) {
        int updated = textAssetService.batchUpdateStatus(request.getIds(), request.getStatus());
        return Result.ok(Map.of("updated", updated));
    }

    @PostMapping("/import")
    public Result<?> importItems(@RequestBody TextAssetImportRequest request) {
        return Result.ok(textAssetService.importItems(request == null ? null : request.getItems()));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        textAssetService.delete(id);
        return Result.ok();
    }
}
