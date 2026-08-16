import Konva from 'konva'
import type { AuraMotion, AuraProject, AuraTemplate } from '../types/aura'
import { ratioSize } from '../types/aura'

export interface RenderOptions { container: HTMLDivElement; project: AuraProject; template: AuraTemplate; photoUrl?: string; width: number }
type MediaVisual = HTMLImageElement | HTMLVideoElement
type CoverVisual = HTMLImageElement | HTMLCanvasElement

export async function renderAuraStage({ container, project, photoUrl, width }: RenderOptions): Promise<Konva.Stage> {
  const [exportWidth, exportHeight] = ratioSize(project.ratio)
  const height = width * exportHeight / exportWidth
  const stage = new Konva.Stage({ container, width, height })
  const layer = new Konva.Layer(); stage.add(layer)
  paintBackground(layer, project, width, height)
  const media = photoUrl ? await loadMedia(photoUrl, project.mediaType) : undefined
  if (media) paintPhoto(layer, project, media, width, height)
  const coverMedia = media instanceof HTMLVideoElement ? freezeVideoFrame(media) : media
  paintPlayer(layer, project, width, height, coverMedia)
  paintLyrics(layer, project, width, height)
  paintDecorations(layer, project, width, height)
  layer.draw()
  if (media instanceof HTMLVideoElement) {
    const mediaAnimation = new Konva.Animation(() => undefined, layer)
    mediaAnimation.start()
    stage.on('destroy', () => { mediaAnimation.stop(); media.pause() })
  }
  return stage
}

function paintBackground(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const a = project.adjustments, first = project.palette[a.paletteIndex] || '#fff8ed', second = project.palette[a.secondaryPaletteIndex] || '#f7d9df'
  layer.add(new Konva.Rect({ x: 0, y: 0, width, height, fill: first }))
  const topHeight = height * a.photoSplit
  if (a.background === 'gradient') layer.add(new Konva.Rect({ x: 0, y: 0, width, height: topHeight, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: width, y: topHeight }, fillLinearGradientColorStops: [0, '#fffaf2', .45, first, 1, second] }))
  if (a.background === 'stripes') {
    const group = new Konva.Group({ clip: { x: 0, y: 0, width, height: topHeight } })
    const pitch = Math.max(12, width / (Math.max(4, a.stripeDensity) * 2.2))
    group.add(new Konva.Rect({ x: 0, y: 0, width, height: topHeight, fill: '#fffdf7', opacity: .5 }))
    for (let x = -width; x < width * 2; x += pitch) {
      group.add(new Konva.Rect({ x, y: -height, width: pitch * .44, height: height * 3, fill: second, rotation: a.stripeAngle - 90, opacity: .28 }))
      group.add(new Konva.Line({ points: [x + pitch * .08, -height, x + pitch * .08, height * 2], stroke: '#ffffff', strokeWidth: Math.max(.55, width * .00065), opacity: .2, rotation: a.stripeAngle - 90 }))
    }
    const threadGap = Math.max(2.2, width / 300)
    for (let x = 0; x <= width; x += threadGap) group.add(new Konva.Line({ points: [x, 0, x + Math.sin(x * .09) * 1.2, topHeight], stroke: x % (threadGap * 3) < threadGap ? '#ffffff' : '#4a4254', strokeWidth: Math.max(.35, width * .00042), opacity: .055 }))
    for (let y = 0; y <= topHeight; y += Math.max(2.5, height / 330)) group.add(new Konva.Line({ points: [0, y, width, y + Math.sin(y * .13) * .8], stroke: '#554c5f', strokeWidth: Math.max(.3, width * .00035), opacity: .035 }))
    layer.add(group)
  }
  if (a.background === 'paper') {
    const group = new Konva.Group({ clip: { x: 0, y: 0, width, height: topHeight } })
    group.add(new Konva.Rect({ x: 0, y: 0, width, height: topHeight, fill: first }))
    group.add(new Konva.Rect({ x: 0, y: 0, width, height: topHeight, fill: '#fff8f4', opacity: .12 }))
    for (let index = 0; index < 38; index++) {
      const x = ((index * 43) % 103) / 103 * width
      const y = ((index * 67) % 101) / 101 * topHeight
      const span = width * (.09 + (index % 6) * .022)
      const rise = topHeight * (((index * 7) % 9 - 4) * .008)
      const points = [x - span * .48, y + rise, x - span * .16, y - rise * .55, x + span * .18, y + rise * .38, x + span * .52, y - rise * .72]
      group.add(new Konva.Line({ points, stroke: '#4d3940', strokeWidth: Math.max(.6, width * .00075), opacity: .055, tension: .12, lineCap: 'round' }))
      group.add(new Konva.Line({ points: points.map((value, pointIndex) => value - (pointIndex % 2 ? 1.15 : .7)), stroke: '#ffffff', strokeWidth: Math.max(.7, width * .0009), opacity: .2, tension: .12, lineCap: 'round' }))
    }
    for (let index = 0; index < 30; index++) {
      const x = ((index * 59) % 97) / 97 * width
      const y = ((index * 37) % 89) / 89 * topHeight
      const size = width * (.035 + (index % 5) * .009)
      group.add(new Konva.Line({ points: [x, y, x + size, y - size * .28, x + size * .68, y + size * .62], closed: true, fill: index % 2 ? '#ffffff' : '#5b4149', opacity: index % 2 ? .035 : .018 }))
    }
    layer.add(group)
  }
}

