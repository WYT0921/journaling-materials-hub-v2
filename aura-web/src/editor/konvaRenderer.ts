import Konva from 'konva'
import type { AuraMotion, AuraProject, AuraTemplate } from '../types/aura'
import { ratioSize } from '../types/aura'

export interface RenderOptions { container: HTMLDivElement; project: AuraProject; template: AuraTemplate; photoUrl?: string; width: number }

export async function renderAuraStage({ container, project, photoUrl, width }: RenderOptions): Promise<Konva.Stage> {
  const [exportWidth, exportHeight] = ratioSize(project.ratio)
  const height = width * exportHeight / exportWidth
  const stage = new Konva.Stage({ container, width, height })
  const layer = new Konva.Layer(); stage.add(layer)
  paintBackground(layer, project, width, height)
  if (photoUrl) await paintPhoto(layer, project, photoUrl, width, height)
  paintPlayer(layer, project, width, height)
  paintNotes(layer, project, width, height)
  paintQuote(layer, project, width, height)
  layer.draw()
  return stage
}

function paintBackground(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const a = project.adjustments, first = project.palette[a.paletteIndex] || '#fff8ed', second = project.palette[a.secondaryPaletteIndex] || '#f7d9df'
  layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: first }))
  const topHeight = height * a.photoSplit
  if (a.background === 'gradient') layer.add(new Konva.Rect({ x: 0, y: 0, width, height: topHeight, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: width, y: topHeight }, fillLinearGradientColorStops: [0, '#fffaf2', .45, first, 1, second] }))
  if (a.background === 'stripes') {
    const stripe = Math.max(5, width / a.stripeDensity)
    const group = new Konva.Group({ clip: { x: 0, y: 0, width, height: topHeight } })
    for (let x = -width; x < width * 2; x += stripe * 2) group.add(new Konva.Rect({ x, y: -height, width: stripe, height: height * 3, fill: second, rotation: a.stripeAngle - 90, opacity: .72 }))
    layer.add(group)
  }
  if (a.background === 'paper') {
    layer.add(new Konva.Rect({ x: 0, y: 0, width, height: topHeight, fill: '#f3eadb' }))
    for (let y = 0; y < topHeight; y += Math.max(6, height / 100)) layer.add(new Konva.Line({ points: [0, y, width, y + 1], stroke: '#927b5e', opacity: .06 }))
  }
}

async function paintPhoto(layer: Konva.Layer, project: AuraProject, url: string, width: number, height: number) {
  const image = await loadImage(url), y = height * project.adjustments.photoSplit, targetHeight = height - y
  const crop = coverCrop(image, width / targetHeight, project.adjustments.photoScale, project.adjustments.photoOffsetX, project.adjustments.photoOffsetY)
  layer.add(new Konva.Image({ image, x: 0, y, width, height: targetHeight, crop }))
  layer.add(new Konva.Line({ points: [0, y, width, y], stroke: '#ffffff', opacity: .28, strokeWidth: Math.max(1, width * .003) }))
}

function playerBox(project: AuraProject, width: number, height: number) {
  const scale = project.adjustments.playerScale, w = width * .52 * scale, h = width * .17 * scale
  return { x: (width - w) / 2, y: height * project.adjustments.photoSplit * .38 - h / 2, w, h }
}

