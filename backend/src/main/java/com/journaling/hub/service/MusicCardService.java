package com.journaling.hub.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.entity.MusicCardAsset;
import com.journaling.hub.entity.MusicPlayerTemplate;
import com.journaling.hub.entity.UserMusicCard;
import com.journaling.hub.mapper.MusicCardAssetMapper;
import com.journaling.hub.mapper.MusicPlayerTemplateMapper;
import com.journaling.hub.mapper.UserMusicCardMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;

@Service
public class MusicCardService {

    private final MusicPlayerTemplateMapper templateMapper;
    private final MusicCardAssetMapper assetMapper;
    private final UserMusicCardMapper creationMapper;

    public MusicCardService(MusicPlayerTemplateMapper templateMapper, MusicCardAssetMapper assetMapper, UserMusicCardMapper creationMapper) {
        this.templateMapper = templateMapper;
        this.assetMapper = assetMapper;
        this.creationMapper = creationMapper;
    }

    // ---- 模板 ----

    public List<MusicPlayerTemplate> listTemplates() {
        return templateMapper.selectList(new LambdaQueryWrapper<MusicPlayerTemplate>()
                .eq(MusicPlayerTemplate::getStatus, 1).orderByAsc(MusicPlayerTemplate::getSortOrder));
    }

    public PageResult<MusicPlayerTemplate> listTemplatesAdmin(int page, int limit) {
        int p = Math.max(1, page), l = Math.min(100, Math.max(1, limit));
        IPage<MusicPlayerTemplate> result = templateMapper.selectPage(new Page<>(p, l),
                new LambdaQueryWrapper<MusicPlayerTemplate>().orderByAsc(MusicPlayerTemplate::getSortOrder));
        return PageResult.from(result);
    }

    public MusicPlayerTemplate createTemplate(MusicPlayerTemplate template) {
        template.setId(null);
        templateMapper.insert(template);
        return template;
    }

    public MusicPlayerTemplate updateTemplate(Long id, MusicPlayerTemplate template) {
        MusicPlayerTemplate existing = templateMapper.selectById(id);
        if (existing == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        template.setId(id);
        templateMapper.updateById(template);
        return template;
    }

    public void updateTemplateStatus(Long id, Integer status) {
        MusicPlayerTemplate t = templateMapper.selectById(id);
        if (t == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        t.setStatus(status);
        templateMapper.updateById(t);
    }

    public void deleteTemplate(Long id) {
        if (templateMapper.deleteById(id) == 0) throw new BusinessException(ErrorCode.NOT_FOUND);
    }

    // ---- 素材 ----

    public List<MusicCardAsset> listAssets(String type, String category) {
        LambdaQueryWrapper<MusicCardAsset> wrapper = new LambdaQueryWrapper<MusicCardAsset>()
                .eq(MusicCardAsset::getStatus, 1).orderByAsc(MusicCardAsset::getSortOrder);
        if (StringUtils.hasText(type)) wrapper.eq(MusicCardAsset::getType, type);
        if (StringUtils.hasText(category)) wrapper.eq(MusicCardAsset::getCategory, category);
        return assetMapper.selectList(wrapper);
    }

    public PageResult<MusicCardAsset> listAssetsAdmin(String type, String category, int page, int limit) {
        int p = Math.max(1, page), l = Math.min(100, Math.max(1, limit));
        LambdaQueryWrapper<MusicCardAsset> wrapper = new LambdaQueryWrapper<MusicCardAsset>()
                .orderByAsc(MusicCardAsset::getSortOrder);
        if (StringUtils.hasText(type)) wrapper.eq(MusicCardAsset::getType, type);
        if (StringUtils.hasText(category)) wrapper.eq(MusicCardAsset::getCategory, category);
        return PageResult.from(assetMapper.selectPage(new Page<>(p, l), wrapper));
    }

    public MusicCardAsset createAsset(MusicCardAsset asset) {
        asset.setId(null);
        assetMapper.insert(asset);
        return asset;
    }

    public MusicCardAsset updateAsset(Long id, MusicCardAsset asset) {
        if (assetMapper.selectById(id) == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        asset.setId(id);
        assetMapper.updateById(asset);
        return asset;
    }

    public void updateAssetStatus(Long id, Integer status) {
        MusicCardAsset a = assetMapper.selectById(id);
        if (a == null) throw new BusinessException(ErrorCode.NOT_FOUND);
        a.setStatus(status);
        assetMapper.updateById(a);
    }

    public void deleteAsset(Long id) {
        if (assetMapper.deleteById(id) == 0) throw new BusinessException(ErrorCode.NOT_FOUND);
    }

    // ---- 用户作品 ----

    @Transactional
    public UserMusicCard saveCreation(Long userId, String title, String canvasSnapshot, String exportUrl) {
        UserMusicCard card = new UserMusicCard();
        card.setUserId(userId);
        card.setTitle(title);
        card.setCanvasSnapshot(canvasSnapshot);
        card.setExportUrl(exportUrl);
        card.setStatus(1);
        creationMapper.insert(card);
        return card;
    }

    public PageResult<UserMusicCard> listUserCreations(Long userId, int page, int limit) {
        int p = Math.max(1, page), l = Math.min(50, Math.max(1, limit));
        IPage<UserMusicCard> result = creationMapper.selectPage(new Page<>(p, l),
                new LambdaQueryWrapper<UserMusicCard>()
                        .eq(UserMusicCard::getUserId, userId)
                        .eq(UserMusicCard::getStatus, 1)
                        .orderByDesc(UserMusicCard::getCreatedAt));
        return PageResult.from(result);
    }

    public void deleteCreation(Long userId, Long id) {
        UserMusicCard card = creationMapper.selectById(id);
        if (card == null || !card.getUserId().equals(userId))
            throw new BusinessException(ErrorCode.NOT_FOUND);
        card.setStatus(0);
        creationMapper.updateById(card);
    }

    public PageResult<UserMusicCard> listAllCreationsAdmin(int page, int limit) {
        int p = Math.max(1, page), l = Math.min(100, Math.max(1, limit));
        return PageResult.from(creationMapper.selectPage(new Page<>(p, l),
                new LambdaQueryWrapper<UserMusicCard>().orderByDesc(UserMusicCard::getCreatedAt)));
    }
}