function paintPhoto(layer: Konva.Layer, project: AuraProject, media: MediaVisual, width: number, height: number) {
  const y = height * project.adjustments.photoSplit, targetHeight = height - y
  const crop = coverCrop(media, width / targetHeight, project.adjustments.photoScale, project.adjustments.photoOffsetX, project.adjustments.photoOffsetY)
  layer.add(new Konva.Image({ image: media, x: 0, y, width, height: targetHeight, crop }))
  layer.add(new Konva.Line({ points: [0, y, width, y], stroke: '#ffffff', opacity: .28, strokeWidth: Math.max(1, width * .003) }))
}

function playerBox(project: AuraProject, width: number, height: number) {
  const scale = project.adjustments.playerScale
  const w = width * .63 * scale
  const h = w * .46
  const topHeight = height * project.adjustments.photoSplit
  const hasLyrics = project.adjustments.quoteVisible
  const lyricsSpace = hasLyrics ? width * .18 : 0
  return { x: (width - w) / 2, y: (topHeight - h - lyricsSpace) / 2, w, h }
}

function paintLyrics(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  if (!project.adjustments.quoteVisible) return
  const a = project.adjustments, box = playerBox(project, width, height)
  const fallback = 'enjoy the little things\nin a slow way'
  const lines = (project.music.quote.trim() || fallback).split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 2)
  if (!lines.length) return
  const style = a.lyricsStyle || 'minimal-serif'
  const align = style === 'editorial' ? 'left' : a.textAlign
  const family = style === 'handwritten-note' ? 'KaiTi, STKaiti, Comic Sans MS, cursive'
    : style === 'editorial' ? 'Arial, sans-serif' : 'Georgia, Times New Roman, serif'
  const fontStyle = style === 'editorial' ? 'bold' : style === 'handwritten-note' ? 'italic' : 'normal'
  const baseSize = style === 'editorial' ? width * .021 : width * .024
  const fontSize = baseSize * (a.lyricsFontSize || 1)
  const lineHeight = a.lyricsLineHeight || 1.45
  const color = project.palette[a.textColorIndex] || project.palette[4] || '#302c2a'
  const y = box.y + box.h + width * (.065 + (a.lyricsOffsetY || 0))
  const lyricWidth = box.w * .9, lyricX = (width - lyricWidth) / 2
  const decorY = y - width * .035, center = width / 2
  layer.add(new Konva.Text({ x: center - width * .1, y: decorY, width: width * .2, text: '·  ·  ♡  ·  ·', align: 'center', fill: color, opacity: (a.lyricsOpacity || .78) * .64, fontFamily: 'Georgia, serif', fontSize: width * .017, letterSpacing: width * .002 }))
  layer.add(new Konva.Text({ x: lyricX, y, width: lyricWidth, text: lines.join('\n'), align, fill: color, opacity: a.lyricsOpacity || .78, fontFamily: family, fontStyle, fontSize, lineHeight, letterSpacing: style === 'editorial' ? width * .0014 : width * .00045 }))
  layer.add(new Konva.Line({ points: [center - width * .022, y + fontSize * lineHeight * lines.length + width * .026, center + width * .022, y + fontSize * lineHeight * lines.length + width * .026], stroke: color, strokeWidth: Math.max(1.5, width * .0022), opacity: (a.lyricsOpacity || .78) * .55, lineCap: 'round' }))
}

