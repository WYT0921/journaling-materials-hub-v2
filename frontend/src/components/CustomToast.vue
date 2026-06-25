<template>
  <view v-if="show" class="custom-toast">
    <view class="toast-content">
      <!-- 图标 -->
      <text v-if="iconType === 'check'" class="toast-icon toast-icon-check">✓</text>
      <text v-else-if="iconType === 'error'" class="toast-icon toast-icon-error">✕</text>
      <!-- 文字 -->
      <text class="toast-message">{{ message }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '', // 'check' | 'error' | ''
  },
  duration: {
    type: Number,
    default: 2000
  }
})

const show = ref(false)
const iconType = ref('')

let timer = null

watch(() => props.message, (val) => {
  if (val) {
    showToast(val, props.icon, props.duration)
  }
})

function showToast(msg, icon = '', duration = 2000) {
  clearTimeout(timer)
  iconType.value = icon
  show.value = true
  timer = setTimeout(() => {
    show.value = false
  }, duration)
}

// 外部调用
defineExpose({ showToast })
</script>

<style scoped>
.custom-toast {
  position: fixed;
  left: 50%;
  bottom: 280rpx;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
  animation: toastFadeIn 0.25s ease;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 40rpx;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 100rpx;
  white-space: nowrap;
}

.toast-icon {
  font-size: 32rpx;
  font-weight: 700;
}

.toast-icon-check {
  color: #52c41a;
}

.toast-icon-error {
  color: #ff4d4f;
}

.toast-message {
  font-size: 26rpx;
  color: #fff;
  line-height: 1.4;
}

@keyframes toastFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
