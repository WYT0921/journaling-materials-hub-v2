export async function shareOrDownload(blob: Blob, title: string): Promise<'shared' | 'downloaded'> {
  return shareOrDownloadMedia(blob, title, 'png', 'image/png')
}

export async function shareOrDownloadMedia(blob: Blob, title: string, extension: 'png' | 'mp4', type: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], `${safeName(title)}.${extension}`, { type })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: 'AURA Music', text: '把喜欢的歌变成视觉记忆', files: [file] })
      return 'shared'
    } catch (error) {
      // Encoding can outlive the original click's user activation. Fall back to a
      // download instead of discarding the finished local export.
      if (error instanceof DOMException && error.name === 'AbortError') throw error
    }
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
