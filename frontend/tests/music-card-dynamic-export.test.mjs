import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { assessDynamicExportCapability, createDynamicExportError } from '../src/utils/music-card/dynamic-export.mjs'

describe('dynamic export capability', () => {
  it('rejects runtimes without MediaRecorder', () => {
    assert.equal(assessDynamicExportCapability({}).code, 'NO_MEDIA_RECORDER')
  })

  it('does not claim the current Canvas 2D renderer is recordable', () => {
    const result = assessDynamicExportCapability({ createMediaRecorder() {}, createOffscreenCanvas() {} }, 'canvas2d')
    assert.equal(result.supported, false)
    assert.equal(result.code, 'CANVAS2D_NOT_RECORDABLE')
  })

  it('reserves the supported path for a future WebGL renderer', () => {
    const result = assessDynamicExportCapability({ createMediaRecorder() {}, createOffscreenCanvas() {} }, 'webgl')
    assert.equal(result.supported, true)
    assert.equal(createDynamicExportError(result).code, 'WEBGL_MEDIA_RECORDER')
  })
})
