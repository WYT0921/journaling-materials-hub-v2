/** 六款 Music Widget — 纯微信 Canvas 2D 绘制，不读取或播放音频。 */
import templates from './templates/player-templates.json' with { type: 'json' }
import { textColorForBackground } from './color-extraction.mjs'
import { songProgress } from './editor.mjs'

export { templates as playerTemplates }

const LEGACY_TEMPLATE_IDS = { minimal: 'capsule', vintage: 'console', 'korean-pink': 'bubble', glass: 'waveform' }
export const normalizePlayerTemplateId = id => LEGACY_TEMPLATE_IDS[id] || id || 'capsule'

const loadCanvasImage = (canvas, path) => new Promise((resolve, reject) => {
  const image = canvas.createImage(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('封面加载失败')); image.src = path
})

const roundRect = (ctx, x, y, w, h, r) => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y); ctx.arcTo(x + w, y, x + w, y + radius, radius)
  ctx.lineTo(x + w, y + h - radius); ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius)
  ctx.lineTo(x + radius, y + h); ctx.arcTo(x, y + h, x, y + h - radius, radius)
  ctx.lineTo(x, y + radius); ctx.arcTo(x, y, x + radius, y, radius); ctx.closePath()
}

const strokeLine = (ctx, points, color, width, alpha = .78) => {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath()
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore()
}

const wrapTitle = (ctx, text, maxWidth, maxLines) => {
  const characters = Array.from(String(text || 'slow living')); const lines = []; let line = ''; let index = 0
  for (; index < characters.length; index++) {
    const candidate = line + characters[index]
    if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = characters[index]; if (lines.length === maxLines - 1) { index++; break } } else line = candidate
  }
  if (line) lines.push(line)
  if (index < characters.length) {
    let last = lines[maxLines - 1] || ''
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last}…`
  }
  return lines.slice(0, maxLines)
}

export const fitSongTitle = (ctx, text, maxWidth, baseSize, minSize, maxLines = 2, family = 'sans-serif') => {
  let fontSize = baseSize
  while (fontSize > minSize) { ctx.font = `600 ${fontSize}px ${family}`; if (ctx.measureText(text || 'slow living').width <= maxWidth * maxLines) break; fontSize-- }
  ctx.font = `600 ${fontSize}px ${family}`
  const lines = wrapTitle(ctx, text || 'slow living', maxWidth, maxLines)
  return { fontSize, lines, height: lines.length * fontSize * 1.14 }
}

const drawTitleBlock = (ctx, songInfo, x, y, maxWidth, color, baseSize, artistSize, family = 'sans-serif', align = 'left') => {
  const layout = fitSongTitle(ctx, songInfo?.songName || 'slow living', maxWidth, baseSize, Math.max(13, baseSize * .62), 2, family)
  ctx.save(); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.font = `600 ${layout.fontSize}px ${family}`
  layout.lines.forEach((line, index) => ctx.fillText(line, x, y + index * layout.fontSize * 1.14, maxWidth))
  const artistY = y + layout.height + 6; ctx.globalAlpha = .66; ctx.font = `${artistSize}px ${family}`; ctx.fillText(songInfo?.artist || 'just be', x, artistY, maxWidth); ctx.restore()
  return artistY + artistSize
}

const drawCover = (ctx, image, x, y, size, radius, fallback, ink) => {
  ctx.save(); roundRect(ctx, x, y, size, size, radius); ctx.clip()
  if (image) ctx.drawImage(image, x, y, size, size)
  else { ctx.fillStyle = fallback; ctx.fillRect(x, y, size, size); ctx.fillStyle = ink; ctx.globalAlpha = .55; ctx.font = `${size * .34}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', x + size / 2, y + size / 2) }
  ctx.restore()
}

const drawProgress = (ctx, x, y, width, progress, ink, accent, lineWidth) => {
  strokeLine(ctx, [[x, y], [x + width, y]], ink, lineWidth, .25); strokeLine(ctx, [[x, y], [x + width * progress, y]], accent, lineWidth * 1.25, .9)
  ctx.save(); ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x + width * progress, y, lineWidth * 1.6, 0, Math.PI * 2); ctx.fill(); ctx.restore()
}

