/**
 * 程序化装饰系统 — 纯 Canvas 2D 路径绘制
 * 不是固定贴纸，所有装饰通过数学参数生成
 */

const TWO_PI = Math.PI * 2

// ---- 可复现的伪随机 ----

const seededRandom = (seed) => {
  let s = seed | 0 || 1
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

// ---- 装饰配置 ----

const DECORATION_DEFS = {
  star: { category: 'shape', name: '星星', defaultCount: 8, defaultSize: 20 },
  heart: { category: 'shape', name: '爱心', defaultCount: 6, defaultSize: 22 },
  flower: { category: 'shape', name: '花朵', defaultCount: 5, defaultSize: 24 },
  diamond: { category: 'shape', name: '菱形', defaultCount: 6, defaultSize: 16 },
  sparkle: { category: 'shape', name: '闪光', defaultCount: 12, defaultSize: 14 },
  rain: { category: 'weather', name: '雨滴', defaultCount: 30, defaultSize: 12 },
  cloud: { category: 'weather', name: '云朵', defaultCount: 3, defaultSize: 60 },
  snow: { category: 'weather', name: '雪花', defaultCount: 20, defaultSize: 10 },
  butterfly: { category: 'cute', name: '蝴蝶', defaultCount: 4, defaultSize: 28 },
  ribbon: { category: 'cute', name: '丝带', defaultCount: 3, defaultSize: 40 },
  bubble: { category: 'cute', name: '气泡', defaultCount: 10, defaultSize: 18 },
  circle: { category: 'handdraw', name: '手绘圈', defaultCount: 5, defaultSize: 30 },
  line: { category: 'handdraw', name: '手绘线', defaultCount: 4, defaultSize: 60 },
  underline: { category: 'handdraw', name: '下划线', defaultCount: 3, defaultSize: 80 },
  tape: { category: 'tape', name: '纸胶带', defaultCount: 3, defaultSize: 60 }
}

export const decorationCategories = [
  { key: 'shape', name: '形状' },
  { key: 'weather', name: '天气' },
  { key: 'cute', name: '可爱' },
  { key: 'handdraw', name: '手绘' },
  { key: 'tape', name: '胶带' }
]

export const getDecorationDefs = () => DECORATION_DEFS

// ---- 绘制函数 ----

const drawStar = (ctx, cx, cy, size, color, opacity) => {
  const outerR = size / 2, innerR = size / 5, spikes = 5
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
      : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1
}

const drawHeart = (ctx, cx, cy, size, color, opacity) => {
  const s = size / 24
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 8)
  ctx.bezierCurveTo(cx, cy + s * 4, cx - s * 10, cy + s * 4, cx - s * 10, cy - s * 2)
  ctx.bezierCurveTo(cx - s * 10, cy - s * 9, cx - s * 3, cy - s * 12, cx, cy - s * 8)
  ctx.bezierCurveTo(cx + s * 3, cy - s * 12, cx + s * 10, cy - s * 9, cx + s * 10, cy - s * 2)
  ctx.bezierCurveTo(cx + s * 10, cy + s * 4, cx, cy + s * 4, cx, cy + s * 8)
  ctx.fill(); ctx.globalAlpha = 1
}

const drawFlower = (ctx, cx, cy, size, color, opacity) => {
  const petals = 5, petalR = size / 3, centerR = size / 6
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * TWO_PI - Math.PI / 2
    const px = cx + petalR * 0.6 * Math.cos(angle)
    const py = cy + petalR * 0.6 * Math.sin(angle)
    ctx.beginPath(); ctx.arc(px, py, petalR, 0, TWO_PI); ctx.fill()
  }
  ctx.fillStyle = '#ffe066'
  ctx.beginPath(); ctx.arc(cx, cy, centerR, 0, TWO_PI); ctx.fill()
  ctx.globalAlpha = 1
}

const drawDiamond = (ctx, cx, cy, size, color, opacity) => {
  const half = size / 2
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.moveTo(cx, cy - half); ctx.lineTo(cx + half * 0.6, cy)
  ctx.lineTo(cx, cy + half); ctx.lineTo(cx - half * 0.6, cy)
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1
}

const drawSparkle = (ctx, cx, cy, size, color, opacity) => {
  const outer = size / 2, inner = size / 8
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (i / 8) * TWO_PI - Math.PI / 2
    i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
      : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
  }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1
}

const drawRain = (ctx, cx, cy, size, color, opacity) => {
  ctx.strokeStyle = color; ctx.globalAlpha = opacity; ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx, cy - size / 2); ctx.lineTo(cx - size * 0.15, cy + size / 2)
  ctx.stroke(); ctx.globalAlpha = 1
}

