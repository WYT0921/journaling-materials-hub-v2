package com.journaling.hub.controller;

import com.journaling.hub.config.WeChatOfficialProperties;
import com.journaling.hub.service.WeChatMessageProbeService;
import com.journaling.hub.util.WeChatOfficialSignature;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wechat/official/callback")
@RequiredArgsConstructor
public class WeChatOfficialCallbackController {
    private final WeChatOfficialProperties properties;
    private final WeChatMessageProbeService probeService;

    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> verify(@RequestParam String signature, @RequestParam String timestamp,
                                         @RequestParam String nonce, @RequestParam String echostr) {
        if (properties.getToken().isBlank()) return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("微信公众号Token未配置");
        if (!WeChatOfficialSignature.verify(properties.getToken(), timestamp, nonce, signature))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("invalid signature");
        return ResponseEntity.ok(echostr);
    }

    @PostMapping(consumes = {MediaType.TEXT_XML_VALUE, MediaType.APPLICATION_XML_VALUE}, produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> receive(@RequestParam String signature, @RequestParam String timestamp,
                                          @RequestParam String nonce, @RequestBody String rawXml) {
        if (properties.getToken().isBlank()) return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("微信公众号Token未配置");
        if (!WeChatOfficialSignature.verify(properties.getToken(), timestamp, nonce, signature))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("invalid signature");
        try {
            probeService.accept(rawXml, false);
            return ResponseEntity.ok("success");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("invalid xml");
        }
    }
}
