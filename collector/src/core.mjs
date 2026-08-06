import { createHash } from 'node:crypto'

const URL_PATTERN = /(?:https?:\/\/|www\.)\S+/iu
const CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u
const BLOCKED_PATTERN = /(porn|nude|sex|suicide|self[- ]?harm|kill yourself|nazi|terrorist|色情|裸照|性爱|自杀|自残|纳粹|恐怖主义)/iu
const MILD_PATTERN = /(🖕|┌∩┐|middle\s*finger|flip\s*off)/iu
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u

export function normalizeContent(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n').normalize('NFC').trim()
}

export function contentHash(value) {
  return createHash('sha256').update(normalizeContent(value), 'utf8').digest('hex')
}

export function rejectionReason(value) {
  const content = normalizeContent(value)
  if (!content) return 'empty'
  if ([...content].length > 1000) return 'too_long'
  if (URL_PATTERN.test(content)) return 'url'
  if (CONTROL_PATTERN.test(content)) return 'control_character'
  if (BLOCKED_PATTERN.test(content)) return 'blocked_topic'
  const letters = [...content].filter(character => /[\p{L}\p{N}]/u.test(character)).length
  if ([...content].length > 120 && letters / [...content].length > 0.75) return 'plain_paragraph'
  if (!/[\p{S}\p{P}]/u.test(content)) return 'plain_text'
  return null
}

export function classifyType(content) {
  const normalized = normalizeContent(content)
  const faceLike = /[()（）\[\]\/\\]/u.test(normalized) && /[_^・ωᴗ▽︿ಠ•]/u.test(normalized)
  return faceLike && !EMOJI_PATTERN.test(normalized) ? 'kaomoji' : 'emoji'
}

export function classifyCategory(content, type) {
  if (type === 'kaomoji') {
    if (/[︿╥泣哭;]/u.test(content)) return '难过'
    if (/[怒ಠ凸]/u.test(content) || MILD_PATTERN.test(content)) return '生气'
    if (/[猫犬兔૮₍]/u.test(content)) return '动物'
    if (/[وづง]/u.test(content)) return '动作'
    if (/[▽ᴗᵕω]/u.test(content)) return '开心'
    return '可爱'
  }
  if (/[♡♥❤💗💕💖]/u.test(content)) return '爱心'
  if (/[★☆✦✧⭐🌟]/u.test(content)) return '星星'
  if (/[🌸🌹🌷🌻🌼]/u.test(content)) return '花朵'
  if (/[☁🌙☀🌧❄]/u.test(content)) return '天气'
  if (/[🍰🍓🍒🍜🍙🍪]/u.test(content)) return '食物'
  return '装饰'
}

export function buildCandidate(content, source, sourceUrl) {
  const normalized = normalizeContent(content)
  const rejection = rejectionReason(normalized)
  if (rejection) return { rejection }
  const type = classifyType(normalized)
  return {
    candidate: {
      content: normalized,
      type,
      category: classifyCategory(normalized, type),
      tags: [],
      source,
      sourceUrl,
      riskLevel: MILD_PATTERN.test(normalized) ? 'mild' : 'safe'
    }
  }
}

export function processCandidates(values, source, sourceUrl, seen = new Set()) {
  const candidates = []
  const filtered = {}
  let duplicates = 0
  for (const value of values) {
    const result = buildCandidate(value, source, sourceUrl)
    if (result.rejection) {
      filtered[result.rejection] = (filtered[result.rejection] || 0) + 1
      continue
    }
    const hash = contentHash(result.candidate.content)
    if (seen.has(hash)) { duplicates++; continue }
    seen.add(hash)
    candidates.push(result.candidate)
  }
  return { candidates, filtered, duplicates }
}
