/**
 * Mock 数据加载中枢
 * 将 URL pattern 映射到 mock 数据模块，替代 require() 动态加载
 */

// 静态导入所有 mock 数据（Vite 打包时捆绑）
import userLogin from './user-login.json'
import userProfile from './user-profile.json'
import userStats from './user-stats.json'
import userPremiumStatus from './user-premium-status.json'
import materialsCategories from './materials-categories.json'
import materialsList from './materials-list.json'
import materialDetail from './material-detail.json'
import redeemVerify from './redeem-verify.json'
import redeemActivate from './redeem-activate.json'
import downloadRecord from './download-record.json'
import downloadMaterial from './download-material.json'
import userBindPhone from './user-bind-phone.json'
import feedbackSubmit from './feedback-submit.json'

// URL pattern → mock 数据模块映射
const mockMap = {
  '/user/login': userLogin,
  '/user/profile': userProfile,
  '/user/stats': userStats,
  '/user/premium-status': userPremiumStatus,
  '/materials/categories': materialsCategories,
  '/materials/search': materialsList,
  '/materials': materialsList,
  '/material': materialDetail,
  '/redeem/verify': redeemVerify,
  '/redeem/activate': redeemActivate,
  '/download/records': downloadRecord,
  '/download': downloadMaterial,
  '/user/bind-phone': userBindPhone,
  '/feedback': feedbackSubmit
}

/**
 * 根据请求 URL 查找对应的 mock 数据
 * @param {string} url - API 请求路径
 * @returns {object|null} mock 响应对象
 */
export function getMockData(url) {
  // 按 key 长度降序排列，优先匹配更具体的路径
  const keys = Object.keys(mockMap).sort((a, b) => b.length - a.length)

  for (const key of keys) {
    if (url.includes(key)) {
      const data = mockMap[key]

      // 素材详情：URL 如 /materials/12（包含数字 ID）
      if (key === '/materials' && /\/materials\/\d+/.test(url)) {
        return materialDetail
      }

      if (key === '/materials/categories') {
        return filterCategories(url, data)
      }

      // 素材列表支持分页（/materials?page=...）
      if (
        key === '/materials' &&
        !url.includes('/materials/categories') &&
        !url.includes('/materials/search')
      ) {
        return paginateMaterials(url, data)
      }

      return data
    }
  }

  return null
}

/**
 * 对素材列表做客户端分页
 */
function paginateMaterials(url, data) {
  const queryStr = (url.split('?')[1] || '')
  const params = {}
  queryStr.split('&').forEach(p => {
    const [k, v] = p.split('=')
    if (k && v) params[k] = decodeURIComponent(v)
  })

  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '10')
  let allItems = data.data.list || []
  if (params.materialType) {
    allItems = allItems.filter(item => item.materialType === params.materialType)
  }
  if (params.category) {
    allItems = allItems.filter(item => item.category === params.category)
  }
  const start = (page - 1) * limit
  const paged = allItems.slice(start, start + limit)

  return {
    success: true,
    data: { total: allItems.length, list: paged },
    error: null
  }
}

/**
 * 按一级素材类型过滤分类统计
 */
function filterCategories(url, data) {
  const queryStr = (url.split('?')[1] || '')
  const params = {}
  queryStr.split('&').forEach(p => {
    const [k, v] = p.split('=')
    if (k && v) params[k] = decodeURIComponent(v)
  })

  const counts = (materialsList.data.list || [])
    .filter(item => !params.materialType || item.materialType === params.materialType)
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

  return {
    success: true,
    data: (data.data || []).map(item => ({
      ...item,
      count: counts[item.category || item.name] || 0
    })),
    error: null
  }
}
