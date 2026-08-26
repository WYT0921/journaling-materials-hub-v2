package com.journaling.hub.util;

import com.journaling.hub.dto.WeChatProbeFileInfo;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.util.HexFormat;

public final class WeChatProbeFileInspector {
    private WeChatProbeFileInspector() {}

    public static WeChatProbeFileInfo inspect(byte[] bytes) {
        Type type = detect(bytes);
        Integer width = null, height = null, frameCount = null;
        Boolean animated = null;
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (readers.hasNext()) {
                ImageReader reader = readers.next();
                try {
                    reader.setInput(input, false, true);
                    width = reader.getWidth(0);
                    height = reader.getHeight(0);
                    if (type == Type.GIF) {
                        frameCount = reader.getNumImages(true);
                        animated = frameCount > 1;
                    }
                } finally { reader.dispose(); }
            }
        } catch (Exception ignored) {
            // 类型检测与原始文件保存不依赖尺寸/帧数读取成功。
        }
        return WeChatProbeFileInfo.builder()
                .fileType(type.name()).mimeType(type.mime).extension(type.extension)
                .fileSize(bytes.length).width(width).height(height)
                .frameCount(frameCount).animated(animated).sha256(sha256(bytes)).build();
    }

    private static Type detect(byte[] b) {
        if (b.length >= 8 && u(b[0]) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return Type.PNG;
        if (b.length >= 3 && u(b[0]) == 0xFF && u(b[1]) == 0xD8 && u(b[2]) == 0xFF) return Type.JPEG;
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') return Type.GIF;
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return Type.WEBP;
        throw new IllegalArgumentException("不支持或无法识别的文件格式");
    }

    private static int u(byte value) { return value & 0xff; }
    private static String sha256(byte[] bytes) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
        catch (Exception e) { throw new IllegalStateException("SHA-256不可用", e); }
    }

    private enum Type {
        PNG("image/png", "png"), JPEG("image/jpeg", "jpg"), GIF("image/gif", "gif"), WEBP("image/webp", "webp");
        final String mime; final String extension;
        Type(String mime, String extension) { this.mime = mime; this.extension = extension; }
    }
}
