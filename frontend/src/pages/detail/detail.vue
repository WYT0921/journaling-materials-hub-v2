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
        <view v-if="material.mediaType === 'animated_gif'" class="dynamic-corner-badge"><text>GIF</text></view>

      </view>

      <!-- 信息区域 -->
      <view class="info-section">
        <!-- 分类标签 -->
        <view class="info-tags">
          <text class="info-category info-type">{{ getMaterialTypeLabel(material.materialType) }}</text>
          <text v-if="material.mediaType === 'animated_gif'" class="info-category info-type">GIF</text>
          <text v-for="category in materialCategories" :key="category" class="info-category">{{ category }}</text>
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
          v-if="false"
          class="collage-action"
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
      <view class="cta-row">
        <button class="cta-btn cta-primary-full" @tap="handleDownload">
          <text class="cta-primary-text">免费下载素材</text>
        </button>
      </view>
    </view>
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
import { prepareDownloadedImage } from '../../utils/downloaded-image.mjs'
import GlassNavBar from '../../components/GlassNavBar.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'

const userStore = useUserStore()
const collageStore = useCollageStore()

const materialId = ref(null)
const material = ref(null)
const materialCategories = computed(() => material.value?.categories?.length
  ? material.value.categories
  : (material.value?.category ? [material.value.category] : []))
const isLoading = ref(true)
const isFavorited = ref(false)
const relatedMaterials = ref([])
let detailRequestVersion = 0

const TECHNICAL_TAG_PREFIXES = ['json:', 'seed:', 'canvas:', 'pos:', 'size:', 'rot:', 'output:']

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

// 页面加载
onLoad((options) => {
  if (options.id) {
    materialId.value = options.id
    loadMaterialDetail()
  }
})

// 加载素材详情（带版本号防止快速切换时旧响应覆盖新数据）
const loadMaterialDetail = async () => {
  const version = ++detailRequestVersion
  try {
    isLoading.value = true
    const result = await getMaterialDetail(materialId.value)
    if (version !== detailRequestVersion) return
    material.value = result
    // 加载相关推荐
    loadRelatedMaterials(version)
    // 检查收藏状态
    checkFavoriteStatus(version)
  } catch (error) {
    if (version !== detailRequestVersion) return
    console.error('加载素材详情失败:', error)
  } finally {
    if (version === detailRequestVersion) {
      isLoading.value = false
    }
  }
}

// 检查收藏状态
const checkFavoriteStatus = async (version = 0) => {
  try {
    const result = await checkFavorite(materialId.value)
    if (version && version !== detailRequestVersion) return
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
  if (material.value.mediaType === 'animated_gif') return
  uni.previewImage({
    urls: [material.value.imageUrl],
    current: material.value.imageUrl
  })
}

const openCollage = () => {
  collageStore.setPendingMaterialId(materialId.value)
  uni.navigateTo({ url: '/pages/collage/index' })
}

const handleCollage = () => {
  if (!material.value || material.value.materialType !== 'single') return
  if (!requireLogin(openCollage)) return
  openCollage()
}

// 加载相关推荐
const loadRelatedMaterials = async (version = 0) => {
  if (!material.value?.category) return
  try {
    const params = { category: material.value.category, limit: 10, page: 1 }
    if (material.value.materialType) {
      params.materialType = material.value.materialType
    }
    const result = await getMaterials(params)
    if (version && version !== detailRequestVersion) return
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
      let preparedImage
      try {
        preparedImage = await prepareDownloadedImage(
          downloadRes.tempFilePath,
          result.filename,
          result.mimeType
        )
        await new Promise((resolve, reject) => {
          uni.saveImageToPhotosAlbum({ filePath: preparedImage.filePath, success: resolve, fail: reject })
        })
      } catch (saveError) {
        if (material.value?.mediaType !== 'animated_gif') throw saveError
        const choice = await new Promise(resolve => uni.showModal({
          title: '当前微信无法保存动图',
          content: '可以复制原始 GIF 下载链接，在浏览器中保存。',
          confirmText: '复制链接',
          success: res => resolve(res.confirm)
        }))
        if (choice) uni.setClipboardData({ data: result.url })
        return
      } finally {
        preparedImage?.cleanup()
      }
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

.dynamic-corner-badge { position:absolute; right:24rpx; top:24rpx; z-index:2; padding:6rpx 18rpx; border-radius:999rpx; background:rgba(0,0,0,.78); color:#fff; font-size:22rpx; }

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
