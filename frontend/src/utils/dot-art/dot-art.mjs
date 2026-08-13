export const DOT_ART_MIN_WIDTH = 24
export const DOT_ART_MAX_WIDTH = 96
export const DOT_ART_DEFAULT_WIDTH = 48
export const ASCII_RAMP = '@%#*+=-:. '

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const fullImageBounds = (width, height) => ({ x: 0, y: 0, width, height })

const median = values => {
  if (!values.length) return 255
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export const clampOutputWidth = width => clamp(
  Math.round(Number(width) || DOT_ART_DEFAULT_WIDTH),
  DOT_ART_MIN_WIDTH,
  DOT_ART_MAX_WIDTH
)

export const rgbaToGrayscale = (data, background = 255) => {
  const gray = new Uint8ClampedArray(Math.floor(data.length / 4))
  for (let source = 0, target = 0; source < data.length; source += 4, target += 1) {
    const alpha = data[source + 3] / 255
    const luminance = 0.299 * data[source] + 0.587 * data[source + 1] + 0.114 * data[source + 2]
    gray[target] = Math.round(luminance * alpha + background * (1 - alpha))
  }
  return gray
}

export const resizeGrayscale = (pixels, sourceWidth, sourceHeight, targetWidth, targetHeight) => {
  const output = new Uint8ClampedArray(targetWidth * targetHeight)
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(sourceHeight - 1, Math.floor((y + 0.5) * sourceHeight / targetHeight))
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor((x + 0.5) * sourceWidth / targetWidth))
      output[y * targetWidth + x] = pixels[sourceY * sourceWidth + sourceX]
    }
  }
  return output
}

export const cropGrayscale = (pixels, sourceWidth, sourceHeight, bounds) => {
  const output = new Uint8ClampedArray(bounds.width * bounds.height)
  for (let y = 0; y < bounds.height; y += 1) {
    const sourceStart = (bounds.y + y) * sourceWidth + bounds.x
    output.set(pixels.subarray(sourceStart, sourceStart + bounds.width), y * bounds.width)
  }
  return output
}

/**
 * Finds a subject surrounded by a near-uniform background. For ordinary photos
 * with detailed edges the full image is retained, so automatic cropping cannot
 * unexpectedly remove real photographic content.
 */
export const detectContentBounds = (data, width, height, options = {}) => {
  if (!data || width < 3 || height < 3) return fullImageBounds(width, height)

  const borderR = []
  const borderG = []
  const borderB = []
  const addPixel = (x, y) => {
    const index = (y * width + x) * 4
    const alpha = data[index + 3] / 255
    borderR.push(data[index] * alpha + 255 * (1 - alpha))
    borderG.push(data[index + 1] * alpha + 255 * (1 - alpha))
    borderB.push(data[index + 2] * alpha + 255 * (1 - alpha))
  }
  const step = Math.max(1, Math.floor(Math.min(width, height) / 160))
  for (let x = 0; x < width; x += step) {
    addPixel(x, 0)
    addPixel(x, height - 1)
  }
  for (let y = step; y < height - 1; y += step) {
    addPixel(0, y)
    addPixel(width - 1, y)
  }

  const background = [median(borderR), median(borderG), median(borderB)]
  const borderDistances = borderR.map((red, index) => Math.hypot(
    red - background[0],
    borderG[index] - background[1],
    borderB[index] - background[2]
  ))
  const sortedDistances = [...borderDistances].sort((a, b) => a - b)
  const borderNoise = sortedDistances[Math.floor(sortedDistances.length * 0.9)] || 0
  const maxBorderNoise = options.maxBorderNoise ?? 34
  if (borderNoise > maxBorderNoise) return fullImageBounds(width, height)

  const colorThreshold = Math.max(options.colorThreshold ?? 20, borderNoise + 10)
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  let foregroundCount = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const alpha = data[index + 3] / 255
      const red = data[index] * alpha + 255 * (1 - alpha)
      const green = data[index + 1] * alpha + 255 * (1 - alpha)
      const blue = data[index + 2] * alpha + 255 * (1 - alpha)
      if (Math.hypot(red - background[0], green - background[1], blue - background[2]) < colorThreshold) continue
      foregroundCount += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (!foregroundCount || foregroundCount < width * height * 0.001) return fullImageBounds(width, height)
  const subjectWidth = maxX - minX + 1
  const subjectHeight = maxY - minY + 1
  const paddingRatio = options.cropPaddingRatio ?? 0.06
  const paddingX = Math.max(2, Math.round(subjectWidth * paddingRatio))
  const paddingY = Math.max(2, Math.round(subjectHeight * paddingRatio))
  const x = Math.max(0, minX - paddingX)
  const y = Math.max(0, minY - paddingY)
  const right = Math.min(width, maxX + 1 + paddingX)
  const bottom = Math.min(height, maxY + 1 + paddingY)
  const bounds = { x, y, width: right - x, height: bottom - y }

  // A nearly full-frame subject does not benefit from an extra copy/crop pass.
  if (bounds.width * bounds.height > width * height * 0.94) return fullImageBounds(width, height)
  return bounds
}

