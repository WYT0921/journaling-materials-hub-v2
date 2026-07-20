export const screenToLogical = (point, viewport) => ({
  x: (point.x - viewport.offsetX) / viewport.scale,
  y: (point.y - viewport.offsetY) / viewport.scale
})

export const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)

export const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI

export const normalizeAngleDelta = value => {
  let normalized = value
  while (normalized > 180) normalized -= 360
  while (normalized < -180) normalized += 360
  return normalized
}

export const hitTestLayer = (point, layer) => {
  if (layer.visible === false || layer.locked === true) return false
  const radians = -layer.rotation * Math.PI / 180
  const dx = point.x - layer.x
  const dy = point.y - layer.y
  const localX = dx * Math.cos(radians) - dy * Math.sin(radians)
  const localY = dx * Math.sin(radians) + dy * Math.cos(radians)
  const halfWidth = layer.baseWidth * layer.scale / 2
  const halfHeight = layer.baseHeight * layer.scale / 2
  return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight
}

export const findTopLayerAtPoint = (layers, point) => {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    if (hitTestLayer(point, layers[index])) return layers[index]
  }
  return null
}
