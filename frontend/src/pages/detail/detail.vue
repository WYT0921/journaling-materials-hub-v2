<template>
  <view class="page-detail">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="素材详情" :show-back="true">
      <template #right>
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

        <!-- 权限角标 -->
        <view v-if="material.isPremium" class="vip-corner-badge">
          <text class="vip-corner-text">权限素材</text>
        </view>
      </view>

      <!-- 信息区域 -->
      <view class="info-section">
        <!-- 分类标签 -->
        <view class="info-tags">
          <text class="info-category info-type">{{ getMaterialTypeLabel(material.materialType) }}</text>
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

        <!-- 收藏按钮 -->
        <button
          class="favorite-action"
          :class="{ 'favorite-action-active': isFavorited }"
          @tap="handleToggleFavorite"
        >
          <text class="favorite-action-icon">{{ isFavorited ? '❤' : '♡' }}</text>
          <text class="favorite-action-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
        </button>

        <button
          v-if="material.materialType === 'single'"
          class="collage-action"
          @tap="handleCollage"
        >
          <text class="collage-action-icon">✦</text>
          <text class="collage-action-text">自由拼贴</text>
        </button>

        <!-- 描述 -->
        <text v-if="material.description" class="material-desc">{{ material.description }}</text>

        <!-- 标签 -->
        <view v-if="displayTags.length" class="tags-wrapper">
          <view v-for="(tag, index) in displayTags" :key="index" class="tag-item">
            <text class="tag-text">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 相关推荐 -->
      <view v-if="relatedMaterials.length > 0" class="related-section">
        <view class="section-header">
          <text class="section-title">相关推荐</text>
        </view>
        <scroll-view scroll-x class="related-scroll" :show-scrollbar="false">
          <view
            v-for="item in relatedMaterials"
            :key="item.id"
            class="related-item"
            @click="goToDetail(item.id)"
          >
            <image
              class="related-image"
              :src="item.thumbnailUrl || item.imageUrl"
              mode="aspectFill"
            />
            <text class="related-title">{{ item.title }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 底部安全区（给CTA栏让位） -->
      <view class="bottom-spacer" />
    </view>

    <!-- 错误状态 -->
    <EmptyState v-else text="素材不存在或已下架" />

    <!-- 底部 CTA 栏（毛玻璃） -->
    <view v-if="material" class="cta-bar safe-area-bottom">
      <!-- 未激活权限：双按钮 — 5 次免费额度内可下载 -->
      <view v-if="!userStore.isPremium" class="cta-row">
        <view class="quota-pill">
          <text class="quota-text">{{ quotaText }}</text>
        </view>
        <button class="cta-btn cta-outline" @tap="handlePreview">
          <text class="cta-outline-text">👁 预览</text>
        </button>
        <button class="cta-btn cta-primary" @tap="handleDownload">
          <text class="cta-primary-text">下载素材</text>
        </button>
      </view>
      <!-- 已激活权限：单按钮 -->
      <view v-else class="cta-row">
        <button class="cta-btn cta-primary-full" @tap="handleDownload">
          <text class="cta-primary-text">下载素材</text>
        </button>
      </view>
    </view>

    <!-- 素材权限半屏弹窗 -->
    <BottomSheet
      v-model:visible="showUnlockSheet"
      title="激活素材权限"
    >
      <view class="unlock-content">
        <view class="unlock-icon-wrapper">
          <text class="unlock-crown">✓</text>
        </view>
        <text class="unlock-desc">免费 5 次保存额度已用完，输入通行码后即可继续保存高清素材</text>
      </view>
      <template #footer>
        <view class="unlock-footer">
          <button class="unlock-btn-primary" @tap="handleGoRedeem">
            <text class="unlock-btn-text">输入通行码</text>
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
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { useCollageStore } from '../../stores/collage'
import { getMaterialDetail, getMaterials } from '../../api/material'
import { downloadMaterial } from '../../api/download'
import { toggleFavorite, checkFavorite } from '../../api/favorite'
import { requireLogin } from '../../utils/auth'
import GlassNavBar from '../../components/GlassNavBar.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import BottomSheet from '../../components/BottomSheet.vue'

const userStore = useUserStore()
const collageStore = useCollageStore()

const materialId = ref(null)
const material = ref(null)
const isLoading = ref(true)
const showUnlockSheet = ref(false)
const isFavorited = ref(false)
const relatedMaterials = ref([])

const TECHNICAL_TAG_PREFIXES = ['json:', 'seed:', 'canvas:', 'pos:', 'size:', 'rot:', 'output:']
const FREE_DOWNLOAD_LIMIT = 5

const getMaterialTypeLabel = (materialType) => {
  return materialType === 'bundle' ? '合并素材' : '单个素材'
}

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags
  }

  if (typeof tags !== 'string') {
    return []
  }

  const trimmed = tags.trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [trimmed]
  }
}

