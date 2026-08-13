package com.journaling.hub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.entity.Download;
import com.journaling.hub.entity.Material;
import com.journaling.hub.entity.User;
import com.journaling.hub.mapper.DownloadMapper;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.service.DownloadService;
import com.journaling.hub.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 下载服务实现
 */
@Slf4j
@Service
public class DownloadServiceImpl implements DownloadService {

    @Value("${FREE_DOWNLOAD_LIMIT:50}")
    private int freeDownloadLimit;

    @Autowired
    private DownloadMapper downloadMapper;

    @Autowired
    private MaterialMapper materialMapper;

    @Autowired
    private UserService userService;

    @Override
    @Transactional
    public Map<String, Object> download(Long userId, Long materialId) {
        // 获取素材信息
        Material material = materialMapper.selectById(materialId);
        if (material == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        if (material.getStatus() != 1) {
            throw new BusinessException(ErrorCode.MATERIAL_OFFLINE);
        }

        User user = userService.getProfile(userId);
        boolean alreadyDownloaded = downloadMapper.selectCount(
                new LambdaQueryWrapper<Download>()
                        .eq(Download::getUserId, userId)
                        .eq(Download::getMaterialId, materialId)
        ) > 0;

        int downloadCount = user.getDownloadCount() == null ? 0 : user.getDownloadCount();
        if (!user.isPremium() && !alreadyDownloaded && downloadCount >= freeDownloadLimit) {
            throw new BusinessException(ErrorCode.DOWNLOAD_FREE_LIMIT_EXCEEDED);
        }

        // 记录下载（使用唯一索引防止重复）
        boolean createdDownload = false;
        try {
            Download download = new Download();
            download.setUserId(userId);
            download.setMaterialId(materialId);
            download.setDownloadedAt(LocalDateTime.now());
            downloadMapper.insert(download);
            createdDownload = true;

            // 增加下载次数
            int materialDownloadCount = material.getDownloadCount() == null ? 0 : material.getDownloadCount();
            material.setDownloadCount(materialDownloadCount + 1);
            materialMapper.updateById(material);

            // 增加用户下载次数
            userService.incrementDownloadCount(userId);

        } catch (org.springframework.dao.DuplicateKeyException e) {
            // 唯一索引冲突，说明已下载过
            log.warn("用户已下载过此素材: userId={}, materialId={}", userId, materialId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("url", material.getImageUrl());
        boolean gif = "animated_gif".equals(material.getMediaType());
        result.put("filename", material.getTitle() + (gif ? ".gif" : extensionFor(material.getMimeType())));
        result.put("mimeType", gif ? "image/gif" : material.getMimeType());
        result.put("materialId", materialId);
        result.put("message", "下载成功");
        result.put("freeDownloadLimit", freeDownloadLimit);
        result.put("freeDownloadUsed", createdDownload ? downloadCount + 1 : downloadCount);
        result.put("freeDownloadRemaining", user.isPremium() ? null : Math.max(0, freeDownloadLimit - (createdDownload ? downloadCount + 1 : downloadCount)));

        return result;
    }

    private String extensionFor(String mimeType) {
        if ("image/jpeg".equalsIgnoreCase(mimeType)) return ".jpg";
        if ("image/webp".equalsIgnoreCase(mimeType)) return ".webp";
        return ".png";
    }

    @Override
    public IPage<Download> getUserDownloads(Long userId, int page, int limit) {
        Page<Download> pageParam = new Page<>(page, limit);

        IPage<Download> downloads = downloadMapper.selectPage(
                pageParam,
                new LambdaQueryWrapper<Download>()
                        .eq(Download::getUserId, userId)
                        .orderByDesc(Download::getDownloadedAt)
        );

        // 填充素材信息
        downloads.getRecords().forEach(download -> {
            Material material = materialMapper.selectById(download.getMaterialId());
            download.setMaterial(material);
        });

        return downloads;
    }
}
