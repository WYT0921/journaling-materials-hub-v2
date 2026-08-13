/**
 * 音乐卡片场景渲染器
 * 按层序渲染：Background → Photo → Player → Text → Decoration
 */

import { drawBackground } from './backgrounds.mjs'
import { drawPlayerTemplate } from './player-templates.mjs'
import { drawDecorations } from './decorations.mjs'
import { textColorForBackground } from './color-extraction.mjs'

const loadCanvasImage = (canvas, path) => new Promise((resolve, reject) => {
  const image = canvas.createImage()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('图片加载失败'))
  image.src = path
})

// ---- 图层渲染调度 ----

const renderBackground = async (ctx, layer, scene, images) => {
  const { width, height } = scene.canvas
  const selectedColor = scene.backgroundStyle?.color
  const palette = selectedColor
    ? [{ hex: selectedColor }, ...(scene.palette || []).filter(item => item.hex !== selectedColor)]
    : scene.palette
  await drawBackground(ctx, { ...(layer.config || {}), ...scene.backgroundStyle, palette }, width, height)
}

const renderPhoto = async (ctx, layer, scene, images) => {
  const img = images.get(layer.imagePath)
  if (!img) return
  const { x, y, scale = 1, rotation = 0 } = layer
  ctx.save()
  ctx.translate(x + (layer.width || img.width) * scale / 2, y + (layer.height || img.height) * scale / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(img, -(layer.width || img.width) * scale / 2, -(layer.height || img.height) * scale / 2,
    (layer.width || img.width) * scale, (layer.height || img.height) * scale)
  ctx.restore()
}

const renderPlayer = async (ctx, layer, scene, images) => {
  const { x = 0, y = 0, width, height, scale = 1, rotation = 0 } = layer
  const coverPath = layer.showCover === false ? null : (layer.coverPath || scene.coverPath || scene.photoPath)
  ctx.save()
  ctx.translate(x + width * scale / 2, y + height * scale / 2)
  ctx.rotate(rotation * Math.PI / 180)
  ctx.scale(scale, scale)
  await drawPlayerTemplate(ctx, layer.templateId, scene.songInfo, scene.palette, { x: -width / 2, y: -height / 2, width, height }, coverPath, layer.colorMode)
  ctx.restore()
}

const renderText = (ctx, layer, scene) => {
  const { x = 0, y = 0, text = '', fontSize = 28, fontFamily = 'serif', color, align = 'left', scale = 1, rotation = 0 } = layer
  const textColor = color === 'auto'
    ? textColorForBackground(scene.palette?.[0]?.hex || '#eeefe8')
    : (color || '#2c2c2c')
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation * Math.PI / 180); ctx.scale(scale, scale)
  ctx.fillStyle = textColor
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  const maxWidth = layer.width || 420
  const lines = []
  for (const paragraph of String(text).split('\n')) {
    let line = ''
    for (const char of Array.from(paragraph)) {
      const candidate = line + char
      if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = char } else line = candidate
    }
    lines.push(line)
  }
  lines.forEach((line, index) => ctx.fillText(line, 0, index * fontSize * 1.25, maxWidth))
  ctx.restore()
}

const renderDecorationLayer = (ctx, layer, scene) => {
  drawDecorations(ctx, layer.decorations || [])
}

// ---- 主渲染入口 ----

const LAYER_RENDERERS = {
  background: renderBackground,
  photo: renderPhoto,
  player: renderPlayer,
  text: renderText,
  decoration: renderDecorationLayer
}

/**
 * 将场景渲染到 Canvas Context
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} scene - { canvas: { width, height }, palette, songInfo, layers }
 * @param {Map<string, Image>} images - 预加载的图片映射
 * @param {object} options - { showSelection?, selectedLayerId? }
 */
export const drawMusicCardScene = async (ctx, scene, images = new Map(), options = {}) => {
  const { width, height } = scene.canvas
  ctx.clearRect(0, 0, width, height)

  // 预加载所有 photo 层图片
  const photoLayers = (scene.layers || []).filter(l => l.type === 'photo' && l.imagePath)
  for (const layer of photoLayers) {
    if (!images.has(layer.imagePath)) {
      try {
        images.set(layer.imagePath, await loadCanvasImage(ctx.canvas, layer.imagePath))
      } catch (error) { throw new Error(`关键图片加载失败: ${error.message}`) }
    }
  }

  for (const layer of (scene.layers || [])) {
    if (layer.visible === false) continue
    const renderFn = LAYER_RENDERERS[layer.type]
    if (renderFn) {
      await renderFn(ctx, layer, scene, images)
    }
  }

  // 选中状态高亮
  if (options.showSelection && options.selectedLayerId) {
    const selectedLayer = scene.layers.find(l => l.id === options.selectedLayerId)
    if (selectedLayer) {
      ctx.strokeStyle = '#8fbc93'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.strokeRect(
        selectedLayer.x || 0, selectedLayer.y || 0,
        selectedLayer.width || 100, selectedLayer.height || 100
      )
      ctx.setLineDash([])
    }
  }
}

// ---- 导出辅助 ----

const toTempFilePath = (canvas, width, height) => new Promise((resolve, reject) => {
  wx.canvasToTempFilePath({
    canvas, x: 0, y: 0, width, height, destWidth: width, destHeight: height,
    fileType: 'png', quality: 1,
    success: result => resolve(result.tempFilePath),
    fail: reject
  })
})

/**
 * 渲染场景到临时 PNG 文件
 * @param {object} scene
 * @param {number} [dpi=300] - 输出 DPI
 * @returns {Promise<{filePath: string, width: number, height: number}>}
 */
export const exportMusicCard = async (scene, pixelRatio = 2) => {
  if (typeof wx === 'undefined' || !wx.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持离屏 Canvas')
  }

  const logicalW = scene.canvas.width
  const logicalH = scene.canvas.height
  const maxEdge = 4096
  const scale = Math.min(pixelRatio, maxEdge / Math.max(logicalW, logicalH))
  const exportW = Math.round(logicalW * scale)
  const exportH = Math.round(logicalH * scale)

  const canvas = wx.createOffscreenCanvas({ type: '2d', width: exportW, height: exportH })
  canvas.width = exportW
  canvas.height = exportH
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  const images = new Map()
  await drawMusicCardScene(ctx, scene, images)

  const filePath = await toTempFilePath(canvas, exportW, exportH)
  return { filePath, width: exportW, height: exportH, pixelRatio: scale }
}

/**
 * 渲染预览（最大 720px 边）
 */
export const renderMusicCardPreview = async (scene, maxEdge = 720) => {
  if (typeof wx === 'undefined' || !wx.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持离屏 Canvas')
  }

  const logicalW = scene.canvas.width
  const logicalH = scene.canvas.height
  const scale = maxEdge / Math.max(logicalW, logicalH)
  const previewW = Math.max(1, Math.round(logicalW * scale))
  const previewH = Math.max(1, Math.round(logicalH * scale))

  const canvas = wx.createOffscreenCanvas({ type: '2d', width: previewW, height: previewH })
  canvas.width = previewW
  canvas.height = previewH
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  const images = new Map()
  await drawMusicCardScene(ctx, scene, images)

  const filePath = await toTempFilePath(canvas, previewW, previewH)
  return { filePath, width: previewW, height: previewH }
}
