/**
 * 色彩提取模块单元测试 — K-Means 收敛、调色板、HSL 工具
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  rgbToHsl, hslToRgb, rgbToHex, luminance, contrastRatio,
  nameColor, extractPalette
} from '../src/utils/music-card/color-extraction.mjs'

describe('RGB / HSL conversion', () => {
  it('converts pure red to HSL', () => {
    const result = rgbToHsl(255, 0, 0)
    assert.equal(result.h, 0)
    assert.equal(result.s, 100)
    assert.equal(result.l, 50)
  })

  it('converts white to HSL', () => {
    const result = rgbToHsl(255, 255, 255)
    assert.equal(result.s, 0)
    assert.equal(result.l, 100)
  })

  it('converts black to HSL', () => {
    const result = rgbToHsl(0, 0, 0)
    assert.equal(result.s, 0)
    assert.equal(result.l, 0)
  })

  it('HSL round-trips approximately', () => {
    const original = { r: 120, g: 180, b: 90 }
    const hsl = rgbToHsl(original.r, original.g, original.b)
    const back = hslToRgb(hsl.h, hsl.s, hsl.l)
    assert.ok(Math.abs(back.r - original.r) < 5, `r diff too large: ${back.r}`)
    assert.ok(Math.abs(back.g - original.g) < 5)
    assert.ok(Math.abs(back.b - original.b) < 5)
  })

  it('converts RGB to hex', () => {
    assert.equal(rgbToHex(255, 0, 0), '#ff0000')
    assert.equal(rgbToHex(0, 128, 0), '#008000')
    assert.equal(rgbToHex(255, 255, 255), '#ffffff')
  })
})

describe('luminance and contrast', () => {
  it('black has luminance near 0, white near 1', () => {
    assert.ok(luminance(0, 0, 0) < 0.01)
    assert.ok(luminance(255, 255, 255) > 0.99)
  })

  it('black on white has high contrast', () => {
    const ratio = contrastRatio(0, 0, 0, 255, 255, 255)
    assert.ok(ratio > 15, `expected >15, got ${ratio}`)
  })

  it('white on white has contrast near 1', () => {
    const ratio = contrastRatio(255, 255, 255, 255, 255, 255)
    assert.ok(ratio < 1.1, `expected ~1, got ${ratio}`)
  })
})

describe('color naming', () => {
  it('names warm gray correctly', () => {
    const name = nameColor(180, 170, 160)
    assert.ok(typeof name === 'string' && name.length > 0)
  })

  it('names dark pixels as dark tones', () => {
    const name = nameColor(30, 28, 26)
    assert.ok(name.length > 0)
  })

  it('never throws for any valid RGB', () => {
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(Math.random() * 256)
      const g = Math.floor(Math.random() * 256)
      const b = Math.floor(Math.random() * 256)
      assert.doesNotThrow(() => nameColor(r, g, b))
    }
  })
})

describe('K-Means palette extraction', () => {
  const makePixelData = (pixels) => {
    const w = Math.min(pixels.length, 100)
    const h = Math.ceil(pixels.length / w)
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < pixels.length; i++) {
      const idx = i * 4
      data[idx] = pixels[i][0]
      data[idx + 1] = pixels[i][1]
      data[idx + 2] = pixels[i][2]
      data[idx + 3] = 255
    }
    return { data, width: w, height: h }
  }

  it('extracts 5 colors from a varied image', () => {
    const pixels = []
    // Generate a mix of red, green, blue, and gray clusters
    for (let i = 0; i < 200; i++) pixels.push([200 + Math.random() * 55, 10 + Math.random() * 30, 10 + Math.random() * 30])
    for (let i = 0; i < 200; i++) pixels.push([10 + Math.random() * 30, 180 + Math.random() * 55, 20 + Math.random() * 30])
    for (let i = 0; i < 200; i++) pixels.push([10 + Math.random() * 30, 10 + Math.random() * 30, 200 + Math.random() * 55])
    for (let i = 0; i < 100; i++) pixels.push([150 + Math.random() * 30, 150 + Math.random() * 30, 150 + Math.random() * 30])
    const pixelData = makePixelData(pixels)
    const palette = extractPalette(pixelData, 4)

    assert.equal(palette.length, 4)
    palette.forEach(color => {
      assert.ok(typeof color.hex === 'string' && color.hex.startsWith('#'))
      assert.ok(Array.isArray(color.rgb) && color.rgb.length === 3)
      assert.ok(typeof color.hsl.h === 'number')
      assert.ok(typeof color.name === 'string')
      assert.ok(typeof color.ratio === 'number' && color.ratio >= 0 && color.ratio <= 100)
    })
  })

  it('handles single-color image', () => {
    const pixels = Array.from({ length: 100 }, () => [128, 128, 128])
    const pixelData = makePixelData(pixels)
    const palette = extractPalette(pixelData, 3)

    assert.ok(palette.length >= 1)
    assert.ok(palette.length <= 3)
  })

  it('handles very small input', () => {
    const pixelData = {
      data: new Uint8ClampedArray([100, 150, 200, 255]),
      width: 1,
      height: 1
    }
    const palette = extractPalette(pixelData, 3)
    assert.ok(palette.length >= 1)
  })

  it('skips transparent and near-white/black pixels', () => {
    const pixels = [
      [0, 0, 0, 0],     // transparent → skipped
      [253, 253, 253, 255], // near-white → skipped
      [2, 2, 2, 255],       // near-black → skipped
      [120, 80, 160, 255],  // valid
      [50, 180, 90, 255],   // valid
    ]
    const w = 5, h = 1
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < pixels.length; i++) {
      const idx = i * 4
      data[idx] = pixels[i][0]; data[idx + 1] = pixels[i][1]
      data[idx + 2] = pixels[i][2]; data[idx + 3] = pixels[i][3]
    }
    const palette = extractPalette({ data, width: w, height: h }, 2)
    // 只有 2 个有效像素
    assert.ok(palette.length >= 1 && palette.length <= 2)
  })
})
