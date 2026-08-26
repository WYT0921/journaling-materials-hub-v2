import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseRandomTemplate, renderDecoration } from '../src/utils/text-decoration.mjs'

test('renders inline, multiline and replace templates', () => {
  assert.equal(renderDecoration({ type: 'inline', prefix: '♡ ', suffix: ' ♡' }, '晚安'), '♡ 晚安 ♡')
  assert.equal(renderDecoration({ type: 'multiline', template: 'top\n{text}\nbottom' }, 'hello'), 'top\nhello\nbottom')
  assert.equal(renderDecoration({ type: 'replace', template: '♡' }, 'A😊B'), 'A♡😊♡B')
})

test('random selection avoids the previous template when possible', () => {
  const list = [{ id: 1, enabled: true }, { id: 2, enabled: true }, { id: 3, enabled: false }]
  assert.equal(chooseRandomTemplate(list, 1, () => 0).id, 2)
  assert.equal(chooseRandomTemplate([{ id: 1, enabled: true }], 1, () => 0).id, 1)
})
