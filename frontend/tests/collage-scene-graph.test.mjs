import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_LAYERS,
  cloneScene,
  createCanvasConfig,
  createEmptyScene,
  createImageLayer,
  getExportSize
} from '../src/utils/collage/scene-graph.mjs'
import { createHistory } from '../src/utils/collage/history.mjs'

test('creates A6 portrait canvas with logical and 300 DPI sizes', () => {
  const canvas = createCanvasConfig('A6', 'portrait')

  assert.deepEqual(canvas, {
    paperSize: 'A6',
    orientation: 'portrait',
    logicalWidth: 1000,
    logicalHeight: 1414,
    exportWidth: 1240,
    exportHeight: 1748,
    background: '#FFFFFF'
  })
})

test('swaps logical and export dimensions for landscape', () => {
  const canvas = createCanvasConfig('A4', 'landscape')

  assert.equal(canvas.logicalWidth, 1414)
  assert.equal(canvas.logicalHeight, 1000)
  assert.equal(canvas.exportWidth, 3508)
  assert.equal(canvas.exportHeight, 2480)
})

test('returns 200 DPI fallback export size', () => {
  assert.deepEqual(getExportSize('A4', 'portrait', 200), {
    width: 1653,
    height: 2339
  })
})

test('creates a centered image layer fitted inside sixty percent of canvas', () => {
  const canvas = createCanvasConfig('A6', 'portrait')
  const layer = createImageLayer(
    { id: 12, title: '花朵' },
    { path: 'wxfile://flower.png', width: 2000, height: 1000 },
    canvas,
    'layer-1'
  )

  assert.equal(layer.id, 'layer-1')
  assert.equal(layer.materialId, 12)
  assert.equal(layer.x, 500)
  assert.equal(layer.y, 707)
  assert.equal(layer.baseWidth, 600)
  assert.equal(layer.baseHeight, 300)
  assert.equal(layer.scale, 1)
  assert.equal(layer.rotation, 0)
})

test('scene clones are independent serializable values', () => {
  const scene = createEmptyScene('A6', 'portrait')
  scene.layers.push({ id: 'one', x: 10 })

  const copy = cloneScene(scene)
  copy.layers[0].x = 20

  assert.equal(scene.layers[0].x, 10)
  assert.equal(copy.layers[0].x, 20)
  assert.equal(JSON.stringify(copy).includes('one'), true)
})

test('declares a fifty layer session limit', () => {
  assert.equal(MAX_LAYERS, 50)
})

test('history supports undo, redo, branch replacement, and reset', () => {
  const history = createHistory({ layers: [] })
  history.commit({ layers: [{ id: 'one' }] })
  history.commit({ layers: [{ id: 'one' }, { id: 'two' }] })

  assert.equal(history.canUndo(), true)
  assert.deepEqual(history.undo(), { layers: [{ id: 'one' }] })
  assert.equal(history.canRedo(), true)

  history.commit({ layers: [{ id: 'three' }] })
  assert.equal(history.canRedo(), false)

  history.reset({ layers: [] })
  assert.equal(history.canUndo(), false)
  assert.deepEqual(history.current(), { layers: [] })
})
