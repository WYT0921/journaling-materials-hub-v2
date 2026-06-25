/**
 * 本地存储工具
 */

/**
 * 获取存储值
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const value = uni.getStorageSync(key)
    return value || defaultValue
  } catch (e) {
    console.error('获取存储失败:', key, e)
    return defaultValue
  }
}

/**
 * 设置存储值
 */
export const setStorage = (key, value) => {
  try {
    uni.setStorageSync(key, value)
    return true
  } catch (e) {
    console.error('设置存储失败:', key, e)
    return false
  }
}

/**
 * 删除存储值
 */
export const removeStorage = (key) => {
  try {
    uni.removeStorageSync(key)
    return true
  } catch (e) {
    console.error('删除存储失败:', key, e)
    return false
  }
}

/**
 * 清空存储
 */
export const clearStorage = () => {
  try {
    uni.clearStorageSync()
    return true
  } catch (e) {
    console.error('清空存储失败:', e)
    return false
  }
}

/**
 * 获取存储信息
 */
export const getStorageInfo = () => {
  try {
    return uni.getStorageInfoSync()
  } catch (e) {
    console.error('获取存储信息失败:', e)
    return null
  }
}
