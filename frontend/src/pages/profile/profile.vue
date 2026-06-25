<template>
  <view class="page-profile">
    <!-- 面包屑 + 标题 -->
    <view class="page-header">
      <text class="breadcrumb">我的 · Account</text>
      <text class="page-title">个人中心</text>
    </view>

    <!-- ===== 身份区 ===== -->
    <view class="profile-section">
      <!-- 已登录 -->
      <view v-if="userStore.isLoggedIn" class="profile-inner">
        <view class="avatar-wrapper">
          <image
            v-if="userStore.avatarUrl && userStore.avatarUrl.indexOf('default') === -1"
            class="avatar-img"
            :src="userStore.avatarUrl"
            mode="aspectFill"
          />
          <text v-else class="avatar-icon">👤</text>
        </view>
        <view class="profile-info">
          <text class="profile-name">{{ userStore.nickname }}</text>
          <text class="profile-level">{{ userStore.isPremium ? '会员' : '普通用户' }}</text>
        </view>
      </view>

      <!-- 未登录 -->
      <view v-else class="profile-inner" @tap="handleLogin">
        <view class="avatar-wrapper avatar-empty">
          <text class="avatar-icon">👤</text>
        </view>
        <view class="profile-info">
          <text class="profile-name">点击登录</text>
          <text class="profile-level">登录后享受更多功能</text>
        </view>
      </view>
    </view>

    <!-- ===== 数据统计条 ===== -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-icon-text">⬇</text>
        <text class="stat-number">{{ formattedStats.downloadCount }}</text>
        <text class="stat-label">下载</text>
      </view>
      <view class="stat-item stat-item-center">
        <text class="stat-icon-text">♡</text>
        <text class="stat-number">{{ formattedStats.collectionCount }}</text>
        <text class="stat-label">收藏</text>
      </view>
      <view class="stat-item">
        <text class="stat-icon-text">🖼</text>
        <text class="stat-number">{{ formattedStats.materialCount }}</text>
        <text class="stat-label">素材</text>
      </view>
    </view>

    <!-- ===== 会员中心卡 ===== -->
    <view class="vip-card" :class="{ 'vip-premium': userStore.isPremium }" @tap="handleGoPremium">
      <view class="vip-left">
        <view class="vip-icon-circle" :class="{ 'vip-icon-dark': !userStore.isPremium }">
          <text class="vip-icon-text">👑</text>
        </view>
        <view class="vip-info">
          <text class="vip-title">会员中心</text>
          <text class="vip-desc">
            {{ userStore.isPremium ? '管理你的会员权益' : '解锁高清素材 + 全部工具' }}
          </text>
        </view>
      </view>
      <text class="card-arrow">›</text>
    </view>

    <!-- ===== 兑换会员卡 ===== -->
    <view class="exchange-card" @tap="handleGoRedeem">
      <view class="exchange-left">
        <view class="exchange-icon-circle">
          <text class="exchange-icon-text">🎫</text>
        </view>
        <view class="exchange-info">
          <text class="exchange-title">兑换会员</text>
          <text class="exchange-desc">使用兑换码激活会员权益</text>
        </view>
      </view>
      <text class="card-arrow">›</text>
    </view>

    <!-- ===== 手机号绑定卡 ===== -->
    <view v-if="userStore.isLoggedIn" class="phone-section">
      <!-- 已绑定 -->
      <view v-if="userStore.userInfo?.phone" class="phone-card phone-bound">
        <view class="phone-left">
          <view class="phone-icon-circle">
            <text class="phone-icon-text">📱</text>
          </view>
          <view class="phone-info">
            <text class="phone-title">已绑定手机号</text>
            <text class="phone-number">{{ maskedPhone }}</text>
          </view>
        </view>
        <text class="card-arrow-bound">✓</text>
      </view>

      <!-- 未绑定 -->
      <button
        v-else
        class="phone-card phone-unbound"
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
      >
        <view class="phone-left">
          <view class="phone-icon-circle phone-icon-dim">
            <text class="phone-icon-text">📱</text>
          </view>
          <view class="phone-info">
            <text class="phone-title">绑定手机号</text>
            <text class="phone-desc">绑定后享受更多服务</text>
          </view>
        </view>
        <text class="card-arrow">›</text>
      </button>
    </view>

    <!-- ===== 菜单列表 ===== -->
    <view class="menu-section">
      <view class="menu-item" @tap="handleSettingTap('settings')">
        <view class="menu-left">
          <view class="menu-icon-circle">
            <text class="menu-icon-text">⚙</text>
          </view>
          <text class="menu-label">设置</text>
        </view>
        <text class="card-arrow">›</text>
      </view>

      <view class="menu-item" @tap="handleSettingTap('materials')">
        <view class="menu-left">
          <view class="menu-icon-circle">
            <text class="menu-icon-text">📁</text>
          </view>
          <text class="menu-label">素材管理</text>
        </view>
        <text class="card-arrow">›</text>
      </view>

      <view class="menu-item" @tap="handleSettingTap('about')">
        <view class="menu-left">
          <view class="menu-icon-circle">
            <text class="menu-icon-text">ℹ</text>
          </view>
          <text class="menu-label">关于</text>
        </view>
        <text class="card-arrow">›</text>
      </view>

      <view class="menu-item" @tap="handleSettingTap('feedback')">
        <view class="menu-left">
          <view class="menu-icon-circle">
            <text class="menu-icon-text">💬</text>
          </view>
          <text class="menu-label">反馈建议</text>
        </view>
        <text class="card-arrow">›</text>
      </view>
    </view>

    <!-- ===== 退出登录 ===== -->
    <view v-if="userStore.isLoggedIn" class="logout-section">
      <view class="logout-button" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>

    <!-- CustomToast -->
    <CustomToast ref="toastRef" />

    <!-- 底部 TabBar -->
    <CustomTabBar :current="2" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { getUserStats } from '../../api/user'
