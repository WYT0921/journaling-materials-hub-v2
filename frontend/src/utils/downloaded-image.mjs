const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
}

function resolveExtension(filename, mimeType) {
  const match = String(filename || '').toLowerCase().match(/\.(png|jpe?g|gif|webp)$/)
  if (match) return match[0] === '.jpeg' ? '.jpg' : match[0]
  return MIME_EXTENSIONS[String(mimeType || '').toLowerCase()] || '.png'
}

function safeBaseName(filename) {
  const base = String(filename || 'material')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'material'
}

export function prepareDownloadedImage(tempFilePath, filename, mimeType) {
  if (typeof wx === 'undefined' || !wx.env?.USER_DATA_PATH || !wx.getFileSystemManager) {
    return Promise.resolve({ filePath: tempFilePath, cleanup: () => {} })
  }

  const extension = resolveExtension(filename, mimeType)
  const targetPath = `${wx.env.USER_DATA_PATH}/${safeBaseName(filename)}-${Date.now()}${extension}`
  const fileSystem = wx.getFileSystemManager()

  return new Promise((resolve, reject) => {
    fileSystem.copyFile({
      srcPath: tempFilePath,
      destPath: targetPath,
      success: () => resolve({
        filePath: targetPath,
        cleanup: () => fileSystem.unlink({ filePath: targetPath, fail: () => {} })
      }),
      fail: reject
    })
  })
}

export { resolveExtension, safeBaseName }
