<template>
  <view class="material-card" :class="cardClass" :aria-label="material.title" hover-class="material-card--pressed" @tap="handleTap">
    <!-- 图片区域 -->
    <view class="card-image-wrapper">
      <image
        class="card-image"
        :src="displayImage"
        mode="aspectFit"
        lazy-load
      />
      <view v-if="material.mediaType === 'animated_gif'" class="dynamic-badge"><text>GIF</text></view>
    </view>

    <!-- 信息区域 -->
    <view v-if="layout !== 'compact'" class="card-info">
      <text class="card-title">{{ material.title }}</text>
      <view class="card-meta">
        <text class="card-category">{{ material.category }}</text>
        <text class="card-downloads">{{ material.downloadCount || 0 }} 次</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  material: {
    type: Object,
    required: true
  },
  layout: {
    type: String,
    default: 'grid'
  }
})

const emit = defineEmits(['select'])

const displayImage = computed(() => props.material.thumbnailUrl || props.material.imageUrl)

const cardClass = computed(() => ({
  'material-card-wide': props.layout === 'wide',
  'material-card-compact': props.layout === 'compact',
  'material-card-bundle': props.material.materialType === 'bundle'
}))

const handleTap = () => {
  emit('select', props.material)
}
</script>

<style lang="scss" scoped>
.material-card {
  /* 半透明毛玻璃卡片 */
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  overflow: hidden;
  /* 1px 极淡边框，零阴影 */
  border: 1rpx solid #EEEEEE;
  margin-bottom: 18rpx;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.material-card--pressed {
  opacity: 0.76;
}

@supports not ((-webkit-backdrop-filter: blur(10px)) or (backdrop-filter: blur(10px))) {
  .material-card {
    background: rgba(255, 255, 255, 0.95);
  }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 320rpx;
  background: #fff;
  overflow: hidden;
}

.dynamic-badge { position:absolute; right:12rpx; bottom:12rpx; padding:4rpx 12rpx; border-radius:999rpx; background:rgba(0,0,0,.78); color:#fff; font-size:20rpx; line-height:1.5; }

.card-image {
  width: 100%;
  height: 100%;
  display: block;
}

.material-card-bundle .card-image-wrapper {
  height: 360rpx;
}

.material-card-wide .card-image-wrapper {
  height: 560rpx;
}

.material-card-compact {
  margin-bottom: 0;
  border-radius: 18rpx;
  background: rgba(255, 253, 247, 0.72);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-color: rgba(126, 139, 116, 0.14);
  box-shadow: 0 8rpx 22rpx rgba(91, 105, 83, 0.06);
}

.material-card-compact .card-image-wrapper {
  height: auto;
  aspect-ratio: 1;
  background: linear-gradient(145deg, rgba(255, 254, 250, 0.96), rgba(244, 247, 236, 0.9));
  box-shadow: inset 0 0 32rpx rgba(137, 154, 120, 0.05);
}

.material-card-compact .dynamic-badge {
  font-size: 18rpx;
}

.card-info {
  padding: 16rpx 14rpx 14rpx;
}

.card-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
}

.card-category {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.card-downloads {
  font-size: 22rpx;
  color: #999;
}
</style>
