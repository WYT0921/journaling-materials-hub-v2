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

// ---- 纸质纹理（程序化噪点） ----

const seededRandom = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const drawPaperTexture = (ctx, w, h, type = 'grain', seed = 42) => {
  const rng = seededRandom(seed)
  ctx.fillStyle = '#eeefe8'; ctx.fillRect(0, 0, w, h)
  const density = type === 'rough' ? 2600 : type === 'smooth' ? 700 : 1500
  for (let i = 0; i < density; i++) {
    const alpha = type === 'rough' ? 0.08 : 0.045
    ctx.fillStyle = `rgba(90,75,55,${alpha * rng()})`
    const size = 0.4 + rng() * (type === 'rough' ? 2.2 : 1.2)
    ctx.fillRect(rng() * w, rng() * h, size, size)
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
    drawFn(ctx, type === 'solid' ? (bgConfig.color || (palette?.[0]?.hex) || '#f7fde9') : palette, w, h)
  }

  // 写入到 context 后可叠加胶片颗粒
  if (bgConfig.filmGrain || type === 'film') {
    drawFilmGrain(ctx, w, h, bgConfig.filmGrain || 18)
  }
}