const drawPlay = (ctx, cx, cy, size, ink, lineWidth) => {
  ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = lineWidth; ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2); ctx.stroke()
  strokeLine(ctx, [[cx - size * .2, cy - size * .36], [cx + size * .36, cy], [cx - size * .2, cy + size * .36], [cx - size * .2, cy - size * .36]], ink, lineWidth, .76); ctx.restore()
}

const drawControls = (ctx, cx, cy, gap, ink, lineWidth) => {
  drawPlay(ctx, cx, cy, gap * .24, ink, lineWidth)
  strokeLine(ctx, [[cx - gap + 5, cy - 8], [cx - gap - 5, cy], [cx - gap + 5, cy + 8]], ink, lineWidth, .62)
  strokeLine(ctx, [[cx + gap - 5, cy - 8], [cx + gap + 5, cy], [cx + gap - 5, cy + 8]], ink, lineWidth, .62)
}

const drawWaveform = (ctx, x, y, width, height, color, seed = 0) => {
  const bars = 34
  for (let index = 0; index < bars; index++) { const amplitude = (.2 + Math.abs(Math.sin(index * 1.73 + seed)) * .8) * height; strokeLine(ctx, [[x + index * width / (bars - 1), y - amplitude / 2], [x + index * width / (bars - 1), y + amplitude / 2]], color, Math.max(1.4, width * .005), .58) }
}

