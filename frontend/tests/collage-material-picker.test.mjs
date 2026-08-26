import assert from 'node:assert/strict'
import test from 'node:test'

import { favoriteRecordsToMaterials } from '../src/utils/collage/material-picker.mjs'

test('unwraps favorite records and keeps only single materials', () => {
  const materials = favoriteRecordsToMaterials([
    { id: 10, materialId: 1, material: { id: 1, title: 'one', materialType: 'single' } },
    { id: 11, materialId: 2, material: { id: 2, title: 'bundle', materialType: 'bundle' } },
    { id: 12, materialId: 3, material: null },
    { id: 13, materialId: 4, material: { title: 'four', materialType: 'single' } }
  ])

  assert.deepEqual(materials, [
    { id: 1, title: 'one', materialType: 'single', favoriteId: 10 },
    { id: 4, title: 'four', materialType: 'single', favoriteId: 13 }
  ])
})