function paintPlayer(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const { x, y, w, h } = playerBox(project, width, height), style = project.adjustments.playerStyle
  const ink = project.palette[4] || '#302c2a', accent = project.palette[project.adjustments.noteColorIndex] || '#9f7f65'
  const group = new Konva.Group({ name: 'aura-player' }); layer.add(group)
  const thin = width * .0018, medium = width * .003
  const line = (x1: number, y1: number, x2: number, y2 = y1, color = ink, opacity = .62, size = thin) => group.add(new Konva.Line({ points: [x1, y1, x2, y2], stroke: color, opacity, strokeWidth: size, lineCap: 'round', lineJoin: 'round' }))
  const outline = (px: number, py: number, pw: number, ph: number, radius = 0) => group.add(new Konva.Rect({ x: px, y: py, width: pw, height: ph, cornerRadius: radius, stroke: ink, strokeWidth: thin, opacity: .5 }))
  const progress = (px: number, py: number, pw: number) => { line(px, py, px + pw, py, ink, .22); line(px, py, px + pw * project.adjustments.progress, py, accent, .88, medium); group.add(new Konva.Circle({ x: px + pw * project.adjustments.progress, y: py, radius: width * .0042, fill: accent })) }
  const play = (cx: number, cy: number, radius: number) => { group.add(new Konva.Circle({ x: cx, y: cy, radius, stroke: ink, strokeWidth: thin, opacity: .62 })); group.add(new Konva.Line({ points: [cx - radius * .2, cy - radius * .34, cx + radius * .34, cy, cx - radius * .2, cy + radius * .34], closed: true, stroke: ink, strokeWidth: thin, opacity: .72 })) }
  const controls = (cx: number, cy: number, gap: number) => {
    play(cx, cy, width * .018)
    line(cx - gap, cy - width * .011, cx - gap, cy + width * .011, ink, .55)
    group.add(new Konva.Line({ points: [cx - gap + width * .014, cy - width * .011, cx - gap + width * .002, cy, cx - gap + width * .014, cy + width * .011], stroke: ink, strokeWidth: thin, opacity: .6 }))
    line(cx + gap, cy - width * .011, cx + gap, cy + width * .011, ink, .55)
    group.add(new Konva.Line({ points: [cx + gap - width * .014, cy - width * .011, cx + gap - width * .002, cy, cx + gap - width * .014, cy + width * .011], stroke: ink, strokeWidth: thin, opacity: .6 }))
  }
  const title = (tx: number, ty: number, tw: number, align: 'left' | 'center' = 'left') => {
    group.add(new Konva.Text({ x: tx, y: ty, width: tw, text: project.music.songName || 'slow living', fill: ink, align, fontFamily: 'Courier New, monospace', fontSize: width * .019, letterSpacing: width * .0013, ellipsis: true, wrap: 'none' }))
    group.add(new Konva.Text({ x: tx, y: ty + h * .18, width: tw, text: project.music.artist || 'just be', fill: ink, align, fontFamily: 'Courier New, monospace', opacity: .46, fontSize: width * .0115, letterSpacing: width * .0008, ellipsis: true, wrap: 'none' }))
  }

  const cordX = width / 2, cordEnd = Math.max(height * .035, y - h * .16), cordStep = Math.max(5, width * .012), cordPoints: number[] = []
  for (let py = 0; py <= cordEnd; py += cordStep) cordPoints.push(cordX + (Math.round(py / cordStep) % 2 ? width * .0035 : -width * .0035), py)
  group.add(new Konva.Line({ points: cordPoints, stroke: ink, strokeWidth: thin, opacity: .28, lineCap: 'round', lineJoin: 'round' }))
  line(cordX - width * .025, cordEnd, cordX + width * .025, cordEnd, ink, .38, medium)

  if (style === 'capsule') {
    title(x, y + h * .03, w, 'center')
    line(x + w * .12, y + h * .48, x + w * .88, y + h * .48, ink, .46)
    line(x + w * .2, y + h * .58, x + w * .8, y + h * .58, ink, .28)
    progress(x + w * .2, y + h * .72, w * .6)
    controls(x + w / 2, y + h * .93, w * .25)
  } else if (style === 'vinyl') {
    const cx = x + w * .34, cy = y + h * .52
    for (const radius of [h * .36, h * .27, h * .09]) group.add(new Konva.Circle({ x: cx, y: cy, radius, stroke: radius === h * .09 ? accent : ink, strokeWidth: thin, opacity: radius === h * .09 ? .75 : .42 }))
    line(cx + h * .22, cy - h * .26, cx + h * .42, cy - h * .4, ink, .48)
    line(cx + h * .42, cy - h * .4, cx + h * .44, cy + h * .16, ink, .48)
    title(x + w * .57, y + h * .29, w * .34)
    progress(x + w * .57, y + h * .72, w * .33)
  } else if (style === 'console') {
    outline(x + w * .08, y + h * .12, w * .84, h * .74, width * .004)
    line(x + w * .08, y + h * .32, x + w * .92, y + h * .32, ink, .3)
    title(x + w * .12, y + h * .16, w * .5)
    addWaveform(group, x + w * .16, y + h * .58, w * .68, h * .2, accent)
    progress(x + w * .16, y + h * .78, w * .68)
    group.add(new Konva.Circle({ x: x + w * .83, y: y + h * .22, radius: width * .006, stroke: ink, strokeWidth: thin, opacity: .5 }))
  } else if (style === 'bubble') {
    const size = h * .7, sx = x + w * .16, sy = y + h * .18
    outline(sx, sy, size, size, width * .004)
    line(sx + size * .14, sy + size * .72, sx + size * .38, sy + size * .46, accent, .65)
    line(sx + size * .38, sy + size * .46, sx + size * .58, sy + size * .62, accent, .65)
    group.add(new Konva.Circle({ x: sx + size * .72, y: sy + size * .27, radius: width * .006, stroke: accent, strokeWidth: thin, opacity: .7 }))
    title(x + w * .48, y + h * .23, w * .36)
    progress(x + w * .48, y + h * .67, w * .36)
    controls(x + w * .66, y + h * .89, w * .12)
  } else if (style === 'waveform') {
    const cx = x + w / 2, cy = y + h * .48
    group.add(new Konva.Arc({ x: cx, y: cy, innerRadius: h * .42, outerRadius: h * .43, angle: 180, rotation: 180, fill: ink, opacity: .55 }))
    outline(cx - h * .52, cy - h * .02, h * .13, h * .38, h * .065)
    outline(cx + h * .39, cy - h * .02, h * .13, h * .38, h * .065)
    addWaveform(group, cx - w * .22, cy + h * .08, w * .44, h * .18, accent)
    title(x + w * .26, y + h * .81, w * .48, 'center')
  } else {
    title(x + w * .22, y - h * .15, w * .56, 'center')
    const baseline = y + h * .58, points = [x, baseline, x + w * .15, baseline, x + w * .22, baseline - h * .12, x + w * .28, baseline + h * .14, x + w * .34, baseline]
    const heart = [x + w * .41, baseline - h * .02, x + w * .46, baseline - h * .2, x + w * .54, baseline - h * .2, x + w * .59, baseline - h * .02, x + w * .5, baseline + h * .22, x + w * .41, baseline - h * .02]
    group.add(new Konva.Line({ points: [...points, ...heart, x + w * .66, baseline, x + w * .72, baseline - h * .14, x + w * .78, baseline + h * .13, x + w * .84, baseline, x + w, baseline], stroke: accent, strokeWidth: medium, lineCap: 'round', lineJoin: 'round', opacity: .78 }))
    progress(x + w * .18, y + h * .92, w * .64)
  }
}

