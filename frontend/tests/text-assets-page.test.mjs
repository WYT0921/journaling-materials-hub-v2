import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('text asset library has tabs, filters, pagination, and copy interaction', async () => {
  const page = await readSource('src/pages/tools/text-assets.vue')
  assert.match(page, /label:\s*'颜文字',[\s\S]*value:\s*'kaomoji'/)
  assert.match(page, /label:\s*'Emoji',[\s\S]*value:\s*'emoji'/)
  assert.match(page, /setTimeout\(applySearch, 300\)/)
  assert.match(page, /@scrolltolower="loadMore"/)
  assert.match(page, /uni\.setClipboardData/)
  assert.match(page, /initialLoading/)
  assert.match(page, /loadError/)
  assert.doesNotMatch(page, /item\.source|素材来源|来源：/)
})

test('special font page retains the unicode font generator identity', async () => {
  const page = await readSource('src/pages/tools/fonts.vue')
  assert.match(page, /特殊字体生成器/)
  assert.match(page, /generateFontResults/)
  assert.doesNotMatch(page, /颜文字生成器/)
})
