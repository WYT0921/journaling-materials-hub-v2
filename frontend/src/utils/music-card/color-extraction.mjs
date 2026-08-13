/**
 * 色彩提取模块 — K-Means 聚类 + RGB/HSL 工具
 * 纯 JS 实现，兼容微信小程序 Canvas 环境
 */

// ---- RGB / HSL 转换 ----

export const rgbToHsl = (r, g, b) => {
  const nr = r / 255, ng = g / 255, nb = b / 255
  const max = Math.max(nr, ng, nb), min = Math.min(nr, ng, nb)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const delta = max - min
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    switch (max) {
      case nr: h = ((ng - nb) / delta + (ng < nb ? 6 : 0)) / 6; break
      case ng: h = ((nb - nr) / delta + 2) / 6; break
      case nb: h = ((nr - ng) / delta + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export const hslToRgb = (h, s, l) => {
  const nh = h / 360, ns = s / 100, nl = l / 100
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  if (ns === 0) {
    const v = Math.round(nl * 255)
    return { r: v, g: v, b: v }
  }
  const q = nl < 0.5 ? nl * (1 + ns) : nl + ns - nl * ns
  const p = 2 * nl - q
  return {
    r: Math.round(hue2rgb(p, q, nh + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, nh) * 255),
    b: Math.round(hue2rgb(p, q, nh - 1 / 3) * 255)
  }
}

export const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map(c => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')

export const luminance = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255

export const contrastRatio = (r1, g1, b1, r2, g2, b2) => {
  const l1 = luminance(r1, g1, b1) + 0.05
  const l2 = luminance(r2, g2, b2) + 0.05
  return l1 > l2 ? l1 / l2 : l2 / l1
}

// ---- 颜色命名 ----

const COLOR_NAMES = [
  { name: '暖粉', ranges: [{ h: [340, 20], s: [30, 100], l: [40, 85] }] },
  { name: '珊瑚橘', ranges: [{ h: [10, 30], s: [40, 100], l: [45, 80] }] },
  { name: '奶油米', ranges: [{ h: [30, 50], s: [10, 60], l: [60, 95] }] },
  { name: '鼠尾草绿', ranges: [{ h: [80, 140], s: [10, 50], l: [40, 75] }] },
  { name: '森林绿', ranges: [{ h: [100, 160], s: [40, 100], l: [15, 45] }] },
  { name: '雾蓝', ranges: [{ h: [190, 220], s: [10, 50], l: [50, 80] }] },
  { name: '深海蓝', ranges: [{ h: [200, 240], s: [50, 100], l: [15, 45] }] },
  { name: '薰衣草紫', ranges: [{ h: [260, 290], s: [10, 50], l: [50, 80] }] },
  { name: '深紫', ranges: [{ h: [250, 290], s: [40, 100], l: [15, 50] }] },
  { name: '暖灰', ranges: [{ h: [0, 60], s: [0, 15], l: [30, 70] }] },
  { name: '冷灰', ranges: [{ h: [200, 260], s: [0, 15], l: [30, 70] }] },
  { name: '纯白', ranges: [{ h: [0, 360], s: [0, 10], l: [90, 100] }] },
  { name: '墨黑', ranges: [{ h: [0, 360], s: [0, 30], l: [0, 20] }] },
  { name: '暖棕', ranges: [{ h: [15, 35], s: [30, 80], l: [20, 50] }] }
]

const hueInRange = (h, range) => {
  if (range[0] <= range[1]) return h >= range[0] && h <= range[1]
  return h >= range[0] || h <= range[1] // 跨 360° 边界
}

export const nameColor = (r, g, b) => {
  const { h, s, l } = rgbToHsl(r, g, b)
  for (const entry of COLOR_NAMES) {
    for (const range of entry.ranges) {
      if (hueInRange(h, range.h) && s >= range.s[0] && s <= range.s[1] && l >= range.l[0] && l <= range.l[1]) {
        return entry.name
      }
    }
  }
  return l > 50 ? '浅色' : '深色'
}

// ---- K-Means 聚类 ----

const distance = (a, b) => {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

const computeCentroids = (clusters) =>
  clusters.map(pixels => {
    if (pixels.length === 0) return [0, 0, 0]
    let sr = 0, sg = 0, sb = 0
    for (const p of pixels) { sr += p[0]; sg += p[1]; sb += p[2] }
    const n = pixels.length
    return [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n)]
  })

const kmeans = (pixels, k = 5, maxIterations = 20, tolerance = 1.0) => {
  if (pixels.length === 0) return []
  const effectiveK = Math.min(k, pixels.length)

  // 初始化质心：均匀采样
  const centroids = []
  const step = Math.max(1, Math.floor(pixels.length / effectiveK))
  for (let i = 0; i < effectiveK; i++) {
    centroids.push([...pixels[Math.min(i * step, pixels.length - 1)]])
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    // 分配像素到最近的质心
    const clusters = Array.from({ length: effectiveK }, () => [])
    for (const pixel of pixels) {
      let minDist = Infinity, bestIdx = 0
      for (let c = 0; c < centroids.length; c++) {
        const dist = distance(pixel, centroids[c])
        if (dist < minDist) { minDist = dist; bestIdx = c }
      }
      clusters[bestIdx].push(pixel)
    }

    // 计算新质心
    const newCentroids = computeCentroids(clusters)

    // 检查收敛
    let maxShift = 0
    for (let c = 0; c < effectiveK; c++) {
      const shift = distance(centroids[c], newCentroids[c])
      if (shift > maxShift) maxShift = shift
    }

    centroids.length = 0
    centroids.push(...newCentroids)

    if (maxShift < tolerance) break
  }

  // 统计每个簇的像素数
  const counts = []
  for (let c = 0; c < effectiveK; c++) {
    let count = 0
    for (const pixel of pixels) {
      let minDist = Infinity, bestIdx = 0
      for (let d = 0; d < centroids.length; d++) {
        const dist = distance(pixel, centroids[d])
        if (dist < minDist) { minDist = dist; bestIdx = d }
      }
      if (bestIdx === c) count++
    }
    counts.push(count)
  }

  // 按像素占比排序
  const indexed = centroids.map((rgb, i) => ({ rgb, count: counts[i] }))
  indexed.sort((a, b) => b.count - a.count)

  return indexed.map(item => item.rgb)
}

// ---- 主入口 ----

const COLOR_STRIDE = 4 // 采样子像素间隔，减少 K-Means 输入量

/**
 * 从图片路径提取主色调调色板
 * @param {Uint8ClampedArray} pixelData - 来自 readImagePixels 的像素数据
 * @param {number} k - 提取颜色数量，默认 5
 * @returns {Array<{hex: string, rgb: [number,number,number], hsl: {h,s,l}, name: string, ratio: number}>}
 */
export const extractPalette = (pixelData, k = 5) => {
  const { data, width, height } = pixelData
  const pixels = []

  // 子采样 + 过滤接近纯白/纯黑的像素
  for (let y = 0; y < height; y += COLOR_STRIDE) {
    for (let x = 0; x < width; x += COLOR_STRIDE) {
      const idx = (y * width + x) * 4
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3]
      if (a < 128) continue // 跳过透明像素
      const sum = r + g + b
      if (sum < 30 || sum > 735) continue // 跳过极黑和极白
      pixels.push([r, g, b])
    }
  }

  const centroids = kmeans(pixels, k)
  const totalPixels = pixels.length || 1

  return centroids.map(rgb => {
    const [r, g, b] = rgb
    // 重新统计占比
    let count = 0
    for (const p of pixels) {
      let minDist = Infinity, bestIdx = 0
      for (let c = 0; c < centroids.length; c++) {
        const dist = distance(p, centroids[c])
        if (dist < minDist) { minDist = dist; bestIdx = c }
      }
      if (bestIdx === centroids.indexOf(rgb)) count++
    }
    return {
      hex: rgbToHex(r, g, b),
      rgb: [r, g, b],
      hsl: rgbToHsl(r, g, b),
      name: nameColor(r, g, b),
      ratio: Math.round(count / totalPixels * 100)
    }
  })
}

/**
 * 为给定颜色生成一个协调的背景渐变
 */
export const paletteToGradient = (palette) => {
  const [primary, secondary] = palette
  if (!primary) return ['#f7fde9', '#eaf7d2'] // 默认 journal 渐变
  const angle = primary.hsl.h < 180 ? 135 : 225
  return [primary.hex, secondary ? secondary.hex : primary.hex]
}

/**
 * 从调色板中为文字选择安全的对比色
 */
export const textColorForBackground = (bgHex) => {
  const r = parseInt(bgHex.slice(1, 3), 16)
  const g = parseInt(bgHex.slice(3, 5), 16)
  const b = parseInt(bgHex.slice(5, 7), 16)
  return luminance(r, g, b) > 0.5 ? '#2c2c2c' : '#f5f5f5'
}
