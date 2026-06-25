package com.journaling.hub.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.journaling.hub.entity.Download;
import org.apache.ibatis.annotations.Mapper;

/**
 * 下载记录 Mapper
 */
@Mapper
public interface DownloadMapper extends BaseMapper<Download> {
}