function paintPlayer(layer: Konva.Layer, project: AuraProject, width: number, height: number, media?: CoverVisual) {
  const { x, y, w, h } = playerBox(project, width, height), style = project.adjustments.playerStyle
  const ink = project.palette[4] || '#302c2a', accent = project.palette[project.adjustments.noteColorIndex] || '#9f7f65'
  const group = new Konva.Group({ name: 'aura-player' }); layer.add(group)
  const coverImage = media
  const thin = Math.max(2, width * .0034), medium = Math.max(2.5, width * .0046)
  const line = (x1: number, y1: number, x2: number, y2 = y1, color = ink, opacity = .82, size = thin) => group.add(new Konva.Line({ points: [x1, y1, x2, y2], stroke: color, opacity, strokeWidth: size, lineCap: 'round', lineJoin: 'round' }))
  const outline = (px: number, py: number, pw: number, ph: number, radius = 0) => group.add(new Konva.Rect({ x: px, y: py, width: pw, height: ph, cornerRadius: radius, stroke: ink, strokeWidth: medium, opacity: .88 }))
  const rectCover = (px: number, py: number, size: number) => {
    if (!coverImage) return false
    const crop = coverCrop(coverImage, 1, 1, project.adjustments.photoOffsetX, project.adjustments.photoOffsetY)
    group.add(new Konva.Image({ image: coverImage, x: px, y: py, width: size, height: size, crop, opacity: .92 }))
    return true
  }
  const circleCover = (cx: number, cy: number, radius: number) => {
    if (!coverImage) return false
    const crop = coverCrop(coverImage, 1, 1, project.adjustments.photoOffsetX, project.adjustments.photoOffsetY)
    const clipped = new Konva.Group({ name: 'aura-player-vinyl-disc', x: cx, y: cy, clipFunc(context) { context.arc(0, 0, radius, 0, Math.PI * 2) } })
    clipped.add(new Konva.Image({ image: coverImage, x: -radius, y: -radius, width: radius * 2, height: radius * 2, crop, opacity: .92 }))
    clipped.add(new Konva.Circle({ x: 0, y: -radius * .22, radius: Math.max(1.5, radius * .025), fill: '#ffffff', opacity: .5 }))
    group.add(clipped)
    return true
  }
  const progress = (px: number, py: number, pw: number) => {
    line(px, py, px + pw, py, ink, .3, thin)
    group.add(new Konva.Line({ name: 'aura-player-progress-line', points: [px, py, px + pw * project.adjustments.progress, py], stroke: accent, opacity: .95, strokeWidth: medium, lineCap: 'round', auraStartX: px, auraWidth: pw, auraProgress: project.adjustments.progress }))
    group.add(new Konva.Circle({ name: 'aura-player-progress-dot', x: px + pw * project.adjustments.progress, y: py, radius: width * .006, fill: accent, auraStartX: px, auraWidth: pw, auraProgress: project.adjustments.progress }))
  }
  const play = (cx: number, cy: number, radius: number) => {
    const control = new Konva.Group({ name: 'aura-player-play', x: cx, y: cy })
    control.add(new Konva.Circle({ radius, stroke: ink, strokeWidth: thin, opacity: .62 }))
    control.add(new Konva.Line({ points: [-radius * .2, -radius * .34, radius * .34, 0, -radius * .2, radius * .34], closed: true, stroke: ink, strokeWidth: thin, opacity: .72 }))
    group.add(control)
  }
  const controls = (cx: number, cy: number, gap: number) => {
    play(cx, cy, width * .018)
    line(cx - gap, cy - width * .011, cx - gap, cy + width * .011, ink, .55)
    group.add(new Konva.Line({ points: [cx - gap + width * .014, cy - width * .011, cx - gap + width * .002, cy, cx - gap + width * .014, cy + width * .011], stroke: ink, strokeWidth: thin, opacity: .6 }))
    line(cx + gap, cy - width * .011, cx + gap, cy + width * .011, ink, .55)
    group.add(new Konva.Line({ points: [cx + gap - width * .014, cy - width * .011, cx + gap - width * .002, cy, cx + gap - width * .014, cy + width * .011], stroke: ink, strokeWidth: thin, opacity: .6 }))
  }
  const title = (tx: number, ty: number, tw: number, align: 'left' | 'center' = 'left') => {
    group.add(new Konva.Text({ x: tx, y: ty, width: tw, text: project.music.songName || 'slow living', fill: ink, align, fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: width * .038, letterSpacing: width * .0005, ellipsis: true, wrap: 'none' }))
    group.add(new Konva.Text({ x: tx, y: ty + width * .052, width: tw, text: project.music.artist || 'just be', fill: ink, align, fontFamily: 'Arial, sans-serif', opacity: .7, fontSize: width * .024, ellipsis: true, wrap: 'none' }))
  }

  if (style === 'capsule') {
    title(x, y + h * .03, w, 'center')
    line(x + w * .12, y + h * .48, x + w * .88, y + h * .48, ink, .46)
    line(x + w * .2, y + h * .58, x + w * .8, y + h * .58, ink, .28)
    progress(x + w * .2, y + h * .72, w * .6)
    controls(x + w / 2, y + h * .93, w * .25)
  } else if (style === 'vinyl') {
    const cx = x + w * .34, cy = y + h * .52
    circleCover(cx, cy, h * .36)
    for (const radius of [h * .36, h * .27, h * .09]) group.add(new Konva.Circle({ x: cx, y: cy, radius, stroke: radius === h * .09 ? accent : ink, strokeWidth: thin, opacity: radius === h * .09 ? .75 : .52 }))
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
    const hasCover = rectCover(sx, sy, size)
    outline(sx, sy, size, size, width * .004)
    if (!hasCover) {
      line(sx + size * .14, sy + size * .72, sx + size * .38, sy + size * .46, accent, .65)
      line(sx + size * .38, sy + size * .46, sx + size * .58, sy + size * .62, accent, .65)
      group.add(new Konva.Circle({ x: sx + size * .72, y: sy + size * .27, radius: width * .006, stroke: accent, strokeWidth: thin, opacity: .7 }))
    }
    title(x + w * .54, y + h * .23, w * .34)
    progress(x + w * .54, y + h * .67, w * .34)
    controls(x + w * .71, y + h * .89, w * .11)
  } else if (style === 'waveform') {
    const cx = x + w / 2, cy = y + h * .48
    group.add(new Konva.Arc({ x: cx, y: cy, innerRadius: h * .42, outerRadius: h * .43, angle: 180, rotation: 180, fill: ink, opacity: .55 }))
    outline(cx - h * .52, cy - h * .02, h * .13, h * .38, h * .065)
    outline(cx + h * .39, cy - h * .02, h * .13, h * .38, h * .065)
    addWaveform(group, cx - w * .22, cy + h * .08, w * .44, h * .18, accent)
    title(x + w * .26, y + h * .81, w * .48, 'center')
  } else {
    const coverSize = h * .48
    const coverX = x, coverY = y
    const doodle = (points: number[], color = ink, opacity = .72, strokeWidth = thin) => {
      const primary = new Konva.Line({ points, stroke: color, strokeWidth, opacity, lineCap: 'round', lineJoin: 'round', tension: .08 })
      group.add(primary)
      group.add(new Konva.Line({ points: points.map((value, index) => value + (index % 2 ? width * .0012 : -width * .0007)), stroke: color, strokeWidth: strokeWidth * .42, opacity: opacity * .34, lineCap: 'round', lineJoin: 'round', tension: .12 }))
      return primary
    }
    rectCover(coverX + coverSize * .07, coverY + coverSize * .03, coverSize * .88)
    doodle([
      coverX + coverSize * .08, coverY + coverSize * .04,
      coverX + coverSize * .92, coverY + coverSize * .02,
      coverX + coverSize * .96, coverY + coverSize * .9,
      coverX + coverSize * .07, coverY + coverSize * .96,
      coverX + coverSize * .08, coverY + coverSize * .04
    ], ink, .74, thin)
    if (!coverImage) {
      const heartY = coverY + coverSize * .53
      doodle([coverX + coverSize * .19, heartY, coverX + coverSize * .34, heartY - coverSize * .15, coverX + coverSize * .5, heartY + coverSize * .12, coverX + coverSize * .67, heartY - coverSize * .14, coverX + coverSize * .82, heartY], accent, .82, medium)
    }
    const infoX = x + coverSize + w * .105, infoW = w - coverSize - w * .105
    group.add(new Konva.Text({ x: infoX, y: y + h * .045, width: infoW, text: project.music.songName || 'slow living', fill: ink, fontFamily: 'KaiTi, STKaiti, Comic Sans MS, cursive', fontStyle: 'bold', fontSize: width * .037, ellipsis: true, wrap: 'none', rotation: -.7, opacity: .86 }))
    group.add(new Konva.Text({ x: infoX + width * .002, y: y + h * .225, width: infoW, text: project.music.artist || 'just be', fill: ink, fontFamily: 'KaiTi, STKaiti, Comic Sans MS, cursive', fontSize: width * .024, ellipsis: true, wrap: 'none', rotation: .4, opacity: .64 }))
    const progressY = y + h * .64, progressX = x + w * .01, progressW = w * .98
    doodle([progressX, progressY, progressX + progressW * .32, progressY + width * .001, progressX + progressW * .67, progressY - width * .0012, progressX + progressW, progressY], ink, .38, thin * .72)
    const activeProgress = doodle([progressX, progressY, progressX + progressW * project.adjustments.progress, progressY - width * .0008], accent, .82, thin)
    activeProgress.name('aura-player-progress-line'); activeProgress.setAttr('auraStartX', progressX); activeProgress.setAttr('auraWidth', progressW); activeProgress.setAttr('auraProgress', project.adjustments.progress)
    group.add(new Konva.Circle({ name: 'aura-player-progress-dot', x: progressX + progressW * project.adjustments.progress, y: progressY, radius: width * .0052, fill: accent, opacity: .86, auraStartX: progressX, auraWidth: progressW, auraProgress: project.adjustments.progress }))
    const timeFont = width * .018
    group.add(new Konva.Text({ x, y: y + h * .68, width: w * .22, text: project.music.currentTime || '0:00', fill: ink, opacity: .56, fontFamily: 'KaiTi, STKaiti, cursive', fontSize: timeFont, rotation: -.5 }))
    group.add(new Konva.Text({ x: x + w * .78, y: y + h * .68, width: w * .22, text: project.music.totalTime || '3:30', align: 'right', fill: ink, opacity: .56, fontFamily: 'KaiTi, STKaiti, cursive', fontSize: timeFont, rotation: .5 }))
    const controlY = y + h * .89, controlGap = w * .18, controlRadius = width * .026
    const playMark = doodle([x + w / 2 - controlRadius * .28, controlY - controlRadius * .45, x + w / 2 + controlRadius * .42, controlY, x + w / 2 - controlRadius * .25, controlY + controlRadius * .46, x + w / 2 - controlRadius * .28, controlY - controlRadius * .45], ink, .78, thin)
    playMark.name('aura-player-play')
    doodle([x + w / 2 - controlGap + width * .008, controlY - width * .012, x + w / 2 - controlGap - width * .006, controlY, x + w / 2 - controlGap + width * .008, controlY + width * .012], ink, .7, thin)
    doodle([x + w / 2 + controlGap - width * .008, controlY - width * .012, x + w / 2 + controlGap + width * .006, controlY, x + w / 2 + controlGap - width * .008, controlY + width * .012], ink, .7, thin)
  }
}