function addWaveform(group: Konva.Group, x: number, y: number, width: number, height: number, color: string) {
  for (let index = 0; index < 34; index++) {
    const amplitude = (.2 + Math.abs(Math.sin(index * 1.73)) * .8) * height
    group.add(new Konva.Line({ points: [x + index * width / 33, y - amplitude / 2, x + index * width / 33, y + amplitude / 2], stroke: color, strokeWidth: Math.max(1, width * .0045), opacity: .58, lineCap: 'round' }))
  }
}

function paintNotes(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const a = project.adjustments, { y, h } = playerBox(project, width, height), startY = y + h * .9, endY = height * .84
  const color = project.palette[a.noteColorIndex] || '#9f7f65', count = a.decorationDensity
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? .5 : i / (count - 1), p = notePoint(a.notePath, t, width, startY, endY, i)
    const symbols = a.noteStyle === 'single' ? ['♪'] : a.noteStyle === 'double' ? ['♫'] : ['♪', '♫', '♬']
    layer.add(new Konva.Text({ name: 'aura-note', x: p.x, y: p.y, text: symbols[i % symbols.length], fill: color, opacity: .58, fontFamily: 'serif', fontSize: width * (.017 + (i % 3) * .005), rotation: p.rotation, id: `note-${i}` }))
  }
}

