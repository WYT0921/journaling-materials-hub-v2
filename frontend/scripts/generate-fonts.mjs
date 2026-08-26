import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'

const fromRange = (start, count) => Array.from({ length: count }, (_, index) => String.fromCodePoint(start + index))

function alphabet(startUpper, startLower, startDigits, exceptions = {}) {
  const upper = fromRange(startUpper, 26)
  const lower = fromRange(startLower, 26)
  const digits = startDigits ? fromRange(startDigits, 10) : [...DIGITS]

  Object.entries(exceptions.upper || {}).forEach(([letter, glyph]) => { upper[UPPER.indexOf(letter)] = glyph })
  Object.entries(exceptions.lower || {}).forEach(([letter, glyph]) => { lower[LOWER.indexOf(letter)] = glyph })

  return { upper, lower, digits }
}

function mapEntries(source, targets, map = {}) {
  ;[...source].forEach((character, index) => {
    const target = targets[index]
    if (target && target !== character) map[character] = target
  })
  return map
}

function createMap(chars, mode = 'natural') {
  const map = {}
  const upperTargets = chars.upper
  const lowerTargets = chars.lower

  if (mode === 'natural') {
    mapEntries(UPPER, upperTargets, map)
    mapEntries(LOWER, lowerTargets, map)
  } else if (mode === 'upper') {
    mapEntries(UPPER, upperTargets, map)
    mapEntries(LOWER, upperTargets, map)
  } else {
    const upperFirst = mode === 'checker-upper'
    const targets = [...UPPER].map((_, index) => ((index % 2 === 0) === upperFirst ? upperTargets[index] : lowerTargets[index]))
    mapEntries(UPPER, targets, map)
    mapEntries(LOWER, targets, map)
  }

  mapEntries(DIGITS, chars.digits || [...DIGITS], map)
  return map
}

function style(id, name, map, reverse = false) {
  return { id, name, map, ...(reverse ? { reverse: true } : {}) }
}

const mathAlphabets = [
  ['bold', 'Bold', alphabet(0x1d400, 0x1d41a, 0x1d7ce)],
  ['italic', 'Italic', alphabet(0x1d434, 0x1d44e, null, { lower: { h: 'ℎ' } })],
  ['bold-italic', 'Bold Italic', alphabet(0x1d468, 0x1d482, null)],
  ['script', 'Script', alphabet(0x1d49c, 0x1d4b6, null, {
    upper: { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ' },
    lower: { e: 'ℯ', g: 'ℊ', l: 'ℓ', o: 'ℴ' }
  })],
  ['bold-script', 'Bold Script', alphabet(0x1d4d0, 0x1d4ea, null)],
  ['fraktur', 'Fraktur', alphabet(0x1d504, 0x1d51e, null, {
    upper: { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }
  })],
  ['bold-fraktur', 'Bold Fraktur', alphabet(0x1d56c, 0x1d586, null)],
  ['double-struck', 'Double Struck', alphabet(0x1d538, 0x1d552, 0x1d7d8, {
    upper: { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }
  })],
  ['sans', 'Sans Serif', alphabet(0x1d5a0, 0x1d5ba, 0x1d7e2)],
  ['sans-bold', 'Sans Bold', alphabet(0x1d5d4, 0x1d5ee, 0x1d7ec)],
  ['sans-italic', 'Sans Italic', alphabet(0x1d608, 0x1d622, null)],
  ['sans-bold-italic', 'Sans Bold Italic', alphabet(0x1d63c, 0x1d656, null)],
  ['monospace', 'Monospace', alphabet(0x1d670, 0x1d68a, 0x1d7f6)]
]

const variants = [
  ['natural', ''],
  ['upper', ' All Caps'],
  ['checker-upper', ' Alternating A'],
  ['checker-lower', ' Alternating B']
]

const styles = []

for (const [id, name, chars] of mathAlphabets) {
  for (const [mode, suffix] of variants) {
    styles.push(style(`${id}-${mode}`, `${name}${suffix}`, createMap(chars, mode)))
  }
}

const fullwidth = alphabet(0xff21, 0xff41, 0xff10)
const circled = {
  upper: fromRange(0x24b6, 26),
  lower: fromRange(0x24d0, 26),
  digits: ['⓪', ...fromRange(0x2460, 9)]
}

for (const [id, name, chars] of [['fullwidth', 'Fullwidth', fullwidth], ['circled', 'Circled', circled]]) {
  for (const [mode, suffix] of variants) {
    styles.push(style(`${id}-${mode}`, `${name}${suffix}`, createMap(chars, mode)))
  }
}

const parenthesizedLower = fromRange(0x249c, 26)
const parenthesizedDigits = ['0', ...fromRange(0x2474, 9)]
const parenthesizedMap = mapEntries(LOWER, parenthesizedLower)
mapEntries(UPPER, parenthesizedLower, parenthesizedMap)
mapEntries(DIGITS, parenthesizedDigits, parenthesizedMap)
styles.push(style('parenthesized', 'Parenthesized', parenthesizedMap))

const singleCaseStyles = [
  ['negative-circled', 'Negative Circled', fromRange(0x1f150, 26)],
  ['negative-squared', 'Negative Squared', fromRange(0x1f170, 26)],
  ['regional', 'Regional Indicators', fromRange(0x1f1e6, 26)]
]

for (const [id, name, targets] of singleCaseStyles) {
  const map = mapEntries(UPPER, targets)
  mapEntries(LOWER, targets, map)
  styles.push(style(id, name, map))
}

function pairedCaseMap(targets, digitTargets) {
  const map = mapEntries(LOWER, [...targets])
  mapEntries(UPPER, [...targets], map)
  if (digitTargets) mapEntries(DIGITS, [...digitTargets], map)
  return map
}

styles.push(style('small-caps', 'Small Caps', pairedCaseMap('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘꞯʀꜱᴛᴜᴠᴡxʏᴢ')))

const superscriptMap = {
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ'
}
Object.entries({ ...superscriptMap }).forEach(([letter, glyph]) => { superscriptMap[letter.toUpperCase()] = glyph })
mapEntries(DIGITS, [...'⁰¹²³⁴⁵⁶⁷⁸⁹'], superscriptMap)
styles.push(style('superscript', 'Superscript', superscriptMap))

const subscriptMap = {
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ'
}
Object.entries({ ...subscriptMap }).forEach(([letter, glyph]) => { subscriptMap[letter.toUpperCase()] = glyph })
mapEntries(DIGITS, [...'₀₁₂₃₄₅₆₇₈₉'], subscriptMap)
styles.push(style('subscript', 'Subscript', subscriptMap))

const mirrorMap = pairedCaseMap('ɒdɔbɘʇǫʜiįʞlmnoqpɿƨƚuvwxyz')
styles.push(style('mirror', 'Mirror', mirrorMap, true))

const upsideMap = pairedCaseMap('ɐqɔpǝɟƃɥᴉɾʞlɯuo,bɹsʇnʌʍxʎz'.replace(',', 'd'))
styles.push(style('upside-down', 'Upside Down', upsideMap, true))
styles.push(style('turned', 'Turned Letters', upsideMap))

if (styles.length !== 70) throw new Error(`Expected 70 styles, received ${styles.length}`)

const outputPath = fileURLToPath(new URL('../src/utils/fonts/fonts.json', import.meta.url))
await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(styles, null, 2)}\n`, 'utf8')
console.log(`Generated ${styles.length} Unicode styles at ${outputPath}`)
