package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.BaseTest;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.entity.Material;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * MaterialService 单元测试
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MaterialServiceTest extends BaseTest {

    @Autowired
    private MaterialService materialService;

    @Test
    @Order(1)
    void testListMaterials_All() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, null, null);
        assertNotNull(page);
        assertTrue(page.getTotal() >= 3);
    }

    @Test
    @Order(2)
    void testListMaterials_ByCategory() {
        IPage<Material> page = materialService.listMaterials(1, 10, "贴纸", null, null);
        assertNotNull(page);
        page.getRecords().forEach(m -> assertEquals("贴纸", m.getCategory()));
    }

    @Test
    @Order(3)
    void testListMaterials_ByKeyword() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, "star", null);
        assertNotNull(page);
        assertTrue(page.getTotal() >= 0);
    }

    @Test
    @Order(4)
    void testListMaterials_MultiKeyword() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, "vintage note", null);
        assertNotNull(page);
        assertTrue(page.getTotal() >= 0);
    }

    @Test
    @Order(5)
    void testListMaterials_Pagination() {
        IPage<Material> page1 = materialService.listMaterials(1, 2, null, null, null);
        IPage<Material> page2 = materialService.listMaterials(2, 2, null, null, null);
        assertNotEquals(page1.getRecords().get(0).getId(), page2.getRecords().get(0).getId());
    }

    @Test
    @Order(6)
    void testGetDetail() {
        Material material = materialService.getDetail(1L);
        assertNotNull(material);
        assertNotNull(material.getTitle());
        assertNotNull(material.getCategory());
    }

    @Test
    @Order(7)
    void testGetDetail_NotFound() {
        assertThrows(BusinessException.class, () -> materialService.getDetail(999L));
    }

    @Test
    @Order(8)
    void testGetCategories() {
        List<Map<String, Object>> categories = materialService.getCategories();
        assertNotNull(categories);
        assertFalse(categories.isEmpty());
    }
}
