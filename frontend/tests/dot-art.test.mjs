import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampOutputWidth,
  cropGrayscale,
  detectContentBounds,
  generateDotArt,
  getTextArtLayout,
  grayscaleToAscii,
  grayscaleToBraille,
  isDotArtEmpty,
  resizeGrayscale,
  rgbaToGrayscale
} from '../src/utils/dot-art/dot-art.mjs'

const rgba = (...values) => new Uint8ClampedArray(values)

test('transparent pixels are composited on white and RGB uses weighted luminance', () => {
  assert.deepEqual([...rgbaToGrayscale(rgba(0, 0, 0, 0, 255, 0, 0, 255))], [255, 76])
})

test('output width is rounded and clamped to supported range', () => {
  assert.equal(clampOutputWidth(10), 24)
  assert.equal(clampOutputWidth(49.4), 49)
  assert.equal(clampOutputWidth(200), 96)
  assert.equal(clampOutputWidth('invalid'), 48)
})

test('grayscale resize keeps dimensions and supports tiny sources', () => {
  const resized = resizeGrayscale(new Uint8ClampedArray([25]), 1, 1, 3, 2)
  assert.deepEqual([...resized], [25, 25, 25, 25, 25, 25])
})

test('content bounds crop a pale subject from a uniform pale background', () => {
  const width = 20
  const height = 16
  const data = new Uint8ClampedArray(width * height * 4)
  for (let offset = 0; offset < data.length; offset += 4) {
    data.set([250, 246, 232, 255], offset)
  }
  for (let y = 5; y <= 10; y += 1) {
    for (let x = 7; x <= 12; x += 1) {
      data.set([195, 230, 238, 255], (y * width + x) * 4)
    }
  }

  const bounds = detectContentBounds(data, width, height)
  assert.deepEqual(bounds, { x: 5, y: 3, width: 10, height: 10 })
  const cropped = cropGrayscale(rgbaToGrayscale(data), width, height, bounds)
  assert.equal(cropped.length, 100)
})

test('auto crop keeps a low-contrast pale subject visible in generated art', () => {
  const width = 80
  const height = 60
  const data = new Uint8ClampedArray(width * height * 4)
  for (let offset = 0; offset < data.length; offset += 4) data.set([250, 246, 232, 255], offset)
  for (let y = 23; y < 37; y += 1) {
    for (let x = 31; x < 49; x += 1) data.set([195, 230, 238, 255], (y * width + x) * 4)
  }
  const result = generateDotArt({ data, width, height }, { mode: 'braille', outputWidth: 24 })
  assert.equal(isDotArtEmpty(result), false)
  assert.ok(result.split('\n').length >= 8)
})

test('braille packs the standard 2 by 4 dot bit order', () => {
  const onlyTopLeft = new Uint8ClampedArray([0, 255, 255, 255, 255, 255, 255, 255])
  assert.equal(grayscaleToBraille(onlyTopLeft, 2, 4, { threshold: 128 }), '⠁')
  const allDark = new Uint8ClampedArray(8).fill(0)
  assert.equal(grayscaleToBraille(allDark, 2, 4, { threshold: 128 }), '⣿')
  assert.equal(grayscaleToBraille(allDark, 2, 4, { threshold: 128, inverted: true }), '')
})

test('ASCII maps black to dense characters and white to spaces', () => {
  const pixels = new Uint8ClampedArray([0, 255])
  assert.equal(grayscaleToAscii(pixels, 2, 1), '@')
  assert.equal(grayscaleToAscii(pixels, 2, 1, { inverted: true }), ' @')
})

test('generator preserves landscape and portrait intent in both modes', () => {
  const opaqueBlack = (width, height) => {
    const data = new Uint8ClampedArray(width * height * 4)
    for (let index = 3; index < data.length; index += 4) data[index] = 255
    return { data, width, height }
  }
  const landscape = opaqueBlack(80, 20)
  const portrait = opaqueBlack(20, 80)
  const landscapeLines = generateDotArt(landscape, { mode: 'ascii', outputWidth: 24 }).split('\n')
  const portraitLines = generateDotArt(portrait, { mode: 'braille', outputWidth: 24 }).split('\n')
  assert.ok(landscapeLines.length < 24)
  assert.ok(portraitLines.length > 24)
})

test('empty detection handles spaces and blank braille characters', () => {
  assert.equal(isDotArtEmpty('  \n⠀'), true)
  assert.equal(isDotArtEmpty('⠁'), false)
})

test('PNG text layout respects maximum edge for long output', () => {
  const layout = getTextArtLayout(`${'@'.repeat(500)}\n${'@'.repeat(500)}`, { maxEdge: 1024 })
  assert.ok(layout.width <= 1024)
  assert.ok(layout.height <= 1024)
  assert.ok(layout.fontSize > 0)
})