function addWaveform(group: Konva.Group, x: number, y: number, width: number, height: number, color: string) {
  for (let index = 0; index < 34; index++) {
    const amplitude = (.2 + Math.abs(Math.sin(index * 1.73)) * .8) * height
    group.add(new Konva.Line({ name: 'aura-player-wave', points: [x + index * width / 33, y - amplitude / 2, x + index * width / 33, y + amplitude / 2], stroke: color, strokeWidth: Math.max(1, width * .0045), opacity: .58, lineCap: 'round', auraCenterY: y, auraAmplitude: amplitude, auraWaveIndex: index }))
  }
}

export function paintDecorations(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const a = project.adjustments
  if (!a.decorationVisible) return
  const color = project.palette[a.noteColorIndex] || '#9f7f65', count = Math.max(1, a.decorationDensity)
  const topHeight = height * a.photoSplit
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? .5 : i / (count - 1), p = decorationPoint(a.decorationDistribution, t, width, height, topHeight, i)
    const size = width * (.025 + (i % 3) * .006), opacity = a.decorationOpacity || .62
    if (a.decorationStyle === 'bows') {
      const bow = new Konva.Group({ name: 'aura-note', x: p.x, y: p.y, rotation: p.rotation, opacity })
      bow.add(new Konva.Line({ points: [0, 0, -size * .6, -size * .32, -size * .72, size * .2, 0, 0, size * .72, size * .2, size * .6, -size * .32, 0, 0], stroke: color, strokeWidth: Math.max(1.5, width * .0027), tension: .45, closed: true, lineCap: 'round', lineJoin: 'round' }))
      bow.add(new Konva.Circle({ x: 0, y: 0, radius: size * .12, fill: color }))
      bow.add(new Konva.Line({ points: [-size * .08, size * .08, -size * .28, size * .62, 0, size * .48, size * .28, size * .62, size * .08, size * .08], stroke: color, strokeWidth: Math.max(1.2, width * .0022), lineCap: 'round', lineJoin: 'round' }))
      layer.add(bow)
    } else {
      const symbols = a.decorationStyle === 'stars' ? ['☆', '✦', '⋆'] : a.decorationStyle === 'flowers' ? ['❀', '✿', '❁'] : a.decorationStyle === 'sparkles' ? ['✦', '⋆', '·'] : a.decorationStyle === 'hearts' ? ['♡', '♥', '♡'] : ['♪', '♫', '♬']
      layer.add(new Konva.Text({ name: 'aura-note', x: p.x, y: p.y, text: symbols[i % symbols.length], fill: color, opacity, fontFamily: 'Georgia, serif', fontSize: size, rotation: p.rotation, id: `decoration-${i}` }))
    }
  }
}

