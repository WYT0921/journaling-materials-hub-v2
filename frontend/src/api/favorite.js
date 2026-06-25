/**
 * 收藏相关 API
 */
import { get, post } from './request'

/**
 * 切换收藏（收藏/取消收藏）
 * @param {number} materialId - 素材 ID
 * @returns {Promise<{isFavorited: boolean, materialId: number}>}
 */
export const toggleFavorite = (materialId) => {
  return post(`/v2/favorites/toggle?materialId=${materialId}`)
}

/**
 * 检查是否已收藏
 * @param {number} materialId - 素材 ID
 * @returns {Promise<{isFavorited: boolean}>}
 */
export const checkFavorite = (materialId) => {
  return get(`/v2/favorites/check/${materialId}`)
}

/**
 * 获取收藏列表（分页）
 * @param {Object} params - { page: number, limit: number }
 * @returns {Promise<{list: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
export const getFavorites = (params = {}) => {
  return get('/v2/favorites', params)
}
