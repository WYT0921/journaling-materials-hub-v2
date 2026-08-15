import type { AuraProject, AuraTemplate } from '../types/aura'
import { ratioSize } from '../types/aura'
import { createAuraMotionController, renderAuraStage } from '../editor/konvaRenderer'

export const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4;codecs=avc1.42001f',
  'video/mp4'
] as const

export function selectMp4MimeType(isSupported: (value: string) => boolean): string | undefined {
  return MP4_MIME_CANDIDATES.find(isSupported)
}

export function videoExportSize(ratio: AuraProject['ratio']): [number, number] {
  return ratioSize(ratio)
}

export interface Mp4ExportOptions {
  durationMs?: number
  fps?: number
  signal?: AbortSignal
  onProgress?: (value: number) => void
}

export async function exportAuraMp4(project: AuraProject, template: AuraTemplate, photoUrl?: string, options: Mp4ExportOptions = {}): Promise<Blob> {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) throw new Error('当前浏览器不支持本地视频录制')
  const mimeType = selectMp4MimeType(value => MediaRecorder.isTypeSupported(value))
  if (!mimeType) throw new Error('当前浏览器不支持 MP4 编码，请使用新版 Safari 或 Chrome')
  const durationMs = options.durationMs ?? 6000, fps = options.fps ?? 30
  const [width, height] = videoExportSize(project.ratio)
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;'
  document.body.appendChild(container)
  const output = document.createElement('canvas'); output.width = width; output.height = height
  const context = output.getContext('2d', { alpha: false })
  if (!context) { container.remove(); throw new Error('无法创建视频画布') }
  let stage: Awaited<ReturnType<typeof renderAuraStage>> | undefined
  let stream: MediaStream | undefined
  try {
    stage = await renderAuraStage({ container, project, template, photoUrl, width })
    const motion = createAuraMotionController(stage, project.adjustments.motion)
    const sourceCanvas = stage.container().querySelector('canvas')
    if (!sourceCanvas) throw new Error('无法读取视频画布')
    const drawFrame = (time: number) => {
      motion.render(time)
      stage!.draw()
      context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0, 0, width, height)
    }
    drawFrame(0)
    stream = output.captureStream(fps)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 10_000_000 })
    const chunks: Blob[] = []
    const completed = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => reject(new Error('MP4 编码失败'))
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(';')[0] }))
    })
    recorder.start(250)
    const startedAt = performance.now()
    await new Promise<void>((resolve, reject) => {
      let frame = 0
      const abort = () => { cancelAnimationFrame(frame); if (recorder.state !== 'inactive') recorder.stop(); reject(new DOMException('已取消导出', 'AbortError')) }
      const draw = (now: number) => {
        if (options.signal?.aborted) { abort(); return }
        const elapsed = Math.min(durationMs, now - startedAt)
        drawFrame(elapsed)
        options.onProgress?.(elapsed / durationMs)
        if (elapsed >= durationMs) { recorder.stop(); resolve(); return }
        frame = requestAnimationFrame(draw)
      }
      frame = requestAnimationFrame(draw)
      options.signal?.addEventListener('abort', abort, { once: true })
    })
    const blob = await completed
    if (!blob.size) throw new Error('MP4 导出为空，请重试')
    options.onProgress?.(1)
    return blob
  } finally {
    stream?.getTracks().forEach(track => track.stop())
    stage?.destroy(); container.remove()
  }
}
