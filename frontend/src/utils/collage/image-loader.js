import { downloadMaterial } from '../../api/download'

const sessionCache = new Map()

const downloadFile = url => new Promise((resolve, reject) => {
  uni.downloadFile({
    url,
    success: res => {
      if (res.statusCode === 200) resolve(res.tempFilePath)
      else reject(new Error(`素材下载失败 (${res.statusCode})`))
    },
    fail: reject
  })
})

const getImageInfo = src => new Promise((resolve, reject) => {
  uni.getImageInfo({ src, success: resolve, fail: reject })
})

export const loadMaterialImage = async material => {
  const cacheKey = String(material.id)
  if (sessionCache.has(cacheKey)) return sessionCache.get(cacheKey)

  const entitlement = await downloadMaterial(material.id)
  if (!entitlement?.url) throw new Error('素材原图地址不可用')

  const path = await downloadFile(entitlement.url)
  const info = await getImageInfo(path)
  const loaded = {
    path: info.path || path,
    width: info.width,
    height: info.height
  }
  sessionCache.set(cacheKey, loaded)
  return loaded
}

export const clearMaterialImageCache = () => {
  sessionCache.clear()
}

export const createCanvasImage = (canvas, src) => new Promise((resolve, reject) => {
  const image = canvas.createImage()
  image.onload = () => resolve(image)
  image.onerror = reject
  image.src = src
})