function decorationPoint(distribution: AuraProject['adjustments']['decorationDistribution'], t: number, width: number, height: number, topHeight: number, index: number) {
  if (distribution === 'uniform') return { x: width * (.14 + ((index * 37) % 73) / 100), y: topHeight * .82 + ((index * 29) % 100) / 100 * (height * .84 - topHeight * .82), rotation: index * 11 % 28 - 14 }
  if (distribution === 'scatter') return { x: width * (.08 + ((index * 43) % 84) / 100), y: topHeight * .72 + ((index * 31) % 100) / 100 * (height * .88 - topHeight * .72), rotation: index * 17 % 44 - 22 }
  return { x: width * (.2 + t * .62 + Math.sin(index * 1.7) * .035), y: topHeight * .78 + t * (height * .8 - topHeight * .78), rotation: -18 + t * 38 }
}

export function paintQuote(layer: Konva.Layer, project: AuraProject, width: number, height: number) {
  const a = project.adjustments
  if (!a.quoteVisible || !project.music.quote) return
  const family = a.textFont === 'serif' ? 'Georgia, serif' : a.textFont === 'rounded' ? 'Arial Rounded MT Bold, sans-serif' : 'Arial, sans-serif'
  layer.add(new Konva.Text({ x: width * .08, y: height * .92, width: width * .84, text: project.music.quote, align: a.textAlign, fill: project.palette[a.textColorIndex] || '#302c2a', fontSize: width * .024, fontFamily: family, opacity: .86, ellipsis: true, wrap: 'none', shadowColor: '#fff', shadowBlur: width * .006, shadowOpacity: .55 }))
}

