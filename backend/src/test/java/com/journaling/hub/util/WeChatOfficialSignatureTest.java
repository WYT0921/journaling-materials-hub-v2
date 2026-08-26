package com.journaling.hub.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WeChatOfficialSignatureTest {
    @Test
    void verifiesValidSignature() {
        String signature = WeChatOfficialSignature.sha1("123noncetoken");
        assertTrue(WeChatOfficialSignature.verify("token", "123", "nonce", signature));
    }

    @Test
    void rejectsInvalidSignature() {
        assertFalse(WeChatOfficialSignature.verify("token", "123", "nonce", "bad"));
    }
}
