export type AuraRatio = '1:1' | '3:4' | '9:16'
export type AuraBackground = 'solid' | 'stripes' | 'gradient' | 'paper'
export type AuraPlayerStyle = 'capsule' | 'bubble' | 'console' | 'vinyl' | 'waveform' | 'heartbeat'
export type AuraNotePath = 'vertical' | 'arc' | 'sparse' | 'spiral' | 'scatter'
export type AuraTextFont = 'serif' | 'sans' | 'rounded'
export type AuraTextAlign = 'left' | 'center' | 'right'
export type AuraMotion = 'fall' | 'breathe' | 'together' | 'sequence' | 'rotate'

export interface AuraMusicInfo {
  songName: string
  artist: string
  album: string
  quote: string
  currentTime: string
  totalTime: string
}

export interface AuraAdjustments {
  background: AuraBackground
  photoScale: number
  photoOffsetX: number
  photoOffsetY: number
  photoSplit: number
  decorationDensity: number
  paletteIndex: number
  secondaryPaletteIndex: number
  stripeAngle: number
  stripeDensity: number
  playerStyle: AuraPlayerStyle
  playerScale: number
  progress: number
  notePath: AuraNotePath
  noteStyle: 'single' | 'double' | 'mixed'
  noteColorIndex: number
  quoteVisible: boolean
  textFont: AuraTextFont
  textAlign: AuraTextAlign
  textColorIndex: number
  motion: AuraMotion
}

export interface AuraProject {
  schemaVersion: 2
  id: string
  title: string
  ratio: AuraRatio
  photoKey?: string
  music: AuraMusicInfo
  palette: string[]
  templateKey: string
  adjustments: AuraAdjustments
  step: number
  updatedAt: string
}

export type LegacyAuraProject = Omit<AuraProject, 'schemaVersion' | 'adjustments'> & {
  schemaVersion: 1
  adjustments: Partial<AuraAdjustments> & { background?: 'gradient' | 'cream' | 'paper' | 'dark' }
}

export interface AuraLayer {
  id: string
  type: 'background' | 'photo' | 'player' | 'text' | 'decoration' | 'texture'
  x?: number
  y?: number
  width?: number
  height?: number
}

export interface AuraTemplate {
  key: string
  name: string
  style: string
  previewUrl?: string | null
  supportedRatios: AuraRatio[]
  configVersion: number
  config: { layers: AuraLayer[] }
}

export interface AuraAsset {
  key: string
  name: string
  type: 'decoration' | 'texture' | 'font'
  fileUrl: string
  previewUrl?: string | null
  resourceVersion: number
  sha256: string
  metadata: Record<string, unknown>
}

export interface AuraCatalog {
  schemaVersion: 1
  catalogVersion: string
  generatedAt?: string
  templates: AuraTemplate[]
  assets: AuraAsset[]
}

export const templatePresentation: Record<string, { playerStyle: AuraPlayerStyle; notePath: AuraNotePath }> = {
  'fresh-rounded': { playerStyle: 'capsule', notePath: 'vertical' },
  'cute-pink': { playerStyle: 'bubble', notePath: 'arc' },
  'vintage-paper': { playerStyle: 'console', notePath: 'sparse' },
  'vinyl-record': { playerStyle: 'vinyl', notePath: 'spiral' },
  'waveform-line': { playerStyle: 'waveform', notePath: 'scatter' }
}

export const defaultAdjustments = (): AuraAdjustments => ({
  background: 'gradient', photoScale: 1, photoOffsetX: 0, photoOffsetY: 0,
  photoSplit: .5, decorationDensity: 12, paletteIndex: 0, secondaryPaletteIndex: 1,
  stripeAngle: 90, stripeDensity: 10, playerStyle: 'capsule', playerScale: 1,
  progress: .42, notePath: 'vertical', noteStyle: 'mixed', noteColorIndex: 3,
  quoteVisible: true, textFont: 'serif', textAlign: 'center', textColorIndex: 4,
  motion: 'fall'
})

export function migrateProject(input: AuraProject | LegacyAuraProject): AuraProject {
  const template = templatePresentation[input.templateKey] || templatePresentation['fresh-rounded']
  const legacyBackground = input.adjustments.background
  const background: AuraBackground = input.schemaVersion === 2 ? legacyBackground as AuraBackground
    : legacyBackground === 'paper' ? 'paper' : legacyBackground === 'gradient' ? 'gradient' : 'solid'
  return {
    ...input,
    schemaVersion: 2,
    ratio: String(input.ratio) === '4:3' ? '3:4' : input.ratio,
    adjustments: {
      ...defaultAdjustments(),
      ...input.adjustments,
      background,
      playerStyle: input.schemaVersion === 1 ? template.playerStyle : input.adjustments.playerStyle || template.playerStyle,
      notePath: input.schemaVersion === 1 ? template.notePath : input.adjustments.notePath || template.notePath
    }
  } as AuraProject
}

export const ratioSize = (ratio: AuraRatio): [number, number] => {
  if (ratio === '1:1') return [1080, 1080]
  if (ratio === '9:16') return [1080, 1920]
  return [1080, 1440]
}

export const newProject = (templateKey = 'fresh-rounded'): AuraProject => {
  const presentation = templatePresentation[templateKey] || templatePresentation['fresh-rounded']
  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    title: '未命名音乐卡片',
    ratio: '3:4',
    music: { songName: '', artist: '', album: '', quote: '', currentTime: '0:00', totalTime: '3:30' },
    palette: ['#fff8ed', '#f7d9df', '#b8cfb0', '#9f7f65', '#302c2a'],
    templateKey,
    adjustments: { ...defaultAdjustments(), ...presentation },
    step: 0,
    updatedAt: new Date().toISOString()
  }
}