import CustomToast from '../../components/CustomToast.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const userStore = useUserStore()
const toastRef = ref(null)

const stats = ref({
  downloadCount: 0,
  collectionCount: 0,
  materialCount: 0
})

const formattedStats = computed(() => ({
  downloadCount: stats.value.downloadCount || 0,
  collectionCount: stats.value.collectionCount || 0,
  materialCount: stats.value.materialCount || 0
}))

const maskedPhone = computed(() => {
  const phone = userStore.userInfo?.phone
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2')
})

onShow(() => {
  if (userStore.isLoggedIn) {
    loadUserStats()
    userStore.refreshProfile()
  }
})

const loadUserStats = async () => {
  try {
    const result = await getUserStats()
    stats.value = {
      downloadCount: result.downloadCount || 0,
      collectionCount: result.collectionCount || 0,
      materialCount: result.materialCount ?? 0
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const handleLogin = async () => {
  try {
    await userStore.login()
    loadUserStats()
  } catch (error) {
    console.error('登录失败:', error)
  }
}

const handleGoPremium = () => {
  uni.navigateTo({ url: '/pages/premium/index' })
}

const handleGoRedeem = () => {
  uni.navigateTo({ url: '/pages/redeem/index' })
}

const handleSettingTap = (type) => {
  switch (type) {
    case 'settings':
      uni.showModal({
        title: '设置',
        content: '手账素材小程序 v1.0\n\n清除缓存可以释放存储空间，不会影响你的会员状态和下载记录。',
        confirmText: '清除缓存',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            toastRef.value?.showToast('缓存已清除', 'check')
          }
        }
      })
      break
    case 'materials':
      uni.showActionSheet({
        itemList: ['下载记录', '收藏记录'],
        success: (res) => {
          if (res.tapIndex === 0) {
            toastRef.value?.showToast('下载记录开发中', 'check')
          } else if (res.tapIndex === 1) {
            uni.navigateTo({ url: '/pages/favorites/index' })
          }
        }
      })
      break
    case 'about':
      uni.showModal({
        title: '关于',
        content: '手账素材小程序 v1.0\n\n为你提供精选手账素材，助你创作更美的手账作品。'
      })
      break
    case 'feedback':
      uni.showModal({
        title: '反馈建议',
        content: '请通过以下方式联系我们：\n\n📧 邮箱：feedback@journaling-hub.com\n💬 微信：JournalingHub',
        confirmText: '知道了',
        showCancel: false
      })
      break
  }
}

const handleGetPhoneNumber = async (event) => {
  const code = event.detail?.code
  if (!code) {
    const errMsg = event.detail?.errMsg || ''
    if (errMsg.indexOf('deny') === -1 && errMsg.indexOf('cancel') === -1) {
      uni.showToast({ title: '获取手机号失败', icon: 'none' })
    }
    return
  }

  try {
    await userStore.bindPhone(code)
    await userStore.refreshProfile()
  } catch (error) {
    console.error('绑定手机号失败:', error)
  }
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        stats.value = { downloadCount: 0, collectionCount: 0, materialCount: 0 }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  padding: 28rpx 24rpx 140rpx;
}

/* ===== 页头 ===== */
.page-header {
  margin-bottom: 24rpx;
}

.breadcrumb {
  font-size: 22rpx;
  color: #888;
  display: block;
  margin-bottom: 6rpx;
}

.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #111;
  display: block;
}

