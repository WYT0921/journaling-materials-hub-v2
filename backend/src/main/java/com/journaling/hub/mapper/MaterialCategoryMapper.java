package com.journaling.hub.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.journaling.hub.entity.MaterialCategory;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface MaterialCategoryMapper extends BaseMapper<MaterialCategory> {
    @Select("SELECT material_id, category, sort_order FROM material_categories WHERE material_id = #{materialId} ORDER BY sort_order, category")
    List<MaterialCategory> selectByMaterialId(Long materialId);

    @Delete("DELETE FROM material_categories WHERE material_id = #{materialId}")
    int deleteByMaterialId(Long materialId);
}