export function createAuraMotionController(stage: Konva.Stage, motion: AuraMotion, playbackProgress?: () => number | undefined) {
  const notes = stage.find('.aura-note'), origins = notes.map(node => ({ x: node.x(), y: node.y(), rotation: node.rotation(), opacity: node.opacity(), scale: node.scaleX() }))
  const progressLines = stage.find('.aura-player-progress-line').filter((node): node is Konva.Line => node instanceof Konva.Line)
  const progressDots = stage.find('.aura-player-progress-dot').filter((node): node is Konva.Circle => node instanceof Konva.Circle)
  const playControls = stage.find('.aura-player-play')
  const waves = stage.find('.aura-player-wave').filter((node): node is Konva.Line => node instanceof Konva.Line)
  const vinylDiscs = stage.find('.aura-player-vinyl-disc')
  const lineOrigins = progressLines.map(node => node.points().slice())
  const dotOrigins = progressDots.map(node => node.x())
  const playOrigins = playControls.map(node => ({ opacity: node.opacity(), scaleX: node.scaleX(), scaleY: node.scaleY() }))
  const waveOrigins = waves.map(node => ({ points: node.points().slice(), opacity: node.opacity() }))
  const vinylOrigins = vinylDiscs.map(node => node.rotation())
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
    progressLines.forEach(node => {
      const start = Number(node.getAttr('auraStartX')), trackWidth = Number(node.getAttr('auraWidth')), baseProgress = Number(node.getAttr('auraProgress'))
      const value = playbackProgress?.() ?? (baseProgress + time / 12000) % 1
      const points = node.points().slice(); points[points.length - 2] = start + trackWidth * value; node.points(points)
    })
    progressDots.forEach(node => {
      const start = Number(node.getAttr('auraStartX')), trackWidth = Number(node.getAttr('auraWidth')), baseProgress = Number(node.getAttr('auraProgress'))
      node.x(start + trackWidth * (playbackProgress?.() ?? (baseProgress + time / 12000) % 1)); node.scale({ x: 1 + Math.sin(time / 260) * .12, y: 1 + Math.sin(time / 260) * .12 })
    })
    playControls.forEach((node, index) => node.opacity(playOrigins[index].opacity * (.78 + (Math.sin(time / 360) + 1) * .11)))
    waves.forEach((node, index) => {
      const center = Number(node.getAttr('auraCenterY')), amplitude = Number(node.getAttr('auraAmplitude'))
      const phase = time / 150 - index * .5
      const pulse = .34 + (Math.sin(phase) + 1) * .36
      const points = node.points().slice(); points[1] = center - amplitude * pulse / 2; points[3] = center + amplitude * pulse / 2; node.points(points)
      const travelingAccent = Math.max(0, Math.cos(time / 165 - index * .34))
      node.opacity(.42 + travelingAccent * .38)
    })
    vinylDiscs.forEach((node, index) => node.rotation(vinylOrigins[index] + time * .018))
    stage.batchDraw()
  }
  const reset = () => {
    notes.forEach((node, index) => { const base = origins[index]; node.position(base); node.rotation(base.rotation); node.opacity(base.opacity); node.scale({ x: base.scale, y: base.scale }) })
    progressLines.forEach((node, index) => node.points(lineOrigins[index]))
    progressDots.forEach((node, index) => { node.x(dotOrigins[index]); node.scale({ x: 1, y: 1 }) })
    playControls.forEach((node, index) => { node.opacity(playOrigins[index].opacity); node.scale({ x: playOrigins[index].scaleX, y: playOrigins[index].scaleY }) })
    waves.forEach((node, index) => { node.points(waveOrigins[index].points); node.opacity(waveOrigins[index].opacity) })
    vinylDiscs.forEach((node, index) => node.rotation(vinylOrigins[index]))
    stage.batchDraw()
  }
  return { render, reset }
}

