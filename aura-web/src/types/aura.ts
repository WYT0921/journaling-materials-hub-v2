export type AuraRatio = '1:1' | '4:3' | '9:16'
export type AuraBackground = 'gradient' | 'cream' | 'paper' | 'dark'

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
  decorationDensity: number
  paletteIndex: number
}

export interface AuraProject {
  schemaVersion: 1
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

export const ratioSize = (ratio: AuraRatio): [number, number] => {
  if (ratio === '1:1') return [1080, 1080]
  if (ratio === '9:16') return [1080, 1920]
  return [1440, 1080]
}

export const newProject = (templateKey = 'fresh-rounded'): AuraProject => ({
  schemaVersion: 1,
  id: crypto.randomUUID(),
  title: '未命名音乐卡片',
  ratio: '4:3',
  music: { songName: '', artist: '', album: '', quote: '', currentTime: '0:00', totalTime: '3:30' },
  palette: ['#fff8ed', '#f7d9df', '#b8cfb0', '#9f7f65', '#302c2a'],
  templateKey,
  adjustments: { background: 'gradient', photoScale: 1, photoOffsetX: 0, photoOffsetY: 0, decorationDensity: 5, paletteIndex: 0 },
  step: 0,
  updatedAt: new Date().toISOString()
})
