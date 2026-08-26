export function copyToClipboard(content, { onSuccess, onFailure } = {}) {
  const value = String(content ?? '')
  if (!value) {
    onFailure?.('没有可复制的内容', null)
    return
  }

  uni.setClipboardData({
    data: value,
    success: () => onSuccess?.(),
    fail: error => {
      const privacyBlocked = Number(error?.errno) === 112
        || String(error?.errMsg || '').includes('privacy agreement')
      onFailure?.(
        privacyBlocked ? '复制功能待隐私声明生效后使用' : '复制失败，请重试',
        error
      )
    }
  })
}
