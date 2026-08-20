/**
 * 微信小程序动态导出能力边界。
 * 当前编辑器使用 OffscreenCanvas 2D；微信 MediaRecorder 仅接受可录制的 WebGL Canvas，
 * 因此不能把 2D 帧序列伪装成可用的 MP4 导出。
 */
export const assessDynamicExportCapability = (runtime = globalThis.wx, rendererMode = 'canvas2d') => {
  if (!runtime?.createMediaRecorder) return { supported: false, code: 'NO_MEDIA_RECORDER', reason: '当前微信基础库不支持本地媒体录制' }
  if (rendererMode !== 'webgl') return { supported: false, code: 'CANVAS2D_NOT_RECORDABLE', reason: '当前 Canvas 2D 渲染链路不能直接录制为视频' }
  if (!runtime?.createOffscreenCanvas) return { supported: false, code: 'NO_OFFSCREEN_CANVAS', reason: '当前微信基础库不支持离屏画布' }
  return { supported: true, code: 'WEBGL_MEDIA_RECORDER', reason: '' }
}

export const createDynamicExportError = capability => {
  const error = new Error(capability?.reason || '当前设备暂不支持动态视频导出')
  error.code = capability?.code || 'DYNAMIC_EXPORT_UNAVAILABLE'
  return error
}
