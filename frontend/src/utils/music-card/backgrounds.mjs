/**
 * 背景生成器 — 纯 Canvas 2D 绘制
 * 支持：纯色、渐变、毛玻璃、纸质纹理、水彩晕染、胶片颗粒
 */

const loadCanvasImage = (canvas, path) => new Promise((resolve, reject) => {
  const image = canvas.createImage()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('背景图片加载失败'))
  image.src = path
})

// ---- 纯色 ----

export const drawSolidBackground = (ctx, color, w, h) => {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
}

// ---- 渐变 ----

export const drawGradientBackground = (ctx, palette, w, h, direction = 'diagonal') => {
  let x0, y0, x1, y1
  switch (direction) {
    case 'vertical': x0 = 0; y0 = 0; x1 = 0; y1 = h; break
    case 'horizontal': x0 = 0; y0 = 0; x1 = w; y1 = 0; break
    case 'radial': {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
      grad.addColorStop(0, palette[0]?.hex || '#f7fde9')
      grad.addColorStop(1, palette[1]?.hex || palette[0]?.hex || '#eaf7d2')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      return
    }
    default: x0 = 0; y0 = 0; x1 = w; y1 = h
  }
  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  grad.addColorStop(0, palette[0]?.hex || '#f7fde9')
  grad.addColorStop(0.5, palette[1]?.hex || palette[0]?.hex || '#f2fbdd')
  grad.addColorStop(1, palette[2]?.hex || palette[0]?.hex || '#eaf7d2')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// ---- 毛玻璃 ----

export const drawBlurGlassBackground = async (ctx, imagePath, w, h, blurRadius = 30, opacity = 0.6) => {
  const image = await loadCanvasImage(ctx.canvas, imagePath)
  // 绘制原图拉伸填满
  ctx.drawImage(image, 0, 0, w, h)
  // 叠加半透明白色实现毛玻璃效果
  ctx.fillStyle = `rgba(255, 255, 255, ${1 - opacity})`
  ctx.fillRect(0, 0, w, h)
}

// ---- 条纹布纹与揉皱纸纹（程序化、可跟随色块换色） ----

const seededRandom = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const drawStripeTexture = (ctx, palette, w, h, density = 18) => {
  const base = palette?.[0]?.hex || '#fbfaf4', stripe = palette?.[1]?.hex || '#d9d5e8'
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h)
  const pitch = Math.max(12, w / Math.max(8, density))
  ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle = stripe
  for (let x = -pitch; x < w + pitch; x += pitch) ctx.fillRect(x, 0, pitch * .44, h)
  ctx.restore()
  const threadGap = Math.max(2.2, w / 300)
  for (let x = 0; x <= w; x += threadGap) { ctx.strokeStyle = x % (threadGap * 3) < threadGap ? 'rgba(255,255,255,.14)' : 'rgba(55,48,66,.035)'; ctx.lineWidth = .55; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(x * .09), h); ctx.stroke() }
  for (let y = 0; y <= h; y += Math.max(2.5, h / 330)) { ctx.strokeStyle = 'rgba(60,52,68,.025)'; ctx.lineWidth = .45; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + Math.sin(y * .13)); ctx.stroke() }
}

export const drawPaperTexture = (ctx, palette, w, h, type = 'crumpled', seed = 42) => {
  const rng = seededRandom(seed)
  ctx.fillStyle = palette?.[0]?.hex || '#f2d7df'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(255,250,247,.1)'; ctx.fillRect(0, 0, w, h)
  const density = type === 'rough' ? 1800 : type === 'smooth' ? 480 : 950
  for (let i = 0; i < density; i++) {
    const alpha = type === 'rough' ? 0.055 : 0.03
    ctx.fillStyle = `rgba(90,75,55,${alpha * rng()})`
    const size = 0.4 + rng() * (type === 'rough' ? 2.2 : 1.2)
    ctx.fillRect(rng() * w, rng() * h, size, size)
  }
  for (let index = 0; index < 42; index++) {
    const x = rng() * w, y = rng() * h, span = w * (.08 + rng() * .16), rise = h * (rng() - .5) * .045
    const points = [[x - span * .5, y + rise], [x - span * .14, y - rise * .5], [x + span * .2, y + rise * .35], [x + span * .52, y - rise * .7]]
    ctx.strokeStyle = 'rgba(70,48,55,.055)'; ctx.lineWidth = .8; ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke()
    ctx.save(); ctx.translate(-.8, -1.1); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1; ctx.beginPath(); points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke(); ctx.restore()
  }
}

// ---- 水彩晕染 ----

export const drawWatercolorBackground = (ctx, palette, w, h) => {
  // 先用调色板底色填充
  ctx.fillStyle = palette[0]?.hex || '#f5f0e8'
  ctx.fillRect(0, 0, w, h)

  // 叠加几个随机位置的半透明圆形模拟水彩
  const rng = seededRandom(99)
  for (let i = 0; i < 8; i++) {
    const colorIndex = Math.floor(rng() * Math.min(palette.length, 3))
    const color = palette[colorIndex]?.hex || palette[0]?.hex || '#e8d5c4'
    const cx = rng() * w
    const cy = rng() * h
    const radius = (0.15 + rng() * 0.35) * Math.max(w, h)
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(0.6, color + '18')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
  }
}

// ---- 胶片颗粒 ----

export const drawFilmGrain = (ctx, w, h, intensity = 12) => {
  const rng = seededRandom(77)
  const count = Math.round(Math.min(5000, w * h / 350))
  for (let i = 0; i < count; i++) {
    const light = rng() > 0.5
    ctx.fillStyle = `rgba(${light ? '255,255,255' : '20,20,20'},${(intensity / 255) * (0.2 + rng() * 0.8)})`
    ctx.fillRect(rng() * w, rng() * h, 0.5 + rng() * 1.5, 0.5 + rng() * 1.5)
  }
}

// ---- 绘制入口 ----

const BG_TYPES = {
  solid: drawSolidBackground,
  gradient: drawGradientBackground,
  stripes: drawStripeTexture,
  blur: drawBlurGlassBackground,
  paper: drawPaperTexture,
  watercolor: drawWatercolorBackground,
  film: drawGradientBackground
}

/**
 * 根据配置绘制背景
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} bgConfig - { type, color?, palette?, imagePath?, blurRadius?, opacity?, paperType?, seed? }
 * @param {number} w
 * @param {number} h
 */
export const drawBackground = async (ctx, bgConfig, w, h) => {
  const { type = 'gradient', palette, imagePath } = bgConfig

  if (type === 'blur' && imagePath) {
    await drawBlurGlassBackground(ctx, imagePath, w, h, bgConfig.blurRadius, bgConfig.opacity)
  } else {
    const drawFn = BG_TYPES[type] || drawGradientBackground
    if (type === 'solid') drawFn(ctx, bgConfig.color || palette?.[0]?.hex || '#f7fde9', w, h)
    else if (type === 'paper') drawFn(ctx, palette, w, h, bgConfig.paperType, bgConfig.seed)
    else if (type === 'stripes') drawFn(ctx, palette, w, h, bgConfig.stripeDensity)
    else drawFn(ctx, palette, w, h)
  }

  // 写入到 context 后可叠加胶片颗粒
  if (bgConfig.filmGrain || type === 'film') {
    drawFilmGrain(ctx, w, h, bgConfig.filmGrain || 18)
  }
}
