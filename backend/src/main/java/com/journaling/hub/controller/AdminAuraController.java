package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.dto.AuraAssetRequest;
import com.journaling.hub.dto.AuraTemplateRequest;
import com.journaling.hub.service.AuraCatalogService;
import com.journaling.hub.service.FileService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.util.*;

@RestController
@RequestMapping("/api/v2/admin/aura")
public class AdminAuraController {
    private static final Map<String, String> MIME_EXTENSIONS = Map.of(
            "image/png", "png", "image/jpeg", "jpg", "image/webp", "webp",
            "font/ttf", "ttf", "font/otf", "otf", "application/x-font-ttf", "ttf", "application/x-font-opentype", "otf");
    private final AuraCatalogService service;
    private final FileService fileService;

    public AdminAuraController(AuraCatalogService service, FileService fileService) {
        this.service = service;
        this.fileService = fileService;
    }

    @GetMapping("/templates") public Result<?> templates() { return Result.ok(service.listTemplatesAdmin()); }
    @PostMapping("/templates") public Result<?> createTemplate(@RequestBody AuraTemplateRequest request) { return Result.ok(service.createTemplate(request)); }
    @PutMapping("/templates/{id}") public Result<?> updateTemplate(@PathVariable Long id, @RequestBody AuraTemplateRequest request) { return Result.ok(service.updateTemplate(id, request)); }
    @PutMapping("/templates/{id}/status") public Result<?> templateStatus(@PathVariable Long id, @RequestParam Integer status) { return Result.ok(service.setTemplateStatus(id, status)); }
    @DeleteMapping("/templates/{id}") public Result<?> deleteTemplate(@PathVariable Long id) { service.deleteTemplate(id); return Result.ok(); }

    @GetMapping("/assets") public Result<?> assets(@RequestParam(required = false) String type) { return Result.ok(service.listAssetsAdmin(type)); }
    @PostMapping("/assets") public Result<?> createAsset(@RequestBody AuraAssetRequest request) { return Result.ok(service.createAsset(request)); }
    @PutMapping("/assets/{id}") public Result<?> updateAsset(@PathVariable Long id, @RequestBody AuraAssetRequest request) { return Result.ok(service.updateAsset(id, request)); }
    @PutMapping("/assets/{id}/status") public Result<?> assetStatus(@PathVariable Long id, @RequestParam Integer status) { return Result.ok(service.setAssetStatus(id, status)); }
    @DeleteMapping("/assets/{id}") public Result<?> deleteAsset(@PathVariable Long id) { service.deleteAsset(id); return Result.ok(); }

    @PostMapping("/assets/upload")
    public Result<?> upload(@RequestParam("file") MultipartFile file) throws Exception {
        if (file.isEmpty()) return Result.error("文件不能为空", 400);
        if (file.getSize() > 10 * 1024 * 1024) return Result.error("文件不能超过 10MB", 400);
        String contentType = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        String extension = MIME_EXTENSIONS.get(contentType);
        if (extension == null) return Result.error("仅支持 PNG、JPG、WebP、TTF 和 OTF", 400);
        byte[] bytes = file.getBytes();
        String detectedType = detectContentType(bytes);
        if (!contentType.equals(detectedType)
                && !(contentType.startsWith("font/") && detectedType.startsWith("font/"))
                && !(contentType.startsWith("application/x-font") && detectedType.startsWith("font/"))) {
            return Result.error("文件内容与 MIME 类型不匹配", 400);
        }
        String sha256 = java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        String objectName = "aura/" + sha256.substring(0, 2) + "/" + sha256 + "." + extension;
        String fileUrl = fileService.upload(bytes, objectName, contentType);
        return Result.ok(Map.of("fileUrl", fileUrl, "sha256", sha256, "contentType", contentType, "size", bytes.length));
    }

    private String detectContentType(byte[] bytes) {
        if (bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47) return "image/png";
        if (bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) return "image/jpeg";
        if (bytes.length >= 12 && new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
                && new String(bytes, 8, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")) return "image/webp";
        if (bytes.length >= 4 && bytes[0] == 0x00 && bytes[1] == 0x01 && bytes[2] == 0x00 && bytes[3] == 0x00) return "font/ttf";
        if (bytes.length >= 4 && new String(bytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII).equals("OTTO")) return "font/otf";
        return "application/octet-stream";
    }
}
