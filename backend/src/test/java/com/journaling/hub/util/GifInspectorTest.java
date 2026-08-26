package com.journaling.hub.util;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriter;
import javax.imageio.metadata.IIOMetadata;
import javax.imageio.metadata.IIOMetadataNode;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class GifInspectorTest {
    @Test
    void inspectsAnimatedGif() throws Exception {
        byte[] bytes = animatedGif();
        GifInspector.Info info = GifInspector.inspect(bytes);
        assertEquals(2, info.frameCount());
        assertEquals(8, info.width());
        assertEquals(8, info.height());
        assertEquals(200, info.durationMs());
    }

    @Test
    void rejectsNonGif() {
        assertThrows(IllegalArgumentException.class, () -> GifInspector.inspect(new byte[]{1,2,3}));
    }

    private byte[] animatedGif() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageWriter writer = ImageIO.getImageWritersByFormatName("gif").next();
        try (ImageOutputStream stream = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(stream); writer.prepareWriteSequence(null);
            for (Color color : new Color[]{Color.RED, Color.BLUE}) {
                BufferedImage image = new BufferedImage(8,8,BufferedImage.TYPE_INT_RGB);
                var graphics=image.createGraphics(); graphics.setColor(color); graphics.fillRect(0,0,8,8); graphics.dispose();
                IIOMetadata metadata=writer.getDefaultImageMetadata(new javax.imageio.ImageTypeSpecifier(image),null);
                IIOMetadataNode root=(IIOMetadataNode)metadata.getAsTree("javax_imageio_gif_image_1.0");
                IIOMetadataNode control=(IIOMetadataNode)root.getElementsByTagName("GraphicControlExtension").item(0);
                control.setAttribute("delayTime","10"); metadata.setFromTree("javax_imageio_gif_image_1.0",root);
                writer.writeToSequence(new javax.imageio.IIOImage(image,null,metadata),null);
            }
            writer.endWriteSequence();
        } finally { writer.dispose(); }
        return out.toByteArray();
    }
}
