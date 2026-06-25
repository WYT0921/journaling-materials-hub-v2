package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.entity.Tool;

import java.util.List;

/**
 * 工具服务接口
 */
public interface ToolService {

    /**
     * 获取所有可用工具（默认工具 + 用户自定义工具）
     */
    List<Tool> getAllTools(Long userId);

    /**
     * 获取用户自定义工具列表
     */
    IPage<Tool> getUserCustomTools(Long userId, int page, int limit);

    /**
     * 添加自定义工具
     */
    Tool addTool(Long userId, Tool tool);

    /**
     * 删除自定义工具
     */
    void removeTool(Long userId, Long toolId);

    /**
     * 更新自定义工具
     */
    Tool updateTool(Long userId, Long toolId, Tool tool);
}
