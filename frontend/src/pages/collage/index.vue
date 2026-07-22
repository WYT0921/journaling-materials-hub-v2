<template>
  <view class="collage-page">
    <GlassNavBar title="自由拼贴" :show-back="false">
      <template #right>
        <button class="header-button" @tap="handleSizeRequest">{{ canvasLabel }}</button>
      </template>
    </GlassNavBar>

    <view class="editor-status">
      <text>{{ collageStore.scene.layers.length }} / 50 个素材</text>
      <text>{{ collageStore.scene.canvas.paperSize }} · {{ orientationLabel }}</text>
    </view>

    <view class="canvas-shell">
      <!-- #ifdef MP-WEIXIN -->
      <canvas
        id="collageCanvas"
        v-show="!hasOpenSheet"
        type="2d"
        class="collage-canvas"
        disable-scroll
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      />
      <image
        v-if="hasOpenSheet && canvasPreviewPath"
        class="canvas-preview"
        :src="canvasPreviewPath"
        mode="aspectFit"
      />
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="platform-placeholder">
        <text>自由拼贴编辑器请在微信小程序中使用</text>
      </view>
      <!-- #endif -->
      <view v-if="collageStore.scene.layers.length === 0 && canvasReady" class="empty-tip">
        <text class="empty-icon">✦</text>
        <text>点击下方“添加素材”开始拼贴</text>
      </view>
    </view>

    <EditorToolbar
      :can-undo="collageStore.canUndo"
      :can-redo="collageStore.canRedo"
      :has-selection="Boolean(collageStore.selectedLayerId)"
      :layer-count="collageStore.scene.layers.length"
      :exporting="exporting"
      @add="openMaterialPicker"
      @undo="collageStore.undo()"
      @redo="collageStore.redo()"
      @duplicate="handleDuplicate"
      @remove="collageStore.removeSelected()"
      @layers="openLayerPanel"
      @export="handleExport"
    />

    <CustomTabBar :current="1" />

    <CanvasSizeSheet :visible="showSizeSheet" @confirm="handleCanvasConfirm" />
    <MaterialPicker
      v-model:visible="showMaterialPicker"
      @select="handleAddMaterial"
    />
    <LayerPanel
      v-model:visible="showLayerPanel"
      :layers="collageStore.scene.layers"
      :selected-layer-id="collageStore.selectedLayerId"
      @select="selectLayer"
      @move="collageStore.moveSelected"
    />
  </view>
</template>

<script setup>
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'
import { onBackPress, onLoad, onReady, onShow, onUnload } from '@dcloudio/uni-app'
import { useCollageStore } from '../../stores/collage'
import { getMaterialDetail } from '../../api/material'
import { requireLogin } from '../../utils/auth'
import { createImageLayer } from '../../utils/collage/scene-graph.mjs'
import { angle, distance, findTopLayerAtPoint, normalizeAngleDelta, screenToLogical } from '../../utils/collage/geometry.mjs'
import { clearMaterialImageCache, createCanvasImage, loadMaterialImage } from '../../utils/collage/image-loader'
import { createViewport, drawScene } from '../../utils/collage/renderer.mjs'
import { exportCollage, renderCollagePreview, saveCollageToAlbum } from '../../utils/collage/exporter.mjs'
import GlassNavBar from '../../components/GlassNavBar.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'
import CanvasSizeSheet from '../../components/collage/CanvasSizeSheet.vue'
import MaterialPicker from '../../components/collage/MaterialPicker.vue'
import EditorToolbar from '../../components/collage/EditorToolbar.vue'
import LayerPanel from '../../components/collage/LayerPanel.vue'

const collageStore = useCollageStore()
const instance = getCurrentInstance()
const showSizeSheet = ref(true)
const showMaterialPicker = ref(false)
const showLayerPanel = ref(false)
const canvasReady = ref(false)
const canvasPreviewPath = ref('')
const exporting = ref(false)
const entryMaterialId = ref(null)
const entryMaterialLoaded = ref(false)
let canvasNode = null
let canvasContext = null
let canvasSize = { width: 0, height: 0 }
let viewport = null
let canvasRect = { left: 0, top: 0 }
let renderPending = false
let allowLeave = false
let gesture = null
const canvasImages = new Map()

