package com.journaling.hub.util;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class WeChatProbeFileInspectorTest {
    @Test
    void detectsPngJpegGifAndWebp() {
        assertEquals("PNG", WeChatProbeFileInspector.inspect(Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")).getFileType());
        assertEquals("JPEG", WeChatProbeFileInspector.inspect(new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0}).getFileType());
        var gif = WeChatProbeFileInspector.inspect(Base64.getDecoder().decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="));
        assertEquals("GIF", gif.getFileType());
        assertEquals(1, gif.getFrameCount());
        byte[] webp = new byte[]{'R','I','F','F',0,0,0,0,'W','E','B','P'};
        assertEquals("WEBP", WeChatProbeFileInspector.inspect(webp).getFileType());
    }

    @Test
    void rejectsUnknownBinary() {
        assertThrows(IllegalArgumentException.class, () -> WeChatProbeFileInspector.inspect(new byte[]{1,2,3,4}));
    }
}
