/**
 * 兑换码相关 API
 */
import { post } from './request'

/**
 * 验证兑换码
 */
export const verifyCode = (code) => {
  return post('/redeem/verify', { code })
}

/**
 * 使用兑换码激活会员
 */
export const activatePremium = (code) => {
  return post('/redeem/activate', { code })
}