export function animateAuraStage(stage: Konva.Stage, motion: AuraMotion, playbackProgress?: () => number | undefined): () => void {
  const controller = createAuraMotionController(stage, motion, playbackProgress)
  let frame = 0, running = true
  const tick = (time: number) => { if (!running) return; controller.render(time); frame = requestAnimationFrame(tick) }
  frame = requestAnimationFrame(tick)
  return () => { running = false; cancelAnimationFrame(frame); controller.reset() }
}

function coverCrop(media: MediaVisual | CoverVisual, ratio: number, scale: number, offsetX: number, offsetY: number) {
  const sourceWidth = media instanceof HTMLVideoElement ? media.videoWidth : media instanceof HTMLImageElement ? media.naturalWidth : media.width
  const sourceHeight = media instanceof HTMLVideoElement ? media.videoHeight : media instanceof HTMLImageElement ? media.naturalHeight : media.height
  let width = sourceWidth, height = sourceHeight
  if (width / height > ratio) width = height * ratio; else height = width / ratio
  width /= scale; height /= scale
  const maxX = sourceWidth - width, maxY = sourceHeight - height
  return { x: Math.max(0, Math.min(maxX, maxX / 2 + offsetX * maxX / 2)), y: Math.max(0, Math.min(maxY, maxY / 2 + offsetY * maxY / 2)), width, height }
}
function freezeVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const sourceWidth = video.videoWidth || 1, sourceHeight = video.videoHeight || 1
  const scale = Math.min(1, 640 / Math.max(sourceWidth, sourceHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceWidth * scale)); canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  const context = canvas.getContext('2d')
  if (context) context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas
}
function loadMedia(url: string, type: AuraProject['mediaType']): Promise<MediaVisual> {
  if (type === 'video') return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto'
    video.onloadeddata = async () => { try { await video.play(); resolve(video) } catch { resolve(video) } }
    video.onerror = () => reject(new Error('视频无法播放，请尝试 H.264 MP4 格式'))
    video.src = url
  })
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('照片加载失败')); image.src = url })
}

export async function exportAuraPng(project: AuraProject, template: AuraTemplate, photoUrl?: string): Promise<Blob> {
  const [width] = ratioSize(project.ratio), container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-10000px;top:0;'; document.body.appendChild(container)
  try {
    const stage = await renderAuraStage({ container, project, template, photoUrl, width })
    const blob = await stage.toBlob({ mimeType: 'image/png', pixelRatio: 1 }) as Blob | null
    stage.destroy(); if (!blob) throw new Error('PNG 导出失败'); return blob
  } finally { container.remove() }
}
