package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Tool;
import com.journaling.hub.service.ToolService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 工具控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/tools")
public class ToolController {

    @Autowired
    private ToolService toolService;

    /**
     * 获取所有工具（默认 + 用户自定义）
     */
    @GetMapping
    public Result<?> getAllTools(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Tool> tools = toolService.getAllTools(userId);
        return Result.ok(tools);
    }

    /**
     * 添加自定义工具
     */
    @PostMapping
    public Result<?> addTool(@RequestBody Tool tool, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return Result.error("请先登录", 401);
        }
        Tool created = toolService.addTool(userId, tool);
        return Result.ok(created);
    }

    /**
     * 删除自定义工具
     */
    @DeleteMapping("/{id}")
    public Result<?> removeTool(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return Result.error("请先登录", 401);
        }
        toolService.removeTool(userId, id);
        return Result.ok(null);
    }

    /**
     * 更新自定义工具
     */
    @PutMapping("/{id}")
    public Result<?> updateTool(@PathVariable Long id, @RequestBody Tool tool, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            return Result.error("请先登录", 401);
        }
        Tool updated = toolService.updateTool(userId, id, tool);
        return Result.ok(updated);
    }
}
