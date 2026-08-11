const DEFAULT_PALETTE = ['#fff8ed', '#f7d9df', '#b8cfb0', '#9f7f65', '#302c2a']

export async function extractPalette(file: Blob): Promise<string[]> {
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
