/**
 * 播放器模板和背景配置单元测试 — JSON schema 校验
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templatesPath = resolve(root, 'src/utils/music-card/templates/player-templates.json')

describe('player templates JSON schema', () => {
  /** @type {Array} */
  let templates

  it('loads JSON file successfully', () => {
    assert.doesNotThrow(() => {
      templates = JSON.parse(readFileSync(templatesPath, 'utf8'))
    })
  })

  it('has exactly the 6 Music Widget templates', () => {
    assert.ok(Array.isArray(templates))
    assert.equal(templates.length, 6)
  })

  it('each template has required fields', () => {
    const required = ['id', 'name', 'description', 'coverSize', 'albumArtBorderRadius', 'fontFamily', 'titleSize', 'artistSize', 'colors']
    templates.forEach(t => {
      required.forEach(field => {
        assert.ok(field in t, `template ${t.id} missing ${field}`)
      })
    })
  })

  it('all template IDs are unique', () => {
    const ids = templates.map(t => t.id)
    assert.equal(new Set(ids).size, ids.length, 'duplicate template IDs found')
  })

  it('coverSize is between 0.2 and 0.8', () => {
    templates.forEach(t => {
      assert.ok(t.coverSize >= 0.2 && t.coverSize <= 0.8,
        `${t.id} coverSize ${t.coverSize} out of range`)
    })
  })

  it('albumArtBorderRadius is non-negative', () => {
    templates.forEach(t => {
      assert.ok(t.albumArtBorderRadius >= 0, `${t.id} borderRadius ${t.albumArtBorderRadius}`)
    })
  })

  it('titleSize and artistSize are positive', () => {
    templates.forEach(t => {
      assert.ok(t.titleSize > 0)
      assert.ok(t.artistSize > 0)
    })
  })

  it('fontFamily is a valid value', () => {
    templates.forEach(t => {
      assert.ok(['sans-serif', 'serif', 'monospace'].includes(t.fontFamily),
        `${t.id} fontFamily ${t.fontFamily} invalid`)
    })
  })

  it('colors has required sub-fields', () => {
    templates.forEach(t => {
      assert.ok('background' in t.colors, `${t.id} missing colors.background`)
      assert.ok('text' in t.colors, `${t.id} missing colors.text`)
    })
  })

  it('has the 6 expected template styles', () => {
    const expectedIds = ['bubble', 'vinyl', 'capsule', 'console', 'waveform', 'heartbeat']
    const ids = templates.map(t => t.id)
    expectedIds.forEach(id => {
      assert.ok(ids.includes(id), `missing template: ${id}`)
    })
  })

  it('showProgress and showControls are booleans', () => {
    templates.forEach(t => {
      assert.equal(typeof t.showProgress, 'boolean', `${t.id} showProgress`)
      assert.equal(typeof t.showControls, 'boolean', `${t.id} showControls`)
    })
  })
})

describe('background functions are importable', () => {
  it('imports all background draw functions', async () => {
    const bg = await import('../src/utils/music-card/backgrounds.mjs')
    assert.equal(typeof bg.drawSolidBackground, 'function')
    assert.equal(typeof bg.drawGradientBackground, 'function')
    assert.equal(typeof bg.drawStripeTexture, 'function')
    assert.equal(typeof bg.drawBlurGlassBackground, 'function')
    assert.equal(typeof bg.drawPaperTexture, 'function')
    assert.equal(typeof bg.drawWatercolorBackground, 'function')
    assert.equal(typeof bg.drawFilmGrain, 'function')
    assert.equal(typeof bg.drawBackground, 'function')
  })
})

describe('player templates module exports', () => {
  it('exports playerTemplates list', async () => {
    const mod = await import('../src/utils/music-card/player-templates.mjs')
    assert.ok(Array.isArray(mod.playerTemplates))
    assert.equal(mod.playerTemplates.length, 6)
    assert.equal(typeof mod.drawPlayerTemplate, 'function')
    assert.equal(mod.normalizePlayerTemplateId('minimal'), 'capsule')
    const context = { font: '', measureText: text => ({ width: Array.from(text).length * 20 }) }
    const layout = mod.fitSongTitle(context, '这是一首名字很长很长的歌曲', 120, 28, 14)
    assert.equal(layout.lines.length, 2)
    assert.ok(layout.fontSize >= 14)
  })
})

describe('renderer module exports', () => {
  it('exports draw and export functions', async () => {
    const mod = await import('../src/utils/music-card/renderer.mjs')
    assert.equal(typeof mod.drawMusicCardScene, 'function')
    assert.equal(typeof mod.exportMusicCard, 'function')
    assert.equal(typeof mod.renderMusicCardPreview, 'function')
    assert.deepEqual(mod.calculateExportSize({ width: 1080, height: 1440 }, 2), { width: 2160, height: 2880, scale: 2 })
    const limited = mod.calculateExportSize({ width: 1080, height: 1920 }, 4)
    assert.ok(limited.width * limited.height <= 12000000)
    assert.ok(Math.max(limited.width, limited.height) <= 4096)
    assert.throws(() => mod.calculateExportSize({ width: 0, height: 100 }, 2), /画布尺寸无效/)
    assert.deepEqual(mod.coverCropRect(1600, 900, 600, 600), { x: 350, y: 0, width: 900, height: 900 })
    assert.deepEqual(mod.coverCropRect(900, 1600, 600, 300), { x: 0, y: 575, width: 900, height: 450 })
  })
})
