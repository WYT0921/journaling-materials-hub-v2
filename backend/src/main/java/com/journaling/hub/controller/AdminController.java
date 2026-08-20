package com.journaling.hub.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.journaling.hub.common.BusinessException;
import com.journaling.hub.common.ErrorCode;
import com.journaling.hub.common.PageResult;
import com.journaling.hub.common.Result;
import com.journaling.hub.dto.RedeemCodeGenerateRequest;
import com.journaling.hub.dto.MaterialRequest;
import com.journaling.hub.service.FileService;
import com.journaling.hub.entity.Feedback;
import com.journaling.hub.dto.FeedbackReplyRequest;
import com.journaling.hub.entity.Material;
import com.journaling.hub.entity.RedeemCode;
import com.journaling.hub.entity.User;
import com.journaling.hub.mapper.FeedbackMapper;
import com.journaling.hub.mapper.MaterialMapper;
import com.journaling.hub.mapper.RedeemCodeMapper;
import com.journaling.hub.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理员控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2/admin")
public class AdminController {

    @Autowired
    private MaterialMapper materialMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private FeedbackMapper feedbackMapper;

    @Autowired
    private RedeemCodeMapper redeemCodeMapper;

    @Autowired
    private FileService fileService;

    private static final SecureRandom REDEEM_RANDOM = new SecureRandom();
    private static final String REDEEM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    // ==================== 素材管理 ====================

