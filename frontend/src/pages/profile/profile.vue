<template>
  <view class="page-profile">
    <!-- ===== 身份区 ===== -->
    <view class="profile-section" :style="{ paddingTop: statusBarHeight + 'px' }">
      <!-- 已登录 -->
      <view v-if="userStore.isLoggedIn" class="profile-inner" @tap="openProfileEditor">
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
    <view class="profile-header-placeholder" :style="{ height: profileHeaderHeight }" />

    <view class="profile-block">
      <text class="section-title">我的内容</text>
      <view class="content-grid">
        <view class="content-card" @tap="handleGoDownloads">
          <view class="profile-card-icon">
            <text class="download-icon-text">↓</text>
          </view>
          <view class="profile-card-info">
            <text class="profile-card-title">我的下载</text>
            <text class="profile-card-desc">查看历史</text>
          </view>
          <text class="card-arrow">›</text>
        </view>

        <view class="content-card" @tap="handleGoFavorites">
          <view class="profile-card-icon">
            <text class="fav-icon-text">♡</text>
          </view>
          <view class="profile-card-info">
            <text class="profile-card-title">我的收藏</text>
            <text class="profile-card-desc">查看收藏</text>
          </view>
          <text class="card-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="profile-block">
      <text class="section-title">会员服务</text>
      <view class="member-card" @tap="handleGoRedeem">
        <view class="member-icon">
          <text class="member-icon-text">♕</text>
        </view>
        <view class="member-info">
          <text class="member-title">兑换会员</text>
          <text class="member-desc">解锁高清素材 + 全部工具</text>
        </view>
        <text class="member-arrow">›</text>
      </view>
    </view>

    <view class="profile-block more-block">
      <text class="section-title">更多</text>

      <view v-if="userStore.isLoggedIn && userStore.userInfo?.phone" class="more-row phone-bound">
        <view class="more-icon">
          <text class="phone-icon-text">▯</text>
        </view>
        <text class="more-title">已绑定手机号</text>
        <text class="more-desc">{{ maskedPhone }}</text>
        <text class="card-arrow-bound">✓</text>
      </view>

      <button
        v-else-if="userStore.isLoggedIn"
        class="more-row more-row-button"
        open-type="getPhoneNumber"
        @getphonenumber="handleGetPhoneNumber"
      >
        <view class="more-icon">
          <text class="phone-icon-text">▯</text>
        </view>
        <text class="more-title">绑定手机号</text>
        <text class="card-arrow">›</text>
      </button>

      <view v-else class="more-row" @tap="handleLogin">
        <view class="more-icon">
          <text class="phone-icon-text">▯</text>
        </view>
        <text class="more-title">绑定手机号</text>
        <text class="card-arrow">›</text>
      </view>

      <view class="more-row" @tap="openFeedbackDialog">
        <view class="more-icon">
          <text class="feedback-icon-text">○</text>
        </view>
        <text class="more-title">反馈建议</text>
        <text class="card-arrow">›</text>
      </view>

      <view class="more-row" @tap="handleAbout">
        <view class="more-icon">
          <text class="about-icon-text">i</text>
        </view>
        <text class="more-title">关于</text>
        <text class="card-arrow">›</text>
      </view>
    </view>

    <!-- ===== 退出登录 ===== -->
    <view v-if="userStore.isLoggedIn" class="logout-section">
      <view class="logout-button" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>

    <!-- ===== 编辑资料 ===== -->
    <view v-if="showProfileEditor" class="editor-mask" @tap="closeProfileEditor">
      <view class="editor-panel" @tap.stop>
        <view class="editor-header">
          <text class="editor-title">编辑个人资料</text>
          <text class="editor-close" @tap="closeProfileEditor">×</text>
        </view>

        <button
          class="avatar-picker"
          open-type="chooseAvatar"
          @chooseavatar="handleChooseAvatar"
        >
          <image
            v-if="profileForm.avatarUrl && profileForm.avatarUrl.indexOf('default') === -1"
            class="editor-avatar-img"
            :src="profileForm.avatarUrl"
            mode="aspectFill"
          />
          <text v-else class="editor-avatar-icon">👤</text>
          <text class="avatar-picker-label">更换头像</text>
        </button>

        <view class="editor-field">
          <text class="editor-label">昵称</text>
          <input
            v-model="profileForm.nickname"
            class="nickname-input"
            type="nickname"
            maxlength="20"
            placeholder="请输入昵称"
          />
        </view>

        <view class="editor-actions">
          <button class="editor-button editor-cancel" @tap="closeProfileEditor">取消</button>
          <button
            class="editor-button editor-save"
            :loading="isSavingProfile"
            :disabled="isSavingProfile"
            @tap="handleSaveProfile"
          >
            保存
          </button>
        </view>
      </view>
    </view>

    <!-- ===== 反馈建议 ===== -->
    <view v-if="showFeedbackDialog" class="feedback-mask" @tap="closeFeedbackDialog">
      <view class="feedback-panel" @tap.stop>
        <view class="feedback-header">
          <text class="feedback-title">反馈建议</text>
          <text class="feedback-close" @tap="closeFeedbackDialog">×</text>
        </view>
        <textarea
          v-model="feedbackContent"
          class="feedback-textarea"
          maxlength="1000"
          placeholder="请写下你的建议或遇到的问题"
          :show-confirm-bar="false"
        />
        <view class="feedback-count">{{ feedbackContent.length }}/1000</view>
        <view class="feedback-actions">
          <button class="feedback-button feedback-cancel" @tap="closeFeedbackDialog">取消</button>
          <button
            class="feedback-button feedback-submit"
            :loading="isSubmittingFeedback"
            :disabled="isSubmittingFeedback"
            @tap="handleSubmitFeedback"
          >
            提交
          </button>
        </view>
      </view>
    </view>

    <!-- CustomToast -->
    <CustomToast ref="toastRef" />

    <!-- 底部 TabBar -->
    <CustomTabBar :current="2" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '../../stores/user'
