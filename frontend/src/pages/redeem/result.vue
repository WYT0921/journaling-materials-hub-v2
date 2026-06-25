<template>
  <view class="page-result">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="兑换结果" :show-back="true" />

    <view class="result-content">
      <!-- ===== 成功态 ===== -->
      <view v-if="isSuccess" class="result-success">
        <view class="result-icon-ring success-ring">
          <text class="result-icon-check">✓</text>
        </view>

        <text class="result-title success-title">兑换成功</text>
        <text class="result-subtitle">会员权益已激活，感谢你的支持</text>

        <!-- 信息卡片 -->
        <view class="info-card">
          <view class="info-row">
            <text class="info-label">兑换码</text>
            <text class="info-value">{{ formattedCode }}</text>
          </view>
          <view class="info-divider" />
          <view class="info-row">
            <text class="info-label">会员类型</text>
            <text class="info-value">年卡会员</text>
          </view>
          <view class="info-divider" />
          <view class="info-row">
            <text class="info-label">有效期至</text>
            <text class="info-value">{{ expireDate }}</text>
          </view>
        </view>

        <!-- 按钮 -->
        <button class="action-btn primary-btn" @tap="handleGoPremium">
          <text class="primary-btn-text">前往会员中心</text>
        </button>
        <button class="action-btn outline-btn" @tap="handleGoHome">
          <text class="outline-btn-text">返回首页</text>
        </button>
      </view>

      <!-- ===== 失败态 ===== -->
      <view v-else class="result-fail">
        <view class="result-icon-ring fail-ring">
          <text class="result-icon-fail">✕</text>
        </view>

        <text class="result-title fail-title">兑换失败</text>
        <text class="result-subtitle">{{ failReason || '兑换码无效，请检查后重试' }}</text>

        <!-- 原因卡片 -->
        <view class="reason-card">
          <view class="reason-item">
            <view class="reason-dot" />
            <text class="reason-text">输入有误，请核对后重新输入</text>
          </view>
          <view class="reason-divider" />
          <view class="reason-item">
            <view class="reason-dot" />
            <text class="reason-text">兑换码已过期</text>
          </view>
          <view class="reason-divider" />
          <view class="reason-item">
            <view class="reason-dot" />
            <text class="reason-text">兑换码已被使用</text>
          </view>
        </view>

        <!-- 按钮 -->
        <button class="action-btn primary-btn" @tap="handleRetry">
          <text class="primary-btn-text">重新输入</text>
        </button>
        <button class="action-btn outline-btn" @tap="handleGoHome">
          <text class="outline-btn-text">返回首页</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import GlassNavBar from '../../components/GlassNavBar.vue'

const isSuccess = ref(false)
const failReason = ref('')
const rawCode = ref('')
const expireDate = ref('')

onLoad((options) => {
  isSuccess.value = options.status === 'success'
  if (isSuccess.value) {
    rawCode.value = options.code || ''
    expireDate.value = options.expire
      ? options.expire.slice(0, 10)
      : '永久有效'
  } else {
    failReason.value = options.reason || '兑换码无效'
  }
})

const formattedCode = computed(() => {
  const c = rawCode.value
  if (c.length === 8) {
    return c.slice(0, 4) + '-' + c.slice(4)
  }
  return c
})

function handleGoPremium() {
  uni.redirectTo({ url: '/pages/premium/index' })
}

function handleGoHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

function handleRetry() {
  uni.navigateBack()
}
</script>

<style scoped>
.page-result {
  min-height: 100vh;
}

.result-content {
  padding: 60rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ===== 共用 ===== */
.result-icon-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.result-subtitle {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  margin-bottom: 48rpx;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  margin: 0 0 16rpx;
  line-height: 88rpx;
}

.action-btn::after { border: none; }

/* ===== 成功态 ===== */
.success-ring {
  background: #f5f5f5;
}

.result-icon-check {
  font-size: 48rpx;
  color: #000;
  font-weight: 700;
}

.success-title {
  color: #333;
}

.info-card {
  width: 100%;
  background: rgba(255,255,255,0.9);
  border-radius: 16rpx;
  border: 1rpx solid #eee;
  padding: 8rpx 0;
  margin-bottom: 40rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 28rpx;
}

.info-label {
  font-size: 26rpx;
  color: #999;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.info-divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 0 28rpx;
}

.primary-btn {
  background: #000;
}

.primary-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}

.outline-btn {
  background: transparent;
  border: 2rpx solid #ddd;
}

.outline-btn-text {
  font-size: 28rpx;
  color: #666;
}

/* ===== 失败态 ===== */
.fail-ring {
  background: #fff0f0;
}

.result-icon-fail {
  font-size: 48rpx;
  color: #ff4d4f;
  font-weight: 700;
}

.fail-title {
  color: #ff4d4f;
}

.reason-card {
  width: 100%;
  background: rgba(255,255,255,0.9);
  border-radius: 16rpx;
  border: 1rpx solid #fee;
  padding: 8rpx 0;
  margin-bottom: 40rpx;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 28rpx;
}

.reason-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ff4d4f;
  flex-shrink: 0;
}

.reason-text {
  font-size: 26rpx;
  color: #666;
}

.reason-divider {
  height: 1rpx;
  background: #fee;
  margin: 0 28rpx;
}
</style>