    /**
     * 素材列表（含已下架）
     */
    @GetMapping("/materials")
    public Result<?> listMaterials(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) String mediaType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer issueYear,
            @RequestParam(required = false) Integer issueNumber) {

        validateIssue(issueYear, issueNumber);

        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Material::getStatus, status);
        }
        if (StringUtils.hasText(materialType)) {
            validateMaterialType(materialType);
            wrapper.eq(Material::getMaterialType, materialType);
        }
        if (StringUtils.hasText(mediaType)) {
            validateMediaType(mediaType);
            wrapper.eq(Material::getMediaType, mediaType);
        }
        if (StringUtils.hasText(category)) {
            wrapper.eq(Material::getCategory, category);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(Material::getTitle, keyword);
        }
        if (issueYear != null) {
            wrapper.eq(Material::getIssueYear, issueYear)
                    .eq(Material::getIssueNumber, issueNumber);
        }
        wrapper.orderByDesc(Material::getCreatedAt);

        IPage<Material> result = materialMapper.selectPage(new Page<>(page, limit), wrapper);
        return Result.ok(PageResult.from(result));
    }

    /**
     * 新增素材
     */
    @PostMapping("/materials")
    public Result<?> createMaterial(@RequestBody MaterialRequest request) {
        validateIssue(request.getIssueYear(), request.getIssueNumber());
        Material material = applyRequest(new Material(), request, true);
        if (!StringUtils.hasText(material.getMaterialType())) {
            material.setMaterialType("single");
        } else {
            validateMaterialType(material.getMaterialType());
        }
        if (material.getStatus() == null) {
            material.setStatus(1);
        }
        if (material.getIsPremium() == null) {
            material.setIsPremium(false);
        }
        if (material.getDownloadCount() == null) {
            material.setDownloadCount(0);
        }
        if (material.getSortOrder() == null) {
            material.setSortOrder(0);
        }
        materialMapper.insert(material);
        log.info("素材新增成功: id={}, title={}", material.getId(), material.getTitle());
        return Result.ok(material);
    }

    /**
     * 编辑素材
     */
    @PutMapping("/materials/{id}")
    public Result<?> updateMaterial(@PathVariable Long id, @RequestBody MaterialRequest material) {
        Material existing = materialMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }

        if (material.getTitle() != null) existing.setTitle(material.getTitle());
        if (material.getDescription() != null) existing.setDescription(material.getDescription());
        if (material.getCategory() != null) existing.setCategory(material.getCategory());
        if (material.getMaterialType() != null) {
            validateMaterialType(material.getMaterialType());
            existing.setMaterialType(material.getMaterialType());
        }
        if (material.isIssueYearSpecified() != material.isIssueNumberSpecified()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "年份和期号必须同时提交");
        }
        if (material.isIssueYearSpecified()) {
            validateIssue(material.getIssueYear(), material.getIssueNumber());
            existing.setIssueYear(material.getIssueYear());
            existing.setIssueNumber(material.getIssueNumber());
        }
        if (material.getImageUrl() != null) existing.setImageUrl(material.getImageUrl());
        if (material.getThumbnailUrl() != null) existing.setThumbnailUrl(material.getThumbnailUrl());
        if (material.getIsPremium() != null) existing.setIsPremium(material.getIsPremium());
        if (material.getTags() != null) existing.setTags(material.getTags());
        if (material.getSortOrder() != null) existing.setSortOrder(material.getSortOrder());
        if (material.getMediaType() != null) {
            validateMediaType(material.getMediaType());
            existing.setMediaType(material.getMediaType());
        }

        materialMapper.updateById(existing);
        if (material.isIssueYearSpecified() && material.getIssueYear() == null) {
            materialMapper.update(null, new LambdaUpdateWrapper<Material>()
                    .eq(Material::getId, id)
                    .set(Material::getIssueYear, null)
                    .set(Material::getIssueNumber, null));
        }
        return Result.ok(existing);
    }

    /**
     * 上下架素材
     */
    @PutMapping("/materials/{id}/status")
    public Result<?> updateMaterialStatus(@PathVariable Long id, @RequestParam Integer status) {
        Material existing = materialMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        existing.setStatus(status);
        materialMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 删除素材
     */
    @DeleteMapping("/materials/{id}")
    public Result<?> deleteMaterial(@PathVariable Long id) {
        Material existing = materialMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        if ("animated_gif".equals(existing.getMediaType())) {
            deleteStoredUrl(existing.getImageUrl(), true);
            deleteStoredUrl(existing.getThumbnailUrl(), true);
        }
        materialMapper.deleteById(id);
        return Result.ok(null);
    }

    private Material applyRequest(Material material, MaterialRequest request, boolean creating) {
        material.setTitle(request.getTitle()); material.setDescription(request.getDescription());
        material.setImageUrl(request.getImageUrl()); material.setThumbnailUrl(request.getThumbnailUrl()); material.setCategory(request.getCategory());
        material.setMaterialType(request.getMaterialType()); material.setMediaType(request.getMediaType()); material.setIssueYear(request.getIssueYear()); material.setIssueNumber(request.getIssueNumber());
        material.setContentHash(request.getContentHash()); material.setMimeType(request.getMimeType()); material.setFileSize(request.getFileSize()); material.setWidth(request.getWidth()); material.setHeight(request.getHeight()); material.setDurationMs(request.getDurationMs()); material.setFrameCount(request.getFrameCount());
        material.setTags(request.getTags()); material.setIsPremium(request.getIsPremium()); material.setStatus(request.getStatus()); material.setSortOrder(request.getSortOrder());
        if (creating && !StringUtils.hasText(material.getMediaType())) material.setMediaType("static_image");
        validateMediaType(material.getMediaType());
        if ("animated_gif".equals(material.getMediaType()) && (!StringUtils.hasText(material.getContentHash()) || !"image/gif".equals(material.getMimeType()) || material.getFrameCount() == null || material.getFrameCount() <= 1)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "动态 GIF 必须通过 GIF 上传接口生成完整元数据");
        }
        return material;
    }

    private void validateMediaType(String mediaType) {
        if (!"static_image".equals(mediaType) && !"animated_gif".equals(mediaType)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "媒体类型必须为 static_image 或 animated_gif");
        }
    }

    private void deleteStoredUrl(String url, boolean strict) {
        if (!StringUtils.hasText(url)) return;
        int marker = url.indexOf("/materials/");
        if (marker >= 0) {
            String object = url.substring(marker + "/materials/".length());
            if (strict) fileService.deleteStrict(object); else fileService.delete(object);
        }
        else log.warn("无法从素材 URL 解析 MinIO 对象，需人工清理: {}", url);
    }

    private void validateMaterialType(String materialType) {
        if (!"single".equals(materialType) && !"bundle".equals(materialType)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "素材类型必须为 single 或 bundle");
        }
    }

    private void validateIssue(Integer issueYear, Integer issueNumber) {
        if ((issueYear == null) != (issueNumber == null)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "年份和期号必须同时提供");
        }
        if (issueYear != null && (issueYear < 1000 || issueYear > 9999)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "年份必须为四位数字");
        }
        if (issueNumber != null && issueNumber <= 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "期号必须大于 0");
        }
    }

    // ==================== 用户管理 ====================

    /**
     * 用户列表（支持搜索、状态筛选、会员类型筛选）
     */
    @GetMapping("/users")
    public Result<?> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String memberType) {

        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(User::getNickname, keyword)
                    .or()
                    .like(User::getPhone, keyword));
        }
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        if (StringUtils.hasText(memberType)) {
            wrapper.eq(User::getMemberType, memberType);
        }
        wrapper.orderByDesc(User::getCreatedAt);

        IPage<User> result = userMapper.selectPage(new Page<>(page, limit), wrapper);

        // 脱敏返回：移除 openid
        result.getRecords().forEach(u -> u.setOpenid(null));

        return Result.ok(PageResult.from(result));
    }

    /**
     * 启用/禁用用户
     */
    @PutMapping("/users/{id}/status")
    public Result<?> updateUserStatus(@PathVariable Long id, @RequestParam Integer status) {
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        existing.setStatus(status);
        userMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 调整用户会员信息
     */
    @PutMapping("/users/{id}/member")
    public Result<?> updateUserMember(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        User existing = userMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (body.containsKey("memberType")) {
            existing.setMemberType((String) body.get("memberType"));
        }
        if (body.containsKey("memberExpireTime")) {
            String timeStr = (String) body.get("memberExpireTime");
            if (timeStr != null && !timeStr.isBlank()) {
                existing.setMemberExpireTime(LocalDateTime.parse(timeStr));
            } else {
                existing.setMemberExpireTime(null);
            }
        }

        userMapper.updateById(existing);
        log.info("管理员调整用户会员: userId={}, memberType={}, expireTime={}",
                id, existing.getMemberType(), existing.getMemberExpireTime());
        return Result.ok(existing);
    }

    // ==================== 兑换码管理 ====================

    /**
     * 兑换码列表
     */
    @GetMapping("/redeem-codes")
    public Result<?> listRedeemCodes(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword) {

        LambdaQueryWrapper<RedeemCode> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(RedeemCode::getStatus, status);
        }
        if (StringUtils.hasText(type)) {
            validateRedeemType(type);
            wrapper.eq(RedeemCode::getType, type);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(RedeemCode::getCode, normalizeRedeemKeyword(keyword));
        }
        wrapper.orderByDesc(RedeemCode::getCreatedAt);

        IPage<RedeemCode> result = redeemCodeMapper.selectPage(new Page<>(page, limit), wrapper);
        return Result.ok(PageResult.from(result));
    }

    /**
     * 批量生成一次性兑换码
     */
    @PostMapping("/redeem-codes/generate")
    public Result<?> generateRedeemCodes(@RequestBody RedeemCodeGenerateRequest request) {
        String type = request != null ? request.getType() : null;
        Integer count = request != null ? request.getCount() : null;

        validateRedeemType(type);
        if (count == null || count < 1 || count > 500) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "生成数量必须在 1 到 500 之间");
        }

        List<RedeemCode> generated = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            RedeemCode code = new RedeemCode();
            code.setCode(generateUniqueRedeemCode());
            code.setType(type);
            code.setStatus(0);
            code.setExpireTime(request.getExpireTime());
            redeemCodeMapper.insert(code);
            generated.add(code);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("count", generated.size());
        data.put("list", generated);
        return Result.ok(data);
    }

    /**
     * 作废未使用兑换码
     */
    @PutMapping("/redeem-codes/{id}/disable")
    public Result<?> disableRedeemCode(@PathVariable Long id) {
        RedeemCode existing = redeemCodeMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.REDEEM_CODE_NOT_FOUND);
        }
        if (existing.getStatus() == 1) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "已使用的兑换码不能作废");
        }
        existing.setStatus(2);
        redeemCodeMapper.updateById(existing);
        return Result.ok(existing);
    }

    private void validateRedeemType(String type) {
        if (!"monthly".equals(type) && !"yearly".equals(type) && !"permanent".equals(type)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "会员类型必须是 monthly、yearly 或 permanent");
        }
    }

    private String normalizeRedeemKeyword(String keyword) {
        String raw = keyword == null ? "" : keyword.replace("-", "").replaceAll("\\s+", "").toUpperCase();
        if (raw.length() == 12) {
            return raw.substring(0, 4) + "-" + raw.substring(4, 8) + "-" + raw.substring(8);
        }
        return keyword == null ? "" : keyword.toUpperCase();
    }

    private String generateUniqueRedeemCode() {
        String code;
        do {
            code = randomRedeemSegment() + "-" + randomRedeemSegment() + "-" + randomRedeemSegment();
        } while (redeemCodeMapper.selectCount(new LambdaQueryWrapper<RedeemCode>()
                .eq(RedeemCode::getCode, code)) > 0);
        return code;
    }

    private String randomRedeemSegment() {
        StringBuilder builder = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            builder.append(REDEEM_ALPHABET.charAt(REDEEM_RANDOM.nextInt(REDEEM_ALPHABET.length())));
        }
        return builder.toString();
    }

    // ==================== 反馈管理 ====================

    /**
     * 反馈列表（分页 + 状态筛选）
     */
    @GetMapping("/feedbacks")
    public Result<?> listFeedbacks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Integer status) {

        LambdaQueryWrapper<Feedback> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Feedback::getStatus, status);
        }
        wrapper.orderByDesc(Feedback::getCreatedAt);

        IPage<Feedback> result = feedbackMapper.selectPage(new Page<>(page, limit), wrapper);

        // 附上用户昵称
        Map<Long, String> userNicknames = new HashMap<>();
        for (Feedback fb : result.getRecords()) {
            if (fb.getUserId() != null && !userNicknames.containsKey(fb.getUserId())) {
                User user = userMapper.selectById(fb.getUserId());
                userNicknames.put(fb.getUserId(), user != null ? user.getNickname() : "未知用户");
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("total", result.getTotal());
        data.put("page", result.getCurrent());
        data.put("limit", result.getSize());
        data.put("list", result.getRecords());
        data.put("userNicknames", userNicknames);

        return Result.ok(data);
    }

    /**
     * 标记反馈处理状态
     */
    @PutMapping("/feedbacks/{id}/status")
    public Result<?> updateFeedbackStatus(@PathVariable Long id, @RequestParam Integer status) {
        Feedback existing = feedbackMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        existing.setStatus(status);
        feedbackMapper.updateById(existing);
        return Result.ok(existing);
    }

    /** 回复反馈；回复后自动标记为已处理。 */
    @PutMapping("/feedbacks/{id}/reply")
    public Result<?> replyFeedback(@PathVariable Long id,
                                   @Valid @RequestBody FeedbackReplyRequest request) {
        Feedback existing = feedbackMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        existing.setReply(request.getReply().trim());
        existing.setRepliedAt(LocalDateTime.now());
        existing.setStatus(1);
        feedbackMapper.updateById(existing);
        return Result.ok(existing);
    }

    /**
     * 删除反馈
     */
    @DeleteMapping("/feedbacks/{id}")
    public Result<?> deleteFeedback(@PathVariable Long id) {
        Feedback existing = feedbackMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        feedbackMapper.deleteById(id);
        return Result.ok(null);
    }
}