import { uploadAvatar } from '../../api/user'
import { submitFeedback } from '../../api/feedback'
import { requireLogin } from '../../utils/auth'
import CustomToast from '../../components/CustomToast.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const userStore = useUserStore()
const toastRef = ref(null)
const statusBarHeight = ref(44)
const showProfileEditor = ref(false)
const isSavingProfile = ref(false)
const selectedAvatarPath = ref('')
const showFeedbackDialog = ref(false)
const feedbackContent = ref('')
const isSubmittingFeedback = ref(false)

const profileForm = ref({
  nickname: '',
  avatarUrl: ''
})

const maskedPhone = computed(() => {
  const phone = userStore.userInfo?.phone
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2')
})

const profileHeaderHeight = computed(() => `calc(${statusBarHeight.value}px + 220rpx)`)

onMounted(() => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 44
  } catch (error) {
    statusBarHeight.value = 44
  }
})

onShow(() => {
  if (userStore.isLoggedIn) {
    userStore.refreshProfile()
  }
})

const handleGoDownloads = () => {
  if (!requireLogin()) return
  uni.navigateTo({ url: '/pages/download-history/index' })
}

const handleGoFavorites = () => {
  if (!requireLogin()) return
  uni.navigateTo({ url: '/pages/favorites/index' })
}

const handleLogin = async () => {
  try {
    await userStore.login()
  } catch (error) {
    console.error('登录失败:', error)
  }
}

const openProfileEditor = () => {
  if (!userStore.isLoggedIn) return
  profileForm.value = {
    nickname: userStore.userInfo?.nickname || '',
    avatarUrl: userStore.userInfo?.avatarUrl || ''
  }
  selectedAvatarPath.value = ''
  showProfileEditor.value = true
}

const closeProfileEditor = () => {
  if (isSavingProfile.value) return
  showProfileEditor.value = false
  selectedAvatarPath.value = ''
}

