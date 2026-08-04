package com.journaling.hub.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HexFormat;

public final class WeChatOfficialSignature {
    private WeChatOfficialSignature() {}

    public static boolean verify(String token, String timestamp, String nonce, String signature) {
        if (isBlank(token) || isBlank(timestamp) || isBlank(nonce) || isBlank(signature)) {
            return false;
        }
        String[] values = {token, timestamp, nonce};
        Arrays.sort(values);
        return MessageDigest.isEqual(sha1(String.join("", values)).getBytes(StandardCharsets.US_ASCII),
                signature.toLowerCase().getBytes(StandardCharsets.US_ASCII));
    }

    public static String sha1(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-1不可用", e);
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
