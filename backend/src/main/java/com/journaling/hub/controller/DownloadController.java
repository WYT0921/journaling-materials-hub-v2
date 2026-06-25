package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Download;
import com.journaling.hub.service.DownloadService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 下载控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/download")
public class DownloadController {

    @Autowired
    private DownloadService downloadService;

    /**
     * 下载素材
     */
    @GetMapping("/{materialId}")
    public Result<?> download(@PathVariable Long materialId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Map<String, Object> result = downloadService.download(userId, materialId);
        return Result.ok(result);
    }

    /**
     * 获取下载记录
     */
    @GetMapping("/records")
    public Result<?> getDownloadRecords(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            HttpServletRequest request) {

        Long userId = (Long) request.getAttribute("userId");
        IPage<Download> downloads = downloadService.getUserDownloads(userId, page, limit);
        return Result.ok(PageResult.from(downloads));
    }
}
