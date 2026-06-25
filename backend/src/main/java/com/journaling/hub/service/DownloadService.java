package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.journaling.hub.entity.Download;

import java.util.Map;

/**
 * 下载服务接口
 */
public interface DownloadService {

    /**
     * 下载素材
     */
    Map<String, Object> download(Long userId, Long materialId);

    /**
     * 获取用户下载记录
     */
    IPage<Download> getUserDownloads(Long userId, int page, int limit);
}
