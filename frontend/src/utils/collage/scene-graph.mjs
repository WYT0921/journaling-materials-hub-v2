export const MAX_LAYERS = 50

const PAPER_PIXELS_300_DPI = {
  A6: { width: 1240, height: 1748 },
  A4: { width: 2480, height: 3508 }
}

const LOGICAL_PORTRAIT = { width: 1000, height: 1414 }

const assertOption = (value, allowed, name) => {
  if (!allowed.includes(value)) {
    throw new Error(`${name} 不支持: ${value}`)
  }
}

export const getExportSize = (paperSize, orientation, dpi = 300) => {
  assertOption(paperSize, ['A6', 'A4'], '纸张尺寸')
  assertOption(orientation, ['portrait', 'landscape'], '画布方向')
  if (![200, 300].includes(dpi)) {
    throw new Error(`导出 DPI 不支持: ${dpi}`)
  }

  const portrait = PAPER_PIXELS_300_DPI[paperSize]
  const scale = dpi / 300
  const width = Math.round(portrait.width * scale)
  const height = Math.round(portrait.height * scale)

  return orientation === 'portrait'
    ? { width, height }
    : { width: height, height: width }
}

export const createCanvasConfig = (paperSize = 'A6', orientation = 'portrait') => {
  const exportSize = getExportSize(paperSize, orientation, 300)
  const portrait = orientation === 'portrait'

  return {
    paperSize,
    orientation,
    logicalWidth: portrait ? LOGICAL_PORTRAIT.width : LOGICAL_PORTRAIT.height,
    logicalHeight: portrait ? LOGICAL_PORTRAIT.height : LOGICAL_PORTRAIT.width,
    exportWidth: exportSize.width,
    exportHeight: exportSize.height,
    background: '#FFFFFF'
  }
}

export const createEmptyScene = (paperSize = 'A6', orientation = 'portrait') => ({
  canvas: createCanvasConfig(paperSize, orientation),
  layers: []
})

export const cloneScene = scene => JSON.parse(JSON.stringify(scene))

export const createLayerId = () => `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const createImageLayer = (material, imageInfo, canvas, id = createLayerId()) => {
  if (!imageInfo?.path || !imageInfo.width || !imageInfo.height) {
    throw new Error('素材图片信息不完整')
  }

  const maxWidth = canvas.logicalWidth * 0.6
  const maxHeight = canvas.logicalHeight * 0.6
  const fitScale = Math.min(maxWidth / imageInfo.width, maxHeight / imageInfo.height, 1)

  return {
    id,
    type: 'image',
    materialId: material.id,
    title: material.title || '未命名素材',
    localImagePath: imageInfo.path,
    sourceWidth: imageInfo.width,
    sourceHeight: imageInfo.height,
    baseWidth: Math.round(imageInfo.width * fitScale),
    baseHeight: Math.round(imageInfo.height * fitScale),
    x: canvas.logicalWidth / 2,
    y: canvas.logicalHeight / 2,
    scale: 1,
    rotation: 0,
    visible: true,
    locked: false,
    sourceKind: 'material'
  }
}
