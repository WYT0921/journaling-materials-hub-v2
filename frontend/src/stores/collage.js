import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { MAX_LAYERS, cloneScene, createEmptyScene, createLayerId } from '../utils/collage/scene-graph.mjs'
import { createHistory } from '../utils/collage/history.mjs'

export const useCollageStore = defineStore('collage', () => {
  const scene = ref(createEmptyScene())
  const selectedLayerId = ref(null)
  const pendingMaterialId = ref(null)
  const dirty = ref(false)
  const revision = ref(0)
  const exportedRevision = ref(-1)
  const historyVersion = ref(0)
  let history = createHistory(scene.value)

  const selectedLayer = computed(() => (
    scene.value.layers.find(layer => layer.id === selectedLayerId.value) || null
  ))
  const canUndo = computed(() => {
    historyVersion.value
    return history.canUndo()
  })
  const canRedo = computed(() => {
    historyVersion.value
    return history.canRedo()
  })
  const hasUnexportedChanges = computed(() => dirty.value && revision.value !== exportedRevision.value)

  const bump = () => {
    revision.value += 1
    historyVersion.value += 1
    dirty.value = true
  }

  const commitScene = nextScene => {
    scene.value = cloneScene(nextScene)
    history.commit(scene.value)
    bump()
  }

  const configureCanvas = (paperSize, orientation) => {
    const next = createEmptyScene(paperSize, orientation)
    scene.value = next
    selectedLayerId.value = null
    history = createHistory(next)
    revision.value = 0
    exportedRevision.value = -1
    historyVersion.value += 1
    dirty.value = false
  }

  const addLayer = layer => {
    if (scene.value.layers.length >= MAX_LAYERS) {
      throw new Error(`单个拼贴最多添加 ${MAX_LAYERS} 个素材`)
    }
    const next = cloneScene(scene.value)
    next.layers.push(layer)
    selectedLayerId.value = layer.id
    commitScene(next)
  }

  const updateLayer = (id, patch, commit = true) => {
    const next = cloneScene(scene.value)
    const index = next.layers.findIndex(layer => layer.id === id)
    if (index < 0) return false
    next.layers[index] = { ...next.layers[index], ...patch }
    if (commit) {
      commitScene(next)
    } else {
      scene.value = next
      dirty.value = true
    }
    return true
  }

  const commitCurrentScene = () => {
    history.commit(scene.value)
    bump()
  }

  const removeSelected = () => {
    if (!selectedLayerId.value) return
    const next = cloneScene(scene.value)
    next.layers = next.layers.filter(layer => layer.id !== selectedLayerId.value)
    selectedLayerId.value = null
    commitScene(next)
  }

  const duplicateSelected = () => {
    const source = selectedLayer.value
    if (!source) return null
    if (scene.value.layers.length >= MAX_LAYERS) {
      throw new Error(`单个拼贴最多添加 ${MAX_LAYERS} 个素材`)
    }
    const copy = {
      ...cloneScene(source),
      id: createLayerId(),
      title: `${source.title} 副本`,
      x: source.x + 30,
      y: source.y + 30
    }
    addLayer(copy)
    return copy
  }

  const moveSelected = direction => {
    const id = selectedLayerId.value
    const currentIndex = scene.value.layers.findIndex(layer => layer.id === id)
    if (currentIndex < 0) return
    const lastIndex = scene.value.layers.length - 1
    const targets = {
      up: Math.min(currentIndex + 1, lastIndex),
      down: Math.max(currentIndex - 1, 0),
      front: lastIndex,
      back: 0
    }
    const targetIndex = targets[direction]
    if (targetIndex === undefined || targetIndex === currentIndex) return

    const next = cloneScene(scene.value)
    const [layer] = next.layers.splice(currentIndex, 1)
    next.layers.splice(targetIndex, 0, layer)
    commitScene(next)
  }

  const undo = () => {
    if (!history.canUndo()) return
    scene.value = history.undo()
    if (!scene.value.layers.some(layer => layer.id === selectedLayerId.value)) {
      selectedLayerId.value = null
    }
    revision.value += 1
    historyVersion.value += 1
    dirty.value = true
  }

  const redo = () => {
    if (!history.canRedo()) return
    scene.value = history.redo()
    revision.value += 1
    historyVersion.value += 1
    dirty.value = true
  }

  const markExported = () => {
    exportedRevision.value = revision.value
  }

  const setPendingMaterialId = materialId => {
    pendingMaterialId.value = materialId ? String(materialId) : null
  }

  const consumePendingMaterialId = () => {
    const materialId = pendingMaterialId.value
    pendingMaterialId.value = null
    return materialId
  }

  const reset = () => {
    const next = createEmptyScene()
    scene.value = next
    selectedLayerId.value = null
    dirty.value = false
    revision.value = 0
    exportedRevision.value = -1
    history = createHistory(next)
    historyVersion.value += 1
  }

  return {
    scene,
    selectedLayerId,
    pendingMaterialId,
    selectedLayer,
    dirty,
    revision,
    canUndo,
    canRedo,
    hasUnexportedChanges,
    configureCanvas,
    addLayer,
    updateLayer,
    commitCurrentScene,
    removeSelected,
    duplicateSelected,
    moveSelected,
    undo,
    redo,
    markExported,
    setPendingMaterialId,
    consumePendingMaterialId,
    reset
  }
})
