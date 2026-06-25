<template>
  <view>
    <!-- 全局浮动星星背景 -->
    <view class="stars-container">
      <view class="star star-1"></view>
      <view class="star star-2"></view>
      <view class="star star-3"></view>
      <view class="star star-4"></view>
      <view class="star star-5"></view>
      <view class="star star-6"></view>
      <view class="star star-7"></view>
      <view class="star star-8"></view>
      <view class="star star-9"></view>
      <view class="star star-10"></view>
      <view class="star star-11"></view>
      <view class="star star-12"></view>
    </view>
    <!-- 页面内容插槽 -->
    <slot />
  </view>
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from './stores/user'

onLaunch(() => {
  console.log('App Launch')
  // 检查登录状态
  const userStore = useUserStore()
  userStore.checkLoginStatus()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style>
/* ===== 全局样式 ===== */
page {
  /* 梦幻粉绿渐变背景 */
  background: linear-gradient(135deg, #fef5f8 0%, #f5fdf5 50%, #fff8f0 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
  min-height: 100vh;
}

/* ===== 浮动星星动画 ===== */
.stars-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.star {
  position: absolute;
  border-radius: 50%;
  animation: floatStar 4s ease-in-out infinite;
}

/* 12 颗星星：不同位置、大小、颜色、延迟 */
.star-1  { width: 12rpx; height: 12rpx; top: 8%;   left: 15%;  background: #E8C4D4; animation-delay: 0s;    animation-duration: 4.2s; }
.star-2  { width: 16rpx; height: 16rpx; top: 15%;  left: 75%;  background: #C8E6C9; animation-delay: 0.6s;  animation-duration: 3.8s; }
.star-3  { width: 10rpx; height: 10rpx; top: 28%;  left: 40%;  background: #E8C4D4; animation-delay: 1.2s;  animation-duration: 4.5s; }
.star-4  { width: 18rpx; height: 18rpx; top: 40%;  left: 85%;  background: #C8E6C9; animation-delay: 0.3s;  animation-duration: 3.5s; }
.star-5  { width: 8rpx;  height: 8rpx;  top: 52%;  left: 10%;  background: #E8C4D4; animation-delay: 1.8s;  animation-duration: 4.8s; }
.star-6  { width: 14rpx; height: 14rpx; top: 60%;  left: 55%;  background: #C8E6C9; animation-delay: 0.9s;  animation-duration: 3.2s; }
.star-7  { width: 10rpx; height: 10rpx; top: 72%;  left: 30%;  background: #E8C4D4; animation-delay: 2.1s;  animation-duration: 4.0s; }
.star-8  { width: 20rpx; height: 20rpx; top: 82%;  left: 70%;  background: #C8E6C9; animation-delay: 0.4s;  animation-duration: 3.6s; }
.star-9  { width: 6rpx;  height: 6rpx;  top: 10%;  left: 50%;  background: #E8C4D4; animation-delay: 1.5s;  animation-duration: 5.0s; }
.star-10 { width: 14rpx; height: 14rpx; top: 35%;  left: 5%;   background: #C8E6C9; animation-delay: 2.5s;  animation-duration: 3.4s; }
.star-11 { width: 8rpx;  height: 8rpx;  top: 68%;  left: 90%;  background: #E8C4D4; animation-delay: 0.8s;  animation-duration: 4.6s; }
.star-12 { width: 12rpx; height: 12rpx; top: 90%;  left: 45%;  background: #C8E6C9; animation-delay: 1.9s;  animation-duration: 3.9s; }

@keyframes floatStar {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.6;
  }
  25% {
    opacity: 1;
  }
  50% {
    transform: translateY(-30rpx) rotate(180deg);
    opacity: 0.8;
  }
  75% {
    opacity: 1;
  }
}

/* ===== 通用样式 ===== */
.container {
  padding: 20rpx;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 安全区域 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
