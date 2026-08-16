const DEFAULT_PALETTE = ['#fff8ed', '#f7d9df', '#b8cfb0', '#9f7f65', '#302c2a']

export async function extractPalette(file: Blob): Promise<string[]> {
  if (file.type.startsWith('video/')) return extractVideoPalette(file)
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const size = 72
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return DEFAULT_PALETTE
  context.drawImage(bitmap, 0, 0, size, size)
  bitmap.close()
  return clusterPixels(context.getImageData(0, 0, size, size).data)
}

async function extractVideoPalette(file: Blob): Promise<string[]> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true; video.playsInline = true; video.preload = 'metadata'; video.src = url
  try {
    await new Promise<void>((resolve, reject) => { video.onloadedmetadata = () => resolve(); video.onerror = () => reject(new Error('无法读取视频，请尝试 MP4 格式')) })
    const canvas = document.createElement('canvas'), size = 72
    canvas.width = size; canvas.height = size
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('浏览器无法创建视频取色画布')
    const frames: Uint8ClampedArray[] = []
    for (const time of videoSampleTimes(video.duration)) {
      await seekVideo(video, time)
      context.clearRect(0, 0, size, size)
      context.drawImage(video, 0, 0, size, size)
      frames.push(new Uint8ClampedArray(context.getImageData(0, 0, size, size).data))
    }
    const combined = new Uint8ClampedArray(frames.reduce((total, frame) => total + frame.length, 0))
    let offset = 0
    for (const frame of frames) { combined.set(frame, offset); offset += frame.length }
    if (!combined.some((value, index) => index % 4 === 3 && value >= 180)) throw new Error('视频取帧为空，请转换为 H.264 MP4 后重试')
    return clusterPixels(combined)
  } finally { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url) }
}

export function videoSampleTimes(duration: number): number[] {
  if (!Number.isFinite(duration) || duration <= 0) return [.1]
  return [.05, .25, .5, .75, .95].map(position => Math.min(Math.max(.01, duration * position), Math.max(.01, duration - .01)))
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  if (Math.abs(video.currentTime - time) < .001 && video.readyState >= 2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const cleanup = () => { video.onseeked = null; video.onerror = null }
    video.onseeked = () => { cleanup(); resolve() }
    video.onerror = () => { cleanup(); reject(new Error('视频抽帧失败，请转换为 H.264 MP4 后重试')) }
    video.currentTime = time
  })
}

export function clusterPixels(data: Uint8ClampedArray, count = 5): string[] {
  const points: [number, number, number][] = []
  for (let i = 0; i < data.length; i += 24) {
    if (data[i + 3] < 180) continue
    points.push([data[i], data[i + 1], data[i + 2]])
  }
  if (!points.length) return DEFAULT_PALETTE
  let centers = Array.from({ length: count }, (_, index) => points[Math.floor(index * (points.length - 1) / Math.max(1, count - 1))])
  for (let pass = 0; pass < 8; pass++) {
    const sums = Array.from({ length: count }, () => [0, 0, 0, 0])
    for (const point of points) {
      let winner = 0
      let distance = Number.MAX_VALUE
      centers.forEach((center, index) => {
        const next = (point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2 + (point[2] - center[2]) ** 2
        if (next < distance) { distance = next; winner = index }
      })
      sums[winner][0] += point[0]; sums[winner][1] += point[1]; sums[winner][2] += point[2]; sums[winner][3]++
    }
    centers = centers.map((center, index) => sums[index][3]
      ? [sums[index][0] / sums[index][3], sums[index][1] / sums[index][3], sums[index][2] / sums[index][3]]
      : center) as [number, number, number][]
  }
  return centers
    .sort((a, b) => luminance(b) - luminance(a))
    .map(([r, g, b]) => `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`)
}

const luminance = ([r, g, b]: [number, number, number]) => r * .299 + g * .587 + b * .114
