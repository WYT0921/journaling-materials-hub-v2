/**
 * 音乐卡片编辑器 — Pinia Store
 * 管理：场景图层、歌曲信息、调色板、背景、装饰、历史
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createHistory } from '../utils/collage/history.mjs'
import { CANVAS_SIZES, resizeLayers } from '../utils/music-card/editor.mjs'

let nextId = 1
const createLayerId = () => `mc_${nextId++}_${Date.now()}`

export const useMusicCardStore = defineStore('musicCard', () => {
  // 画布
  const canvasSize = ref('4:3')
  const canvas = computed(() => CANVAS_SIZES[canvasSize.value] || CANVAS_SIZES['4:3'])

  // 调色板
  const palette = ref([])
  const paletteLoading = ref(false)

  // 场景图层
  const layers = ref([])
  const selectedLayerId = ref(null)

  // 歌曲信息
  const songInfo = ref({ songName: '', artist: '', album: '', lyrics: '', date: '', currentTime: '1:24', totalTime: '3:32' })

  // 背景配置
  const backgroundStyle = ref({ type: 'gradient', filmGrain: 0 })

  // 播放器配置
  const playerTemplateId = ref('minimal')

  // 装饰配置
  const decorations = ref([])

  // 历史
  const historyVersion = ref(0)
  let history = createHistory({ canvasSize: canvasSize.value, palette: [], layers: [], songInfo: songInfo.value,
    backgroundStyle: backgroundStyle.value, playerTemplateId: playerTemplateId.value, decorations: [] })

  // 计算属性
  const canUndo = computed(() => { historyVersion.value; return history.canUndo() })
  const canRedo = computed(() => { historyVersion.value; return history.canRedo() })
  const selectedLayer = computed(() => layers.value.find(l => l.id === selectedLayerId.value) || null)

  // 场景快照
  const snapshot = () => JSON.parse(JSON.stringify({ canvasSize: canvasSize.value, palette: palette.value, layers: layers.value, songInfo: songInfo.value, backgroundStyle: backgroundStyle.value, playerTemplateId: playerTemplateId.value, decorations: decorations.value }))

  const restore = (data) => {
    if (!data) return
    canvasSize.value = data.canvasSize || '4:3'
    palette.value = data.palette || []
    layers.value = data.layers || []
    songInfo.value = data.songInfo || { songName: '', artist: '', album: '', lyrics: '', date: '' }
    backgroundStyle.value = data.backgroundStyle || { type: 'gradient' }
    playerTemplateId.value = data.playerTemplateId || 'minimal'
    decorations.value = data.decorations || []
  }

  // Actions
  const commit = () => { history.commit(snapshot()); historyVersion.value++ }
  const undo = () => { if (!history.canUndo()) return; const s = history.undo(); if (s) restore(s); historyVersion.value++ }
  const redo = () => { if (!history.canRedo()) return; const s = history.redo(); if (s) restore(s); historyVersion.value++ }

  const setCanvasSize = (size) => {
    if (!CANVAS_SIZES[size] || size === canvasSize.value) return
    const oldCanvas = canvas.value
    const nextCanvas = CANVAS_SIZES[size]
    layers.value = resizeLayers(layers.value, oldCanvas, nextCanvas)
    canvasSize.value = size
    commit()
  }

  const setPalette = (colors) => {
    palette.value = colors
    paletteLoading.value = false
    commit()
  }

  const setBackground = (style) => {
    backgroundStyle.value = { ...backgroundStyle.value, ...style }
    commit()
  }

  const setPlayerTemplate = (templateId) => {
    playerTemplateId.value = templateId
    // 更新或创建播放器图层
    const playerLayer = layers.value.find(l => l.type === 'player')
    if (playerLayer) {
      playerLayer.templateId = templateId
    } else {
      const c = canvas.value
      const pw = c.width * 0.75
      const ph = pw * 0.45
      layers.value.push({
        id: createLayerId(), type: 'player', templateId,
        x: (c.width - pw) / 2, y: c.height - ph - 40,
        width: pw, height: ph, visible: true
      })
    }
    commit()
  }

  const updateSongInfo = (info) => {
    songInfo.value = { ...songInfo.value, ...info }
    commit()
  }

  const addDecorationLayer = (decorationConfig) => {
    layers.value.push({
      id: createLayerId(), type: 'decoration',
      x: 0, y: 0, width: canvas.value.width, height: canvas.value.height,
      scale: 1, rotation: 0, decorations: [decorationConfig],
      visible: true
    })
    decorations.value.push(decorationConfig)
    commit()
  }

  const removeDecoration = (index) => {
    decorations.value.splice(index, 1)
    const decLayers = layers.value.filter(l => l.type === 'decoration')
    if (decLayers[index]) {
      layers.value = layers.value.filter(l => l.id !== decLayers[index].id)
    }
    commit()
  }

  const addPhoto = (imagePath, info) => {
    const c = canvas.value
    const maxW = c.width * 0.85
    const maxH = c.height * 0.55
    const scale = Math.min(1, maxW / info.width, maxH / info.height)
    const w = Math.round(info.width * scale)
    const h = Math.round(info.height * scale)
    const photo = {
      id: createLayerId(), type: 'photo', imagePath,
      x: (c.width - w) / 2, y: 40, width: w, height: h,
      scale: 1, rotation: 0, visible: true
    }
    const existingIndex = layers.value.findIndex(layer => layer.type === 'photo')
    if (existingIndex >= 0) layers.value.splice(existingIndex, 1, photo)
    else layers.value.splice(Math.min(1, layers.value.length), 0, photo)
    const player = layers.value.find(layer => layer.type === 'player')
    if (player && !player.coverPath) player.coverPath = imagePath
    backgroundStyle.value.imagePath = imagePath
    selectedLayerId.value = photo.id
    commit()
  }

  const addTextLayer = (textConfig = {}) => {
    const c = canvas.value
    layers.value.push({
      id: createLayerId(), type: 'text',
      x: c.width / 2, y: c.height - 280,
      text: textConfig.text || '', fontSize: textConfig.fontSize || 24,
      fontFamily: textConfig.fontFamily || 'serif', color: textConfig.color || 'auto',
      align: 'center', visible: true
    })
    selectedLayerId.value = layers.value[layers.value.length - 1].id
    commit()
  }

  const moveLayer = (layerId, x, y) => {
    const layer = layers.value.find(l => l.id === layerId)
    if (layer) { layer.x = x; layer.y = y }
  }

  const updateLayer = (layerId, changes) => {
    const layer = layers.value.find(l => l.id === layerId)
    if (layer) Object.assign(layer, changes)
  }

  const removeLayer = (layerId) => {
    const target = layers.value.find(l => l.id === layerId)
    if (target?.type === 'decoration') {
      const config = target.decorations?.[0]
      decorations.value = decorations.value.filter(item => item.id !== config?.id)
    }
    layers.value = layers.value.filter(l => l.id !== layerId)
    if (selectedLayerId.value === layerId) selectedLayerId.value = null
    commit()
  }

  const duplicateSelected = () => {
    const source = selectedLayer.value
    if (!source || source.type === 'background') return
    const copy = JSON.parse(JSON.stringify(source))
    copy.id = createLayerId(); copy.x = (copy.x || 0) + 24; copy.y = (copy.y || 0) + 24
    layers.value.push(copy); selectedLayerId.value = copy.id; commit()
  }

  const moveSelected = direction => {
    const index = layers.value.findIndex(l => l.id === selectedLayerId.value)
    if (index < 0) return
    let target = index
    if (direction === 'up') target = Math.min(layers.value.length - 1, index + 1)
    if (direction === 'down') target = Math.max(1, index - 1)
    if (direction === 'top') target = layers.value.length - 1
    if (direction === 'bottom') target = 1
    if (target === index) return
    const [layer] = layers.value.splice(index, 1); layers.value.splice(target, 0, layer); commit()
  }

  const reset = () => {
    canvasSize.value = '4:3'
    palette.value = []
    paletteLoading.value = false
    layers.value = []
    selectedLayerId.value = null
    songInfo.value = { songName: '', artist: '', album: '', lyrics: '', date: '', currentTime: '1:24', totalTime: '3:32' }
    backgroundStyle.value = { type: 'gradient', filmGrain: 0 }
    playerTemplateId.value = 'minimal'
    decorations.value = []
    history = createHistory(snapshot())
    historyVersion.value++
    nextId = 1
  }

  // 初始化默认图层
  const initDefaults = () => {
    if (layers.value.length > 0) return
    // 背景层
    layers.value.push({ id: createLayerId(), type: 'background', config: backgroundStyle.value, visible: true })
    // 播放器层
    const c = canvas.value
    const pw = c.width * 0.75
    const ph = pw * 0.45
    layers.value.push({
      id: createLayerId(), type: 'player', templateId: playerTemplateId.value,
      x: (c.width - pw) / 2, y: c.height - ph - 40,
      width: pw, height: ph, visible: true
    })
    commit()
  }

  return {
    canvasSize, canvas, palette, paletteLoading,
    layers, selectedLayerId, selectedLayer,
    songInfo, backgroundStyle, playerTemplateId, decorations,
    canUndo, canRedo, history,
    setCanvasSize, setPalette, setBackground, setPlayerTemplate,
    updateSongInfo, addDecorationLayer, removeDecoration,
    addPhoto, addTextLayer, moveLayer, updateLayer, removeLayer, duplicateSelected, moveSelected,
    commit, undo, redo, reset, initDefaults, snapshot
  }
})
