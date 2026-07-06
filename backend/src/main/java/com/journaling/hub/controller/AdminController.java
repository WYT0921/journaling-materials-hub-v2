package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Feedback;
import com.journaling.hub.entity.Material;
import com.journaling.hub.entity.Tool;
import com.journaling.hub.entity.User;
import com.journaling.hub.mapper.FeedbackMapper;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.mapper.ToolMapper;
import com.journaling.hub.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 管理员控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/admin")
public class AdminController {

    @Autowired
    private MaterialMapper materialMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ToolMapper toolMapper;

    @Autowired
    private FeedbackMapper feedbackMapper;

    // ==================== 素材管理 ====================

    /**
     * 素材列表（含已下架）
     */
    @GetMapping("/materials")
    public Result<?> listMaterials(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Material::getStatus, status);
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(Material::getCategory, category);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Material::getTitle, keyword);
        }
        wrapper.orderByDesc(Material::getCreatedAt);

        IPage<Material> result = materialMapper.selectPage(new Page<>(page, limit), wrapper);
        return Result.ok(PageResult.from(result));
    }

    /**
     * 新增素材
     */
    @PostMapping("/materials")
    public Result<?> createMaterial(@RequestBody Material material) {
        if (material.getStatus() == null) {
            material.setStatus(1);
        }
        if (material.getIsPremium() == null) {
            material.setIsPremium(false);
        }
        if (material.getDownloadCount() == null) {
            material.setDownloadCount(0);
        }
        if (material.getSortOrder() == null) {
            material.setSortOrder(0);
        }
        materialMapper.insert(material);
        log.info("素材新增成功: id={}, title={}", material.getId(), material.getTitle());
        return Result.ok(material);
    }

    /**
     * 编辑素材
     */
    @PutMapping("/materials/{id}")
    public Result<?> updateMaterial(@PathVariable Long id, @RequestBody Material material) {
        Material existing = materialMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }

        if (material.getTitle() != null) existing.setTitle(material.getTitle());
        if (material.getDescription() != null) existing.setDescription(material.getDescription());
        if (material.getCategory() != null) existing.setCategory(material.getCategory());
        if (material.getImageUrl() != null) existing.setImageUrl(material.getImageUrl());
        if (material.getThumbnailUrl() != null) existing.setThumbnailUrl(material.getThumbnailUrl());
        if (material.getIsPremium() != null) existing.setIsPremium(material.getIsPremium());
        if (material.getTags() != null) existing.setTags(material.getTags());
        if (material.getSortOrder() != null) existing.setSortOrder(material.getSortOrder());

        materialMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 上下架素材
     */
    @PutMapping("/materials/{id}/status")
    public Result<?> updateMaterialStatus(@PathVariable Long id, @RequestParam Integer status) {
        Material existing = materialMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        existing.setStatus(status);
        materialMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 删除素材
     */
    @DeleteMapping("/materials/{id}")
    public Result<?> deleteMaterial(@PathVariable Long id) {
        Material existing = materialMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        materialMapper.deleteById(id);
        return Result.ok(null);
    }

    // ==================== 工具管理 ====================

    /**
     * 工具列表（含已下架）
     */
    @GetMapping("/tools")
    public Result<?> listTools(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String category) {

        LambdaQueryWrapper<Tool> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Tool::getStatus, status);
        } else {
            // 默认只显示启用和默认工具，加上自定义工具
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(Tool::getCategory, category);
        }
        wrapper.orderByAsc(Tool::getSortOrder).orderByDesc(Tool::getCreatedAt);

        IPage<Tool> result = toolMapper.selectPage(new Page<>(page, limit), wrapper);
        return Result.ok(PageResult.from(result));
    }

    /**
     * 新增工具
     */
    @PostMapping("/tools")
    public Result<?> createTool(@RequestBody Tool tool) {
        if (tool.getSortOrder() == null) {
            tool.setSortOrder(0);
        }
        if (tool.getStatus() == null) {
            tool.setStatus(1);
        }
        tool.setIsDefault(true); // 后台创建的工具标记为全局工具
        toolMapper.insert(tool);
        log.info("工具新增成功: id={}, name={}", tool.getId(), tool.getName());
        return Result.ok(tool);
    }

    /**
     * 编辑工具
     */
    @PutMapping("/tools/{id}")
    public Result<?> updateTool(@PathVariable Long id, @RequestBody Tool tool) {
        Tool existing = toolMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }

        if (tool.getName() != null) existing.setName(tool.getName());
        if (tool.getDescription() != null) existing.setDescription(tool.getDescription());
        if (tool.getIcon() != null) existing.setIcon(tool.getIcon());
        if (tool.getUrl() != null) existing.setUrl(tool.getUrl());
        if (tool.getCategory() != null) existing.setCategory(tool.getCategory());
        if (tool.getSortOrder() != null) existing.setSortOrder(tool.getSortOrder());

        toolMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 上下架工具
     */
    @PutMapping("/tools/{id}/status")
    public Result<?> updateToolStatus(@PathVariable Long id, @RequestParam Integer status) {
        Tool existing = toolMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        existing.setStatus(status);
        toolMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 删除工具
     */
    @DeleteMapping("/tools/{id}")
    public Result<?> deleteTool(@PathVariable Long id) {
        Tool existing = toolMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        toolMapper.deleteById(id);
        return Result.ok(null);
    }

    // ==================== 用户管理 ====================

    /**
     * 用户列表（支持搜索、状态筛选、会员类型筛选）
     */
    @GetMapping("/users")
    public Result<?> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String memberType) {

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(User::getNickname, keyword)
                    .or()
                    .like(User::getPhone, keyword));
        }
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        if (StringUtils.hasText(memberType)) {
            wrapper.eq(User::getMemberType, memberType);
        }
        wrapper.orderByDesc(User::getCreatedAt);

        IPage<User> result = userMapper.selectPage(new Page<>(page, limit), wrapper);

        // 脱敏返回：移除 openid
        result.getRecords().forEach(u -> u.setOpenid(null));

        return Result.ok(PageResult.from(result));
    }

    /**
     * 启用/禁用用户
     */
    @PutMapping("/users/{id}/status")
    public Result<?> updateUserStatus(@PathVariable Long id, @RequestParam Integer status) {
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        existing.setStatus(status);
        userMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 调整用户会员信息
     */
    @PutMapping("/users/{id}/member")
    public Result<?> updateUserMember(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (body.containsKey("memberType")) {
            existing.setMemberType((String) body.get("memberType"));
        }
        if (body.containsKey("memberExpireTime")) {
            String timeStr = (String) body.get("memberExpireTime");
            if (timeStr != null && !timeStr.isBlank()) {
                existing.setMemberExpireTime(LocalDateTime.parse(timeStr));
            } else {
                existing.setMemberExpireTime(null);
            }
        }

        userMapper.updateById(existing);
        log.info("管理员调整用户会员: userId={}, memberType={}, expireTime={}",
                id, existing.getMemberType(), existing.getMemberExpireTime());
        return Result.ok(existing);
    }

    // ==================== 反馈管理 ====================

    /**
     * 反馈列表（分页 + 状态筛选）
     */
    @GetMapping("/feedbacks")
    public Result<?> listFeedbacks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status) {

        LambdaQueryWrapper<Feedback> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Feedback::getStatus, status);
        }
        wrapper.orderByDesc(Feedback::getCreatedAt);

        IPage<Feedback> result = feedbackMapper.selectPage(new Page<>(page, limit), wrapper);

        // 附上用户昵称
        Map<Long, String> userNicknames = new HashMap<>();
        for (Feedback fb : result.getRecords()) {
            if (fb.getUserId() != null && !userNicknames.containsKey(fb.getUserId())) {
                User user = userMapper.selectById(fb.getUserId());
                userNicknames.put(fb.getUserId(), user != null ? user.getNickname() : "未知用户");
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("total", result.getTotal());
        data.put("page", result.getCurrent());
        data.put("limit", result.getSize());
        data.put("list", result.getRecords());
        data.put("userNicknames", userNicknames);

        return Result.ok(data);
    }

    /**
     * 标记反馈处理状态
     */
    @PutMapping("/feedbacks/{id}/status")
    public Result<?> updateFeedbackStatus(@PathVariable Long id, @RequestParam Integer status) {
        Feedback existing = feedbackMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        existing.setStatus(status);
        feedbackMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 删除反馈
     */
    @DeleteMapping("/feedbacks/{id}")
    public Result<?> deleteFeedback(@PathVariable Long id) {
        Feedback existing = feedbackMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        feedbackMapper.deleteById(id);
        return Result.ok(null);
    }
}
