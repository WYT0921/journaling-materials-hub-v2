import test from 'node:test'
import assert from 'node:assert/strict'
import { CANVAS_SIZES, findTopLayerAtPoint, resizeLayers, songProgress } from '../src/utils/music-card/editor.mjs'

test('song progress validates and clamps time values', () => {
  assert.equal(songProgress('1:00', '4:00'), 0.25)
  assert.equal(songProgress('9:00', '4:00'), 1)
  assert.equal(songProgress('bad', '4:00'), 0.35)
})

test('canvas ratio conversion rescales layer coordinates and bounds', () => {
  const layers = [{ id: 'photo', type: 'photo', x: 120, y: 90, width: 600, height: 300, scale: 1 }]
  const result = resizeLayers(layers, CANVAS_SIZES['4:3'], CANVAS_SIZES['1:1'])
  assert.equal(result[0].x, 108)
  assert.equal(result[0].y, 108)
  assert.equal(result[0].width, 540)
})

test('hit testing chooses top visual layer and ignores global decoration layers', () => {
  const layers = [
    { id: 'photo', type: 'photo', x: 0, y: 0, width: 200, height: 200 },
    { id: 'player', type: 'player', x: 20, y: 20, width: 100, height: 100 },
    { id: 'decor', type: 'decoration', x: 0, y: 0, width: 500, height: 500 }
  ]
  assert.equal(findTopLayerAtPoint(layers, { x: 50, y: 50 }).id, 'player')
})
