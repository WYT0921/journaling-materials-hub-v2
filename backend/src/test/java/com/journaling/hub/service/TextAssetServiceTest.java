package com.journaling.hub.service;

import com.journaling.hub.BaseTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.*;

class TextAssetServiceTest extends BaseTest {
    @Autowired
    private TextAssetService service;

    @Test
    void normalizeUsesNfcAndLfWhilePreservingZwJAndVariationSelector() {
        String value = "  e\u0301\r\n👩‍💻️  ";
        assertEquals("é\n👩‍💻️", service.normalize(value));
    }

    @Test
    void hashIsStableForEquivalentUnicode() {
        assertEquals(service.hash(service.normalize("é")), service.hash(service.normalize("e\u0301")));
    }
}