const handleChooseAvatar = (event) => {
  const avatarUrl = event.detail?.avatarUrl
  if (!avatarUrl) {
    uni.showToast({ title: '获取头像失败', icon: 'none' })
    return
  }

  profileForm.value.avatarUrl = avatarUrl
  selectedAvatarPath.value = avatarUrl
}

const handleSaveProfile = async () => {
  const nickname = profileForm.value.nickname.trim()
  if (!nickname) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }

  isSavingProfile.value = true
  try {
    let avatarUrl = profileForm.value.avatarUrl
    if (selectedAvatarPath.value) {
      const uploadResult = await uploadAvatar(selectedAvatarPath.value)
      avatarUrl = uploadResult.avatarUrl
    }

    await userStore.updateProfile({
      nickname,
      avatarUrl
    })
    showProfileEditor.value = false
    selectedAvatarPath.value = ''
  } catch (error) {
    console.error('保存资料失败:', error)
  } finally {
    isSavingProfile.value = false
  }
}

const handleGoRedeem = () => {
  uni.navigateTo({ url: '/pages/redeem/index' })
}

const openFeedbackDialog = () => {
  showFeedbackDialog.value = true
}

const closeFeedbackDialog = () => {
  if (isSubmittingFeedback.value) return
  showFeedbackDialog.value = false
}

const handleSubmitFeedback = async () => {
  const content = feedbackContent.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入反馈内容', icon: 'none' })
    return
  }

  isSubmittingFeedback.value = true
  try {
    await submitFeedback(content)
    feedbackContent.value = ''
    showFeedbackDialog.value = false
    uni.showToast({ title: '感谢反馈', icon: 'success' })
  } catch (error) {
    console.error('提交反馈失败:', error)
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    })
  } finally {
    isSubmittingFeedback.value = false
  }
}

const handleAbout = () => {
  uni.showModal({
    title: '关于',
    content: '手账素材小程序 v1.0\n\n为你提供精选手账素材，助你创作更美的手账作品。',
    confirmText: '知道了',
    showCancel: false
  })
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
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-profile {
  min-height: 100vh;
  padding: 0 52rpx 160rpx;
  box-sizing: border-box;
}

/* ===== 身份区 ===== */
.profile-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 120;
  padding-left: 52rpx;
  padding-right: 52rpx;
  padding-bottom: 28rpx;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(254, 245, 248, 0.92) 0%, rgba(245, 253, 245, 0.9) 55%, rgba(255, 248, 240, 0.9) 100%);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}

.profile-header-placeholder {
  width: 100%;
}

