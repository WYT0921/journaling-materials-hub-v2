<template>
  <view class="page-redeem">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="兑换会员" :show-back="true" />

    <view class="redeem-content">
      <!-- 票据 icon -->
      <view class="redeem-icon-ring">
        <text class="redeem-icon-ticket">🎫</text>
      </view>

      <text class="redeem-title">输入兑换码</text>
      <text class="redeem-subtitle">输入你的兑换码，激活会员权益</text>

      <!-- 输入框 -->
      <view class="input-wrapper" :class="{ 'input-focused': isFocused }">
        <input
          class="redeem-input"
          v-model="codeDisplay"
          placeholder="XXXX-XXXX-XXXX"
          placeholder-style="color: #ccc; letter-spacing: 2rpx;"
          maxlength="14"
          :adjust-position="false"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @input="handleInput"
        />
        <!-- 清除按钮 -->
        <view v-if="codeDisplay" class="input-clear" @tap="handleClear">
          <text class="clear-icon">×</text>
        </view>
      </view>

      <!-- 校验错误 -->
      <text v-if="errorMsg" class="input-error">{{ errorMsg }}</text>

      <!-- 兑换按钮 -->
      <button
        class="redeem-btn"
        :class="{ 'btn-loading': isSubmitting }"
        :disabled="isSubmitting"
        @tap="handleRedeem"
      >
        <text v-if="isSubmitting" class="btn-loading-icon">⟳</text>
        <text class="btn-text">{{ isSubmitting ? '验证中...' : '立即兑换' }}</text>
      </button>

      <text class="redeem-note">区分大小写，支持字母数字组合</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { activatePremium } from '../../api/redeem'
import { useUserStore } from '../../stores/user'
import GlassNavBar from '../../components/GlassNavBar.vue'

const userStore = useUserStore()

const codeDisplay = ref('')
const isFocused = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

// 格式化输入：XXXX-XXXX-XXXX
function handleInput(e) {
  let raw = e.detail.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const parts = []
  for (let i = 0; i < raw.length; i += 4) {
    parts.push(raw.slice(i, i + 4))
  }
  codeDisplay.value = parts.join('-')
  errorMsg.value = ''
}

// 清除
function handleClear() {
  codeDisplay.value = ''
  errorMsg.value = ''
}

// 提交兑换
async function handleRedeem() {
  const code = codeDisplay.value.replace(/-/g, '')
  if (code.length < 8) {
    errorMsg.value = '兑换码格式不正确，请检查后重试'
    return
  }

  isSubmitting.value = true
  errorMsg.value = ''

  try {
    const result = await activatePremium(code)
    // 兑换成功 -> 更新 token 和状态 -> 跳转结果页
    if (result.token) {
      uni.setStorageSync('token', result.token)
    }
    userStore.refreshPremiumStatus()
    userStore.refreshProfile()

    uni.redirectTo({
      url: `/pages/redeem/result?status=success&code=${code}&expire=${result.expireTime || ''}`
    })
  } catch (err) {
    // 兑换失败 -> 跳转结果页
    uni.redirectTo({
      url: `/pages/redeem/result?status=fail&reason=${encodeURIComponent(err.message || '兑换失败')}`
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.page-redeem {
  min-height: 100vh;
}

.redeem-content {
  padding: 60rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 票据 icon */
.redeem-icon-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.redeem-icon-ticket {
  font-size: 56rpx;
}

.redeem-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.redeem-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 48rpx;
}

/* 输入框 */
.input-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 0 24rpx;
  height: 88rpx;
  border: 2rpx solid transparent;
  transition: background 0.2s, border-color 0.2s;
  margin-bottom: 12rpx;
}

.input-focused {
  background: #fff;
  border-color: #000;
}

.redeem-input {
  flex: 1;
  height: 88rpx;
  font-size: 30rpx;
  color: #333;
  letter-spacing: 4rpx;
  background: transparent;
}

.input-clear {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ddd;
}

.clear-icon {
  font-size: 28rpx;
  color: #fff;
}

.input-error {
  font-size: 24rpx;
  color: #ff4d4f;
  align-self: flex-start;
  margin-bottom: 24rpx;
}

/* 兑换按钮 */
.redeem-btn {
  width: 100%;
  height: 88rpx;
  background: #000;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: none;
  padding: 0;
  margin-top: 32rpx;
  line-height: 88rpx;
}

.redeem-btn::after { border: none; }

.redeem-btn[disabled] {
  opacity: 0.5;
}

.btn-loading-icon {
  font-size: 32rpx;
  color: #fff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}

.redeem-note {
  font-size: 22rpx;
  color: #ccc;
  margin-top: 24rpx;
}
</style>
