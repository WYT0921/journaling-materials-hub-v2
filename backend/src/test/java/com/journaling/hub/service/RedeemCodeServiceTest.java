package com.journaling.hub.service;

import com.journaling.hub.BaseTest;
import com.journaling.hub.common.BusinessException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RedeemCodeService 单元测试
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RedeemCodeServiceTest extends BaseTest {

    @Autowired
    private RedeemCodeService redeemCodeService;

    @Test
    @Order(1)
    void testVerifyCode_Valid() {
        Map<String, Object> result = redeemCodeService.verifyCode("TEST-VALID-CODE");
        assertNotNull(result);
        assertEquals(true, result.get("valid"));
    }

    @Test
    @Order(2)
    void testVerifyCode_Used() {
        Map<String, Object> result = redeemCodeService.verifyCode("TEST-USED-CODE");
        assertNotNull(result);
        assertEquals(false, result.get("valid"));
    }

    @Test
    @Order(3)
    void testVerifyCode_NotFound() {
        Map<String, Object> result = redeemCodeService.verifyCode("NONEXISTENT-CODE");
        assertNotNull(result);
        assertEquals(false, result.get("valid"));
    }

    @Test
    @Order(4)
    void testActivate_Success() {
        Map<String, Object> result = redeemCodeService.activate(1L, "TEST-VALID-CODE");
        assertNotNull(result);
        assertNotNull(result.get("token"));
    }

    @Test
    @Order(5)
    void testActivate_AlreadyUsed() {
        assertThrows(BusinessException.class,
                () -> redeemCodeService.activate(1L, "TEST-USED-CODE"));
    }

    @Test
    @Order(6)
    void testActivate_Permanent() {
        Map<String, Object> result = redeemCodeService.activate(2L, "TEST-PERMANENT");
        assertNotNull(result);
        assertNotNull(result.get("token"));
    }
}
