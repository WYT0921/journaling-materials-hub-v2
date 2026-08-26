import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { convertText, generateFontResults } from '../src/utils/fonts/font-generator.mjs'

const styles = JSON.parse(await readFile(new URL('../src/utils/fonts/fonts.json', import.meta.url), 'utf8'))
const canonical = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

test('font library contains 70 valid and unique styles', () => {
  assert.equal(styles.length, 70)
  assert.equal(new Set(styles.map(style => style.id)).size, styles.length)

  const outputs = styles.map(style => convertText(canonical, style))
  assert.equal(new Set(outputs).size, styles.length)

  for (const style of styles) {
    const changed = [...canonical].filter(character => style.map[character] && style.map[character] !== character)
    assert.ok(changed.length >= 20, `${style.id} only maps ${changed.length} ASCII alphanumeric characters`)
    for (const glyph of Object.values(style.map)) {
      assert.equal([...glyph].length, 1, `${style.id} contains a multi-code-point glyph`)
      assert.doesNotMatch(glyph, /\p{Mark}/u, `${style.id} contains a combining mark`)
    }
  }
})

test('conversion preserves unsupported punctuation, Chinese, and emoji', () => {
  const bold = styles.find(style => style.id === 'bold-natural')
  const converted = convertText('Ab9, 中文🙂!', bold)
  assert.equal(converted, '𝐀𝐛𝟗, 中文🙂!')
})

test('missing mappings fall back to the original character', () => {
  const italic = styles.find(style => style.id === 'italic-natural')
  assert.equal(convertText('A1?', italic), '𝐴1?')
})

test('surrogate-pair emoji is preserved as a single code point', () => {
  const bold = styles.find(style => style.id === 'bold-natural')
  assert.equal(convertText('a😀b', bold), '𝐚😀𝐛')
})

test('mirror and upside-down styles reverse before mapping', () => {
  const mirror = styles.find(style => style.id === 'mirror')
  const upsideDown = styles.find(style => style.id === 'upside-down')
  assert.equal(convertText('abc', mirror), `${mirror.map.c}${mirror.map.b}${mirror.map.a}`)
  assert.equal(convertText('abc', upsideDown), `${upsideDown.map.c}${upsideDown.map.b}${upsideDown.map.a}`)
})

test('default input produces 70 non-empty distinct results', () => {
  const results = generateFontResults('fancy text', styles)
  assert.equal(results.length, 70)
  assert.ok(results.every(result => result.text.length > 0))
  assert.equal(new Set(results.map(result => result.text)).size, results.length)
})

test('empty input produces no results', () => {
  assert.deepEqual(generateFontResults('', styles), [])
})
