/**
 * 素材相关 API
 */
import { get } from './request'

/**
 * 获取素材列表
 */
export const getMaterials = (params) => {
  return get('/materials', params)
}

/**
 * 获取素材详情
 */
export const getMaterialDetail = (id) => {
  return get(`/materials/${id}`)
}

/**
 * 搜索素材
 */
export const searchMaterials = (params) => {
  return get('/materials/search', params)
}

/**
 * 获取所有分类
 */
export const getCategories = () => {
  return get('/materials/categories')
}
