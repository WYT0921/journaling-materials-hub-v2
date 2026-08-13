const TOOL_SHARE_CONFIG = Object.freeze({
  toolbox: {
    title: '特殊字体、颜文字和图片 Dot Art 都在这里',
    path: '/pages/tools/tools'
  },
  materials: {
    title: '发现清新可爱的手账素材',
    path: '/pages/index/index'
  }
})

export function getToolShareConfig(tool) {
  return TOOL_SHARE_CONFIG[tool]
}

export function showToolShareMenu() {
  if (typeof uni.showShareMenu !== 'function') return
  uni.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

export function hidePageShareMenu() {
  if (typeof uni.hideShareMenu === 'function') {
    uni.hideShareMenu()
  }
}

export function buildShareAppMessage(tool) {
  const config = getToolShareConfig(tool)
  return {
    title: config.title,
    path: config.path
  }
}

export function buildShareTimeline(tool) {
  const config = getToolShareConfig(tool)
  return {
    title: config.title,
    query: ''
  }
}
