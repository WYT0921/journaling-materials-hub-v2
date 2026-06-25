package com.journaling.hub.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.entity.Material;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 素材 Mapper
 */
@Mapper
public interface MaterialMapper extends BaseMapper<Material> {

    /**
     * 搜索素材（标题和描述模糊匹配）
     */
    IPage<Material> searchMaterials(Page<Material> page, @Param("keyword") String keyword);
}
