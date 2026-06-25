package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.entity.Material;
import com.journaling.hub.entity.User;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    // ==================== 素材管理 ====================

    /**
     * 素材列表（含已下架）
     */
    @GetMapping("/materials")
    public Result<?> listMaterials(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status) {

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Material::getStatus, status);
        }
        wrapper.orderByDesc(Material::getCreatedAt);

        IPage<Material> result = materialMapper.selectPage(new Page<>(page, limit), wrapper);
        return Result.ok(PageResult.from(result));
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

    // ==================== 用户管理 ====================

    /**
     * 用户列表
     */
    @GetMapping("/users")
    public Result<?> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(User::getCreatedAt);

        IPage<User> result = userMapper.selectPage(new Page<>(page, limit), wrapper);
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
}
