package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.Favorite;
import com.journaling.hub.entity.Material;
import com.journaling.hub.mapper.FavoriteMapper;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.service.FavoriteService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 收藏服务实现
 */
@Slf4j
@Service
public class FavoriteServiceImpl implements FavoriteService {

    @Autowired
    private FavoriteMapper favoriteMapper;

    @Autowired
    private MaterialMapper materialMapper;

    @Override
    @Transactional
    public boolean toggleFavorite(Long userId, Long materialId) {
        // 检查素材是否存在
        Material material = materialMapper.selectById(materialId);
        if (material == null || material.getStatus() != 1) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }

        // 查找现有收藏
        Favorite existing = favoriteMapper.selectOne(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .eq(Favorite::getMaterialId, materialId)
        );

        if (existing != null) {
            // 已收藏 → 取消
            favoriteMapper.deleteById(existing.getId());
            log.info("用户取消收藏: userId={}, materialId={}", userId, materialId);
            return false;
        } else {
            // 未收藏 → 添加
            Favorite favorite = new Favorite();
            favorite.setUserId(userId);
            favorite.setMaterialId(materialId);
            favorite.setCreatedAt(LocalDateTime.now());
            favoriteMapper.insert(favorite);
            log.info("用户添加收藏: userId={}, materialId={}", userId, materialId);
            return true;
        }
    }

    @Override
    public boolean isFavorited(Long userId, Long materialId) {
        Long count = favoriteMapper.selectCount(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .eq(Favorite::getMaterialId, materialId)
        );
        return count != null && count > 0;
    }

    @Override
    public IPage<Favorite> getUserFavorites(Long userId, int page, int limit) {
        Page<Favorite> pageParam = new Page<>(page, limit);

        IPage<Favorite> favorites = favoriteMapper.selectPage(
                pageParam,
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
                        .orderByDesc(Favorite::getCreatedAt)
        );

        // 填充素材信息
        favorites.getRecords().forEach(fav -> {
            Material material = materialMapper.selectById(fav.getMaterialId());
            fav.setMaterial(material);
        });

        return favorites;
    }

    @Override
    public long getFavoriteCount(Long userId) {
        Long count = favoriteMapper.selectCount(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, userId)
        );
        return count != null ? count : 0;
    }
}
