package com.journaling.hub.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.dto.WeChatProbeResponse;
import com.journaling.hub.entity.WeChatMessageProbe;
import com.journaling.hub.service.WeChatMessageProbeService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/admin/wechat-probe/messages")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "wechat.official", name = "probe-api-enabled", havingValue = "true")
public class AdminWeChatProbeController {
    private final WeChatMessageProbeService service;

    @GetMapping
    public Result<PageResult<WeChatProbeResponse>> list(@RequestParam(defaultValue = "1") int page,
                                                        @RequestParam(defaultValue = "20") int limit) {
        if (page < 1 || limit < 1 || limit > 100) throw new BusinessException(ErrorCode.BAD_REQUEST);
        Page<WeChatMessageProbe> result = service.page(page, limit);
        List<WeChatProbeResponse> list = result.getRecords().stream()
                .map(item -> WeChatProbeResponse.from(item, false)).toList();
        return Result.ok(new PageResult<>(list, result.getTotal(), result.getCurrent(), result.getSize()));
    }

    @GetMapping("/{id}")
    public Result<WeChatProbeResponse> detail(@PathVariable Long id) {
        WeChatMessageProbe probe = service.get(id);
        if (probe == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        return Result.ok(WeChatProbeResponse.from(probe, true));
    }
}
