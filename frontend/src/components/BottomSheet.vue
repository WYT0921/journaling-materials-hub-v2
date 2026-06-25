<template>
  <!-- 遮罩层 -->
  <view
    v-if="visible"
    class="bottomsheet-overlay"
    :class="{ 'bottomsheet-overlay-show': visible }"
    @tap="handleOverlayTap"
  />

  <!-- 面板 -->
  <view
    v-if="visible"
    class="bottomsheet-panel"
    :class="{ 'bottomsheet-panel-show': visible }"
  >
    <!-- 把手条 -->
    <view class="bottomsheet-handle-bar">
      <view class="bottomsheet-handle" />
    </view>

    <!-- 标题行 -->
    <view v-if="title || $slots.header" class="bottomsheet-header">
      <text class="bottomsheet-title">{{ title }}</text>
      <view v-if="$slots.header" class="bottomsheet-header-right">
        <slot name="header" />
      </view>
    </view>

    <!-- 内容区 -->
    <view class="bottomsheet-content">
      <slot />
    </view>

    <!-- 底部按钮区 -->
    <view v-if="$slots.footer" class="bottomsheet-footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  maskClosable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:visible', 'close'])

function handleOverlayTap() {
  if (props.maskClosable) {
    emit('update:visible', false)
    emit('close')
  }
}

function close() {
  emit('update:visible', false)
  emit('close')
}

defineExpose({ close })
</script>

<style scoped>
/* 遮罩 */
.bottomsheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 900;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.bottomsheet-overlay-show {
  opacity: 1;
}

/* 面板 */
.bottomsheet-panel {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 901;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.bottomsheet-panel-show {
  transform: translateY(0);
}

/* 把手 */
.bottomsheet-handle-bar {
  display: flex;
  justify-content: center;
  padding: 16rpx 0 8rpx;
}

.bottomsheet-handle {
  width: 64rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #ddd;
}

/* 标题 */
.bottomsheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 32rpx 16rpx;
}

.bottomsheet-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.bottomsheet-header-right {
  display: flex;
  align-items: center;
}

/* 内容区（可滚动） */
.bottomsheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 32rpx 32rpx;
}

/* 底部按钮区 */
.bottomsheet-footer {
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 0.5px solid rgba(0, 0, 0, 0.05);
}
</style>
