/**
 * 播放器模板绘制 — 纯 Canvas 2D
 * 视觉组件，非实际播放功能
 */

import templates from './templates/player-templates.json' with { type: 'json' }
import { textColorForBackground } from './color-extraction.mjs'
import { songProgress } from './editor.mjs'

export { templates as playerTemplates }

const loadCanvasImage = (canvas, path) => new Promise((resolve, reject) => {
  const image = canvas.createImage()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('封面加载失败'))
  image.src = path
})

const layerSeed = songInfo => Array.from(`${songInfo?.songName || ''}|${songInfo?.artist || ''}`)
  .reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 37)

// ---- 辅助绘制函数 ----

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

const drawPlayButton = (ctx, cx, cy, size, color) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.3, cy - size * 0.4)
  ctx.lineTo(cx - size * 0.3, cy + size * 0.4)
  ctx.lineTo(cx + size * 0.4, cy)
  ctx.closePath()
  ctx.fill()
}

const drawPauseButton = (ctx, cx, cy, size, color) => {
  ctx.fillStyle = color
  const barW = size * 0.15, barH = size * 0.7
  ctx.fillRect(cx - size * 0.3, cy - barH / 2, barW, barH)
  ctx.fillRect(cx + size * 0.3 - barW, cy - barH / 2, barW, barH)
}

const drawSkipButton = (ctx, cx, cy, size, color, dir = 1) => {
  ctx.fillStyle = color
  ctx.beginPath()
  const hw = size * 0.25
  const barW = size * 0.08, barH = size * 0.55
  if (dir === 1) {
    ctx.moveTo(cx - hw, cy - hw); ctx.lineTo(cx - hw, cy + hw); ctx.lineTo(cx + hw * 0.3, cy); ctx.closePath()
    ctx.fill()
    ctx.fillRect(cx + hw * 0.5, cy - barH / 2, barW, barH)
  } else {
    ctx.moveTo(cx + hw, cy - hw); ctx.lineTo(cx + hw, cy + hw); ctx.lineTo(cx - hw * 0.3, cy); ctx.closePath()
    ctx.fill()
    ctx.fillRect(cx - hw * 0.5 - barW, cy - barH / 2, barW, barH)
  }
}

const drawProgressBar = (ctx, x, y, w, h, progress = 0.35, color = '#999', bgColor = 'rgba(0,0,0,0.1)') => {
  ctx.fillStyle = bgColor
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = color
  roundRect(ctx, x, y, w * progress, h, h / 2)
  ctx.fill()
}

const drawWaveform = (ctx, x, y, w, h, color, bars = 40, seed = 37) => {
  const barW = (w / bars) * 0.6
  const gap = (w / bars) * 0.4
  ctx.fillStyle = color
  for (let i = 0; i < bars; i++) {
    const amp = 0.2 + Math.abs(Math.sin(i * 0.5 + seed * 0.013)) * 0.6
    const barH = h * amp
    ctx.fillRect(x + i * (barW + gap), y + (h - barH) / 2, barW, barH)
  }
}