function notePoint(path: AuraProject['adjustments']['notePath'], t: number, width: number, startY: number, endY: number, index: number) {
  const center = width / 2, range = endY - startY
  if (path === 'arc') return { x: center + Math.sin(t * Math.PI * 2.1) * width * .16, y: startY + t * range, rotation: Math.sin(t * 8) * 18 }
  if (path === 'sparse') return { x: center + (((index * 47) % 100) / 100 - .5) * width * .28, y: startY + t * range, rotation: index % 2 ? 12 : -10 }
  if (path === 'spiral') { const radius = width * (.04 + t * .17), angle = t * Math.PI * 4; return { x: center + Math.cos(angle) * radius, y: startY + t * range, rotation: angle * 20 } }
  if (path === 'scatter') return { x: width * (.18 + ((index * 37) % 65) / 100), y: startY + ((index * 29) % 100) / 100 * range, rotation: index * 9 % 30 - 15 }
  return { x: center + Math.sin(index * 1.8) * width * .055, y: startY + t * range, rotation: index % 2 ? 8 : -8 }
}

function paintQuote(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const a = project.adjustments
  if (!a.quoteVisible || !project.music.quote) return
  const family = a.textFont === 'serif' ? 'Georgia, serif' : a.textFont === 'rounded' ? 'Arial Rounded MT Bold, sans-serif' : 'Arial, sans-serif'
  layer.add(new Konva.Text({ x: width * .08, y: height * .92, width: width * .84, text: project.music.quote, align: a.textAlign, fill: project.palette[a.textColorIndex] || '#302c2a', fontSize: width * .024, fontFamily: family, opacity: .86, ellipsis: true, wrap: 'none', shadowColor: '#fff', shadowBlur: width * .006, shadowOpacity: .55 }))
}

export function createAuraMotionController(stage: Konva.Stage, motion: AuraMotion) {
  const notes = stage.find('.aura-note'), origins = notes.map(node => ({ x: node.x(), y: node.y(), rotation: node.rotation(), opacity: node.opacity(), scale: node.scaleX() }))
  const render = (time: number) => {
    notes.forEach((node, index) => {
      const base = origins[index], phase = time / 850 + index * .36
      node.position({ x: base.x, y: base.y }); node.rotation(base.rotation); node.opacity(base.opacity); node.scale({ x: base.scale, y: base.scale })
      if (motion === 'fall') node.y(base.y + (Math.sin(phase) + 1) * stage.height() * .018)
      if (motion === 'breathe') node.scale({ x: .82 + Math.sin(phase) * .18, y: .82 + Math.sin(phase) * .18 })
      if (motion === 'together') node.opacity(.48 + (Math.sin(time / 420) + 1) * .25)
      if (motion === 'sequence') node.opacity(Math.max(.15, (Math.sin(phase * 1.4) + 1) / 2))
      if (motion === 'rotate') node.rotation(base.rotation + time / 28)
    })
    stage.batchDraw()
  }
  const reset = () => { notes.forEach((node, index) => { const base = origins[index]; node.position(base); node.rotation(base.rotation); node.opacity(base.opacity); node.scale({ x: base.scale, y: base.scale }) }); stage.batchDraw() }
  return { render, reset }
}

export function animateAuraStage(stage: Konva.Stage, motion: AuraMotion): () => void {
  const controller = createAuraMotionController(stage, motion)
  let frame = 0, running = true
  const tick = (time: number) => { if (!running) return; controller.render(time); frame = requestAnimationFrame(tick) }
  frame = requestAnimationFrame(tick)
  return () => { running = false; cancelAnimationFrame(frame); controller.reset() }
}

function coverCrop(image: HTMLImageElement, ratio: number, scale: number, offsetX: number, offsetY: number) {
  let width = image.naturalWidth, height = image.naturalHeight
  if (width / height > ratio) width = height * ratio; else height = width / ratio
  width /= scale; height /= scale
  const maxX = image.naturalWidth - width, maxY = image.naturalHeight - height
  return { x: Math.max(0, Math.min(maxX, maxX / 2 + offsetX * maxX / 2)), y: Math.max(0, Math.min(maxY, maxY / 2 + offsetY * maxY / 2)), width, height }
}
function loadImage(url: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('照片加载失败')); image.src = url }) }

export async function exportAuraPng(project: AuraProject, template: AuraTemplate, photoUrl?: string): Promise<Blob> {
  const [width] = ratioSize(project.ratio), container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;'; document.body.appendChild(container)
  try {
    const stage = await renderAuraStage({ container, project, template, photoUrl, width })
    const blob = await stage.toBlob({ mimeType: 'image/png', pixelRatio: 1 }) as Blob | null
    stage.destroy(); if (!blob) throw new Error('PNG 导出失败'); return blob
  } finally { container.remove() }
}
