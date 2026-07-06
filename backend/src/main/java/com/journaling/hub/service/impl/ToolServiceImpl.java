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
 * 默认工具从数据库 tools 表读取（is_default=true, status=1）
 */
@Slf4j
@Service
public class ToolServiceImpl implements ToolService {

    @Autowired
    private ToolMapper toolMapper;

    @Override
    public List<Tool> getAllTools(Long userId) {
        // 从数据库读取全局启用的默认工具
        List<Tool> result = new ArrayList<>(toolMapper.selectList(
                new LambdaQueryWrapper<Tool>()
                        .eq(Tool::getIsDefault, true)
                        .eq(Tool::getStatus, 1)
                        .orderByAsc(Tool::getSortOrder)
                        .orderByDesc(Tool::getCreatedAt)
        ));

        // 追加用户自定义工具
        if (userId != null) {
            List<Tool> customTools = toolMapper.selectList(
                    new LambdaQueryWrapper<Tool>()
                            .eq(Tool::getUserId, userId)
                            .eq(Tool::getIsDefault, false)
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
                        .eq(Tool::getIsDefault, false)
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
        if (tool.getCategory() != null) {
            existing.setCategory(tool.getCategory());
        }

        toolMapper.updateById(existing);
        return existing;
    }
}
