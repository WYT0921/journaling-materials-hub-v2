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
import textAssets from './text-assets.json'

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

function buildTextAssetResponse(url, requestParams = {}) {
  const params = parseParams(url, requestParams)
  let list = textAssets.data || []
  if (params.type) list = list.filter(item => item.type === params.type)
  if (params.category) list = list.filter(item => item.category === params.category)
  if (params.keyword) {
    const keyword = String(params.keyword).toLowerCase()
    list = list.filter(item => `${item.content} ${item.category} ${(item.tags || []).join(' ')}`.toLowerCase().includes(keyword))
  }

  if (url.includes('/categories')) {
    const counts = list.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})
    return { success: true, data: Object.entries(counts).map(([name, count], index) => ({ name, count, sortOrder: index })), error: null }
  }

  const page = Number(params.page || 1)
  const limit = Number(params.limit || 30)
  const start = (page - 1) * limit
  return {
    success: true,
    data: { list: list.slice(start, start + limit), total: list.length, page, limit, totalPages: Math.ceil(list.length / limit) },
    error: null
  }
}

/**
 * 根据请求 URL 查找对应的 mock 数据
 * @param {string} url - API 请求路径
 * @returns {object|null} mock 响应对象
 */
export function getMockData(url, requestParams = {}) {
  if (url.includes('/text-assets')) {
    return buildTextAssetResponse(url, requestParams)
  }
  if (url.includes('/materials/issues')) {
    return buildIssues(requestParams)
  }
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
        return filterCategories(url, data, requestParams)
      }

      // 素材列表支持分页（/materials?page=...）
      if (
        key === '/materials' &&
        !url.includes('/materials/categories') &&
        !url.includes('/materials/search')
      ) {
        return paginateMaterials(url, data, requestParams)
      }

      return data
    }
  }

  return null
}

/**
 * 对素材列表做客户端分页
 */
function parseParams(url, requestParams = {}) {
  const queryStr = (url.split('?')[1] || '')
  const params = { ...requestParams }
  queryStr.split('&').forEach(p => {
    const [k, v] = p.split('=')
    if (k && v) params[k] = decodeURIComponent(v)
  })

  return params
}

function withMockIssue(item) {
  if (item.issueYear && item.issueNumber) return item
  const issueNumber = item.id <= 6 ? 7 : item.id <= 12 ? 6 : 5
  return { ...item, issueYear: 2026, issueNumber }
}

function paginateMaterials(url, data, requestParams) {
  const params = parseParams(url, requestParams)
  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '10')
  let allItems = (data.data.list || []).map(withMockIssue)
  if (params.materialType) {
    allItems = allItems.filter(item => item.materialType === params.materialType)
  }
  if (params.category) {
    allItems = allItems.filter(item => item.category === params.category)
  }
  if (params.issueYear && params.issueNumber) {
    allItems = allItems.filter(item =>
      item.issueYear === Number(params.issueYear) && item.issueNumber === Number(params.issueNumber)
    )
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
function filterCategories(url, data, requestParams) {
  const params = parseParams(url, requestParams)

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

function buildIssues(params = {}) {
  const counts = (materialsList.data.list || [])
    .map(withMockIssue)
    .filter(item => !params.materialType || item.materialType === params.materialType)
    .reduce((acc, item) => {
      const key = `${item.issueYear}-${item.issueNumber}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  const chineseNumbers = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const toChineseNumber = number => chineseNumbers[number] || String(number)
  const list = Object.entries(counts)
    .map(([key, count]) => {
      const [issueYear, issueNumber] = key.split('-').map(Number)
      return {
        issueYear,
        issueNumber,
        label: `${issueYear}年第${toChineseNumber(issueNumber)}期`,
        count
      }
    })
    .sort((a, b) => b.issueYear - a.issueYear || b.issueNumber - a.issueNumber)

  return { success: true, data: list, error: null }
}
