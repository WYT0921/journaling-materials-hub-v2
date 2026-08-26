const DIGITS = new Map([
  ['零', 0], ['〇', 0], ['一', 1], ['二', 2], ['两', 2], ['三', 3], ['四', 4],
  ['五', 5], ['六', 6], ['七', 7], ['八', 8], ['九', 9]
])
const UNITS = new Map([['十', 10], ['百', 100], ['千', 1000]])

export function parseIssueNumber(value) {
  if (/^\d+$/.test(value)) return Number(value)
  let result = 0
  let digit = 0
  for (const char of value) {
    if (DIGITS.has(char)) {
      digit = DIGITS.get(char)
    } else if (UNITS.has(char)) {
      result += (digit || 1) * UNITS.get(char)
      digit = 0
    }
  }
  return result + digit
}

export function extractIssueCandidates(text) {
  const candidates = []
  const pattern = /(\d{4})\D{0,24}?第([〇零一二两三四五六七八九十百千\d]+)期/g
  for (const match of String(text || '').matchAll(pattern)) {
    const issueYear = Number(match[1])
    const issueNumber = parseIssueNumber(match[2])
    if (issueYear >= 1000 && issueYear <= 9999 && issueNumber > 0) {
      candidates.push({ issueYear, issueNumber })
    }
  }
  return candidates
}

export function resolveIssueCandidate(sources) {
  const matches = sources.flatMap(({ source, text }) =>
    extractIssueCandidates(text).map(candidate => ({ ...candidate, source }))
  )
  const unique = new Map(matches.map(match => [
    `${match.issueYear}-${match.issueNumber}`,
    { issueYear: match.issueYear, issueNumber: match.issueNumber }
  ]))

  if (unique.size === 1) {
    const [candidate] = unique.values()
    return { ...candidate, confidence: 'high', matchedSources: [...new Set(matches.map(item => item.source))] }
  }
  if (unique.size > 1) {
    return { issueYear: null, issueNumber: null, confidence: 'conflict', candidates: [...unique.values()] }
  }
  return { issueYear: null, issueNumber: null, confidence: 'unmatched', candidates: [] }
}
