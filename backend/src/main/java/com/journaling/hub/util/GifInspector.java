package com.journaling.hub.util;

import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.util.Iterator;

public final class GifInspector {
    private GifInspector() {}

    public record Info(int width, int height, int frameCount, int durationMs) {}

    public static Info inspect(byte[] bytes) {
        if (bytes == null || bytes.length < 6 || bytes[0] != 'G' || bytes[1] != 'I' || bytes[2] != 'F') {
            throw new IllegalArgumentException("文件不是有效 GIF");
        }
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName("gif");
            if (!readers.hasNext()) throw new IllegalArgumentException("当前运行环境不支持 GIF");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, false, false);
                int frames = reader.getNumImages(true);
                int duration = 0;
                for (int i = 0; i < frames; i++) duration += frameDelayMs(reader.getImageMetadata(i));
                return new Info(reader.getWidth(0), reader.getHeight(0), frames, duration);
            } finally {
                reader.dispose();
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("GIF 文件解析失败", e);
        }
    }

    private static int frameDelayMs(IIOMetadata metadata) {
        Node root = metadata.getAsTree("javax_imageio_gif_image_1.0");
        for (Node node = root.getFirstChild(); node != null; node = node.getNextSibling()) {
            if ("GraphicControlExtension".equals(node.getNodeName())) {
                NamedNodeMap attrs = node.getAttributes();
                Node delay = attrs.getNamedItem("delayTime");
                return delay == null ? 0 : Integer.parseInt(delay.getNodeValue()) * 10;
            }
        }
        return 0;
    }
}
