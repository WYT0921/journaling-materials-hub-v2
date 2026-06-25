package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.Tool;
import com.journaling.hub.mapper.ToolMapper;
import com.journaling.hub.service.ToolService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 工具服务实现
 */
@Slf4j
@Service
public class ToolServiceImpl implements ToolService {

    @Autowired
    private ToolMapper toolMapper;

    // 默认工具列表（内存中维护）
    private static final List<Tool> DEFAULT_TOOLS = new ArrayList<>();

    static {
        addDefaultTool("Notion", "万能笔记和项目管理工具", "📝", "https://www.notion.so");
        addDefaultTool("Canva", "在线设计平台，海量模板", "🎨", "https://www.canva.cn");
        addDefaultTool("Color Hunt", "精选配色方案集合", "🎯", "https://colorhunt.co");
        addDefaultTool("Coolors", "快速生成配色方案", "🌈", "https://coolors.co");
        addDefaultTool("Google Fonts", "免费开源字体库", "🔤", "https://fonts.google.com");
        addDefaultTool("DaFont", "英文字体下载站", "✒️", "https://www.dafont.com");
        addDefaultTool("Freepik", "免费矢量图和 PSD 素材", "🖼️", "https://www.freepik.com");
        addDefaultTool("Unsplash", "高质量免费图片", "📷", "https://unsplash.com");
    }

    private static void addDefaultTool(String name, String desc, String icon, String url) {
        Tool tool = new Tool();
        tool.setName(name);
        tool.setDescription(desc);
        tool.setIcon(icon);
        tool.setUrl(url);
        tool.setIsDefault(true);
        DEFAULT_TOOLS.add(tool);
    }

    @Override
    public List<Tool> getAllTools(Long userId) {
        List<Tool> result = new ArrayList<>(DEFAULT_TOOLS);

        // 追加用户自定义工具
        if (userId != null) {
            List<Tool> customTools = toolMapper.selectList(
                    new LambdaQueryWrapper<Tool>()
                            .eq(Tool::getUserId, userId)
                            .eq(Tool::getStatus, 1)
                            .orderByAsc(Tool::getSortOrder)
                            .orderByDesc(Tool::getCreatedAt)
            );
            result.addAll(customTools);
        }

        return result;
    }

    @Override
    public IPage<Tool> getUserCustomTools(Long userId, int page, int limit) {
        Page<Tool> pageParam = new Page<>(page, limit);
        return toolMapper.selectPage(pageParam,
                new LambdaQueryWrapper<Tool>()
                        .eq(Tool::getUserId, userId)
                        .eq(Tool::getStatus, 1)
                        .orderByDesc(Tool::getCreatedAt));
    }

    @Override
    public Tool addTool(Long userId, Tool tool) {
        tool.setUserId(userId);
        tool.setIsDefault(false);
        tool.setStatus(1);
        toolMapper.insert(tool);
        return tool;
    }

    @Override
    public void removeTool(Long userId, Long toolId) {
        Tool existing = toolMapper.selectById(toolId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        if (!userId.equals(existing.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        // 软删除
        existing.setStatus(0);
        toolMapper.updateById(existing);
    }

    @Override
    public Tool updateTool(Long userId, Long toolId, Tool tool) {
        Tool existing = toolMapper.selectById(toolId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        if (!userId.equals(existing.getUserId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (Boolean.TRUE.equals(existing.getIsDefault())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "默认工具不可修改");
        }

        if (tool.getName() != null) {
            existing.setName(tool.getName());
        }
        if (tool.getDescription() != null) {
            existing.setDescription(tool.getDescription());
        }
        if (tool.getIcon() != null) {
            existing.setIcon(tool.getIcon());
        }
        if (tool.getUrl() != null) {
            existing.setUrl(tool.getUrl());
        }

        toolMapper.updateById(existing);
        return existing;
    }
}
