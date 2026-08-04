package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.dto.WeChatProbeResponse;
import com.journaling.hub.entity.WeChatMessageProbe;
import com.journaling.hub.service.WeChatMessageProbeService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("dev")
@RequestMapping("/api/v2/admin/wechat-probe")
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "wechat.official", name = "probe-api-enabled", havingValue = "true")
public class AdminWeChatProbeSimulationController {
    private final WeChatMessageProbeService service;

    @PostMapping(value = "/simulate", consumes = {MediaType.TEXT_XML_VALUE, MediaType.APPLICATION_XML_VALUE})
    public Result<WeChatProbeResponse> simulate(@RequestBody String rawXml) {
        WeChatMessageProbe probe = service.accept(rawXml, true);
        return Result.ok(WeChatProbeResponse.from(probe, true));
    }
}
