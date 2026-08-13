import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCandidate, contentHash, normalizeContent, processCandidates, rejectionReason } from '../src/core.mjs'

test('normalizes NFC and line endings while preserving emoji joiners', () => {
  assert.equal(normalizeContent(' e\u0301\r\n👩‍💻️ '), 'é\n👩‍💻️')
  assert.equal(contentHash('é'), contentHash('e\u0301'))
})

test('removes copy-button feedback and rejects ASCII navigation labels', () => {
  assert.equal(normalizeContent('Copied! ૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა'), '૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა')
  assert.equal(rejectionReason('Visual Art & Design'), 'plain_text')
  assert.equal(rejectionReason('📋 copy'), 'ui_artifact')
  assert.equal(rejectionReason('🔎'), 'ui_artifact')
})

test('filters URLs, blocked topics, plain text, and long paragraphs', () => {
  assert.equal(rejectionReason('https://example.com ♡'), 'url')
  assert.equal(rejectionReason('suicide'), 'blocked_topic')
  assert.equal(rejectionReason('hello world'), 'plain_text')
  assert.equal(rejectionReason('a'.repeat(130) + '!'), 'plain_paragraph')
})

test('allows mild content but marks it for review', () => {
  const result = buildCandidate('┌∩┐(◣_◢)┌∩┐', 'cuteinternet', 'https://cuteinternet.com/middleFinger')
  assert.equal(result.candidate.riskLevel, 'mild')
  const sourceMarked = buildCandidate('凸 (►˛◄’!)', 'cuteinternet', 'https://cuteinternet.com/middleFinger')
  assert.equal(sourceMarked.candidate.riskLevel, 'mild')
})

test('deduplicates equivalent content and classifies assets', () => {
  const result = processCandidates(['(｡･ω･｡)', '(｡･ω･｡)', '₊˚⊹♡'], 'emojidb', 'https://emojidb.org/')
  assert.equal(result.candidates.length, 2)
  assert.equal(result.duplicates, 1)
  assert.equal(result.candidates[0].type, 'kaomoji')
  assert.equal(result.candidates[1].type, 'emoji')
})
