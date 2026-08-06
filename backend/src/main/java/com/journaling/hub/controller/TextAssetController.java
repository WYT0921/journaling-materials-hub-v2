package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.service.TextAssetService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/text-assets")
public class TextAssetController {
    private final TextAssetService textAssetService;

    public TextAssetController(TextAssetService textAssetService) {
        this.textAssetService = textAssetService;
    }

    @GetMapping
    public Result<?> list(@RequestParam String type,
                          @RequestParam(required = false) String category,
                          @RequestParam(required = false) String keyword,
                          @RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "30") int limit) {
        return Result.ok(textAssetService.listPublished(type, category, keyword, page, limit));
    }

    @GetMapping("/categories")
    public Result<?> categories(@RequestParam String type) {
        return Result.ok(textAssetService.listCategoryCounts(type));
    }
}
