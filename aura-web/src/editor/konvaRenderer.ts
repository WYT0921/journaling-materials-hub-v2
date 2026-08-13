import Konva from 'konva'
import type { AuraProject, AuraTemplate } from '../types/aura'
import { ratioSize } from '../types/aura'

export interface RenderOptions {
  container: HTMLDivElement
  project: AuraProject
  template: AuraTemplate
  photoUrl?: string
  width: number
}

export async function renderAuraStage(options: RenderOptions): Promise<Konva.Stage> {
  const { container, project, template, photoUrl, width } = options
  const [exportWidth, exportHeight] = ratioSize(project.ratio)
  const height = width * exportHeight / exportWidth
  const stage = new Konva.Stage({ container, width, height })
  const layer = new Konva.Layer()
  stage.add(layer)
  paintBackground(layer, project, width, height)
  if (photoUrl) await paintPhoto(layer, project, template, photoUrl, width, height)
  paintPlayer(layer, project, template, width, height)
  paintDecorations(layer, project, template, width, height)
  layer.draw()
  return stage
}

function paintBackground(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const selected = project.palette[project.adjustments.paletteIndex] || project.palette[0]
  const fill = project.adjustments.background === 'dark' ? '#242426'
    : project.adjustments.background === 'cream' ? '#fffaf2'
    : project.adjustments.background === 'paper' ? '#eee4d2'
    : { start: { x: 0, y: 0 }, end: { x: width, y: height }, colorStops: [0, '#fffaf2', .45, selected, 1, project.palette[1] || '#f7d9df'] }
  layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: typeof fill === 'string' ? fill : undefined, fillLinearGradientStartPoint: typeof fill === 'string' ? undefined : fill.start, fillLinearGradientEndPoint: typeof fill === 'string' ? undefined : fill.end, fillLinearGradientColorStops: typeof fill === 'string' ? undefined : fill.colorStops }))
  if (project.adjustments.background === 'paper') {
    for (let y = 0; y < height; y += Math.max(7, height / 90)) layer.add(new Konva.Line({ points: [0, y, width, y + 1], stroke: '#8f7650', opacity: .055, strokeWidth: 1 }))
  }
}

async function paintPhoto(layer: Konva.Layer, project: AuraProject, template: AuraTemplate, url: string, width: number, height: number) {
  const config = template.config.layers.find(item => item.type === 'photo')
  if (!config) return
  const image = await loadImage(url)
  const x = (config.x ?? .05) * width
  const y = (config.y ?? .42) * height
  const targetWidth = (config.width ?? .9) * width
  const targetHeight = (config.height ?? .53) * height
  const crop = coverCrop(image, targetWidth / targetHeight, project.adjustments.photoScale, project.adjustments.photoOffsetX, project.adjustments.photoOffsetY)
  const group = new Konva.Group({ x, y, clipFunc: context => roundedRect(context, 0, 0, targetWidth, targetHeight, width * .025) })
  group.add(new Konva.Image({ image, width: targetWidth, height: targetHeight, crop }))
  layer.add(group)
}

