import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const paginatedViews = [
  'src/views/materials/MaterialList.vue',
  'src/views/users/UserList.vue',
  'src/views/redeem-codes/RedeemCodeList.vue',
  'src/views/collector/CollectorRunList.vue',
  'src/views/feedbacks/FeedbackList.vue'
]

for (const view of paginatedViews) {
  test(`${view} displays the total record count`, async () => {
    const source = await readFile(new URL(`../${view}`, import.meta.url), 'utf8')

    assert.match(source, /共\s*\{\{\s*total\s*\}\}\s*条/)
  })
}
