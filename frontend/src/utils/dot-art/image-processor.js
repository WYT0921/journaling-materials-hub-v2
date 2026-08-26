import { generateDotArt } from './dot-art.mjs'

const IMAGE_READ_TIMEOUT = 10000

const withTimeout = (promise, message) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(message)), IMAGE_READ_TIMEOUT)
  promise.then(
    value => {
      clearTimeout(timer)
      resolve(value)
    },
    error => {
      clearTimeout(timer)
      reject(error)
    }
  )
})

const loadCanvasImage = (canvas, path) => new Promise((resolve, reject) => {
  const image = canvas.createImage()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('图片读取失败，请重新选择'))
  image.src = path
})

const getImageInfo = src => new Promise((resolve, reject) => {
  uni.getImageInfo({ src, success: resolve, fail: reject })
})

export const readImagePixels = async (path, maxEdge = 1200) => {
  if (typeof wx === 'undefined' || !wx.createOffscreenCanvas) {
    throw new Error('当前微信版本不支持图片处理')
  }
  const info = await withTimeout(getImageInfo(path), '图片信息读取超时，请重新选择')
  const scale = Math.min(1, maxEdge / Math.max(info.width, info.height))
  const width = Math.max(1, Math.round(info.width * scale))
  const height = Math.max(1, Math.round(info.height * scale))
  const canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  const image = await withTimeout(loadCanvasImage(canvas, path), '图片加载超时，请重新选择')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  return { data: imageData.data, width, height }
}

export const convertImageToDotArt = async (path, options) => {
  const pixels = await readImagePixels(path)
  return generateDotArt(pixels, options)
}
