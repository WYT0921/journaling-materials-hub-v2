package com.journaling.hub.service;

import com.journaling.hub.BaseTest;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.entity.User;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UserService 单元测试
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UserServiceTest extends BaseTest {

    @Autowired
    private UserService userService;

    @Test
    @Order(1)
    void testFindByOpenid() {
        User user = userService.findByOpenid("test-openid-normal");
        assertNotNull(user);
        assertNotNull(user.getNickname());
        assertEquals("normal", user.getMemberType());
    }

    @Test
    @Order(2)
    void testFindByOpenid_NotFound() {
        User user = userService.findByOpenid("nonexistent-openid");
        assertNull(user);
    }

    @Test
    @Order(3)
    void testFindOrCreateByOpenid_Existing() {
        User user = userService.findOrCreateByOpenid("test-openid-normal");
        assertNotNull(user);
        assertNotNull(user.getNickname());
    }

    @Test
    @Order(4)
    void testFindOrCreateByOpenid_New() {
        User user = userService.findOrCreateByOpenid("new-test-openid-123456");
        assertNotNull(user);
        assertTrue(user.getNickname().contains("123456"));
        assertEquals("normal", user.getMemberType());
        assertEquals(1, user.getStatus());
    }

    @Test
    @Order(5)
    void testGetProfile() {
        User user = userService.getProfile(1L);
        assertNotNull(user);
        assertNotNull(user.getNickname());
    }

    @Test
    @Order(6)
    void testGetProfile_NotFound() {
        assertThrows(BusinessException.class, () -> userService.getProfile(999L));
    }

    @Test
    @Order(7)
    void testGetProfile_Disabled() {
        assertThrows(BusinessException.class, () -> userService.getProfile(3L));
    }

    @Test
    @Order(8)
    void testUpdateProfile() {
        User updated = userService.updateProfile(1L, "NewNick", "https://new-avatar.png", null);
        assertEquals("NewNick", updated.getNickname());
        assertEquals("https://new-avatar.png", updated.getAvatarUrl());
    }

    @Test
    @Order(9)
    void testGetUserStats() {
        Map<String, Object> stats = userService.getUserStats(1L);
        assertEquals(100, stats.get("points"));
        assertTrue((int) stats.get("materialCount") >= 0);
    }

    @Test
    @Order(10)
    void testActivatePremium_Yearly() {
        User user = userService.activatePremium(1L, "yearly", 365);
        assertEquals("yearly", user.getMemberType());
        assertNotNull(user.getMemberExpireTime());
    }

    @Test
    @Order(11)
    void testActivatePremium_Permanent() {
        User user = userService.activatePremium(1L, "permanent", 0);
        assertEquals("permanent", user.getMemberType());
    }

    @Test
    @Order(12)
    void testIsPremium() {
        // user 2 is premium in test data
        User premiumUser = userService.getProfile(2L);
        assertTrue(premiumUser.isPremium());

        // user 1 was upgraded to yearly in testActivatePremium (Order 10)
        // so check a freshly created user instead
        User newUser = userService.findOrCreateByOpenid("ispremium-test-openid");
        assertFalse(newUser.isPremium());
    }

    @Test
    @Order(13)
    void testBindPhone() {
        User user = userService.bindPhone(1L, "13800138000");
        assertNotNull(user);
        assertEquals("13800138000", user.getPhone());
    }
}