const drawCloud = (ctx, cx, cy, size, color, opacity) => {
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  const r = size / 4
  ctx.beginPath(); ctx.arc(cx - r * 0.8, cy, r * 1.2, 0, TWO_PI); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + r * 0.8, cy, r * 1.2, 0, TWO_PI); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.5, r * 1.3, 0, TWO_PI); ctx.fill()
  ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.7, r, 0, TWO_PI); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.7, r, 0, TWO_PI); ctx.fill()
  ctx.globalAlpha = 1
}

const drawSnowflake = (ctx, cx, cy, size, color, opacity) => {
  ctx.strokeStyle = color; ctx.globalAlpha = opacity; ctx.lineWidth = 1
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * TWO_PI
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + size / 2 * Math.cos(angle), cy + size / 2 * Math.sin(angle))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

const drawButterfly = (ctx, cx, cy, size, color, opacity) => {
  const s = size / 20
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  // 左翅
  ctx.beginPath(); ctx.ellipse(cx - s * 4, cy - s * 2, s * 6, s * 8, -0.3, 0, TWO_PI); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx - s * 3, cy + s * 3, s * 4, s * 5, 0.2, 0, TWO_PI); ctx.fill()
  // 右翅
  ctx.beginPath(); ctx.ellipse(cx + s * 4, cy - s * 2, s * 6, s * 8, 0.3, 0, TWO_PI); ctx.fill()
  ctx.beginPath(); ctx.ellipse(cx + s * 3, cy + s * 3, s * 4, s * 5, -0.2, 0, TWO_PI); ctx.fill()
  // 身体
  ctx.beginPath(); ctx.ellipse(cx, cy, s * 1.5, s * 7, 0, 0, TWO_PI); ctx.fill()
  ctx.globalAlpha = 1
}

const drawRibbon = (ctx, cx, cy, size, color, opacity) => {
  const w = size * 0.5, h = size * 0.2
  ctx.fillStyle = color; ctx.globalAlpha = opacity
  ctx.beginPath()
  ctx.moveTo(cx - w, cy)
  ctx.bezierCurveTo(cx - w * 0.6, cy - h, cx + w * 0.6, cy - h, cx + w, cy)
  ctx.bezierCurveTo(cx + w * 0.6, cy + h, cx - w * 0.6, cy + h, cx - w, cy)
  ctx.fill(); ctx.globalAlpha = 1
}

const drawBubble = (ctx, cx, cy, size, color, opacity) => {
  ctx.fillStyle = color + '40'
  ctx.globalAlpha = opacity
  ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, TWO_PI); ctx.fill()
  ctx.strokeStyle = color; ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, TWO_PI); ctx.stroke()
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.beginPath(); ctx.arc(cx - size * 0.15, cy - size * 0.15, size * 0.12, 0, TWO_PI); ctx.fill()
  ctx.globalAlpha = 1
}

const drawHandCircle = (ctx, cx, cy, size, color, opacity) => {
  ctx.strokeStyle = color; ctx.globalAlpha = opacity; ctx.lineWidth = 2
  ctx.setLineDash([4, 3])
  ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, TWO_PI * 0.85)
  ctx.stroke(); ctx.setLineDash([])
  ctx.globalAlpha = 1
}

const drawHandLine = (ctx, cx, cy, size, color, opacity) => {
  ctx.strokeStyle = color; ctx.globalAlpha = opacity; ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath(); ctx.moveTo(cx - size / 2, cy); ctx.lineTo(cx + size / 2, cy)
  ctx.stroke(); ctx.setLineDash([])
  ctx.globalAlpha = 1
}

const drawUnderline = (ctx, cx, cy, size, color, opacity) => {
  ctx.strokeStyle = color; ctx.globalAlpha = opacity; ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - size / 2, cy)
  ctx.quadraticCurveTo(cx - size * 0.1, cy + 4, cx + size * 0.1, cy + 2)
  ctx.quadraticCurveTo(cx + size / 2, cy - 2, cx + size / 2, cy)
  ctx.stroke(); ctx.globalAlpha = 1
}

const drawTape = (ctx, cx, cy, size, color, opacity) => {
  const w = size * 0.7, h = size * 0.18
  ctx.fillStyle = color; ctx.globalAlpha = opacity * 0.7
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((((Math.round(cx * 13 + cy * 7) % 101) / 100) - 0.5) * 0.3)
  ctx.fillRect(-w / 2, -h / 2, w, h)
  // 锯齿边缘
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(-w / 2, -h / 2)
  for (let x = -w / 2; x < w / 2; x += 4) {
    ctx.lineTo(x, -h / 2 + (x % 8 < 4 ? 2 : -2))
  }
  ctx.stroke()
  ctx.restore()
  ctx.globalAlpha = 1
}

