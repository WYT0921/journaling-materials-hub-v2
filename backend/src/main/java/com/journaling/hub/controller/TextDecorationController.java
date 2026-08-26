package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.service.TextDecorationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/text-decoration")
public class TextDecorationController {
    private final TextDecorationService service;

    public TextDecorationController(TextDecorationService service) {
        this.service = service;
    }

    @GetMapping("/templates")
    public Result<?> templates(@RequestParam(required = false) String category) {
        return Result.ok(service.listEnabled(category));
    }

    @GetMapping("/random")
    public Result<?> random(@RequestParam String text,
                            @RequestParam(required = false) String category,
                            @RequestParam(required = false) Long excludeId) {
        return Result.ok(service.random(text, category, excludeId));
    }
}