function paintPlayer(layer: Konva.Layer, project: AuraProject, template: AuraTemplate, width: number, height: number) {
  const config = template.config.layers.find(item => item.type === 'player')
  if (!config) return
  const x = (config.x ?? .08) * width, y = (config.y ?? .08) * height
  const w = (config.width ?? .84) * width, h = (config.height ?? .28) * height
  const dark = project.adjustments.background === 'dark'
  const fill = template.style === 'cute' ? '#fff0f5' : template.style === 'vintage' ? '#f4ead7' : dark ? '#ffffff22' : '#ffffffd9'
  layer.add(new Konva.Rect({ x, y, width: w, height: h, cornerRadius: width * .035, fill, shadowColor: '#3d3027', shadowOpacity: .12, shadowBlur: width * .035, shadowOffsetY: width * .01 }))
  const ink = dark ? '#fffaf2' : '#332f2c'
  if (template.style === 'vinyl') {
    layer.add(new Konva.Circle({ x: x + h * .42, y: y + h * .5, radius: h * .28, fill: '#252326' }))
    layer.add(new Konva.Circle({ x: x + h * .42, y: y + h * .5, radius: h * .08, fill: project.palette[1] }))
  }
  const textX = template.style === 'vinyl' ? x + h * .8 : x + w * .08
  const maxTextWidth = x + w - textX - w * .06
  layer.add(new Konva.Text({ x: textX, y: y + h * .2, width: maxTextWidth, text: project.music.songName || 'Song of the day', fill: ink, fontFamily: 'Georgia, serif', fontStyle: 'bold', fontSize: Math.max(13, width * .055), ellipsis: true, wrap: 'none' }))
  layer.add(new Konva.Text({ x: textX, y: y + h * .48, width: maxTextWidth, text: project.music.artist || 'Your favorite artist', fill: ink, opacity: .65, fontFamily: 'Arial, sans-serif', fontSize: Math.max(9, width * .026), ellipsis: true, wrap: 'none' }))
  const barY = y + h * .72
  layer.add(new Konva.Line({ points: [textX, barY, x + w * .9, barY], stroke: ink, opacity: .18, strokeWidth: Math.max(2, width * .006), lineCap: 'round' }))
  layer.add(new Konva.Line({ points: [textX, barY, textX + (x + w * .9 - textX) * .42, barY], stroke: project.palette[3] || ink, strokeWidth: Math.max(2, width * .006), lineCap: 'round' }))
}

function paintDecorations(layer: Konva.Layer, project: AuraProject, template: AuraTemplate, width: number, height: number) {
  const symbols = template.style === 'cute' ? ['♡', '✦', '୨୧', '☆'] : template.style === 'vintage' ? ['✦', '35mm', '⌁', '•'] : ['✦', '♡', '☁', '⋆']
  for (let index = 0; index < project.adjustments.decorationDensity; index++) {
    const left = ((index * 37 + 11) % 91) / 100 * width
    const top = (.34 + ((index * 29) % 61) / 100 * .62) * height
    layer.add(new Konva.Text({ x: left, y: top, text: symbols[index % symbols.length], fill: project.palette[(index + 2) % project.palette.length], opacity: .8, fontSize: width * (.03 + (index % 3) * .012), rotation: (index % 2 ? 1 : -1) * 8 }))
  }
  if (project.music.quote) layer.add(new Konva.Text({ x: width * .09, y: height * .95, width: width * .82, text: project.music.quote, align: 'center', fill: project.adjustments.background === 'dark' ? '#fff' : '#4c4741', fontSize: width * .026, fontFamily: 'Georgia, serif', opacity: .78, ellipsis: true, wrap: 'none' }))
}

function coverCrop(image: HTMLImageElement, ratio: number, scale: number, offsetX: number, offsetY: number) {
  let width = image.naturalWidth, height = image.naturalHeight
  if (width / height > ratio) width = height * ratio
  else height = width / ratio
  width /= scale; height /= scale
  const maxX = image.naturalWidth - width, maxY = image.naturalHeight - height
  return { x: Math.max(0, Math.min(maxX, maxX / 2 + offsetX * maxX / 2)), y: Math.max(0, Math.min(maxY, maxY / 2 + offsetY * maxY / 2)), width, height }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('照片加载失败'))
    image.src = url
  })
}

interface PathContext {
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  closePath(): void
}

function roundedRect(context: PathContext, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.lineTo(x + width - r, y)
  context.quadraticCurveTo(x + width, y, x + width, y + r)
  context.lineTo(x + width, y + height - r)
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  context.lineTo(x + r, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - r)
  context.lineTo(x, y + r)
  context.quadraticCurveTo(x, y, x + r, y)
  context.closePath()
}

export async function exportAuraPng(project: AuraProject, template: AuraTemplate, photoUrl?: string): Promise<Blob> {
  const [width] = ratioSize(project.ratio)
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;'
  document.body.appendChild(container)
  try {
    const stage = await renderAuraStage({ container, project, template, photoUrl, width })
    const blob = await stage.toBlob({ mimeType: 'image/png', pixelRatio: 1 }) as Blob | null
    stage.destroy()
    if (!blob) throw new Error('PNG 导出失败')
    return blob
  } finally { container.remove() }
}
