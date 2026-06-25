/**
 * 工具箱相关 API
 */
import { get, post, put, del } from './request'

/**
 * 获取所有工具（默认 + 用户自定义）
 * @returns {Promise<Array>}
 */
export const getTools = () => {
  return get('/v2/tools')
}

/**
 * 添加自定义工具
 * @param {Object} tool - { name, description, icon, url }
 * @returns {Promise<Object>}
 */
export const addTool = (tool) => {
  return post('/v2/tools', tool)
}

/**
 * 更新自定义工具
 * @param {number} id - 工具 ID
 * @param {Object} tool - { name, description, icon, url }
 * @returns {Promise<Object>}
 */
export const updateTool = (id, tool) => {
  return put(`/v2/tools/${id}`, tool)
}

/**
 * 删除自定义工具
 * @param {number} id - 工具 ID
 * @returns {Promise<void>}
 */
export const removeTool = (id) => {
  return del(`/v2/tools/${id}`)
}
