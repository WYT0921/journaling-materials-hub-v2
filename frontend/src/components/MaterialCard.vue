<template>
  <view class="material-card" @tap="handleTap">
    <!-- 图片区域 -->
    <view class="card-image-wrapper">
      <image
        class="card-image"
        :src="material.imageUrl || material.thumbnailUrl"
        mode="widthFix"
        lazy-load
      />
      <!-- VIP 角标（黑底白字） -->
      <view v-if="material.isPremium" class="vip-badge">
        <text class="vip-text">VIP</text>
      </view>
    </view>

    <!-- 信息区域 -->
    <view class="card-info">
      <text class="card-title">{{ material.title }}</text>
      <view class="card-meta">
        <text class="card-category">{{ material.category }}</text>
        <text class="card-downloads">{{ material.downloadCount || 0 }} 次</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  material: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select'])

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
}

@supports not ((-webkit-backdrop-filter: blur(10px)) or (backdrop-filter: blur(10px))) {
  .material-card {
    background: rgba(255, 255, 255, 0.95);
  }
}

.card-image-wrapper {
  position: relative;
  width: 100%;
}

.card-image {
  width: 100%;
  display: block;
}

/* VIP 角标：黑底白字（左上角） */
.vip-badge {
  position: absolute;
  top: 12rpx;
  left: 12rpx;
  background: #000;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.vip-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
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
