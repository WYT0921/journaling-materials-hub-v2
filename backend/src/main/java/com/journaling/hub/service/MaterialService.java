package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.entity.Material;

import java.util.List;
import java.util.Map;

/**
 * 素材服务接口
 */
public interface MaterialService {

    /**
     * 获取素材列表（分页）
     */
    IPage<Material> listMaterials(int page, int limit, String category, String keyword, String sortBy);

    /**
     * 获取素材详情
     */
    Material getDetail(Long id);

    /**
     * 搜索素材
     */
    IPage<Material> searchMaterials(String keyword, int page, int limit);

    /**
     * 获取所有分类
     */
    List<Map<String, Object>> getCategories();
}
