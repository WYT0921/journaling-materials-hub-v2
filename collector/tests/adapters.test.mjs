import assert from 'node:assert/strict'
import test from 'node:test'
import { extractCuteInternet, extractEmojiDb } from '../src/adapters.mjs'

const snapshot = { clipboardTexts: ['(｡･ω･｡)'], copyTexts: ['Copy', '(｡･ω･｡)'], emojiTexts: ['₊˚⊹♡'], bodyText: 'Heading\n☁️⋆｡˚' }

test('cuteinternet adapter extracts unique DOM and line candidates', () => {
  assert.deepEqual(extractCuteInternet(snapshot), ['(｡･ω･｡)', 'Copy', 'Heading', '☁️⋆｡˚'])
})

test('emojidb adapter also includes emoji nodes', () => {
  assert.ok(extractEmojiDb(snapshot).includes('₊˚⊹♡'))
})
