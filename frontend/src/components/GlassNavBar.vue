<template>
  <view class="navbar-host">
    <view
      class="glass-navbar"
      :style="{ paddingTop: statusBarHeight + 'px' }"
    >
      <view class="navbar-inner">
        <!-- 左侧：返回按钮 -->
        <view v-if="showBack" class="navbar-left" @tap="handleBack">
          <view class="navbar-back-icon">
            <text class="icon-arrow">‹</text>
          </view>
          <text v-if="backText" class="navbar-back-text">{{ backText }}</text>
        </view>

        <!-- 中间：标题 -->
        <view class="navbar-center">
          <text class="navbar-title">{{ title }}</text>
        </view>

        <!-- 右侧：操作区域（插槽） -->
        <view v-if="$slots.right" class="navbar-right">
          <slot name="right" />
        </view>
      </view>
    </view>
    <view
      class="navbar-placeholder"
      :style="{ paddingTop: statusBarHeight + 'px' }"
    />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: false
  },
  backText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['back'])
const statusBarRef = ref(44) // 默认值 44px

onMounted(() => {
  // 获取状态栏高度
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarRef.value = systemInfo.statusBarHeight || 44
  } catch (e) {
    statusBarRef.value = 44
  }
})

const statusBarHeight = statusBarRef

function handleBack() {
  emit('back')
  uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/index/index' }) })
}
</script>

<style scoped>
.glass-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 900;
  width: 100%;
  box-sizing: border-box;
}

.navbar-placeholder {
  height: 88rpx;
  width: 100%;
  box-sizing: content-box;
}

.navbar-inner {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 16rpx;
  position: relative;
  box-sizing: border-box;
  /* 毛玻璃效果 + fallback */
  background: rgba(238, 239, 232, 0.88);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  /* 底部细线 */
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

@supports not ((-webkit-backdrop-filter: blur(20px)) or (backdrop-filter: blur(20px))) {
  .navbar-inner {
    background: rgba(238, 239, 232, 0.97);
  }
}

.navbar-left {
  display: flex;
  align-items: center;
  min-width: 120rpx;
  height: 100%;
  padding-left: 8rpx;
  z-index: 2;
}

.navbar-back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.03);
}

.icon-arrow {
  font-size: 44rpx;
  color: #333;
  line-height: 1;
  font-weight: 300;
}

.navbar-back-text {
  font-size: 26rpx;
  color: #666;
  margin-left: 4rpx;
}

.navbar-center {
  position: absolute;
  left: 144rpx;
  right: 144rpx;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  z-index: 1;
}

.navbar-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 120rpx;
  justify-content: flex-end;
  padding-right: 8rpx;
  margin-left: auto;
  z-index: 2;
}
</style>
