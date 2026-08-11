import { describe, expect, it } from 'vitest'
import { clusterPixels } from '../src/services/paletteService'
import { newProject, ratioSize } from '../src/types/aura'

describe('AURA web domain', () => {
  it('uses exact required export sizes', () => {
    expect(ratioSize('1:1')).toEqual([1080, 1080])
    expect(ratioSize('4:3')).toEqual([1440, 1080])
    expect(ratioSize('9:16')).toEqual([1080, 1920])
  })

  it('creates local-only versioned projects', () => {
    const project = newProject('cute-pink')
    expect(project.schemaVersion).toBe(1)
    expect(project.templateKey).toBe('cute-pink')
    expect(project).not.toHaveProperty('userId')
  })

  it('extracts five deterministic colors from pixels', () => {
    const pixels = new Uint8ClampedArray(Array.from({ length: 120 }, (_, index) => [index % 3 ? 230 : 30, index % 4 ? 90 : 210, index % 5 ? 60 : 180, 255]).flat())
    const first = clusterPixels(pixels)
    expect(first).toHaveLength(5)
    expect(clusterPixels(pixels)).toEqual(first)
    expect(first.every(color => /^#[0-9a-f]{6}$/.test(color))).toBe(true)
  })
})
