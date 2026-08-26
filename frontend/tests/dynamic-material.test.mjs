import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const card = fs.readFileSync(new URL('../src/components/MaterialCard.vue', import.meta.url), 'utf8')
const detail = fs.readFileSync(new URL('../src/pages/detail/detail.vue', import.meta.url), 'utf8')
const picker = fs.readFileSync(new URL('../src/components/collage/MaterialPicker.vue', import.meta.url), 'utf8')

test('dynamic materials use a list badge and detail playback behavior', () => {
  assert.match(card, /mediaType === 'animated_gif'/)
  assert.match(card, />GIF</)
  assert.match(detail, /<text>GIF<\/text>/)
  assert.match(detail, /当前微信无法保存动图/)
})

test('collage requests static images only', () => {
  assert.match(picker, /mediaType: 'static_image'/)
})
