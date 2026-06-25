<template>
  <view class="icon-picker">
    <!-- 当前选中预览 -->
    <view class="picker-trigger" @tap="showGrid = !showGrid">
      <view class="picker-selected-icon">
        <text class="picker-icon-emoji">{{ selectedIcon || '📁' }}</text>
      </view>
      <text class="picker-label">{{ selectedIcon ? '点击更换图标' : '选择图标' }}</text>
      <text class="picker-arrow">{{ showGrid ? '▲' : '▼' }}</text>
    </view>

    <!-- 图标网格 -->
    <view v-if="showGrid" class="icon-grid">
      <view
        v-for="(icon, index) in icons"
        :key="index"
        class="icon-item"
        :class="{ selected: selectedIcon === icon }"
        @tap="handleSelect(icon)"
      >
        <text class="icon-emoji">{{ icon }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const showGrid = ref(false)
const selectedIcon = ref(props.modelValue)

// 24 个常用图标（emoji 表示，实际可替换为图标字体）
const icons = [
  '🎨', '📝', '🖼️', '🎯',
  '🌈', '🔤', '✒️', '📷',
  '🔧', '⚙️', '💡', '⭐',
  '📐', '🖌️', '✂️', '📎',
  '🗂️', '📊', '🔄', '🔗',
  '💎', '🏆', '🎵', '🌿'
]

function handleSelect(icon) {
  selectedIcon.value = icon
  emit('update:modelValue', icon)
  showGrid.value = false
}

function reset() {
  selectedIcon.value = ''
}

defineExpose({ reset })
</script>

<style scoped>
.icon-picker {
  margin-bottom: 16rpx;
}

.picker-trigger {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
}

.picker-selected-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-icon-emoji {
  font-size: 32rpx;
}

.picker-label {
  flex: 1;
  font-size: 26rpx;
  color: #666;
}

.picker-arrow {
  font-size: 20rpx;
  color: #999;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12rpx;
  padding: 20rpx 0;
}

.icon-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.icon-item.selected {
  background: #000;
  border-color: #000;
}

.icon-item:active {
  background: #ddd;
}

.icon-item.selected .icon-emoji {
  color: #fff;
}

.icon-emoji {
  font-size: 32rpx;
}
</style>
