/**
 * 通行码相关 API
 */
import { post } from './request'

/**
 * 验证通行码
 */
export const verifyCode = (code) => {
  return post('/redeem/verify', { code })
}

/**
 * 使用通行码激活素材权限
 */
export const activatePremium = (code) => {
  return post('/redeem/activate', { code })
}
