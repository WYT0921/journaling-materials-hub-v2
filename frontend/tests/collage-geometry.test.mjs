import test from 'node:test'
import assert from 'node:assert/strict'

import {
  angle,
  distance,
  hitTestLayer,
  logicalToScreen,
  normalizeAngleDelta,
  screenToLogical
} from '../src/utils/collage/geometry.mjs'

test('converts screen coordinates into logical canvas coordinates', () => {
  const point = screenToLogical({ x: 120, y: 220 }, {
    offsetX: 20,
    offsetY: 20,
    scale: 0.5
  })

  assert.deepEqual(point, { x: 200, y: 400 })
})

test('converts logical canvas coordinates into DOM stage coordinates', () => {
  const point = logicalToScreen({ x: 200, y: 400 }, {
    offsetX: 20,
    offsetY: 20,
    scale: 0.5
  })

  assert.deepEqual(point, { x: 120, y: 220 })
})

test('detects points inside and outside an unrotated layer', () => {
  const layer = { x: 100, y: 100, baseWidth: 80, baseHeight: 40, scale: 1, rotation: 0 }

  assert.equal(hitTestLayer({ x: 130, y: 110 }, layer), true)
  assert.equal(hitTestLayer({ x: 150, y: 110 }, layer), false)
})

test('hit testing applies the inverse layer rotation', () => {
  const layer = { x: 100, y: 100, baseWidth: 100, baseHeight: 20, scale: 1, rotation: 90 }

  assert.equal(hitTestLayer({ x: 100, y: 140 }, layer), true)
  assert.equal(hitTestLayer({ x: 140, y: 100 }, layer), false)
})

test('calculates touch distance and angle', () => {
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5)
  assert.equal(angle({ x: 0, y: 0 }, { x: 0, y: 10 }), 90)
})

test('normalizes rotation deltas around the 180 degree seam', () => {
  assert.equal(normalizeAngleDelta(340), -20)
  assert.equal(normalizeAngleDelta(-340), 20)
})