.profile-inner {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.avatar-wrapper {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
  background: rgba(244, 244, 244, 0.82);
  border: 3rpx solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 10rpx 28rpx rgba(0, 0, 0, 0.06);
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
  font-size: 56rpx;
  color: #b4b4b4;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 42rpx;
  font-weight: 700;
  color: #0b0b0c;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-level {
  font-size: 26rpx;
  color: #747474;
  margin-top: 14rpx;
  display: block;
}

.download-icon-text,
.fav-icon-text {
  font-size: 42rpx;
  color: #0a0a0a;
  line-height: 1;
}

.card-arrow {
  font-size: 54rpx;
  color: #c8c8cc;
  line-height: 1;
}

.profile-block {
  margin-bottom: 76rpx;
}

.more-block {
  margin-bottom: 26rpx;
}

.section-title {
  display: block;
  margin-bottom: 30rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #080808;
  line-height: 1.2;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26rpx;
}

.content-card {
  min-height: 112rpx;
  padding: 26rpx 26rpx 26rpx 24rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  border-radius: 16rpx;
  box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  box-sizing: border-box;
}

.more-row-button {
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  font-size: inherit;
  line-height: inherit;
}

.more-row-button::after {
  border: none;
}

.profile-card-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(245, 245, 245, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-card-info {
  flex: 1;
  min-width: 0;
}

.profile-card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #090909;
  display: block;
  margin-bottom: 6rpx;
  line-height: 1.2;
}

.profile-card-desc {
  font-size: 24rpx;
  color: #8a8a8a;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-card {
  min-height: 126rpx;
  padding: 28rpx 34rpx 28rpx 28rpx;
  background: linear-gradient(135deg, #050505 0%, #171717 100%);
  border-radius: 16rpx;
  box-shadow: 0 18rpx 38rpx rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 26rpx;
  box-sizing: border-box;
}

.member-icon {
  width: 74rpx;
  height: 74rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-icon-text {
  font-size: 40rpx;
  color: #ffffff;
  line-height: 1;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.member-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.64);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-arrow {
  font-size: 54rpx;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1;
}

.more-row {
  min-height: 94rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  box-sizing: border-box;
}

.more-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.more-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  color: #1d1d1f;
  line-height: 1.2;
}

.more-desc {
  max-width: 180rpx;
  font-size: 24rpx;
  color: #8a8a8a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.phone-icon-text,
.feedback-icon-text,
.about-icon-text {
  font-size: 28rpx;
  color: #5f6063;
  line-height: 1;
}

.card-arrow-bound {
  font-size: 28rpx;
  color: #4CAF50;
}

@media (max-width: 340px) {
  .page-profile {
    padding-left: 36rpx;
    padding-right: 36rpx;
  }

  .profile-section {
    padding-left: 36rpx;
    padding-right: 36rpx;
  }

  .content-grid {
    gap: 18rpx;
  }

  .content-card {
    padding-left: 18rpx;
    padding-right: 18rpx;
  }

  .profile-card-title,
  .more-title {
    font-size: 28rpx;
  }
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

/* ===== 编辑资料弹层 ===== */
.editor-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.36);
  display: flex;
  align-items: flex-end;
}

.editor-panel {
  width: 100%;
  max-height: calc(100vh - 160rpx);
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 28rpx 28rpx calc(160rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-y: auto;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.editor-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111;
}

.editor-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f5f5f5;
  color: #888;
  font-size: 40rpx;
  line-height: 52rpx;
  text-align: center;
}

.avatar-picker {
  width: 180rpx;
  margin: 0 auto 32rpx;
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.avatar-picker::after {
  border: none;
}

.editor-avatar-img,
.editor-avatar-icon {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
  background: #f2f2f2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.editor-avatar-icon {
  font-size: 56rpx;
  color: #bbb;
  line-height: 132rpx;
}

.avatar-picker-label {
  font-size: 24rpx;
  color: #666;
  margin-top: 14rpx;
}

.editor-field {
  margin-bottom: 32rpx;
}

.editor-label {
  font-size: 24rpx;
  color: #888;
  display: block;
  margin-bottom: 12rpx;
}

.nickname-input {
  height: 88rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #111;
  box-sizing: border-box;
}

.editor-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.editor-button {
  height: 84rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  line-height: 84rpx;
}

.editor-button::after {
  border: none;
}

.editor-cancel {
  background: #f5f5f5;
  color: #666;
}

.editor-save {
  background: #111;
  color: #fff;
}

/* ===== 反馈弹层 ===== */
.feedback-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.36);
  display: flex;
  align-items: flex-end;
}

.feedback-panel {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 28rpx 28rpx calc(160rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.feedback-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111;
}

.feedback-close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f5f5f5;
  color: #888;
  font-size: 40rpx;
  line-height: 52rpx;
  text-align: center;
}

.feedback-textarea {
  width: 100%;
  height: 260rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 22rpx 24rpx;
  font-size: 28rpx;
  color: #111;
  line-height: 1.5;
  box-sizing: border-box;
}

.feedback-count {
  font-size: 22rpx;
  color: #aaa;
  text-align: right;
  margin: 12rpx 0 28rpx;
}

.feedback-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.feedback-button {
  height: 84rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  line-height: 84rpx;
}

.feedback-button::after {
  border: none;
}

.feedback-cancel {
  background: #f5f5f5;
  color: #666;
}

.feedback-submit {
  background: #111;
  color: #fff;
}
</style>
