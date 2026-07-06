package com.journaling.hub.service;

import com.journaling.hub.BaseTest;
import com.journaling.hub.entity.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * CategoryService 测试
 */
@DisplayName("CategoryService")
class CategoryServiceTest extends BaseTest {

    @Autowired
    private CategoryService categoryService;

    @Test
    @DisplayName("按类型获取所有分类")
    void listByType_shouldReturnAll() {
        List<Category> categories = categoryService.listByType("material");
        assertFalse(categories.isEmpty());
        assertTrue(categories.stream().allMatch(c -> "material".equals(c.getType())));
    }

    @Test
    @DisplayName("获取启用的分类（排除已禁用）")
    void listActiveByType_shouldExcludeDisabled() {
        List<Category> categories = categoryService.listActiveByType("material");
        assertFalse(categories.isEmpty());
        assertTrue(categories.stream().allMatch(c -> c.getStatus() == 1));
    }

    @Test
    @DisplayName("获取工具分类")
    void listActiveByType_tool_shouldReturnToolCategories() {
        List<Category> categories = categoryService.listActiveByType("tool");
        assertFalse(categories.isEmpty());
        assertTrue(categories.stream().allMatch(c -> "tool".equals(c.getType()) && c.getStatus() == 1));
    }

    @Test
    @DisplayName("根据 ID 获取分类")
    void getById_shouldReturnCategory() {
        Category category = categoryService.getById(1L);
        assertNotNull(category);
        assertNotNull(category.getName());
        assertEquals("material", category.getType());
        assertEquals(1, category.getStatus());
    }

    @Test
    @DisplayName("新增分类")
    void create_shouldInsert() {
        Category category = new Category();
        category.setName("TestCategory");
        category.setType("material");
        category.setStatus(1);
        category.setSortOrder(10);

        Category created = categoryService.create(category);
        assertNotNull(created.getId());
        assertEquals("TestCategory", created.getName());
    }

    @Test
    @DisplayName("更新分类")
    void update_shouldModify() {
        Category category = new Category();
        category.setName("UpdatedCategory");

        Category updated = categoryService.update(1L, category);
        assertEquals("UpdatedCategory", updated.getName());
        assertEquals(1L, updated.getId().longValue());
    }

    @Test
    @DisplayName("删除分类")
    void delete_shouldRemove() {
        // 先创建一个临时分类再删除
        Category category = new Category();
        category.setName("ToDelete");
        category.setType("material");
        category.setStatus(1);
        Category created = categoryService.create(category);

        categoryService.delete(created.getId());

        // 验证删除后查不到
        assertThrows(Exception.class, () -> categoryService.getById(created.getId()));
    }
}
