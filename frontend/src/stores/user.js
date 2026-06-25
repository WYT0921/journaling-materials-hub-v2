/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as userApi from '../api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref('')
  const userInfo = ref(null)
  const isPremium = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const nickname = computed(() => userInfo.value?.nickname || '未登录')
  const avatarUrl = computed(() => userInfo.value?.avatarUrl || '/static/images/default-avatar.png')
  const memberTypeText = computed(() => userInfo.value?.memberTypeText || '普通用户')

  /**
   * 检查登录状态（从本地存储恢复）
   */
  const checkLoginStatus = () => {
    const savedToken = uni.getStorageSync('token')
    const savedUserInfo = uni.getStorageSync('userInfo')

    if (savedToken) {
      token.value = savedToken
    }
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
        isPremium.value = userInfo.value?.memberType !== 'normal'
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }

  /**
   * 微信登录
   */
  const login = async () => {
    try {
      // 获取微信登录 code
      const { code } = await new Promise((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        })
      })

      // 检测游客模式 mock code，自动降级到 dev-login
      const isMockCode = !code || code.includes('mock')
      let result
      if (isMockCode) {
        console.log('检测到游客模式，使用 dev-login:', code)
        result = await userApi.devLogin('dev-tourist', true)
      } else {
        result = await userApi.login(code)
      }

      // 保存登录信息
      token.value = result.token
      userInfo.value = result.userInfo
      isPremium.value = result.isPremium

      // 持久化存储
      uni.setStorageSync('token', result.token)
      uni.setStorageSync('userInfo', JSON.stringify(result.userInfo))

      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })

      return result
    } catch (error) {
      console.error('登录失败:', error)
      uni.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
      throw error
    }
  }

  /**
   * 登出
   */
  const logout = () => {
    token.value = ''
    userInfo.value = null
    isPremium.value = false

    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')

    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  }

  /**
   * 刷新用户资料
   */
  const refreshProfile = async () => {
    if (!isLoggedIn.value) return

    try {
      const profile = await userApi.getProfile()
      userInfo.value = profile
      isPremium.value = profile.memberType !== 'normal'
      uni.setStorageSync('userInfo', JSON.stringify(profile))
    } catch (error) {
      console.error('刷新用户资料失败:', error)
    }
  }

  /**
   * 绑定手机号
   */
  const bindPhone = async (code) => {
    if (!isLoggedIn.value) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    try {
      const result = await userApi.bindPhone(code)

      // 更新本地状态
      userInfo.value = {
        ...userInfo.value,
        ...result
      }
      uni.setStorageSync('userInfo', JSON.stringify(userInfo.value))

      uni.showToast({
        title: '手机号绑定成功',
        icon: 'success'
      })

      return result
    } catch (error) {
      console.error('绑定手机号失败:', error)
      uni.showToast({
        title: error.message || '绑定失败，请重试',
        icon: 'none'
      })
      throw error
    }
  }

  /**
   * 刷新会员状态
   */
  const refreshPremiumStatus = async () => {
    if (!isLoggedIn.value) return

    try {
      const status = await userApi.getPremiumStatus()
      isPremium.value = status.isPremium
      if (userInfo.value) {
        userInfo.value.memberType = status.memberType
        userInfo.value.memberTypeText = status.memberTypeText
        userInfo.value.memberExpireTime = status.memberExpireTime
        uni.setStorageSync('userInfo', JSON.stringify(userInfo.value))
      }
    } catch (error) {
      console.error('刷新会员状态失败:', error)
    }
  }

  return {
    token,
    userInfo,
    isPremium,
    isLoggedIn,
    nickname,
    avatarUrl,
    memberTypeText,
    checkLoginStatus,
    login,
    logout,
    bindPhone,
    refreshProfile,
    refreshPremiumStatus
  }
})