const drawLyrics = (ctx, songInfo, x, y, width, color, family, renderState = {}) => {
  if (!songInfo?.lyrics) return
  const style = renderState.lyricsStyle || 'minimal-serif'; const size = Math.max(11, 14 * (renderState.lyricsFontSize || 1))
  const styles = { 'center-poetry': { family: 'serif', weight: '400', prefix: '“ ', suffix: ' ”' }, editorial: { family: 'sans-serif', weight: '600', prefix: '— ', suffix: '' }, 'handwritten-note': { family: 'cursive', weight: '400', prefix: '♡ ', suffix: '' }, 'minimal-serif': { family: family || 'serif', weight: '400', prefix: '', suffix: '' } }
  const selected = styles[style] || styles['minimal-serif']
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = Number.isFinite(renderState.lyricsOpacity) ? renderState.lyricsOpacity : .56; ctx.font = `${selected.weight} ${size}px ${selected.family}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(`${selected.prefix}${String(songInfo.lyrics)}${selected.suffix}`, x + width / 2, y, width * .86); ctx.restore()
}

const colorsFor = (template, palette, colorMode) => {
  const selected = colorMode && !['auto', 'template'].includes(colorMode) ? colorMode : palette?.[0]?.hex
  const background = selected || '#e8eadf'
  const ink = template.colors.text === 'auto' ? textColorForBackground(background) : template.colors.text
  return { ink, accent: selected || palette?.[2]?.hex || '#8f9b79', background }
}

export const drawPlayerTemplate = async (ctx, templateId, songInfo, palette = [], bounds, coverPath, colorMode = 'auto', renderState = {}) => {
  const id = normalizePlayerTemplateId(templateId); const template = templates.find(item => item.id === id) || templates[0]
  const { x, y, width: W, height: H } = bounds; const { ink, accent, background } = colorsFor(template, palette, colorMode)
  const lineWidth = Math.max(2, W * .0032); const animationTime = renderState.animationTime || 0
  const baseProgress = Number.isFinite(renderState.progress) ? renderState.progress : songProgress(songInfo?.currentTime, songInfo?.totalTime)
  const progress = animationTime ? (baseProgress + animationTime * .018) % 1 : baseProgress
  let cover
  if (coverPath) { try { cover = await loadCanvasImage(ctx.canvas, coverPath) } catch { throw new Error('播放器封面加载失败') } }

  if (id === 'capsule') {
    drawTitleBlock(ctx, songInfo, x + W / 2, y + H * .06, W * .82, ink, W * .038, W * .022, 'sans-serif', 'center')
    strokeLine(ctx, [[x + W * .18, y + H * .43], [x + W * .82, y + H * .43]], ink, lineWidth, .36)
    drawProgress(ctx, x + W * .2, y + H * .66, W * .6, progress, ink, accent, lineWidth)
    drawControls(ctx, x + W / 2, y + H * .84, W * .13, ink, lineWidth)
  } else if (id === 'vinyl') {
    const cx = x + W * .31, cy = y + H * .47, radius = Math.min(H * .36, W * .22)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(animationTime * .72); drawCover(ctx, cover, -radius, -radius, radius * 2, radius, background, ink); ctx.restore()
    ;[radius, radius * .76, radius * .2].forEach((r, index) => { ctx.save(); ctx.strokeStyle = index === 2 ? accent : ink; ctx.globalAlpha = index === 2 ? .78 : .5; ctx.lineWidth = lineWidth; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore() })
    strokeLine(ctx, [[cx + radius * .58, cy - radius * .68], [cx + radius * 1.08, cy - radius * 1.05], [cx + radius * 1.12, cy + radius * .38]], ink, lineWidth, .52)
    drawTitleBlock(ctx, songInfo, x + W * .57, y + H * .22, W * .36, ink, W * .034, W * .021, 'serif')
    drawProgress(ctx, x + W * .57, y + H * .7, W * .34, progress, ink, accent, lineWidth)
  } else if (id === 'console') {
    ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = lineWidth * 1.2; ctx.globalAlpha = .75; roundRect(ctx, x + W * .07, y + H * .08, W * .86, H * .72, W * .015); ctx.stroke(); ctx.restore()
    drawTitleBlock(ctx, songInfo, x + W * .13, y + H * .13, W * .54, ink, W * .03, W * .019)
    drawWaveform(ctx, x + W * .15, y + H * .53, W * .7, H * .16, accent, animationTime * 2.2)
    drawProgress(ctx, x + W * .15, y + H * .72, W * .7, progress, ink, accent, lineWidth)
  } else if (id === 'bubble') {
    const size = H * .62, sx = x + W * .1, sy = y + H * .15
    drawCover(ctx, cover, sx, sy, size, W * .01, background, ink); ctx.save(); ctx.strokeStyle = ink; ctx.globalAlpha = .75; ctx.lineWidth = lineWidth; roundRect(ctx, sx, sy, size, size, W * .01); ctx.stroke(); ctx.restore()
    drawTitleBlock(ctx, songInfo, x + W * .48, y + H * .2, W * .43, ink, W * .032, W * .02)
    drawProgress(ctx, x + W * .48, y + H * .64, W * .4, progress, ink, accent, lineWidth)
    drawControls(ctx, x + W * .68, y + H * .81, W * .1, ink, lineWidth)
  } else if (id === 'waveform') {
    const cx = x + W / 2, cy = y + H * .4
    ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = lineWidth * 1.25; ctx.globalAlpha = .64; ctx.beginPath(); ctx.arc(cx, cy, H * .3, Math.PI, Math.PI * 2); ctx.stroke(); ctx.restore()
    ;[-1, 1].forEach(direction => { ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = lineWidth; ctx.globalAlpha = .72; roundRect(ctx, cx + direction * H * .34 - H * .055, cy - H * .03, H * .11, H * .28, H * .055); ctx.stroke(); ctx.restore() })
    drawWaveform(ctx, cx - W * .2, cy + H * .09, W * .4, H * .13, accent, .6 + animationTime * 2.2)
    drawTitleBlock(ctx, songInfo, cx, y + H * .72, W * .58, ink, W * .031, W * .019, 'sans-serif', 'center')
  } else {
    const size = H * .43, sx = x + W * .03, sy = y + H * .06
    drawCover(ctx, cover, sx, sy, size, W * .008, background, ink)
    strokeLine(ctx, [[sx + 2, sy], [sx + size - 3, sy - 2], [sx + size + 2, sy + size - 2], [sx - 2, sy + size + 3], [sx + 2, sy]], ink, lineWidth, .72)
    drawTitleBlock(ctx, songInfo, x + W * .4, y + H * .08, W * .55, ink, W * .032, W * .02, 'serif')
    drawProgress(ctx, x + W * .03, y + H * .61, W * .92, progress, ink, accent, lineWidth)
    drawControls(ctx, x + W / 2, y + H * .82, W * .14, ink, lineWidth)
  }
  drawLyrics(ctx, songInfo, x, y + H * .98, W, ink, template.fontFamily, renderState)
}
