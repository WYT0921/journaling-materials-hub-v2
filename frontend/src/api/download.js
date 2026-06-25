/**
 * 下载相关 API
 */
import { get } from './request'

/**
 * 下载素材
 */
export const downloadMaterial = (materialId) => {
  return get(`/download/${materialId}`)
}

/**
 * 获取下载记录
 */
export const getDownloadRecords = (params) => {
  return get('/download/records', params)
}