const orientationLabel = computed(() => (
  collageStore.scene.canvas.orientation === 'portrait' ? '竖版' : '横版'
))
const canvasLabel = computed(() => `${collageStore.scene.canvas.paperSize}${orientationLabel.value}`)
const hasOpenSheet = computed(() => (
  showSizeSheet.value || showMaterialPicker.value || showLayerPanel.value
))

const queryCanvas = () => new Promise((resolve, reject) => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select('#collageCanvas').fields({ node: true, size: true, rect: true }).exec(result => {
    const canvas = result?.[0]
    if (!canvas?.node) reject(new Error('Canvas 初始化失败'))
    else resolve(canvas)
  })
})

const initializeCanvas = async () => {
  // #ifdef MP-WEIXIN
  try {
    await nextTick()
    const result = await queryCanvas()
    canvasNode = result.node
    canvasSize = { width: result.width, height: result.height }
    canvasRect = { left: result.left || 0, top: result.top || 0 }
    const dpr = uni.getSystemInfoSync().pixelRatio || 1
    canvasNode.width = result.width * dpr
    canvasNode.height = result.height * dpr
    canvasContext = canvasNode.getContext('2d')
    canvasContext.scale(dpr, dpr)
    canvasReady.value = true
    renderScene()
  } catch (error) {
    uni.showToast({ title: error.message || '画布初始化失败', icon: 'none' })
  }
  // #endif
}

const renderScene = () => {
  if (!canvasContext || renderPending) return
  renderPending = true
  const draw = () => {
    renderPending = false
    viewport = createViewport(collageStore.scene, canvasSize.width, canvasSize.height, 14)
    drawScene(canvasContext, collageStore.scene, canvasImages, viewport, {
      outputWidth: canvasSize.width,
      outputHeight: canvasSize.height,
      selectedLayerId: collageStore.selectedLayerId,
      showSelection: true
    })
  }
  if (canvasNode?.requestAnimationFrame) canvasNode.requestAnimationFrame(draw)
  else setTimeout(draw, 16)
}

const captureCanvasPreview = async () => {
  if (!canvasNode || collageStore.scene.layers.length === 0) {
    canvasPreviewPath.value = ''
    return
  }
  try {
    const result = await renderCollagePreview(collageStore.scene)
    canvasPreviewPath.value = result.filePath
  } catch (error) {
    canvasPreviewPath.value = ''
    uni.showToast({ title: error.message || '画布预览生成失败', icon: 'none' })
  }
}

const openMaterialPicker = async () => {
  await captureCanvasPreview()
  showMaterialPicker.value = true
}

const openLayerPanel = async () => {
  await captureCanvasPreview()
  showLayerPanel.value = true
}

const addMaterial = async material => {
  uni.showLoading({ title: '加载素材...' })
  try {
    const info = await loadMaterialImage(material)
    if (!canvasImages.has(info.path)) {
      canvasImages.set(info.path, await createCanvasImage(canvasNode, info.path))
    }
    const layer = createImageLayer(material, info, collageStore.scene.canvas)
    collageStore.addLayer(layer)
    renderScene()
  } catch (error) {
    if (error.code === 4004) {
      uni.showModal({
        title: '素材权限不足',
        content: '免费保存次数已用完，请先输入通行码。',
        confirmText: '去激活',
        success: res => res.confirm && uni.navigateTo({ url: '/pages/redeem/index' })
      })
    } else {
      uni.showToast({ title: error.message || '素材添加失败', icon: 'none' })
    }
  } finally {
    uni.hideLoading()
  }
}

const handleAddMaterial = material => {
  if (!requireLogin(() => addMaterial(material))) return
}

