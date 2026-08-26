import assert from 'node:assert/strict'
import test from 'node:test'
import { mediaExtension, normalizeMusicCardProject, safeProjectId } from '../src/repositories/music-card-local.mjs'

test('music card local project accepts only safe local identifiers', () => {
  assert.equal(safeProjectId('card_12345678'), 'card_12345678')
  assert.throws(() => safeProjectId('../outside'), /无效/)
  assert.throws(() => safeProjectId('short'), /无效/)
})

test('media extension preserves supported source suffix without storing binary in JSON', () => {
  assert.equal(mediaExtension('wxfile://tmp/source.MP4?x=1', 'video'), '.mp4')
  assert.equal(mediaExtension('wxfile://tmp/no-extension', 'video'), '.mp4')
  assert.equal(mediaExtension('wxfile://tmp/no-extension', 'image'), '.jpg')
})

test('normalizes a local-only image or video project without audio fields', () => {
  const project = normalizeMusicCardProject({
    id: 'card_12345678',
    canvasSize: '3:4',
    media: { type: 'video', localPath: 'wxfile://usr/music-card/card_12345678/source.mp4', size: 2048 },
    songInfo: { songName: 'slow living', artist: 'just be' }
  })
  assert.equal(project.schemaVersion, 2)
  assert.equal(project.media.type, 'video')
  assert.equal(project.media.size, 2048)
  assert.equal(project.songInfo.songName, 'slow living')
  assert.equal('audio' in project, false)
  assert.equal('audioPath' in project, false)
})

test('migrates legacy player ids in the project and player layer', () => {
  const project = normalizeMusicCardProject({ id: 'card_12345678', playerTemplateId: 'minimal', layers: [{ id: 'player', type: 'player', templateId: 'vintage' }] })
  assert.equal(project.playerTemplateId, 'capsule')
  assert.equal(project.layers[0].templateId, 'console')
})
