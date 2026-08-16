import { describe, expect, it } from 'vitest'
import { EditHistory } from '../src/editor/history'
import { clusterPixels } from '../src/services/paletteService'
import { videoSampleTimes } from '../src/services/paletteService'
import { migrateProject, newProject, ratioSize, templatePresentation, type LegacyAuraProject } from '../src/types/aura'
import { selectMp4MimeType, videoExportSize } from '../src/services/videoExportService'

describe('AURA web domain', () => {
  it('uses exact required export sizes', () => {
    expect(ratioSize('1:1')).toEqual([1080, 1080])
    expect(ratioSize('3:4')).toEqual([1080, 1440])
    expect(ratioSize('9:16')).toEqual([1080, 1920])
  })

  it('creates local-only v2 projects with template presentation', () => {
    const project = newProject('cute-pink')
    expect(project.schemaVersion).toBe(2)
    expect(project.templateKey).toBe('cute-pink')
    expect(project.adjustments.playerStyle).toBe('bubble')
    expect(project.adjustments.notePath).toBe('arc')
    expect(project.mediaType).toBe('image')
    expect(project).not.toHaveProperty('userId')
  })

  it('maps all five stable templates to distinct players and note paths', () => {
    expect(Object.keys(templatePresentation)).toHaveLength(5)
    expect(new Set(Object.values(templatePresentation).map(value => value.playerStyle)).size).toBe(5)
    expect(new Set(Object.values(templatePresentation).map(value => value.notePath)).size).toBe(5)
    for (const key of Object.keys(templatePresentation)) {
      for (const ratio of ['1:1', '3:4', '9:16'] as const) {
        const project = newProject(key); project.ratio = ratio
        expect(ratioSize(project.ratio)[0]).toBeGreaterThanOrEqual(1080)
      }
    }
  })

  it('accepts the six reference-inspired vector player families', () => {
    const project = newProject()
    const styles = ['capsule', 'vinyl', 'console', 'bubble', 'waveform', 'heartbeat'] as const
    for (const style of styles) { project.adjustments.playerStyle = style; expect(project.adjustments.playerStyle).toBe(style) }
  })

  it('keeps decoration color independently editable from the background', () => {
    const project = newProject()
    project.adjustments.paletteIndex = 0
    project.adjustments.noteColorIndex = 3
    expect(project.adjustments.noteColorIndex).not.toBe(project.adjustments.paletteIndex)
  })

  it('selects a real MP4 recorder type and exact full-size video dimensions', () => {
    expect(selectMp4MimeType(value => value === 'video/mp4')).toBe('video/mp4')
    expect(selectMp4MimeType(() => false)).toBeUndefined()
    expect(videoExportSize('1:1')).toEqual([1080, 1080])
    expect(videoExportSize('3:4')).toEqual([1080, 1440])
    expect(videoExportSize('9:16')).toEqual([1080, 1920])
  })

  it('migrates v1 drafts without losing identity, photo or template', () => {
    const legacy = {
      ...newProject('vinyl-record'), schemaVersion: 1, photoKey: 'old:photo',
      adjustments: { background: 'dark', photoScale: 1.4, photoOffsetX: .2, photoOffsetY: -.1, decorationDensity: 7, paletteIndex: 2 }
    } as unknown as LegacyAuraProject
    const migrated = migrateProject(legacy)
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.photoKey).toBe('old:photo')
    expect(migrated.templateKey).toBe('vinyl-record')
    expect(migrated.adjustments.playerStyle).toBe('vinyl')
    expect(migrated.adjustments.notePath).toBe('spiral')
    expect(migrated.adjustments.photoScale).toBe(1.4)
  })

  it('migrates the mistaken landscape ratio to portrait 3:4', () => {
    const saved = { ...newProject(), ratio: '4:3' } as unknown as Parameters<typeof migrateProject>[0]
    expect(migrateProject(saved).ratio).toBe('3:4')
  })

  it('keeps v2 editor choices when a saved draft is reopened', () => {
    const saved = newProject('fresh-rounded')
    saved.adjustments.background = 'stripes'
    saved.adjustments.playerStyle = 'waveform'
    saved.adjustments.notePath = 'scatter'
    const reopened = migrateProject(saved)
    expect(reopened.adjustments.background).toBe('stripes')
    expect(reopened.adjustments.playerStyle).toBe('waveform')
    expect(reopened.adjustments.notePath).toBe('scatter')
  })

  it('supports bounded undo and redo while clearing redo on a new edit', () => {
    const history = new EditHistory({ value: 0 }, 2)
    history.push({ value: 1 }); history.push({ value: 2 }); history.push({ value: 3 })
    expect(history.undo()).toEqual({ value: 2 })
    expect(history.undo()).toEqual({ value: 1 })
    expect(history.undo()).toBeUndefined()
    expect(history.redo()).toEqual({ value: 2 })
    history.push({ value: 9 })
    expect(history.redo()).toBeUndefined()
  })

  it('extracts five deterministic colors from pixels', () => {
    const pixels = new Uint8ClampedArray(Array.from({ length: 120 }, (_, index) => [index % 3 ? 230 : 30, index % 4 ? 90 : 210, index % 5 ? 60 : 180, 255]).flat())
    const first = clusterPixels(pixels)
    expect(first).toHaveLength(5)
    expect(clusterPixels(pixels)).toEqual(first)
    expect(first.every(color => /^#[0-9a-f]{6}$/.test(color))).toBe(true)
  })

  it('samples five representative video frames instead of only the opening frame', () => {
    expect(videoSampleTimes(10)).toEqual([.5, 2.5, 5, 7.5, 9.5])
    expect(videoSampleTimes(0)).toEqual([.1])
  })
})
