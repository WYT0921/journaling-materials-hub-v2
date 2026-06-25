<template>
  <view class="loading-spinner" v-if="loading">
    <view class="spinner"></view>
    <text class="loading-text" v-if="text">{{ text }}</text>
  </view>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #f0f0f0;
  border-top: 4rpx solid #333333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 24rpx;
  color: #999999;
  margin-top: 16rpx;
}
</style>