const loadEntryMaterial = async () => {
  if (!entryMaterialId.value || entryMaterialLoaded.value) return
  entryMaterialLoaded.value = true
  try {
    const material = await getMaterialDetail(entryMaterialId.value)
    if (material.materialType !== 'single') throw new Error('自由拼贴仅支持单个素材')
    await addMaterial(material)
  } catch (error) {
    entryMaterialLoaded.value = false
    uni.showToast({ title: error.message || '入口素材加载失败', icon: 'none' })
  }
}

const handleCanvasConfirm = async ({ paperSize, orientation }) => {
  collageStore.configureCanvas(paperSize, orientation)
  showSizeSheet.value = false
  renderScene()
  await loadEntryMaterial()
}

const handleSizeRequest = () => {
  if (collageStore.scene.layers.length === 0) {
    canvasPreviewPath.value = ''
    showSizeSheet.value = true
    return
  }
  uni.showModal({
    title: '重新选择画布？',
    content: '更换画布会清空当前所有素材，且无法撤销。',
    confirmText: '继续',
    success: async result => {
      if (result.confirm) {
        await captureCanvasPreview()
        showSizeSheet.value = true
      }
    }
  })
}

const touchToScreenPoint = touch => ({
  x: touch.clientX !== undefined ? touch.clientX - canvasRect.left : touch.x,
  y: touch.clientY !== undefined ? touch.clientY - canvasRect.top : touch.y
})

const logicalTouches = event => Array.from(event.touches || []).map(touch => (
  screenToLogical(touchToScreenPoint(touch), viewport)
))

const beginTransform = points => {
  const layer = collageStore.selectedLayer
  if (!layer || points.length < 2) return null
  const midpoint = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  }
  return {
    type: 'transform',
    layerId: layer.id,
    startLayer: { ...layer },
    startDistance: Math.max(distance(points[0], points[1]), 1),
    startAngle: angle(points[0], points[1]),
    startMidpoint: midpoint,
    changed: false
  }
}

const handleTouchStart = event => {
  if (!viewport) return
  const points = logicalTouches(event)
  if (points.length >= 2 && collageStore.selectedLayer) {
    gesture = beginTransform(points)
    return
  }
  if (points.length !== 1) return
  const layer = findTopLayerAtPoint(collageStore.scene.layers, points[0])
  collageStore.selectedLayerId = layer?.id || null
  if (layer) {
    gesture = {
      type: 'drag',
      layerId: layer.id,
      startPoint: points[0],
      startLayer: { ...layer },
      changed: false
    }
  } else {
    gesture = null
  }
}

const handleTouchMove = event => {
  if (!viewport || !gesture) return
  const points = logicalTouches(event)
  if (points.length >= 2) {
    if (gesture.type !== 'transform') gesture = beginTransform(points)
    if (!gesture) return
    const currentDistance = Math.max(distance(points[0], points[1]), 1)
    const currentAngle = angle(points[0], points[1])
    const midpoint = {
      x: (points[0].x + points[1].x) / 2,
      y: (points[0].y + points[1].y) / 2
    }
    collageStore.updateLayer(gesture.layerId, {
      x: gesture.startLayer.x + midpoint.x - gesture.startMidpoint.x,
      y: gesture.startLayer.y + midpoint.y - gesture.startMidpoint.y,
      scale: Math.min(8, Math.max(0.08, gesture.startLayer.scale * currentDistance / gesture.startDistance)),
      rotation: gesture.startLayer.rotation + normalizeAngleDelta(currentAngle - gesture.startAngle)
    }, false)
    gesture.changed = true
    return
  }

  if (gesture.type === 'drag' && points.length === 1) {
    collageStore.updateLayer(gesture.layerId, {
      x: gesture.startLayer.x + points[0].x - gesture.startPoint.x,
      y: gesture.startLayer.y + points[0].y - gesture.startPoint.y
    }, false)
    gesture.changed = true
  }
}

const handleTouchEnd = () => {
  if (gesture?.changed) collageStore.commitCurrentScene()
  gesture = null
}

