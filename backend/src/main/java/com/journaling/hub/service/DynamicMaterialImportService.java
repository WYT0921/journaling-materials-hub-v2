package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.dto.DynamicMaterialImportRequest;
import com.journaling.hub.entity.Material;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.util.GifInspector;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DynamicMaterialImportService {
    public static final int MAX_GIF_BYTES = 10 * 1024 * 1024;
    public static final int MAX_DURATION_MS = 10_000;
    private final FileService fileService;
    private final MaterialMapper materialMapper;

    public Map<String, Object> importGif(MultipartFile gif, MultipartFile cover, DynamicMaterialImportRequest request) {
        try {
            byte[] gifBytes = gif.getBytes();
            byte[] coverBytes = cover.getBytes();
            if (gifBytes.length == 0 || gifBytes.length > MAX_GIF_BYTES) bad("GIF 必须大于 0 且不超过 10MB");
            GifInspector.Info info = GifInspector.inspect(gifBytes);
            if (info.frameCount() <= 1) bad("GIF 必须包含多个动画帧");
            if (info.durationMs() <= 0 || info.durationMs() > MAX_DURATION_MS) bad("GIF 时长必须大于 0 且不超过 10 秒");
            BufferedImage coverImage = ImageIO.read(new ByteArrayInputStream(coverBytes));
            if (coverImage == null || !isPng(coverBytes)) bad("封面必须为有效 PNG");
            String hash = sha256(gifBytes);
            if (request.getContentHash() != null && !hash.equalsIgnoreCase(request.getContentHash())) bad("GIF 哈希不匹配");
            if (materialMapper.selectCount(new LambdaQueryWrapper<Material>().eq(Material::getContentHash, hash)) > 0) {
                return result("duplicate", null, hash);
            }
            validateRequest(request);
            String id = UUID.randomUUID().toString().replace("-", "");
            String gifKey = "dynamic/original/" + id + ".gif";
            String coverKey = "dynamic/thumb/" + id + ".png";
            String imageUrl = fileService.upload(gifBytes, gifKey, "image/gif");
            String thumbnailUrl;
            try {
                thumbnailUrl = fileService.upload(coverBytes, coverKey, "image/png");
            } catch (RuntimeException e) {
                fileService.delete(gifKey);
                throw e;
            }
            Material material = new Material();
            material.setTitle(request.getTitle().trim()); material.setDescription(request.getDescription());
            material.setCategory(request.getCategory()); material.setMaterialType(defaultValue(request.getMaterialType(), "single"));
            material.setMediaType("animated_gif"); material.setImageUrl(imageUrl); material.setThumbnailUrl(thumbnailUrl);
            material.setContentHash(hash); material.setMimeType("image/gif"); material.setFileSize((long) gifBytes.length);
            material.setWidth(info.width()); material.setHeight(info.height()); material.setDurationMs(info.durationMs()); material.setFrameCount(info.frameCount());
            material.setSource(defaultValue(request.getSource(), "threads")); material.setSourceUrl(request.getSourceUrl()); material.setCollectedAt(LocalDateTime.now());
            material.setTags(request.getTags()); material.setIsPremium(Boolean.TRUE.equals(request.getIsPremium()));
            material.setDownloadCount(0); material.setStatus(1); material.setSortOrder(0);
            try { materialMapper.insert(material); }
            catch (DuplicateKeyException e) { fileService.delete(gifKey); fileService.delete(coverKey); return result("duplicate", null, hash); }
            catch (RuntimeException e) { fileService.delete(gifKey); fileService.delete(coverKey); throw e; }
            return result("inserted", material.getId(), hash);
        } catch (BusinessException e) { throw e; }
        catch (Exception e) { throw new BusinessException(ErrorCode.BAD_REQUEST, e.getMessage()); }
    }

    private void validateRequest(DynamicMaterialImportRequest r) {
        if (r == null || r.getTitle() == null || r.getTitle().isBlank() || r.getCategory() == null || r.getCategory().isBlank()) bad("标题和分类不能为空");
        if (r.getSourceUrl() == null || !r.getSourceUrl().startsWith("https://www.threads.com/") && !r.getSourceUrl().startsWith("https://threads.com/")) bad("来源必须是 HTTPS Threads 链接");
        if (r.getMaterialType() != null && !"single".equals(r.getMaterialType()) && !"bundle".equals(r.getMaterialType())) bad("素材类型无效");
    }
    private static boolean isPng(byte[] b) { return b.length >= 8 && b[0] == (byte)137 && b[1] == 80 && b[2] == 78 && b[3] == 71; }
    private static String sha256(byte[] b) throws Exception { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(b)); }
    private static String defaultValue(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private static void bad(String message) { throw new BusinessException(ErrorCode.BAD_REQUEST, message); }
    private static Map<String,Object> result(String status, Long id, String hash) { Map<String,Object> r=new LinkedHashMap<>(); r.put("status",status); r.put("id",id); r.put("contentHash",hash); return r; }
}
