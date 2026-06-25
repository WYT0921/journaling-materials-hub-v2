<template>
  <view class="empty-state">
    <image
      v-if="image"
      class="empty-image"
      :src="image"
      mode="aspectFit"
    />
    <text v-else class="empty-icon">📭</text>
    <text class="empty-text">{{ text || '暂无数据' }}</text>
    <button
      v-if="showRetry"
      class="retry-button"
      @tap="handleRetry"
    >
      <text class="retry-text">重试</text>
    </button>
  </view>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '暂无数据'
  },
  image: {
    type: String,
    default: ''
  },
  showRetry: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['retry'])

const handleRetry = () => {
  emit('retry')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
  opacity: 0.6;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 32rpx;
}

.retry-button {
  background: #ffffff;
  border: 2rpx solid #333333;
  border-radius: 8rpx;
  padding: 16rpx 48rpx;
}

.retry-text {
  font-size: 28rpx;
  color: #333333;
}
</style>
