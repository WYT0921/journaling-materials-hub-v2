const resolveImage = (images, layer) => (
  typeof images === 'function' ? images(layer) : images.get(layer.localImagePath)
)

export const createViewport = (scene, width, height, padding = 16) => {
  const availableWidth = Math.max(1, width - padding * 2)
  const availableHeight = Math.max(1, height - padding * 2)
  const scale = Math.min(
    availableWidth / scene.canvas.logicalWidth,
    availableHeight / scene.canvas.logicalHeight
  )
  const canvasWidth = scene.canvas.logicalWidth * scale
  const canvasHeight = scene.canvas.logicalHeight * scale
  return {
    scale,
    offsetX: (width - canvasWidth) / 2,
    offsetY: (height - canvasHeight) / 2,
    width: canvasWidth,
    height: canvasHeight
  }
}

const drawSelection = (ctx, layer) => {
  const width = layer.baseWidth * layer.scale
  const height = layer.baseHeight * layer.scale
  ctx.save()
  ctx.translate(layer.x, layer.y)
  ctx.rotate(layer.rotation * Math.PI / 180)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 8])
  ctx.strokeRect(-width / 2, -height / 2, width, height)
  ctx.setLineDash([])
  ctx.fillStyle = '#111111'
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export const drawScene = (ctx, scene, images, viewport, options = {}) => {
  const outputWidth = options.outputWidth || (viewport.offsetX * 2 + viewport.width)
  const outputHeight = options.outputHeight || (viewport.offsetY * 2 + viewport.height)
  ctx.clearRect(0, 0, outputWidth, outputHeight)

  ctx.save()
  ctx.translate(viewport.offsetX, viewport.offsetY)
  ctx.scale(viewport.scale, viewport.scale)
  ctx.fillStyle = scene.canvas.background
  ctx.fillRect(0, 0, scene.canvas.logicalWidth, scene.canvas.logicalHeight)
  ctx.beginPath()
  ctx.rect(0, 0, scene.canvas.logicalWidth, scene.canvas.logicalHeight)
  ctx.clip()

  scene.layers.forEach(layer => {
    if (!layer.visible) return
    const image = resolveImage(images, layer)
    if (!image) return
    ctx.save()
    ctx.translate(layer.x, layer.y)
    ctx.rotate(layer.rotation * Math.PI / 180)
    const width = layer.baseWidth * layer.scale
    const height = layer.baseHeight * layer.scale
    ctx.drawImage(image, -width / 2, -height / 2, width, height)
    ctx.restore()
  })

  if (options.showSelection) {
    const selected = scene.layers.find(layer => layer.id === options.selectedLayerId)
    if (selected) drawSelection(ctx, selected)
  }
  ctx.restore()
}
