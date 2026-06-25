package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.entity.Favorite;

/**
 * 收藏服务接口
 */
public interface FavoriteService {

    /**
     * 切换收藏状态（已收藏则取消，未收藏则添加）
     * @return true=已收藏 false=已取消
     */
    boolean toggleFavorite(Long userId, Long materialId);

    /**
     * 检查是否已收藏
     */
    boolean isFavorited(Long userId, Long materialId);

    /**
     * 获取用户收藏列表（分页）
     */
    IPage<Favorite> getUserFavorites(Long userId, int page, int limit);

    /**
     * 获取用户收藏总数
     */
    long getFavoriteCount(Long userId);
}
