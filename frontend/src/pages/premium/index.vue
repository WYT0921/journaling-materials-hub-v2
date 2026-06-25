<template>
  <view class="page-premium">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="会员中心" :show-back="true" />

    <view class="premium-content">
      <!-- ===== 未开通状态 ===== -->
      <view v-if="!userStore.isPremium" class="not-activated">
        <!-- 顶部 icon -->
        <view class="premium-icon-ring">
          <text class="premium-icon-crown">👑</text>
        </view>

        <text class="premium-title">解锁会员权益</text>
        <text class="premium-subtitle">畅享全部高清素材与创作工具</text>

        <!-- 权益列表 -->
        <view class="benefits-list">
          <view class="benefit-item">
            <view class="benefit-dot" />
            <text class="benefit-text">全量高清素材下载</text>
          </view>
          <view class="benefit-divider" />
          <view class="benefit-item">
            <view class="benefit-dot" />
            <text class="benefit-text">全部创作工具开放</text>
          </view>
          <view class="benefit-divider" />
          <view class="benefit-item">
            <view class="benefit-dot" />
            <text class="benefit-text">优先获取新素材更新</text>
          </view>
          <view class="benefit-divider" />
          <view class="benefit-item">
            <view class="benefit-dot" />
            <text class="benefit-text">专属会员身份标识</text>
          </view>
        </view>

        <!-- 前往兑换按钮 -->
        <button class="go-redeem-btn" @tap="handleGoRedeem">
          <text class="go-redeem-text">前往兑换</text>
        </button>
        <text class="redeem-hint">使用兑换码激活会员，无需付费</text>
      </view>

      <!-- ===== 已开通状态 ===== -->
      <view v-else class="activated">
        <!-- 顶部 icon（正负形对比） -->
        <view class="premium-icon-ring activated-ring">
          <text class="premium-icon-crown activated-crown">👑</text>
        </view>

        <text class="premium-title activated-title">已开通会员</text>
        <text v-if="memberExpire" class="premium-expire">有效期至 {{ memberExpire }}</text>

        <!-- 2x2 权益网格 -->
        <view class="benefits-grid">
          <view class="benefit-grid-item">
            <view class="grid-dot" />
            <text class="grid-text">高清素材</text>
          </view>
          <view class="benefit-grid-item">
            <view class="grid-dot" />
            <text class="grid-text">全部工具</text>
          </view>
          <view class="benefit-grid-item">
            <view class="grid-dot" />
            <text class="grid-text">优先更新</text>
          </view>
          <view class="benefit-grid-item">
            <view class="grid-dot" />
            <text class="grid-text">专属标识</text>
          </view>
        </view>

        <!-- 续费按钮 -->
        <button class="renew-btn" @tap="handleGoRedeem">
          <text class="renew-text">续费 / 升级</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '../../stores/user'
import GlassNavBar from '../../components/GlassNavBar.vue'

const userStore = useUserStore()

const memberExpire = computed(() => {
  const expireTime = userStore.userInfo?.memberExpireTime
  if (!expireTime) return ''
  const d = new Date(expireTime)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function handleGoRedeem() {
  uni.navigateTo({ url: '/pages/redeem/index' })
}
</script>

<style scoped>
.page-premium {
  min-height: 100vh;
}

.premium-content {
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ===== 未开通 ===== */
.not-activated {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.premium-icon-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.premium-icon-crown {
  font-size: 56rpx;
}

.premium-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.premium-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

/* 权益列表 */
.benefits-list {
  width: 100%;
  background: rgba(255,255,255,0.9);
  border-radius: 16rpx;
  border: 1rpx solid #eee;
  padding: 8rpx 0;
  margin-bottom: 40rpx;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 28rpx;
}

.benefit-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #333;
  flex-shrink: 0;
}

.benefit-text {
  font-size: 28rpx;
  color: #333;
}

.benefit-divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 0 28rpx;
}

/* 前往兑换按钮 */
.go-redeem-btn {
  width: 100%;
  height: 88rpx;
  background: #000;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  margin: 0;
  line-height: 88rpx;
}

.go-redeem-btn::after { border: none; }

.go-redeem-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}

.redeem-hint {
  font-size: 22rpx;
  color: #bbb;
  margin-top: 20rpx;
}

/* ===== 已开通 ===== */
.activated {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.activated-ring {
  background: #000;
}

.activated-crown {
}

.activated-title {
  margin-bottom: 8rpx;
}

.premium-expire {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 40rpx;
}

/* 2x2 权益网格 */
.benefits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  width: 100%;
  margin-bottom: 40rpx;
}

.benefit-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 36rpx 20rpx;
  background: rgba(255,255,255,0.9);
  border-radius: 16rpx;
  border: 1rpx solid #eee;
}

.grid-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #fff;
  border: 2rpx solid #333;
}

.grid-text {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

/* 续费按钮 */
.renew-btn {
  width: 100%;
  height: 88rpx;
  background: transparent;
  border: 2rpx solid #000;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 88rpx;
  padding: 0;
  margin: 0;
}

.renew-btn::after { border: none; }

.renew-text {
  font-size: 28rpx;
  color: #000;
  font-weight: 500;
}
</style>
