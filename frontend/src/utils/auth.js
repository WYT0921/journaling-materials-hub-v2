/**
 * 认证工具
 */
import { useUserStore } from '../stores/user'

/**
 * 检查是否已登录（从 Pinia store 读取）
 */
export const isLoggedIn = () => {
  return useUserStore().isLoggedIn
}

/**
 * 获取 Token
 */
export const getToken = () => {
  return useUserStore().token || ''
}

/**
 * 需要登录的装饰器
 * 如果未登录，弹出登录提示
 */
export const requireLogin = (callback) => {
  if (!isLoggedIn()) {
    uni.showModal({
      title: '提示',
      content: '此功能需要登录，是否立即登录？',
      success: (res) => {
        if (res.confirm) {
          const userStore = useUserStore()
          userStore.login().then(() => {
            if (callback) callback()
          })
        }
      }
    })
    return false
  }
  return true
}

/**
 * 需要会员的装饰器
 * 如果未登录或非会员，弹出相应提示
 */
export const requirePremium = (callback) => {
  const userStore = useUserStore()

  if (!userStore.isLoggedIn) {
    uni.showModal({
      title: '提示',
      content: '此功能需要登录，是否立即登录？',
      success: (res) => {
        if (res.confirm) {
          userStore.login().then(() => {
            if (callback) callback()
          })
        }
      }
    })
    return false
  }

  if (!userStore.isPremium) {
    uni.showModal({
      title: '会员专享',
      content: '此功能需要会员权限，是否前往开通？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/premium/index' })
        }
      }
    })
    return false
  }

  return true
}