// ---- 绘制调度 ----

const DRAW_FNS = {
  star: drawStar, heart: drawHeart, flower: drawFlower, diamond: drawDiamond,
  sparkle: drawSparkle, rain: drawRain, cloud: drawCloud, snow: drawSnowflake,
  butterfly: drawButterfly, ribbon: drawRibbon, bubble: drawBubble,
  circle: drawHandCircle, line: drawHandLine, underline: drawUnderline, tape: drawTape
}

/**
 * 在给定区域内绘制装饰
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} decorationType - 装饰类型
 * @param {object} bounds - { x, y, width, height }
 * @param {object} options - { count?, size?, opacity?, color?, seed?, randomness? }
 */
export const drawDecoration = (ctx, decorationType, bounds, options = {}) => {
  const drawFn = DRAW_FNS[decorationType]
  if (!drawFn) return

  const def = DECORATION_DEFS[decorationType]
  const count = options.count ?? def?.defaultCount ?? 5
  const size = options.size ?? def?.defaultSize ?? 20
  const opacity = options.opacity ?? 0.8
  const color = options.color || '#6f8b8d'
  const seed = options.seed || decorationType.charCodeAt(0) * 100 + count
  const randomness = options.randomness ?? 1
  const sizeRandom = options.sizeRandom ?? 0.8
  const rng = seededRandom(seed)
  const { x, y, width, height } = bounds

  for (let i = 0; i < count; i++) {
    const point = decorationPoint(options.distribution || 'scatter', i, count, bounds, rng, randomness)
    const motion = decorationMotionTransform(options.motion || 'fall', i, count, point, bounds, options.animationTime || 0)
    const sz = size * (1 - sizeRandom / 2 + rng() * sizeRandom * randomness) * motion.scale
    ctx.save(); ctx.translate(motion.cx, motion.cy); ctx.rotate(motion.rotation); drawFn(ctx, 0, 0, sz, color, opacity * (0.6 + rng() * 0.4) * motion.opacity); ctx.restore()
  }
}

export const decorationMotionTransform = (motion, index, count, point, bounds, time = 0) => {
  if (!time) return { ...point, scale: 1, opacity: 1, rotation: 0 }
  const phase = time * 1.7 + index * .72
  if (motion === 'breathe') return { ...point, scale: 1 + Math.sin(phase) * .16, opacity: .82 + Math.sin(phase) * .18, rotation: 0 }
  if (motion === 'together') return { cx: point.cx, cy: point.cy + Math.sin(time * 2) * bounds.height * .025, scale: 1, opacity: 1, rotation: 0 }
  if (motion === 'sequence') return { ...point, scale: .9 + Math.max(0, Math.sin(phase)) * .18, opacity: .35 + Math.max(0, Math.sin(phase)) * .65, rotation: 0 }
  if (motion === 'rotate') return { ...point, scale: 1, opacity: 1, rotation: phase * .45 }
  const offset = (time * bounds.height * .08 + index * bounds.height / Math.max(count, 1)) % (bounds.height * .95)
  return { cx: point.cx + Math.sin(phase) * bounds.width * .015, cy: bounds.y + offset, scale: 1, opacity: 1, rotation: Math.sin(phase) * .12 }
}

export const decorationPoint = (distribution, index, count, bounds, rng, randomness = 1) => {
  const { x, y, width, height } = bounds
  if (distribution === 'uniform') {
    const columns = Math.max(1, Math.ceil(Math.sqrt(count * width / Math.max(height, 1)))); const rows = Math.max(1, Math.ceil(count / columns))
    return { cx: x + ((index % columns) + .5) * width / columns, cy: y + (Math.floor(index / columns) + .5) * height / rows }
  }
  if (distribution === 'trail') {
    const progress = count <= 1 ? .5 : index / (count - 1); const jitterX = (rng() - .5) * width * .14 * randomness; const jitterY = (rng() - .5) * height * .12 * randomness
    return { cx: x + width * (.16 + progress * .68) + jitterX, cy: y + height * (.12 + progress * .76) + jitterY }
  }
  return { cx: x + (0.1 + rng() * .8 * randomness) * width, cy: y + (0.1 + rng() * .8 * randomness) * height }
}

/**
 * 根据配置数组绘制多层装饰
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} decorationLayers - [{ type, bounds, options }]
 */
export const drawDecorations = (ctx, decorationLayers) => {
  for (const layer of decorationLayers) {
    drawDecoration(ctx, layer.type, layer.bounds, layer.options || layer)
  }
}
