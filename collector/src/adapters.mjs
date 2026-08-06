function unique(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))]
}

function usefulLines(bodyText) {
  return String(bodyText || '').split(/\n+/).map(line => line.trim()).filter(line => line && line.length <= 1000)
}

export function extractCuteInternet(snapshot) {
  return unique([...snapshot.clipboardTexts, ...snapshot.copyTexts, ...usefulLines(snapshot.bodyText)])
}

export function extractEmojiDb(snapshot) {
  return unique([...snapshot.clipboardTexts, ...snapshot.copyTexts, ...snapshot.emojiTexts, ...usefulLines(snapshot.bodyText)])
}

export const adapters = { cuteinternet: extractCuteInternet, emojidb: extractEmojiDb }
