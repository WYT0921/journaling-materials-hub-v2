import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('collage is the second primary tab and existing tab indexes move with it', async () => {
  const pages = JSON.parse(await readSource('src/pages.json'))
  assert.deepEqual(
    pages.tabBar.list.map(item => item.pagePath),
    ['pages/index/index', 'pages/collage/index', 'pages/tools/tools', 'pages/profile/profile']
  )

  const tabBar = await readSource('src/components/CustomTabBar.vue')
  assert.match(tabBar, /text:\s*'拼贴'[\s\S]*pagePath:\s*'\/pages\/collage\/index'/)

  const tools = await readSource('src/pages/tools/tools.vue')
  const profile = await readSource('src/pages/profile/profile.vue')
  assert.match(tools, /<CustomTabBar\s+:current="2"/)
  assert.match(profile, /<CustomTabBar\s+:current="3"/)
})

test('detail page passes a material through the collage store before switching tabs', async () => {
  const detail = await readSource('src/pages/detail/detail.vue')
  assert.match(detail, /setPendingMaterialId\(materialId\.value\)/)
  assert.match(detail, /uni\.switchTab\(\{\s*url:\s*'\/pages\/collage\/index'/)
})

test('collage uses DOM image layers for editing and renders its tab bar', async () => {
  const collage = await readSource('src/pages/collage/index.vue')
  assert.match(collage, /class="paper-stage"/)
  assert.match(collage, /v-for="layer in collageStore\.scene\.layers"/)
  assert.match(collage, /class="stage-layer-image"/)
  assert.match(collage, /class="selection-outline"/)
  assert.doesNotMatch(collage, /<canvas/)
  assert.match(collage, /<CustomTabBar\s+:current="1"/)
})

test('material picker requests a compact bottom sheet', async () => {
  const picker = await readSource('src/components/collage/MaterialPicker.vue')
  assert.match(picker, /max-height="68vh"/)
})

test('material picker omits keyword when the search input is empty', async () => {
  const picker = await readSource('src/components/collage/MaterialPicker.vue')
  assert.match(picker, /const\s+params\s*=\s*\{[\s\S]*materialType:\s*'single'/)
  assert.match(picker, /if\s*\(normalizedKeyword\)\s*params\.keyword\s*=\s*normalizedKeyword/)
  assert.doesNotMatch(picker, /keyword:\s*keyword\.value\.trim\(\)\s*\|\|\s*undefined/)
})

test('collage does not generate a sheet preview for the live editor', async () => {
  const collage = await readSource('src/pages/collage/index.vue')
  assert.doesNotMatch(collage, /canvasPreviewPath/)
  assert.doesNotMatch(collage, /renderCollagePreview\(collageStore\.scene\)/)
  assert.doesNotMatch(collage, /canvasToTempFilePath/)
})