const displayTags = computed(() => {
  const hiddenTags = new Set([
    material.value?.category,
    getMaterialTypeLabel(material.value?.materialType)
  ])

  return normalizeTags(material.value?.tags)
    .map(tag => String(tag).trim())
    .filter(tag => tag && !hiddenTags.has(tag))
    .filter(tag => !TECHNICAL_TAG_PREFIXES.some(prefix => tag.startsWith(prefix)))
    .filter((tag, index, list) => list.indexOf(tag) === index)
})

const freeDownloadUsed = computed(() => {
  const count = Number(userStore.userInfo?.downloadCount || 0)
  return Math.min(Math.max(count, 0), FREE_DOWNLOAD_LIMIT)
})

const freeDownloadRemaining = computed(() => {
  return Math.max(0, FREE_DOWNLOAD_LIMIT - freeDownloadUsed.value)
})

const quotaText = computed(() => {
  if (!userStore.isLoggedIn) {
    return `登录后可免费保存 ${FREE_DOWNLOAD_LIMIT} 次`
  }
  if (freeDownloadRemaining.value > 0) {
    return `免费素材保存次数：剩余 ${freeDownloadRemaining.value} 次`
  }
  return '免费保存次数已用完，可输入通行码继续使用'
})

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
    // 加载相关推荐
    loadRelatedMaterials()
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

// 预览按钮
const handlePreview = () => {
  handleImagePreview()
}

const openCollage = () => {
  collageStore.setPendingMaterialId(materialId.value)
  uni.switchTab({ url: '/pages/collage/index' })
}

const handleCollage = () => {
  if (!material.value || material.value.materialType !== 'single') return
  if (!requireLogin(openCollage)) return
  openCollage()
}

// 激活权限后下载
const handleUnlock = () => {
  if (!requireLogin()) return
  showUnlockSheet.value = true
}

// 加载相关推荐
const loadRelatedMaterials = async () => {
  if (!material.value?.category) return
  try {
    const params = { category: material.value.category, limit: 10, page: 1 }
    if (material.value.materialType) {
      params.materialType = material.value.materialType
    }
    const result = await getMaterials(params)
    const items = (result.list || []).filter(item => String(item.id) !== String(materialId.value))
    relatedMaterials.value = items.slice(0, 6)
  } catch (error) {
    console.error('加载相关推荐失败:', error)
  }
}

// 跳转到其他素材详情
const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}

// 跳转通行码页
const handleGoRedeem = () => {
  showUnlockSheet.value = false
  uni.navigateTo({ url: '/pages/redeem/index' })
}

// 联系客服
const handleContactService = () => {
  showUnlockSheet.value = false
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

// 下载素材
const handleDownload = async () => {
  if (!requireLogin()) return

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
      if (!userStore.isPremium && typeof result.freeDownloadUsed === 'number' && userStore.userInfo) {
        userStore.userInfo.downloadCount = result.freeDownloadUsed
      }
      if (!userStore.isPremium) {
        await userStore.refreshProfile()
      }
    } else {
      throw new Error('下载失败')
    }
  } catch (error) {
    console.error('下载失败:', error)
    if (error.code === 4004) {
      showUnlockSheet.value = true
      return
    }
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

/* 权限角标（左上角黑底白字） */
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

.info-type {
  color: #333;
  border-color: #ddd;
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

.favorite-action {
  width: 100%;
  min-height: 96rpx;
  margin: 24rpx 0 0;
  padding: 0 28rpx;
  border: none;
  border-radius: 18rpx;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  line-height: 96rpx;
}

.favorite-action::after {
  border: none;
}

.favorite-action-active {
  background: #fff4f4;
}

.favorite-action-icon {
  font-size: 34rpx;
  color: #111;
  font-weight: 700;
}

.favorite-action-active .favorite-action-icon {
  color: #e04444;
}

.favorite-action-text {
  font-size: 28rpx;
  color: #111;
  font-weight: 600;
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

/* ===== 相关推荐 ===== */
.related-section {
  padding: 0 28rpx 32rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111;
}

.related-scroll {
  white-space: nowrap;
  width: 100%;
}

.related-item {
  display: inline-block;
  width: 200rpx;
  margin-right: 16rpx;
  vertical-align: top;
}

.related-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  display: block;
}

.related-title {
  font-size: 24rpx;
  color: #333;
  margin-top: 10rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  white-space: normal;
  line-height: 1.4;
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
  flex-wrap: wrap;
}

.quota-pill {
  width: 100%;
  min-height: 44rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.quota-text {
  font-size: 22rpx;
  color: #666;
  line-height: 1.4;
  text-align: center;
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

/* ===== 素材权限弹窗 ===== */
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

.collage-action {
  width: 100%;
  height: 84rpx;
  margin: 20rpx 0 0;
  border: 1rpx solid #111;
  border-radius: 42rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.collage-action::after { border: none; }
.collage-action-icon { color: #111; font-size: 30rpx; }
.collage-action-text { color: #111; font-size: 28rpx; font-weight: 600; }
</style>
