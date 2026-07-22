import test from 'node:test'
import assert from 'node:assert/strict'

import { getPreviewSize, validateSceneForExport } from '../src/utils/collage/exporter.mjs'

test('rejects an empty collage', () => {
  assert.throws(
    () => validateSceneForExport({ layers: [] }),
    /至少添加一个素材/
  )
})

test('rejects a visible image layer without a local image path', () => {
  assert.throws(
    () => validateSceneForExport({ layers: [{ type: 'image', visible: true }] }),
    /素材图片尚未加载完成/
  )
})

test('accepts a scene with a loaded visible image layer', () => {
  assert.equal(validateSceneForExport({
    layers: [{ type: 'image', visible: true, localImagePath: 'wxfile://one.png' }]
  }), true)
})

test('creates a bounded portrait preview size from logical canvas dimensions', () => {
  assert.deepEqual(getPreviewSize({ logicalWidth: 1000, logicalHeight: 1414 }, 720), {
    width: 509,
    height: 720
  })
})
