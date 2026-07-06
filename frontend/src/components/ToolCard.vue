<template>
  <view class="tool-card">
    <!-- 图标 -->
    <view class="tool-icon-circle">
      <text class="tool-icon-emoji">{{ tool.icon }}</text>
    </view>

    <!-- 名称+描述 -->
    <text class="tool-name">{{ tool.name }}</text>
    <text class="tool-desc">{{ tool.description }}</text>

    <!-- 复制链接按钮 -->
    <view class="tool-copy-btn" @tap.stop="handleCopy">
      <text class="copy-btn-text">复制链接</text>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  tool: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['copy'])

function handleCopy() {
  emit('copy', props.tool)
}
</script>

<style scoped>
.tool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  border: 1rpx solid #eee;
  margin-bottom: 20rpx;
}

@supports not ((-webkit-backdrop-filter: blur(10px)) or (backdrop-filter: blur(10px))) {
  .tool-card {
    background: rgba(255, 255, 255, 0.95);
  }
}

/* 图标圆底 */
.tool-icon-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.tool-icon-emoji {
  font-size: 36rpx;
}

.tool-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-bottom: 4rpx;
  line-height: 1.3;
}

.tool-desc {
  font-size: 22rpx;
  color: #999;
  text-align: center;
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 复制链接胶囊按钮 */
.tool-copy-btn {
  padding: 10rpx 28rpx;
  border-radius: 100rpx;
  border: 1rpx solid #ddd;
  background: transparent;
}

.tool-copy-btn:active {
  background: #f5f5f5;
}

.copy-btn-text {
  font-size: 22rpx;
  color: #666;
}
</style>
