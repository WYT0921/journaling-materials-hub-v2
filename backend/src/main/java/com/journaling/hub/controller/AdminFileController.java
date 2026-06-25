package com.journaling.hub.controller;

import com.journaling.hub.common.Result;
import com.journaling.hub.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 管理员文件上传控制器
 * 所有端点需要管理员权限（由 AdminInterceptor 拦截 /api/v2/admin/**）
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/admin")
@RequiredArgsConstructor
public class AdminFileController {

    private final FileService fileService;

    private static final int THUMB_WIDTH = 400;

    /**
     * 上传素材图片（原图 + 缩略图）
     */
    @PostMapping("/upload")
    public Result<?> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return Result.error("文件不能为空", 400);
        }

        try {
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String ext = getExtension(originalFilename);
            String uuid = UUID.randomUUID().toString().substring(0, 8);

            // 上传原图
            String originalPath = String.format("materials/original/%s.%s", uuid, ext);
            String imageUrl = fileService.upload(file, originalPath);

            // 生成缩略图（宽度 400px）
            String thumbnailPath = String.format("materials/thumb/%s.%s", uuid, ext);
            byte[] thumbBytes = generateThumbnail(file, THUMB_WIDTH);
            String thumbnailUrl = fileService.upload(thumbBytes, thumbnailPath, file.getContentType());

            log.info("素材图片上传成功: original={}, thumb={}", originalPath, thumbnailPath);

            Map<String, String> result = new HashMap<>();
            result.put("imageUrl", imageUrl);
            result.put("thumbnailUrl", thumbnailUrl);
            return Result.ok(result);

        } catch (Exception e) {
            log.error("文件上传失败", e);
            return Result.error("上传失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 使用 Thumbnailator 生成缩略图
     */
    private byte[] generateThumbnail(MultipartFile file, int width) throws Exception {
        BufferedImage original = ImageIO.read(new ByteArrayInputStream(file.getBytes()));
        if (original == null) {
            throw new IllegalArgumentException("无法解析图片文件");
        }

        // 等比缩放至指定宽度
        BufferedImage thumbnail = Thumbnails.of(original)
                .width(width)
                .keepAspectRatio(true)
                .asBufferedImage();

        String ext = getExtension(file.getOriginalFilename());
        String format = ext.equalsIgnoreCase("png") ? "png" : "jpeg";

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(thumbnail, format, out);
        return out.toByteArray();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "png";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
