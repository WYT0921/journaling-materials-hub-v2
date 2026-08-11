export async function shareOrDownload(blob: Blob, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], `${safeName(title)}.png`, { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'AURA Music', text: '把喜欢的歌变成视觉记忆', files: [file] })
    return 'shared'
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}

const safeName = (value: string) => (value.trim() || 'aura-music-card').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)
