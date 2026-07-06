package com.journaling.hub.service;

import com.journaling.hub.BaseTest;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.entity.Tool;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ToolService 单元测试
 * 默认工具从数据库读取
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ToolServiceTest extends BaseTest {

    @Autowired
    private ToolService toolService;

    @Test
    @Order(1)
    void testGetAllTools_DefaultOnly() {
        List<Tool> tools = toolService.getAllTools(null);
        assertNotNull(tools);
        // 测试数据中有 8 个启用的默认工具
        assertEquals(8, tools.size());
        tools.forEach(t -> assertTrue(t.getIsDefault()));
    }

    @Test
    @Order(2)
    void testGetAllTools_WithCustom() {
        // 先添加一个自定义工具
        Tool custom = toolService.addTool(1L, createTool("我的工具", "🔒", "https://mine.com"));

        List<Tool> tools = toolService.getAllTools(1L);
        assertNotNull(tools);
        assertTrue(tools.size() >= 9); // 8 默认 + 至少 1 自定义
        assertTrue(tools.stream().anyMatch(t -> "我的工具".equals(t.getName())));
    }

    @Test
    @Order(3)
    void testGetAllTools_IncludesCategory() {
        List<Tool> tools = toolService.getAllTools(null);
        Tool notion = tools.stream().filter(t -> "Notion".equals(t.getName())).findFirst().orElseThrow();
        assertNotNull(notion.getCategory());
        assertFalse(notion.getCategory().isEmpty());
    }

    @Test
    @Order(4)
    void testAddTool() {
        Tool tool = new Tool();
        tool.setName("测试工具");
        tool.setDescription("测试描述");
        tool.setIcon("🔧");
        tool.setUrl("https://test.example.com");

        Tool created = toolService.addTool(1L, tool);
        assertNotNull(created.getId());
        assertEquals("测试工具", created.getName());
        assertEquals(Long.valueOf(1L), created.getUserId());
        assertFalse(created.getIsDefault());
    }

    @Test
    @Order(5)
    void testUpdateTool() {
        Tool existing = toolService.addTool(1L, createTool("旧名称", "🔨", "https://old.com"));

        Tool update = new Tool();
        update.setName("新名称");
        update.setIcon("⚡");
        update.setCategory("写作与项目");

        Tool updated = toolService.updateTool(1L, existing.getId(), update);
        assertEquals("新名称", updated.getName());
        assertEquals("⚡", updated.getIcon());
        assertEquals("写作与项目", updated.getCategory());
        assertEquals("https://old.com", updated.getUrl());
    }

    @Test
    @Order(6)
    void testUpdateTool_ForbiddenForDefault() {
        List<Tool> tools = toolService.getAllTools(null);
        Tool defaultTool = tools.get(0);

        Tool update = new Tool();
        update.setName("hacked");

        // 默认工具不可修改
        assertThrows(BusinessException.class,
                () -> toolService.updateTool(1L, defaultTool.getId(), update));
    }

    @Test
    @Order(7)
    void testRemoveTool() {
        Tool tool = toolService.addTool(1L, createTool("待删除", "🗑️", "https://delete.me"));
        assertDoesNotThrow(() -> toolService.removeTool(1L, tool.getId()));
    }

    @Test
    @Order(8)
    void testRemoveTool_NotOwner() {
        Tool tool = toolService.addTool(1L, createTool("我的工具2", "🔒", "https://mine2.com"));
        assertThrows(BusinessException.class,
                () -> toolService.removeTool(2L, tool.getId()));
    }

    private Tool createTool(String name, String icon, String url) {
        Tool tool = new Tool();
        tool.setName(name);
        tool.setDescription("test");
        tool.setIcon(icon);
        tool.setUrl(url);
        return tool;
    }
}
