export const CANVAS_SIZES = {
  '4:3': { width: 1200, height: 900 },
  '1:1': { width: 1080, height: 1080 },
  '3:4': { width: 900, height: 1200 },
  '9:16': { width: 1080, height: 1920 }
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const parseTime = value => {
  const match = /^(\d+):([0-5]\d)$/.exec(String(value || '').trim())
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}

export const songProgress = (current, total, fallback = 0.35) => {
  const currentSeconds = parseTime(current)
  const totalSeconds = parseTime(total)
  if (currentSeconds === null || !totalSeconds) return fallback
  return clamp(currentSeconds / totalSeconds, 0, 1)
}

export const resizeLayers = (layers, oldCanvas, nextCanvas) => {
  const sx = nextCanvas.width / oldCanvas.width
  const sy = nextCanvas.height / oldCanvas.height
  const uniform = Math.min(sx, sy)
  return layers.map(layer => {
    if (layer.type === 'background') return { ...layer }
    const next = {
      ...layer,
      x: (layer.x || 0) * sx,
      y: (layer.y || 0) * sy,
      width: layer.width ? layer.width * uniform : layer.width,
      height: layer.height ? layer.height * uniform : layer.height,
      scale: layer.scale || 1
    }
    if (layer.type === 'decoration') {
      next.decorations = (layer.decorations || []).map(item => ({
        ...item,
        bounds: { x: 0, y: 0, width: nextCanvas.width, height: nextCanvas.height }
      }))
    }
    return next
  })
}

export const layerBounds = layer => {
  const scale = layer.scale || 1
  return {
    x: layer.x || 0,
    y: layer.y || 0,
    width: Math.max(1, (layer.width || 120) * scale),
    height: Math.max(1, (layer.height || 80) * scale)
  }
}

export const findTopLayerAtPoint = (layers, point) => {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i]
    if (layer.visible === false || layer.type === 'background' || layer.type === 'decoration') continue
    const b = layerBounds(layer)
    if (point.x >= b.x && point.x <= b.x + b.width && point.y >= b.y && point.y <= b.y + b.height) return layer
  }
  return null
}