/* ===== 身份区 ===== */
.profile-section {
  margin-bottom: 24rpx;
}

.profile-inner {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar-wrapper {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-icon {
  font-size: 44rpx;
  color: #bbb;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #111;
  display: block;
}

.profile-level {
  font-size: 24rpx;
  color: #888;
  margin-top: 6rpx;
  display: block;
}

/* ===== 统计条 (白底卡片，匹配account.html) ===== */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.stat-item {
  text-align: center;
  padding: 28rpx 10rpx;
  border-right: 1rpx solid #eee;
}

.stat-item:last-child {
  border: none;
}

.stat-icon-text {
  font-size: 32rpx;
  display: block;
  margin-bottom: 6rpx;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #111;
  display: block;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 22rpx;
  color: #888;
  display: block;
  margin-top: 4rpx;
}

/* ===== 会员中心卡 ===== */
.vip-card {
  background: #111;
  border-radius: 16rpx;
  padding: 24rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.vip-premium {
  background: #fff;
  border: 1rpx solid #eee;
}

.vip-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.vip-icon-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #2c2c2c;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vip-premium .vip-icon-circle {
  background: #f5f5f5;
}

.vip-icon-text {
  font-size: 36rpx;
  color: #fff;
}

.vip-premium .vip-icon-text {
  color: #111;
}

.vip-info {
  flex: 1;
}

.vip-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
  display: block;
  margin-bottom: 4rpx;
}

.vip-premium .vip-title {
  color: #111;
}

.vip-desc {
  font-size: 22rpx;
  color: #aaa;
  display: block;
}

.vip-premium .vip-desc {
  color: #999;
}

/* ===== 兑换会员卡 ===== */
.exchange-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.exchange-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.exchange-icon-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.exchange-icon-text {
  font-size: 36rpx;
}

.exchange-info {
  flex: 1;
}

.exchange-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #111;
  display: block;
  margin-bottom: 4rpx;
}

.exchange-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.card-arrow {
  font-size: 36rpx;
  color: #ccc;
}

/* ===== 手机号绑定卡 ===== */
.phone-section {
  margin-bottom: 24rpx;
}

.phone-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.phone-unbound {
  width: 100%;
  border: none;
  text-align: left;
  font-size: inherit;
  line-height: inherit;
}

.phone-unbound::after {
  border: none;
}

.phone-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.phone-icon-circle {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.phone-icon-dim {
  background: #f0f0f0;
}

.phone-icon-text {
  font-size: 36rpx;
}

.phone-info {
  flex: 1;
}

.phone-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #111;
  display: block;
  margin-bottom: 4rpx;
}

.phone-number {
  font-size: 24rpx;
  color: #888;
  display: block;
}

.phone-desc {
  font-size: 22rpx;
  color: #999;
  display: block;
}

.card-arrow-bound {
  font-size: 28rpx;
  color: #4CAF50;
}

/* ===== 菜单列表 (透明底+顶部线) ===== */
.menu-section {
  background: transparent;
  border-top: 1rpx solid #eee;
  padding-top: 12rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
}

.menu-icon-circle {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon-text {
  font-size: 28rpx;
  color: #888;
}

.menu-label {
  font-size: 28rpx;
  color: #111;
}

.menu-item .card-arrow {
  font-size: 28rpx;
  color: #ccc;
}

/* ===== 退出 ===== */
.logout-section {
  padding: 40rpx 0;
}

.logout-button {
  width: 100%;
  height: 80rpx;
  background: #fff;
  border: 1rpx solid #eee;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-text {
  font-size: 26rpx;
  color: #999;
}
</style>
