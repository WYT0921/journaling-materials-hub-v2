package com.journaling.hub.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.journaling.hub.entity.Favorite;
import org.apache.ibatis.annotations.Mapper;

/**
 * 收藏 Mapper
 */
@Mapper
public interface FavoriteMapper extends BaseMapper<Favorite> {
}
