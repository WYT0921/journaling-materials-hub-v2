package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.BaseTest;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.entity.Material;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MaterialServiceTest extends BaseTest {

    @Autowired
    private MaterialService materialService;

    @Test
    @Order(1)
    void testListMaterials_All() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, null, null, null, null, null);
        assertNotNull(page);
        assertTrue(page.getTotal() >= 3);
    }

    @Test
    @Order(2)
    void testListMaterials_ByCategory() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, "sticker", null, null, null, null);
        assertNotNull(page);
        page.getRecords().forEach(m -> assertEquals("sticker", m.getCategory()));
    }

    @Test
    @Order(3)
    void testListMaterials_ByKeyword() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, null, "star", null, null, null);
        assertNotNull(page);
        assertTrue(page.getTotal() >= 0);
    }

    @Test
    @Order(4)
    void testListMaterials_MultiKeyword() {
        IPage<Material> page = materialService.listMaterials(1, 10, null, null, "vintage note", null, null, null);
        assertNotNull(page);
        assertTrue(page.getTotal() >= 0);
    }

    @Test
    @Order(5)
    void testListMaterials_Pagination() {
        IPage<Material> page1 = materialService.listMaterials(1, 2, null, null, null, null, null, null);
        IPage<Material> page2 = materialService.listMaterials(2, 2, null, null, null, null, null, null);
        assertNotEquals(page1.getRecords().get(0).getId(), page2.getRecords().get(0).getId());
    }

    @Test
    @Order(6)
    void testListMaterials_ByMaterialType() {
        IPage<Material> page = materialService.listMaterials(1, 10, "bundle", null, null, null, null, null);
        assertNotNull(page);
        assertFalse(page.getRecords().isEmpty());
        page.getRecords().forEach(m -> assertEquals("bundle", m.getMaterialType()));
    }

    @Test
    @Order(7)
    void testListMaterials_ByMaterialTypeAndCategory() {
        IPage<Material> page = materialService.listMaterials(1, 10, "bundle", "sticker", null, null, null, null);
        assertNotNull(page);
        assertFalse(page.getRecords().isEmpty());
        page.getRecords().forEach(m -> {
            assertEquals("bundle", m.getMaterialType());
            assertEquals("sticker", m.getCategory());
        });
    }

    @Test
    @Order(8)
    void testListMaterials_PseudoEmptyKeywordReturnsAll() {
        long expected = materialService.listMaterials(1, 10, "single", null, null, null, null, null).getTotal();

        assertEquals(expected, materialService.listMaterials(1, 10, "single", null, "undefined", null, null, null).getTotal());
        assertEquals(expected, materialService.listMaterials(1, 10, "single", null, "null", null, null, null).getTotal());
        assertEquals(expected, materialService.listMaterials(1, 10, "single", null, "  ", null, null, null).getTotal());
    }

    @Test
    @Order(9)
    void testGetDetail() {
        Material material = materialService.getDetail(1L);
        assertNotNull(material);
        assertNotNull(material.getTitle());
        assertNotNull(material.getCategory());
        assertNotNull(material.getMaterialType());
    }

    @Test
    @Order(10)
    void testGetDetail_NotFound() {
        assertThrows(BusinessException.class, () -> materialService.getDetail(999L));
    }

    @Test
    @Order(11)
    void testGetCategories_fromCategoryTable() {
        List<Map<String, Object>> categories = materialService.getCategories(null);
        assertNotNull(categories);
        assertFalse(categories.isEmpty());
        assertEquals("sticker", categories.get(0).get("category"));
        assertEquals("background", categories.get(1).get("category"));
        assertEquals("note", categories.get(2).get("category"));
        assertEquals("tape", categories.get(3).get("category"));
        assertEquals(0L, categories.get(3).get("count"));
        assertTrue(categories.stream().noneMatch(c -> "disabled-material".equals(c.get("category"))));
    }

    @Test
    @Order(12)
    void testGetCategories_ByMaterialTypeOnlyChangesCounts() {
        List<Map<String, Object>> categories = materialService.getCategories("bundle");
        assertNotNull(categories);
        assertEquals(4, categories.size());
        assertTrue(categories.stream().anyMatch(c -> "sticker".equals(c.get("category")) && Long.valueOf(1L).equals(c.get("count"))));
        assertTrue(categories.stream().anyMatch(c -> "background".equals(c.get("category")) && Long.valueOf(0L).equals(c.get("count"))));
        assertTrue(categories.stream().anyMatch(c -> "tape".equals(c.get("category")) && Long.valueOf(0L).equals(c.get("count"))));
    }

    @Test
    @Order(13)
    void testListMaterials_ByIssue() {
        IPage<Material> page = materialService.listMaterials(1, 10, "single", "sticker", null, null, 2026, 7);

        assertEquals(1, page.getTotal());
        assertEquals(2026, page.getRecords().get(0).getIssueYear());
        assertEquals(7, page.getRecords().get(0).getIssueNumber());
    }

    @Test
    @Order(14)
    void testGetIssues_ReturnsPublishedIssuesNewestFirst() {
        List<Map<String, Object>> issues = materialService.getIssues("single");

        assertEquals(2, issues.size());
        assertEquals(2026, issues.get(0).get("issueYear"));
        assertEquals(7, issues.get(0).get("issueNumber"));
        assertEquals("2026年第七期", issues.get(0).get("label"));
        assertEquals(1L, issues.get(0).get("count"));
        assertTrue(issues.stream().noneMatch(issue -> Integer.valueOf(2027).equals(issue.get("issueYear"))));
    }
}
