import { getTextArtLayout } from './dot-art.mjs'

const canvasToTempFilePath = (canvas, width, height) => new Promise((resolve, reject) => {
  wx.canvasToTempFilePath({
    canvas,
    x: 0,
    y: 0,
    width,
    height,
    destWidth: width,
    destHeight: height,
    fileType: 'png',
    quality: 1,
    success: result => resolve(result.tempFilePath),
    fail: reject
  })
})

export const renderDotArtPng = async text => {
  if (!text) throw new Error('请先生成点阵图')
  if (typeof wx === 'undefined' || !wx.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持图片导出')
  }
  const layout = getTextArtLayout(text)
  const canvas = wx.createOffscreenCanvas({ type: '2d', width: layout.width, height: layout.height })
  canvas.width = layout.width
  canvas.height = layout.height
  const context = canvas.getContext('2d')
  context.fillStyle = '#EEEFE8'
  context.fillRect(0, 0, layout.width, layout.height)
  context.fillStyle = '#3F4D50'
  context.font = `${layout.fontSize}px monospace`
  context.textBaseline = 'top'
  layout.lines.forEach((line, index) => {
    context.fillText(line || ' ', layout.padding, layout.padding + index * layout.lineHeight)
  })
  return canvasToTempFilePath(canvas, layout.width, layout.height)
}

const saveImage = filePath => new Promise((resolve, reject) => {
  uni.saveImageToPhotosAlbum({ filePath, success: resolve, fail: reject })
})

const requestAlbumSetting = () => new Promise((resolve, reject) => {
  uni.showModal({
    title: '需要相册权限',
    content: '请在设置中允许保存图片到相册。',
    confirmText: '去设置',
    success: modal => {
      if (!modal.confirm) return reject(new Error('未获得相册权限'))
      uni.openSetting({
        success: setting => setting.authSetting?.['scope.writePhotosAlbum']
          ? resolve()
          : reject(new Error('未获得相册权限')),
        fail: reject
      })
    },
    fail: reject
  })
})

export const saveDotArtToAlbum = async text => {
  const filePath = await renderDotArtPng(text)
  try {
    await saveImage(filePath)
  } catch (error) {
    const message = error?.errMsg || error?.message || ''
    if (!/auth deny|authorize|permission/i.test(message)) throw error
    await requestAlbumSetting()
    await saveImage(filePath)
  }
  return filePath
}
