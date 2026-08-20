/**
 * 音乐卡片编辑器 — Pinia Store
 * 管理：场景图层、歌曲信息、调色板、背景、装饰、历史
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createHistory } from '../utils/collage/history.mjs'
import { CANVAS_SIZES, resizeLayers } from '../utils/music-card/editor.mjs'
import { createMusicCardLocalRepository, normalizeMusicCardProject } from '../repositories/music-card-local.mjs'

let nextId = 1
const createLayerId = () => `mc_${nextId++}_${Date.now()}`

export const useMusicCardStore = defineStore('musicCard', () => {
  const projectId = ref('')
  const media = ref(null)
  const needsMediaRepair = ref(false)
  const localReady = ref(false)
  let repository = null
  let persistTimer = null
  // 画布
  const canvasSize = ref('3:4')
  const canvas = computed(() => CANVAS_SIZES[canvasSize.value] || CANVAS_SIZES['3:4'])

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
  const appearance = ref({ photoSplit: .5, playerScale: 1, lyricsVisible: true, lyricsStyle: 'minimal-serif', lyricsFontSize: 1, lyricsOpacity: .72, decorationMotion: 'fall', decorationDistribution: 'trail' })

  // 播放器配置
  const playerTemplateId = ref('capsule')

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
  const snapshot = () => JSON.parse(JSON.stringify({ canvasSize: canvasSize.value, palette: palette.value, layers: layers.value, songInfo: songInfo.value, backgroundStyle: backgroundStyle.value, appearance: appearance.value, playerTemplateId: playerTemplateId.value, decorations: decorations.value }))
  const projectSnapshot = () => normalizeMusicCardProject({ id: projectId.value, ...snapshot(), media: media.value, title: songInfo.value.songName || '未命名音乐卡片' })

  const restore = (data) => {
    if (!data) return
    canvasSize.value = data.canvasSize || '3:4'
    palette.value = data.palette || []
    layers.value = data.layers || []
    songInfo.value = data.songInfo || { songName: '', artist: '', album: '', lyrics: '', date: '' }
    backgroundStyle.value = data.backgroundStyle || { type: 'gradient' }
    appearance.value = { photoSplit: .5, playerScale: 1, lyricsVisible: true, lyricsStyle: 'minimal-serif', lyricsFontSize: 1, lyricsOpacity: .72, decorationMotion: 'fall', decorationDistribution: 'trail', ...(data.appearance || {}) }
    playerTemplateId.value = data.playerTemplateId || 'capsule'
    decorations.value = data.decorations || []
    if (data.id) projectId.value = data.id
    if (Object.prototype.hasOwnProperty.call(data, 'media')) media.value = data.media || null
    if (Object.prototype.hasOwnProperty.call(data, 'needsMediaRepair')) needsMediaRepair.value = Boolean(data.needsMediaRepair)
  }

  const createProjectId = () => `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const persistLocal = async () => {
    if (!repository || !projectId.value) return
    await repository.saveProject(projectSnapshot())
  }
  const schedulePersist = () => {
    if (!repository || !localReady.value) return
    clearTimeout(persistTimer)
    persistTimer = setTimeout(() => persistLocal().catch(() => undefined), 350)
  }
  const initializeLocal = async runtime => {
    repository = createMusicCardLocalRepository(runtime)
    const projects = await repository.listProjects()
    if (projects[0]) restore(await repository.repairProject(projects[0]))
    else {
      projectId.value = createProjectId()
      reset(); initDefaults()
      await persistLocal()
    }
    history = createHistory(snapshot())
    historyVersion.value++
    localReady.value = true
    return projects[0] || projectSnapshot()
  }

  // Actions
  const commit = () => { history.commit(snapshot()); historyVersion.value++; schedulePersist() }
  const undo = () => { if (!history.canUndo()) return; const s = history.undo(); if (s) restore(s); historyVersion.value++; schedulePersist() }
  const redo = () => { if (!history.canRedo()) return; const s = history.redo(); if (s) restore(s); historyVersion.value++; schedulePersist() }

  const setCanvasSize = (size) => {
    if (!CANVAS_SIZES[size] || size === canvasSize.value) return
    const oldCanvas = canvas.value
    const nextCanvas = CANVAS_SIZES[size]
    layers.value = resizeLayers(layers.value, oldCanvas, nextCanvas)
    canvasSize.value = size
    applyAutomaticLayout()
    commit()
  }

  const applyAutomaticLayout = () => {
    const c = canvas.value, splitY = Math.round(c.height * appearance.value.photoSplit)
    const photo = layers.value.find(layer => layer.type === 'photo')
    if (photo) Object.assign(photo, { x: 0, y: splitY, width: c.width, height: c.height - splitY, fit: 'cover' })
    const player = layers.value.find(layer => layer.type === 'player')
    if (player) {
      const width = c.width * .63 * appearance.value.playerScale, height = width * .46
      Object.assign(player, { x: (c.width - width) / 2, y: Math.max(12, (splitY - height) / 2), width, height, scale: 1 })
    }
  }

  const setAppearance = changes => { appearance.value = { ...appearance.value, ...changes }; applyAutomaticLayout(); commit() }

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
      const pw = c.width * 0.63
      const ph = pw * 0.46
      layers.value.push({
        id: createLayerId(), type: 'player', templateId,
        x: (c.width - pw) / 2, y: (c.height * appearance.value.photoSplit - ph) / 2,
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
    const splitY = Math.round(c.height * appearance.value.photoSplit)
    const w = c.width
    const h = c.height - splitY
    const photo = {
      id: createLayerId(), type: 'photo', imagePath,
      x: 0, y: splitY, width: w, height: h,
      sourceWidth: Number(info.width) || w, sourceHeight: Number(info.height) || h,
      fit: 'cover', scale: 1, rotation: 0, visible: true
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

  const importLocalMedia = async (tempFilePath, type, metadata = {}) => {
    if (!repository) throw new Error('本地项目尚未初始化')
    const imported = await repository.importMedia(tempFilePath, type, projectId.value, metadata)
    if (type === 'video' && metadata.posterTempPath) imported.posterPath = await repository.savePoster(metadata.posterTempPath, projectId.value)
    media.value = imported
    needsMediaRepair.value = false
    const displayPath = imported.posterPath || imported.localPath
    addPhoto(displayPath, { width: imported.width, height: imported.height })
    const photo = layers.value.find(layer => layer.type === 'photo')
    if (photo) { photo.mediaType = type; photo.sourcePath = imported.localPath; photo.imagePath = displayPath }
    await persistLocal()
    return imported
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
    canvasSize.value = '3:4'
    palette.value = []
    paletteLoading.value = false
    layers.value = []
    selectedLayerId.value = null
    songInfo.value = { songName: '', artist: '', album: '', lyrics: '', date: '', currentTime: '1:24', totalTime: '3:32' }
    backgroundStyle.value = { type: 'gradient', filmGrain: 0 }
    appearance.value = { photoSplit: .5, playerScale: 1, lyricsVisible: true, lyricsStyle: 'minimal-serif', lyricsFontSize: 1, lyricsOpacity: .72, decorationMotion: 'fall', decorationDistribution: 'trail' }
    playerTemplateId.value = 'capsule'
    decorations.value = []
    media.value = null
    needsMediaRepair.value = false
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
    const pw = c.width * 0.63
    const ph = pw * 0.46
    layers.value.push({
      id: createLayerId(), type: 'player', templateId: playerTemplateId.value,
      x: (c.width - pw) / 2, y: (c.height * appearance.value.photoSplit - ph) / 2,
      width: pw, height: ph, visible: true
    })
    commit()
  }

  const deleteLocalProject = async () => {
    if (!repository || !projectId.value) return
    await repository.deleteProject(projectId.value)
    projectId.value = createProjectId()
    reset(); initDefaults()
    await persistLocal()
  }

  const inspectLocalStorage = () => repository?.inspectStorage()

  return {
    projectId, media, needsMediaRepair, localReady,
    canvasSize, canvas, palette, paletteLoading,
    layers, selectedLayerId, selectedLayer,
    songInfo, backgroundStyle, appearance, playerTemplateId, decorations,
    canUndo, canRedo, history,
    setCanvasSize, setPalette, setBackground, setAppearance, applyAutomaticLayout, setPlayerTemplate,
    updateSongInfo, addDecorationLayer, removeDecoration,
    addPhoto, addTextLayer, moveLayer, updateLayer, removeLayer, duplicateSelected, moveSelected,
    commit, undo, redo, reset, initDefaults, snapshot, projectSnapshot,
    initializeLocal, persistLocal, importLocalMedia, deleteLocalProject, inspectLocalStorage
  }
})