export const calculateAdaptiveThreshold = pixels => {
  if (!pixels.length) return 128
  let total = 0
  for (const value of pixels) total += value
  // Keep enough headroom to distinguish pale subjects from white/cream paper.
  return clamp(Math.round(total / pixels.length), 8, 247)
}

const BRAILLE_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80]
]

export const grayscaleToBraille = (pixels, width, height, options = {}) => {
  const threshold = options.threshold ?? calculateAdaptiveThreshold(pixels)
  const inverted = Boolean(options.inverted)
  const rows = []

  for (let y = 0; y < height; y += 4) {
    let line = ''
    for (let x = 0; x < width; x += 2) {
      let mask = 0
      for (let dotY = 0; dotY < 4; dotY += 1) {
        for (let dotX = 0; dotX < 2; dotX += 1) {
          const pixelX = x + dotX
          const pixelY = y + dotY
          if (pixelX >= width || pixelY >= height) continue
          const value = pixels[pixelY * width + pixelX]
          const active = inverted ? value >= threshold : value < threshold
          if (active) mask |= BRAILLE_BITS[dotY][dotX]
        }
      }
      line += String.fromCodePoint(0x2800 + mask)
    }
    rows.push(line.replace(/[⠀]+$/u, ''))
  }
  return rows.join('\n').replace(/\n+$/u, '')
}

export const grayscaleToAscii = (pixels, width, height, options = {}) => {
  const ramp = options.ramp || ASCII_RAMP
  const inverted = Boolean(options.inverted)
  const rows = []
  for (let y = 0; y < height; y += 1) {
    let line = ''
    for (let x = 0; x < width; x += 1) {
      const value = pixels[y * width + x]
      const normalized = inverted ? 255 - value : value
      const index = Math.min(ramp.length - 1, Math.floor(normalized / 256 * ramp.length))
      line += ramp[index]
    }
    rows.push(line.replace(/ +$/u, ''))
  }
  return rows.join('\n').replace(/\n+$/u, '')
}

export const isDotArtEmpty = text => !text || !text.replace(/[\s⠀]/gu, '')

export const generateDotArt = ({ data, width, height }, options = {}) => {
  if (!data || width <= 0 || height <= 0) throw new Error('图片像素数据无效')
  const mode = options.mode === 'ascii' ? 'ascii' : 'braille'
  const columns = clampOutputWidth(options.outputWidth)
  const fullGray = rgbaToGrayscale(data)
  const bounds = options.autoCrop === false
    ? fullImageBounds(width, height)
    : detectContentBounds(data, width, height, options)
  const sourceGray = bounds.width === width && bounds.height === height
    ? fullGray
    : cropGrayscale(fullGray, width, height, bounds)
  const sourceWidth = bounds.width
  const sourceHeight = bounds.height
  const aspectRatio = sourceHeight / sourceWidth

  if (mode === 'ascii') {
    const targetWidth = columns
    const targetHeight = Math.max(1, Math.round(aspectRatio * columns * 0.5))
    const resized = resizeGrayscale(sourceGray, sourceWidth, sourceHeight, targetWidth, targetHeight)
    return grayscaleToAscii(resized, targetWidth, targetHeight, options)
  }

  const targetWidth = columns * 2
  const rawHeight = Math.max(4, Math.round(aspectRatio * targetWidth))
  const targetHeight = Math.max(4, Math.round(rawHeight / 4) * 4)
  const resized = resizeGrayscale(sourceGray, sourceWidth, sourceHeight, targetWidth, targetHeight)
  return grayscaleToBraille(resized, targetWidth, targetHeight, options)
}

export const getTextArtLayout = (text, options = {}) => {
  const lines = String(text || '').split('\n')
  const maxColumns = Math.max(1, ...lines.map(line => [...line].length))
  const maxEdge = options.maxEdge || 4096
  const padding = options.padding || 32
  const preferredFontSize = options.fontSize || 24
  const preferredLineHeight = preferredFontSize * 1.35
  const preferredCharWidth = preferredFontSize * 0.62
  const rawWidth = padding * 2 + maxColumns * preferredCharWidth
  const rawHeight = padding * 2 + lines.length * preferredLineHeight
  const scale = Math.min(1, maxEdge / Math.max(rawWidth, rawHeight))
  const fontSize = Math.max(1, preferredFontSize * scale)
  const lineHeight = fontSize * 1.35
  const charWidth = fontSize * 0.62
  return {
    lines,
    fontSize,
    lineHeight,
    padding: Math.round(padding * scale),
    width: Math.min(maxEdge, Math.max(1, Math.ceil(padding * 2 * scale + maxColumns * charWidth))),
    height: Math.min(maxEdge, Math.max(1, Math.ceil(padding * 2 * scale + lines.length * lineHeight)))
  }
}
