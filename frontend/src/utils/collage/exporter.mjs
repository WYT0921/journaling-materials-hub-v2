import { getExportSize } from './scene-graph.mjs'
import { drawScene } from './renderer.mjs'

export const validateSceneForExport = scene => {
  const visibleLayers = (scene?.layers || []).filter(layer => layer.visible !== false)
  if (visibleLayers.length === 0) throw new Error('请至少添加一个素材')
  if (visibleLayers.some(layer => layer.type === 'image' && !layer.localImagePath)) {
    throw new Error('素材图片尚未加载完成')
  }
  return true
}

const loadCanvasImage = (canvas, src) => new Promise((resolve, reject) => {
  const image = canvas.createImage()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('高清素材加载失败'))
  image.src = src
})

const toTempFilePath = (canvas, size) => new Promise((resolve, reject) => {
  wx.canvasToTempFilePath({
    canvas,
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    destWidth: size.width,
    destHeight: size.height,
    fileType: 'jpg',
    quality: 0.95,
    success: result => resolve(result.tempFilePath),
    fail: reject
  })
})

export const exportCollage = async (scene, dpi = 300) => {
  validateSceneForExport(scene)
  if (typeof wx === 'undefined' || !wx.createOffscreenCanvas) {
    throw new Error('当前环境不支持微信离屏 Canvas')
  }

  const size = getExportSize(scene.canvas.paperSize, scene.canvas.orientation, dpi)
  const canvas = wx.createOffscreenCanvas({ type: '2d', width: size.width, height: size.height })
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  const images = new Map()
  const uniquePaths = [...new Set(
    scene.layers
      .filter(layer => layer.visible !== false && layer.localImagePath)
      .map(layer => layer.localImagePath)
  )]

  await Promise.all(uniquePaths.map(async path => {
    images.set(path, await loadCanvasImage(canvas, path))
  }))

  const scale = Math.min(
    size.width / scene.canvas.logicalWidth,
    size.height / scene.canvas.logicalHeight
  )
  drawScene(context, scene, images, {
    scale,
    offsetX: 0,
    offsetY: 0,
    width: size.width,
    height: size.height
  }, {
    outputWidth: size.width,
    outputHeight: size.height,
    showSelection: false
  })

  const filePath = await toTempFilePath(canvas, size)
  return { filePath, width: size.width, height: size.height, dpi }
}

const saveImage = filePath => new Promise((resolve, reject) => {
  uni.saveImageToPhotosAlbum({ filePath, success: resolve, fail: reject })
})

const openAlbumSetting = () => new Promise((resolve, reject) => {
  uni.showModal({
    title: '需要相册权限',
    content: '请在设置中允许保存图片到相册。',
    confirmText: '去设置',
    success: modal => {
      if (!modal.confirm) {
        reject(new Error('未获得相册权限'))
        return
      }
      uni.openSetting({
        success: setting => {
          if (setting.authSetting?.['scope.writePhotosAlbum']) resolve()
          else reject(new Error('未获得相册权限'))
        },
        fail: reject
      })
    },
    fail: reject
  })
})

export const saveCollageToAlbum = async filePath => {
  try {
    await saveImage(filePath)
  } catch (error) {
    const message = error?.errMsg || error?.message || ''
    if (!message.includes('auth deny') && !message.includes('authorize') && !message.includes('permission')) {
      throw error
    }
    await openAlbumSetting()
    await saveImage(filePath)
  }
}
