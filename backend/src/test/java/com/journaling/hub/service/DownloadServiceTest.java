package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.BaseTest;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.entity.Download;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DownloadService 单元测试
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DownloadServiceTest extends BaseTest {

    @Autowired
    private DownloadService downloadService;

    @Test
    @Order(1)
    void testDownload_FreeMaterial() {
        Map<String, Object> result = downloadService.download(4L, 1L);
        assertNotNull(result);
        assertNotNull(result.get("url"));
        assertEquals(1L, (long) result.get("materialId"));
        assertFalse(result.containsKey("freeDownloadLimit"));
        assertFalse(result.containsKey("freeDownloadRemaining"));
    }

    @Test
    @Order(2)
    void testDownload_Duplicate() {
        downloadService.download(4L, 1L);
        Map<String, Object> result = downloadService.download(4L, 1L);
        assertNotNull(result);
        assertEquals("下载成功", result.get("message"));
        assertFalse(result.containsKey("freeDownloadRemaining"));
    }

    @Test
    @Order(3)
    void testDownload_PremiumMaterialWithinFreeQuota() {
        Map<String, Object> result = downloadService.download(4L, 2L);
        assertNotNull(result);
        assertNotNull(result.get("url"));
        assertEquals(2L, (long) result.get("materialId"));
    }

    @Test
    @Order(4)
    void testDownload_NormalUserWithoutQuotaLimit() {
        Map<String, Object> result = downloadService.download(1L, 2L);
        assertNotNull(result);
        assertNotNull(result.get("url"));
    }

    @Test
    @Order(5)
    void testDownload_PremiumByPremiumUser() {
        Map<String, Object> result = downloadService.download(2L, 2L);
        assertNotNull(result);
        assertNotNull(result.get("url"));
    }

    @Test
    @Order(6)
    void testDownload_OfflineMaterial() {
        assertThrows(BusinessException.class,
                () -> downloadService.download(1L, 4L));
    }

    @Test
    @Order(7)
    void testGetUserDownloads() {
        downloadService.download(4L, 1L);
        IPage<Download> downloads = downloadService.getUserDownloads(4L, 1, 10);
        assertNotNull(downloads);
        assertTrue(downloads.getTotal() >= 1);
        downloads.getRecords().forEach(d -> assertNotNull(d.getMaterial()));
    }
}
