import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('primary tab bar excludes collage and keeps three top-level destinations', async () => {
  const pages = JSON.parse(await readSource('src/pages.json'))
  assert.equal(pages.pages[0].path, 'pages/tools/tools')
  assert.deepEqual(
    pages.tabBar.list.map(item => item.pagePath),
    ['pages/tools/tools', 'pages/index/index', 'pages/profile/profile']
  )

  const tabBar = await readSource('src/components/CustomTabBar.vue')
  assert.doesNotMatch(tabBar, /text:\s*'拼贴'/)

  const tools = await readSource('src/pages/tools/tools.vue')
  const profile = await readSource('src/pages/profile/profile.vue')
  assert.match(tools, /<CustomTabBar\s+:current="0"/)
  assert.match(await readSource('src/pages/index/index.vue'), /<CustomTabBar\s+:current="1"/)
  assert.match(profile, /<CustomTabBar\s+:current="2"/)
})

test('local paper background is rendered with image components instead of app WXSS', async () => {
  const app = await readSource('src/App.vue')
  const background = await readSource('src/components/PageBackground.vue')
  assert.doesNotMatch(app, /background-image:\s*url\(['"]?\/static\/backgrounds/)
  assert.match(background, /<image[\s\S]*journal-paper\.jpg/)
})

test('toolbox exposes current tools while music card remains hidden', async () => {
  const pages = JSON.parse(await readSource('src/pages.json'))
  const tools = await readSource('src/pages/tools/tools.vue')

  assert.ok(pages.pages.some(page => page.path === 'pages/tools/fonts'))
  assert.ok(pages.pages.some(page => page.path === 'pages/tools/text-assets'))
  assert.ok(pages.pages.some(page => page.path === 'pages/tools/dot-art'))
  assert.ok(!pages.pages.some(page => page.path === 'pages/tools/music-card'))
  assert.match(tools, /name:\s*'特殊字体'/)
  assert.match(tools, /route:\s*'\/pages\/tools\/fonts'/)
  assert.match(tools, /name:\s*'颜文字 \/ Emoji'/)
  assert.match(tools, /route:\s*'\/pages\/tools\/text-assets'/)
  assert.match(tools, /name:\s*'自由拼贴'/)
  assert.match(tools, /route:\s*'\/pages\/collage\/index'/)
  assert.match(tools, /name:\s*'图片转 Dot Art'/)
  assert.match(tools, /route:\s*'\/pages\/tools\/dot-art'/)
  assert.doesNotMatch(tools, /name:\s*'氛围音乐卡片'/)
  assert.doesNotMatch(tools, /route:\s*'\/pages\/tools\/music-card'/)
  assert.doesNotMatch(tools, /uni\.switchTab\(\{\s*url:\s*tool\.route/)
  assert.doesNotMatch(tools, /fetchTools|useToolsStore|api\/tools/)
})

test('Dot Art page exposes dense local generation, color selection, copy and PNG saving', async () => {
  const dotArt = await readSource('src/pages/tools/dot-art.vue')
  assert.match(dotArt, /readImagePixels/)
  assert.match(dotArt, /generateDotArt/)
  assert.match(dotArt, /uni\.chooseImage/)
  assert.match(dotArt, /copyToClipboard\(dotText\.value/)
  assert.match(dotArt, /density = ref\('dense'\)/)
  assert.match(dotArt, /textColor/)
  assert.match(dotArt, /customColorInput/)
  assert.match(dotArt, /handleRgbChange/)
  assert.match(dotArt, /#RRGGBB/)
  assert.match(dotArt, /saveDotArtToAlbum/)
  assert.match(dotArt, /cachedImagePixels/)
  assert.match(dotArt, /dotOutputStyle/)
  assert.match(dotArt, /22 \* outputWidth\.value \/ effectiveOutputWidth\.value/)
  assert.match(dotArt, /下载图片/)
  assert.match(dotArt, /图片仅在本机处理/)
})

test('detail page passes a material through the collage store before opening the toolbox page', async () => {
  const detail = await readSource('src/pages/detail/detail.vue')
  assert.match(detail, /setPendingMaterialId\(materialId\.value\)/)
  assert.match(detail, /uni\.navigateTo\(\{\s*url:\s*'\/pages\/collage\/index'/)
})

test('materials page uses three phone columns and four wide-screen columns', async () => {
  const index = await readSource('src/pages/index/index.vue')
  const card = await readSource('src/components/MaterialCard.vue')
  assert.match(index, /class="material-grid"/)
  assert.match(index, /grid-template-columns:\s*repeat\(3,/)
  assert.match(index, /@media \(min-width:\s*600px\)[\s\S]*grid-template-columns:\s*repeat\(4,/)
  assert.match(index, /layout="compact"/)
  assert.match(card, /material-card-compact/)
  assert.match(card, /v-if="layout !== 'compact'"/)
  assert.match(card, /material-card-compact \.card-image-wrapper[\s\S]*background:\s*linear-gradient/)
  assert.doesNotMatch(card, /background-size:\s*24rpx 24rpx/)
  assert.doesNotMatch(card, /material\.isPremium|vip-badge|权限/)
})

test('material downloads do not expose membership or quota gates', async () => {
  const detail = await readSource('src/pages/detail/detail.vue')
  const profile = await readSource('src/pages/profile/profile.vue')
  assert.match(detail, /免费下载素材/)
  assert.doesNotMatch(detail, /showUnlockSheet|freeDownloadLimit|handleGoRedeem|权限素材/)
  assert.doesNotMatch(profile, /handleGoRedeem|输入通行码|素材权限/)
})

test('collage uses DOM image layers for editing without a duplicated tab bar', async () => {
  const collage = await readSource('src/pages/collage/index.vue')
  assert.match(collage, /class="paper-stage"/)
  assert.match(collage, /v-for="layer in collageStore\.scene\.layers"/)
  assert.match(collage, /class="stage-layer-image"/)
  assert.match(collage, /class="selection-outline"/)
  assert.doesNotMatch(collage, /<canvas/)
  assert.doesNotMatch(collage, /<CustomTabBar/)
})

test('material picker requests a compact bottom sheet', async () => {
  const picker = await readSource('src/components/collage/MaterialPicker.vue')
  assert.match(picker, /max-height="68vh"/)
})

test('material picker can switch between all materials and favorites', async () => {
  const picker = await readSource('src/components/collage/MaterialPicker.vue')
  assert.match(picker, />全部素材</)
  assert.match(picker, />我的收藏</)
  assert.match(picker, /getFavorites/)
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