const handleDuplicate = () => {
  try {
    collageStore.duplicateSelected()
  } catch (error) {
    uni.showToast({ title: error.message, icon: 'none' })
  }
}

const selectLayer = id => {
  collageStore.selectedLayerId = id
}

const runExport = async dpi => {
  uni.showLoading({ title: dpi === 300 ? '高清导出中...' : '正在降低分辨率...' })
  return exportCollage(collageStore.scene, dpi)
}

const saveExportResult = async result => {
  uni.showLoading({ title: '保存到相册...' })
  await saveCollageToAlbum(result.filePath)
  collageStore.markExported()
  uni.hideLoading()
  uni.showToast({
    title: `已保存 ${result.width}×${result.height}`,
    icon: 'none',
    duration: 2500
  })
}

const askFallbackExport = originalError => new Promise(resolve => {
  uni.showModal({
    title: '高清导出失败',
    content: '设备内存可能不足，是否改用 200 DPI 导出？',
    confirmText: '降低后重试',
    cancelText: '取消',
    success: async result => {
      if (!result.confirm) {
        resolve(false)
        return
      }
      try {
        resolve(await runExport(200))
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '导出失败，请重试', icon: 'none' })
        resolve(null)
      }
    },
    fail: () => {
      uni.showToast({ title: originalError.message || '导出失败', icon: 'none' })
      resolve(null)
    }
  })
})

const handleExport = async () => {
  if (exporting.value) return
  exporting.value = true
  try {
    let result
    try {
      result = await runExport(300)
    } catch (error) {
      uni.hideLoading()
      result = await askFallbackExport(error)
    }
    if (result) await saveExportResult(result)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: error.message || '保存失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
    exporting.value = false
  }
}

onLoad(options => {
  collageStore.reset()
  entryMaterialId.value = options.materialId || null
})

onShow(() => {
  const pendingMaterialId = collageStore.consumePendingMaterialId()
  if (!pendingMaterialId) return
  collageStore.reset()
  entryMaterialId.value = pendingMaterialId
  entryMaterialLoaded.value = false
  showMaterialPicker.value = false
  showLayerPanel.value = false
  showSizeSheet.value = true
})

onReady(initializeCanvas)

watch(() => collageStore.scene, renderScene, { deep: true })
watch(() => collageStore.selectedLayerId, renderScene)
watch(hasOpenSheet, visible => {
  if (!visible) {
    canvasPreviewPath.value = ''
    nextTick(renderScene)
  }
})

onBackPress(() => {
  if (allowLeave || !collageStore.hasUnexportedChanges) return false
  uni.showModal({
    title: '退出自由拼贴？',
    content: '退出后当前拼贴内容不会保留。',
    confirmText: '退出',
    success: res => {
      if (res.confirm) {
        allowLeave = true
        uni.navigateBack()
      }
    }
  })
  return true
})

onUnload(() => {
  collageStore.reset()
  clearMaterialImageCache()
  canvasImages.clear()
  canvasNode = null
  canvasContext = null
})
</script>

<style scoped lang="scss">
.collage-page { height: 100vh; display: flex; flex-direction: column; background: #ececec; }
.header-button { margin: 0; padding: 0 18rpx; height: 56rpx; line-height: 56rpx; border-radius: 28rpx; background: #111; color: #fff; font-size: 22rpx; }
.header-button::after { border: none; }
.editor-status { display: flex; justify-content: space-between; padding: 12rpx 28rpx; color: #777; font-size: 22rpx; }
.canvas-shell { position: relative; flex: 1; min-height: 0; margin: 0 20rpx 16rpx; border-radius: 22rpx; overflow: hidden; background: #dcdcdc; }
.collage-canvas { width: 100%; height: 100%; display: block; }
.canvas-preview { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.platform-placeholder, .empty-tip { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #888; font-size: 26rpx; }
.empty-tip { flex-direction: column; gap: 14rpx; pointer-events: none; }
.empty-icon { font-size: 54rpx; color: #bbb; }
</style>
