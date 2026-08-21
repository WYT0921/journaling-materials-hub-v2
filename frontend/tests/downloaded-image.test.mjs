import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveExtension, safeBaseName } from '../src/utils/downloaded-image.mjs'

test('downloaded images retain a real image extension instead of bin', () => {
  assert.equal(resolveExtension('素材.png', 'application/octet-stream'), '.png')
  assert.equal(resolveExtension('photo.jpeg', 'image/jpeg'), '.jpg')
  assert.equal(resolveExtension('', 'image/gif'), '.gif')
  assert.equal(resolveExtension('', 'image/webp'), '.webp')
})

test('download filenames are safe inside USER_DATA_PATH', () => {
  assert.equal(safeBaseName('可爱 / 素材?.png'), '可爱-素材')
  assert.equal(safeBaseName(''), 'material')
})
