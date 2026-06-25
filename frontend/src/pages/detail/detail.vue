<template>
  <view class="page-detail">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="素材详情" :show-back="true">
      <template #right>
        <view class="nav-action" @tap="handleToggleFavorite">
          <text class="nav-action-icon">{{ isFavorited ? '❤' : '♡' }}</text>
        </view>
        <view class="nav-action" @tap="handleShare">
          <text class="nav-action-icon">⋯</text>
        </view>
      </template>
    </GlassNavBar>

    <!-- 加载中 -->
    <LoadingSpinner v-if="isLoading" />

    <!-- 素材详情 -->
    <view v-else-if="material" class="detail-content">
      <!-- 核心大图区 -->
      <view class="image-section">
        <image
          class="material-image"
          :src="material.imageUrl"
          mode="widthFix"
          @tap="handleImagePreview"
        />

        <!-- VIP 角标 -->
        <view v-if="material.isPremium" class="vip-corner-badge">
          <text class="vip-corner-text">👑 会员专属</text>
        </view>
      </view>

      <!-- 信息区域 -->
      <view class="info-section">
        <!-- 分类标签 -->
        <view class="info-tags">
          <text class="info-category">{{ material.category }}</text>
        </view>

        <!-- 标题 -->
        <text class="material-title">{{ material.title }}</text>

        <!-- 作者+数据 -->
        <view class="material-meta">
          <view class="meta-author">
            <view class="author-avatar" />
            <text class="author-name">@手账控Mori</text>
          </view>
          <view class="meta-stats">
            <text class="stat-item">❤ {{ material.likeCount || material.downloadCount || 0 }}</text>
            <text class="stat-divider">·</text>
            <text class="stat-item">↓ {{ material.downloadCount || 0 }}</text>
          </view>
        </view>

        <!-- 描述 -->
        <text v-if="material.description" class="material-desc">{{ material.description }}</text>

        <!-- 标签 -->
        <view v-if="material.tags && material.tags.length" class="tags-wrapper">
          <view v-for="(tag, index) in material.tags" :key="index" class="tag-item">
            <text class="tag-text">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 底部安全区（给CTA栏让位） -->
      <view class="bottom-spacer" />
    </view>

    <!-- 错误状态 -->
    <EmptyState v-else text="素材不存在或已下架" />

    <!-- 底部 CTA 栏（毛玻璃） -->
    <view v-if="material" class="cta-bar safe-area-bottom">
      <!-- 非会员：双按钮 — 全素材需会员下载 -->
      <view v-if="!userStore.isPremium" class="cta-row">
        <button class="cta-btn cta-outline" @tap="handlePreview">
          <text class="cta-outline-text">👁 预览</text>
        </button>
        <button class="cta-btn cta-primary" @tap="handleUnlock">
          <text class="cta-primary-text">👑 解锁下载</text>
        </button>
      </view>
      <!-- 会员：单按钮 -->
      <view v-else class="cta-row">
        <button class="cta-btn cta-primary-full" @tap="handleDownload">
          <text class="cta-primary-text">下载素材</text>
        </button>
      </view>
    </view>

    <!-- Unlock Premium 半屏弹窗 -->
    <BottomSheet
      v-model:visible="showUnlockSheet"
      title="解锁会员"
    >
      <view class="unlock-content">
        <view class="unlock-icon-wrapper">
          <text class="unlock-crown">👑</text>
        </view>
        <text class="unlock-desc">该素材为会员专属，成为会员即可下载高清无水印原图</text>
      </view>
      <template #footer>
        <view class="unlock-footer">
          <button class="unlock-btn-primary" @tap="handleGoRedeem">
            <text class="unlock-btn-text">👑 解锁会员</text>
          </button>
          <button class="unlock-btn-customer" @tap="handleContactService">
            <text class="unlock-customer-text">联系客服</text>
          </button>
          <button class="unlock-btn-cancel" @tap="showUnlockSheet = false">
            <text class="unlock-cancel-text">取消</text>
          </button>
        </view>
      </template>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getMaterialDetail } from '../../api/material'
import { downloadMaterial } from '../../api/download'
import { toggleFavorite, checkFavorite } from '../../api/favorite'
import { requireLogin } from '../../utils/auth'
import GlassNavBar from '../../components/GlassNavBar.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import BottomSheet from '../../components/BottomSheet.vue'

const userStore = useUserStore()

const materialId = ref(null)
const material = ref(null)
const isLoading = ref(true)
const showUnlockSheet = ref(false)
const isFavorited = ref(false)

// 页面加载
onLoad((options) => {
  if (options.id) {
    materialId.value = options.id
    loadMaterialDetail()
  }
})

