import type { AuraCatalog } from '../types/aura'

const layers = (photo: [number, number, number, number], player: [number, number, number, number]) => ({ layers: [
  { id: 'background-main', type: 'background' as const, x: 0, y: 0, width: 1, height: 1 },
  { id: 'photo-main', type: 'photo' as const, x: photo[0], y: photo[1], width: photo[2], height: photo[3] },
  { id: 'player-main', type: 'player' as const, x: player[0], y: player[1], width: player[2], height: player[3] }
] })

export const fallbackCatalog: AuraCatalog = {
  schemaVersion: 1,
  catalogVersion: 'web-bundled-1',
  assets: [],
  templates: [
    { key: 'fresh-rounded', name: '清新圆角', style: 'fresh', supportedRatios: ['1:1', '3:4', '9:16'], configVersion: 1, config: layers([.05, .42, .9, .53], [.08, .08, .84, .28]) },
    { key: 'cute-pink', name: '可爱粉色', style: 'cute', supportedRatios: ['1:1', '3:4', '9:16'], configVersion: 1, config: layers([.08, .39, .84, .55], [.1, .07, .8, .25]) },
    { key: 'vintage-paper', name: '复古纸质', style: 'vintage', supportedRatios: ['1:1', '3:4', '9:16'], configVersion: 1, config: layers([.07, .4, .86, .54], [.09, .08, .82, .25]) },
    { key: 'vinyl-record', name: '黑胶唱片', style: 'vinyl', supportedRatios: ['1:1', '3:4', '9:16'], configVersion: 1, config: layers([.05, .42, .9, .53], [.1, .08, .8, .27]) },
    { key: 'waveform-line', name: '波形线', style: 'waveform', supportedRatios: ['1:1', '3:4', '9:16'], configVersion: 1, config: layers([.04, .44, .92, .51], [.07, .08, .86, .28]) }
  ]
}
