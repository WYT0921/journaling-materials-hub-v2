<template>
  <view class="tabbar-host">
    <view class="custom-tabbar safe-area-bottom">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: current === index }"
        @tap="handleTabTap(index)"
      >
        <text v-if="tab.iconText" class="tab-icon tab-icon-text">{{ tab.iconText }}</text>
        <image
          v-else
          class="tab-icon"
          :src="current === index ? tab.activeIcon : tab.icon"
          mode="aspectFit"
        />
        <text class="tab-label">{{ tab.text }}</text>
      </view>
    </view>
    <view class="tabbar-placeholder safe-area-bottom" />
  </view>
</template>

<script setup>
const props = defineProps({
  current: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change'])

const tabs = [
  {
    text: '首页',
    icon: '/static/icons/home.png',
    activeIcon: '/static/icons/home-active.png',
    pagePath: '/pages/index/index'
  },
  {
    text: '工具',
    icon: '/static/icons/tools.png',
    activeIcon: '/static/icons/tools-active.png',
    pagePath: '/pages/tools/tools'
  },
  {
    text: '我的',
    icon: '/static/icons/profile.png',
    activeIcon: '/static/icons/profile-active.png',
    pagePath: '/pages/profile/profile'
  }
]

function handleTabTap(index) {
  if (index === props.current) return
  emit('change', index)
  uni.switchTab({ url: tabs[index].pagePath })
}
</script>

<style scoped>
.custom-tabbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100rpx;
  box-sizing: content-box;
  /* 毛玻璃效果 + fallback */
  background: rgba(238, 239, 232, 0.94);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  /* 顶部细线 */
  border-top: 0.5px solid rgba(143, 188, 147, 0.32);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 900;
}

.tabbar-placeholder {
  height: 100rpx;
  box-sizing: content-box;
}

@supports not ((-webkit-backdrop-filter: blur(20px)) or (backdrop-filter: blur(20px))) {
  .custom-tabbar {
    background: #eeefe8;
  }
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  padding: 8rpx 0;
}

.tab-icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 4rpx;
}

.tab-label {
  font-size: 20rpx;
  color: #777d79;
  line-height: 1.2;
  font-weight: 400;
}

.tab-item.active .tab-label {
  color: #4f7356;
  font-weight: 700;
}
</style>