// 加载素材详情
const loadMaterialDetail = async () => {
  try {
    isLoading.value = true
    const result = await getMaterialDetail(materialId.value)
    material.value = result
    // 检查收藏状态
    checkFavoriteStatus()
  } catch (error) {
    console.error('加载素材详情失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 检查收藏状态
const checkFavoriteStatus = async () => {
  try {
    const result = await checkFavorite(materialId.value)
    isFavorited.value = result.isFavorited
  } catch {
    // 未登录或请求失败，忽略
  }
}

// 切换收藏
const handleToggleFavorite = async () => {
  if (!requireLogin()) return
  try {
    const result = await toggleFavorite(materialId.value)
    isFavorited.value = result.isFavorited
    uni.showToast({
      title: result.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'none',
      duration: 1500
    })
  } catch (error) {
    console.error('收藏操作失败:', error)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 图片预览 — 所有用户均可查看大图
const handleImagePreview = () => {
  if (!material.value) return
  uni.previewImage({
    urls: [material.value.imageUrl],
    current: material.value.imageUrl
  })
}

// 预览按钮（VIP非会员）
const handlePreview = () => {
  showUnlockSheet.value = true
}

// 解锁下载
const handleUnlock = () => {
  if (!requireLogin()) return
  showUnlockSheet.value = true
}

// 跳转兑换页
const handleGoRedeem = () => {
  showUnlockSheet.value = false
  uni.navigateTo({ url: '/pages/redeem/index' })
}

// 联系客服
const handleContactService = () => {
  showUnlockSheet.value = false
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

// 下载素材（仅会员可调用，CTA 栏已做权限控制）
const handleDownload = async () => {
  if (!requireLogin()) return

  // 兜底检查：非会员拦截
  if (!userStore.isPremium) {
    showUnlockSheet.value = true
    return
  }

  try {
    uni.showLoading({ title: '下载中...' })
    const result = await downloadMaterial(materialId.value)
    const downloadRes = await new Promise((resolve, reject) => {
      uni.downloadFile({
        url: result.url,
        success: (res) => resolve(res),
        fail: (err) => reject(err)
      })
    })

    if (downloadRes.statusCode === 200) {
      await new Promise((resolve, reject) => {
        uni.saveImageToPhotosAlbum({
          filePath: downloadRes.tempFilePath,
          success: () => resolve(),
          fail: (err) => reject(err)
        })
      })
      // 黑底白字 Toast
      uni.showToast({
        title: '已保存至相册',
        icon: 'none',
        duration: 2000
      })
    } else {
      throw new Error('下载失败')
    }
  } catch (error) {
    console.error('下载失败:', error)
    uni.showToast({
      title: error.message || '下载失败，请重试',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

// 分享
const handleShare = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page-detail {
  min-height: 100vh;
  padding-bottom: 120rpx; /* 给底部CTA栏让位 */
}

/* ===== 核心大图区 ===== */
.image-section {
  position: relative;
  width: 100%;
  background: #fff;
  overflow: hidden;
}

.material-image {
  width: 100%;
  display: block;
}

/* VIP 专属角标（左上角黑底白字） */
.vip-corner-badge {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  background: #000;
  padding: 6rpx 18rpx;
  border-radius: 6rpx;
  z-index: 2;
}

.vip-corner-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: 600;
}

/* ===== 信息区域 ===== */
.info-section {
  padding: 28rpx 28rpx 32rpx;
  position: relative;
  z-index: 1;
}

.info-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.info-category {
  font-size: 22rpx;
  color: #999;
  background: rgba(255,255,255,0.7);
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  border: 1rpx solid #eee;
}

.material-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.material-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  gap: 16rpx;
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.author-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ddd;
}

.author-name {
  font-size: 24rpx;
  color: #666;
}

.meta-stats {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-item {
  font-size: 22rpx;
  color: #999;
}

.stat-divider {
  font-size: 22rpx;
  color: #ccc;
}

.material-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-top: 20rpx;
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.tag-item {
  background: rgba(255,255,255,0.7);
  padding: 6rpx 18rpx;
  border-radius: 6rpx;
  border: 1rpx solid #eee;
}

.tag-text {
  font-size: 22rpx;
  color: #666;
}

/* 底部占位 */
.bottom-spacer {
  height: 40rpx;
}

/* ===== 底部 CTA 栏（毛玻璃） ===== */
.cta-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.7);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(0, 0, 0, 0.05);
  padding: 16rpx 28rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

@supports not ((-webkit-backdrop-filter: blur(20px)) or (backdrop-filter: blur(20px))) {
  .cta-bar {
    background: rgba(255, 255, 255, 0.85);
  }
}

.cta-row {
  display: flex;
  gap: 20rpx;
}

.cta-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: none;
  line-height: 80rpx;
}

.cta-btn::after {
  border: none;
}

/* 黑色主按钮 */
.cta-primary {
  background: #000;
}

.cta-primary-full {
  background: #000;
  flex: 1;
}

.cta-primary-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}

/* 边框按钮 */
.cta-outline {
  background: transparent;
  border: 2rpx solid #000;
}

.cta-outline-text {
  font-size: 28rpx;
  color: #000;
  font-weight: 500;
}

/* ===== Unlock Premium 弹窗 ===== */
.unlock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  gap: 20rpx;
}

.unlock-icon-wrapper {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unlock-crown {
  font-size: 44rpx;
  color: #fff;
}

.unlock-desc {
  font-size: 26rpx;
  color: #666;
  text-align: center;
  line-height: 1.5;
  padding: 0 20rpx;
}

.unlock-footer {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 8rpx 0;
}

.unlock-btn-primary {
  height: 88rpx;
  background: #000;
  border-radius: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 88rpx;
}

.unlock-btn-primary::after {
  border: none;
}

.unlock-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}

.unlock-btn-cancel {
  height: 72rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 72rpx;
}

.unlock-btn-cancel::after {
  border: none;
}

.unlock-cancel-text {
  font-size: 28rpx;
  color: #999;
}

/* 联系客服按钮 */
.unlock-btn-customer {
  height: 88rpx;
  background: #fff;
  border: 1px solid #000;
  border-radius: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  line-height: 88rpx;
}

.unlock-btn-customer::after {
  border: none;
}

.unlock-customer-text {
  font-size: 28rpx;
  color: #000;
  font-weight: 500;
}

/* ===== 导航栏操作按钮 ===== */
.nav-action {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-action-icon {
  font-size: 36rpx;
  color: #333;
  font-weight: 700;
}
</style>
