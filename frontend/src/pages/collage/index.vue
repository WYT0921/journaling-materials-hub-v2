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

    <view
      id="collageStage"
      class="canvas-shell"
      @touchstart="handleTouchStart"
      @touchmove.stop.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    >
      <view v-if="stageReady" class="paper-stage" :style="paperStageStyle">
        <view
          v-for="layer in collageStore.scene.layers"
          v-show="layer.visible !== false"
          :key="layer.id"
          class="stage-layer"
          :style="layerStyle(layer)"
        >
          <image class="stage-layer-image" :src="layer.localImagePath" mode="aspectFit" />
          <view v-if="layer.id === collageStore.selectedLayerId" class="selection-outline" />
          <view v-if="layer.id === collageStore.selectedLayerId" class="selection-handle" />
        </view>
        <view v-if="collageStore.scene.layers.length === 0" class="empty-tip">
          <text class="empty-icon">✦</text>
          <text>点击下方“添加素材”开始拼贴</text>
        </view>
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
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { onBackPress, onLoad, onReady, onShow, onUnload } from '@dcloudio/uni-app'
import { useCollageStore } from '../../stores/collage'
import { getMaterialDetail } from '../../api/material'
import { requireLogin } from '../../utils/auth'
import { createImageLayer } from '../../utils/collage/scene-graph.mjs'
import { angle, distance, findTopLayerAtPoint, logicalToScreen, normalizeAngleDelta, screenToLogical } from '../../utils/collage/geometry.mjs'
import { clearMaterialImageCache, loadMaterialImage } from '../../utils/collage/image-loader'
import { createViewport } from '../../utils/collage/renderer.mjs'
import { exportCollage, saveCollageToAlbum } from '../../utils/collage/exporter.mjs'
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
const stageReady = ref(false)
const viewport = ref(null)
const exporting = ref(false)
const entryMaterialId = ref(null)
const entryMaterialLoaded = ref(false)
let stageSize = { width: 0, height: 0 }
let stageRect = { left: 0, top: 0 }
let allowLeave = false
let gesture = null

const orientationLabel = computed(() => (
  collageStore.scene.canvas.orientation === 'portrait' ? '竖版' : '横版'
))
const canvasLabel = computed(() => `${collageStore.scene.canvas.paperSize}${orientationLabel.value}`)
const paperStageStyle = computed(() => {
  const current = viewport.value
  if (!current) return {}
  return {
    left: `${current.offsetX}px`,
    top: `${current.offsetY}px`,
    width: `${current.width}px`,
    height: `${current.height}px`,
    backgroundColor: collageStore.scene.canvas.background
  }
})

const layerStyle = layer => {
  const current = viewport.value
  if (!current) return {}
  const width = layer.baseWidth * layer.scale * current.scale
  const height = layer.baseHeight * layer.scale * current.scale
  const center = logicalToScreen({ x: layer.x, y: layer.y }, {
    ...current,
    offsetX: 0,
    offsetY: 0
  })
  return {
    left: `${center.x - width / 2}px`,
    top: `${center.y - height / 2}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `rotate(${layer.rotation}deg)`
  }
}

const refreshViewport = () => {
  if (!stageSize.width || !stageSize.height) return
  viewport.value = createViewport(
    collageStore.scene,
    stageSize.width,
    stageSize.height,
    14
  )
}

const queryStage = () => new Promise((resolve, reject) => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select('#collageStage').fields({ size: true, rect: true }).exec(result => {
    const stage = result?.[0]
    if (!stage?.width || !stage?.height) reject(new Error('编辑区初始化失败'))
    else resolve(stage)
  })
})

const initializeStage = async () => {
  try {
    await nextTick()
    const result = await queryStage()
    stageSize = { width: result.width, height: result.height }
    stageRect = { left: result.left || 0, top: result.top || 0 }
    refreshViewport()
    stageReady.value = true
  } catch (error) {
    uni.showToast({ title: error.message || '编辑区初始化失败', icon: 'none' })
  }
}

const openMaterialPicker = () => {
  showMaterialPicker.value = true
}

const openLayerPanel = () => {
  showLayerPanel.value = true
}

const addMaterial = async material => {
  uni.showLoading({ title: '加载素材...' })
  try {
    const info = await loadMaterialImage(material)
    const layer = createImageLayer(material, info, collageStore.scene.canvas)
    collageStore.addLayer(layer)
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
  if (requireLogin(() => addMaterial(material))) addMaterial(material)
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
  refreshViewport()
  await loadEntryMaterial()
}

const handleSizeRequest = () => {
  if (collageStore.scene.layers.length === 0) {
    showSizeSheet.value = true
    return
  }
  uni.showModal({
    title: '重新选择画布？',
    content: '更换画布会清空当前所有素材，且无法撤销。',
    confirmText: '继续',
    success: result => {
      if (result.confirm) showSizeSheet.value = true
    }
  })
}

const touchToScreenPoint = touch => ({
  x: touch.clientX !== undefined ? touch.clientX - stageRect.left : touch.x,
  y: touch.clientY !== undefined ? touch.clientY - stageRect.top : touch.y
})

const logicalTouches = event => Array.from(event.touches || []).map(touch => (
  screenToLogical(touchToScreenPoint(touch), viewport.value)
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
  if (!viewport.value) return
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
  if (!viewport.value || !gesture) return
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

onReady(initializeStage)

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
})
</script>

<style scoped lang="scss">
.collage-page { height: 100vh; display: flex; flex-direction: column; background: #ececec; }
.header-button { margin: 0; padding: 0 18rpx; height: 56rpx; line-height: 56rpx; border-radius: 28rpx; background: #111; color: #fff; font-size: 22rpx; }
.header-button::after { border: none; }
.editor-status { display: flex; justify-content: space-between; padding: 12rpx 28rpx; color: #777; font-size: 22rpx; }
.canvas-shell { position: relative; flex: 1; min-height: 0; margin: 0 20rpx 16rpx; border-radius: 22rpx; overflow: hidden; background: #dcdcdc; }
.paper-stage { position: absolute; overflow: hidden; box-shadow: 0 4rpx 18rpx rgba(0, 0, 0, 0.08); }
.stage-layer { position: absolute; transform-origin: center center; pointer-events: none; }
.stage-layer-image { width: 100%; height: 100%; display: block; }
.selection-outline { position: absolute; inset: 0; box-sizing: border-box; border: 3rpx dashed #111; }
.selection-handle { position: absolute; right: -10rpx; bottom: -10rpx; width: 20rpx; height: 20rpx; border-radius: 50%; background: #111; }
.empty-tip { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #888; font-size: 26rpx; }
.empty-tip { flex-direction: column; gap: 14rpx; pointer-events: none; }
.empty-icon { font-size: 54rpx; color: #bbb; }
</style>