const drawVinylDisc = (ctx, cx, cy, radius) => {
  // 唱片主体
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill()

  // 环形纹路
  for (let r = radius * 0.25; r < radius * 0.95; r += radius * 0.06) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.03 + ((r * 17) % 7) / 100})`
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
  }

  // 中心标签
  ctx.fillStyle = '#c4a265'
  ctx.beginPath(); ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath(); ctx.arc(cx, cy, radius * 0.05, 0, Math.PI * 2); ctx.fill()
}

// ---- 主绘制函数 ----

/**
 * 在给定区域绘制播放器模板
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} templateId - 模板 ID
 * @param {object} songInfo - { songName, artist, album? }
 * @param {Array} palette - 主色调调色板
 * @param {object} bounds - { x, y, width, height }
 * @param {string} [coverPath] - 可选专辑封面图片路径
 */
export const drawPlayerTemplate = async (ctx, templateId, songInfo, palette, bounds, coverPath, colorMode = 'auto') => {
  const template = templates.find(t => t.id === templateId) || templates[0]
  const { x, y, width: W, height: H } = bounds
  const pad = W * (template.padding || 0.06)
  const coverSize = W * template.coverSize

  const effectivePalette = colorMode && colorMode !== 'auto' && colorMode !== 'template'
    ? [{ hex: colorMode }, ...(palette || [])]
    : palette
  const textColor = template.colors.text === 'auto'
    ? textColorForBackground(effectivePalette?.[0]?.hex || '#eeefe8')
    : template.colors.text
  const progressColor = template.colors.progress === 'auto'
    ? effectivePalette?.[0]?.hex || '#8fbc93'
    : template.colors.progress
  const controlColor = template.colors.control === 'auto'
    ? textColor
    : template.colors.control

  // 模板背景
  if (template.colors.background !== 'transparent') {
    ctx.fillStyle = template.colors.background
    roundRect(ctx, x, y, W, H, 16)
    ctx.fill()
  }

  // Glass 效果：半透明叠加
  if (template.colors.glass) {
    ctx.fillStyle = template.colors.glass
    roundRect(ctx, x, y, W, H, 16)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    roundRect(ctx, x, y, W, H, 16)
    ctx.stroke()
  }

  // Vintage 叠加纸质纹理
  if (template.id === 'vintage') {
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, x, y, W, H, 4)
    ctx.clip()
    ctx.fillStyle = 'rgba(110,85,50,0.05)'
    for (let i = 0; i < 90; i++) {
      const px = x + ((i * 47) % 97) / 97 * W
      const py = y + ((i * 71) % 89) / 89 * H
      ctx.fillRect(px, py, 1.2, 1.2)
    }
    ctx.restore()
  }

  const innerX = x + pad
  const innerY = y + pad
  const coverX = innerX
  const coverY = innerY
  const infoX = coverX + coverSize + pad
  const infoW = W - coverSize - pad * 3

  // 专辑封面
  if (coverPath) {
    try {
      const coverImage = await loadCanvasImage(ctx.canvas, coverPath)
      ctx.save()
      roundRect(ctx, coverX, coverY, coverSize, coverSize, template.albumArtBorderRadius)
      ctx.clip()
      ctx.drawImage(coverImage, coverX, coverY, coverSize, coverSize)
      ctx.restore()
    } catch { throw new Error('播放器封面加载失败') }
  } else {
    // 无封面时绘制调色板颜色占位
    ctx.fillStyle = palette[0]?.hex || '#ddd'
    roundRect(ctx, coverX, coverY, coverSize, coverSize, template.albumArtBorderRadius)
    ctx.fill()
    // 音符图标
    ctx.fillStyle = textColor
    ctx.font = `${coverSize * 0.4}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('♪', coverX + coverSize / 2, coverY + coverSize / 2)
  }

  // 歌曲名
  const titleY = coverY + coverSize * 0.15
  ctx.fillStyle = textColor
  ctx.font = `600 ${template.titleSize}px ${template.fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const title = songInfo?.songName || '歌曲名称'
  const maxTitleW = infoW - pad
  ctx.fillText(title.length > 12 ? title.slice(0, 11) + '…' : title, infoX, titleY, maxTitleW)

  // 艺术家
  const artistY = titleY + template.titleSize + 8
  ctx.fillStyle = textColor + '99'
  ctx.font = `${template.artistSize}px ${template.fontFamily}`
  ctx.fillText((songInfo?.artist || '艺术家'), infoX, artistY, maxTitleW)

  // 专辑（如果有）
  if (songInfo?.album) {
    const albumY = artistY + template.artistSize + 4
    ctx.fillStyle = textColor + '66'
    ctx.font = `${template.artistSize - 2}px ${template.fontFamily}`
    ctx.fillText(songInfo.album, infoX, albumY, maxTitleW)
  }

  // 进度条
  const controlsY = Math.max(coverY + coverSize, artistY + template.artistSize * 3) - 30
  const progressY = controlsY - 30

  if (template.showProgress) {
    drawProgressBar(ctx, infoX, progressY, infoW, 4, songProgress(songInfo?.currentTime, songInfo?.totalTime), progressColor)
    // 时间标签
    ctx.fillStyle = textColor + '66'
    ctx.font = `10px ${template.fontFamily}`
    ctx.fillText(songInfo?.currentTime || '1:24', infoX, progressY - 16)
    ctx.textAlign = 'right'
    ctx.fillText(songInfo?.totalTime || '3:32', infoX + infoW, progressY - 16)
    ctx.textAlign = 'left'
  }

  // 波形图
  if (template.showWaveform) {
    const waveColor = template.colors.waveform === 'auto' ? palette[0]?.hex || '#e9acbb' : template.colors.waveform
    drawWaveform(ctx, infoX, progressY - 40, infoW, 30, waveColor, 40, layerSeed(songInfo))
  }

  // 播放控件
  if (template.showControls) {
    const btnSize = template.artistSize + 4
    const ctrlCenterY = template.showProgress ? controlsY + btnSize / 2 + 10 : controlsY
    const ctrlCenterX = infoX + infoW / 2
    drawSkipButton(ctx, ctrlCenterX - btnSize * 1.5, ctrlCenterY, btnSize, controlColor, -1)
    drawPauseButton(ctx, ctrlCenterX, ctrlCenterY, btnSize * 1.1, controlColor)
    drawSkipButton(ctx, ctrlCenterX + btnSize * 1.5, ctrlCenterY, btnSize, controlColor, 1)
  }

  // Vinyl 黑胶唱片
  if (template.showVinyl) {
    drawVinylDisc(ctx, x + W / 2, y + H * 0.6, W * 0.35)
  }
}
