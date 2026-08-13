<template>
  <view class="mc-page">
    <GlassNavBar title="氛围音乐卡片" :show-back="true" />

    <scroll-view class="page-scroll" scroll-y>
      <view class="hero-section">
        <text class="eyebrow">MUSIC CARD GENERATOR</text>
        <text class="page-title">把照片和音乐变成一张卡片</text>
        <text class="page-subtitle">照片仅在本地处理，卡片可导出保存</text>
      </view>

      <!-- 上传照片 -->
      <view v-if="!hasPhoto" class="panel upload-panel" @tap="handleChoosePhoto">
        <view v-if="!photoChoosing" class="upload-zone">
          <text class="upload-mark">＋</text>
          <text class="upload-title">选择一张照片</text>
          <text class="upload-hint">照片将作为卡片主体</text>
        </view>
        <view v-else class="upload-zone">
          <text class="upload-mark">⟳</text>
          <text class="upload-title">正在分析色彩…</text>
        </view>
      </view>

      <view v-if="hasPhoto" class="editor-panel">
        <view class="editor-head">
          <text>{{ store.canvasSize }} · 实时预览</text>
          <text class="replace-photo" @tap="handleChoosePhoto">重新选图</text>
        </view>
        <view id="musicCardStage" class="stage-shell" :style="stageAspectStyle"
          @touchstart="handleTouchStart" @touchmove.stop.prevent="handleTouchMove"
          @touchend="handleTouchEnd" @touchcancel="handleTouchEnd">
          <image v-if="previewPath" class="stage-preview" :src="previewPath" mode="aspectFit" />
          <view v-else class="preview-loading"><text>{{ previewError || '正在生成预览…' }}</text></view>
          <view v-if="selectionStyle" class="selection-box" :style="selectionStyle"><view class="selection-handle" /></view>
        </view>
        <view class="selection-actions">
          <text :class="{ disabled: !store.selectedLayer }" @tap="store.duplicateSelected()">复制</text>
          <text :class="{ disabled: !store.selectedLayer }" @tap="store.moveSelected('up')">上移</text>
          <text :class="{ disabled: !store.selectedLayer }" @tap="store.moveSelected('down')">下移</text>
          <text :class="{ disabled: !store.selectedLayer }" @tap="store.moveSelected('top')">置顶</text>
          <text :class="{ disabled: !store.selectedLayer }" @tap="store.moveSelected('bottom')">置底</text>
          <text :class="{ disabled: !store.selectedLayer }" @tap="removeSelected">删除</text>
        </view>
        <view v-if="selectedText" class="text-controls">
          <text @tap="editSelectedText">编辑内容</text>
          <text @tap="setTextAlign('left')">左对齐</text><text @tap="setTextAlign('center')">居中</text><text @tap="setTextAlign('right')">右对齐</text>
          <slider :value="selectedText.fontSize" min="14" max="72" @changing="e => updateSelectedText({ fontSize: e.detail.value })" @change="store.commit()" />
          <view class="palette-row"><view v-for="color in palette" :key="color.hex" class="palette-dot" :style="{ background: color.hex }" @tap="updateSelectedText({ color: color.hex }, true)" /></view>
        </view>
      </view>

      <!-- 调色板 -->
      <view v-if="hasPhoto && palette.length" class="panel palette-panel">
        <text class="panel-label">提取的主色调</text>
        <view class="palette-row">
          <view v-for="(color, i) in palette" :key="i" class="palette-chip" :style="{ background: color.hex }">
            <text class="palette-name">{{ color.name }}</text>
            <text class="palette-pct">{{ color.ratio }}%</text>
          </view>
        </view>
      </view>

      <!-- 歌曲信息 -->
      <view v-if="hasPhoto" class="panel" @tap="showSongSheet = true">
        <view class="panel-row">
          <text class="panel-label">歌曲信息</text>
          <text class="panel-hint">点击编辑 ›</text>
        </view>
        <view v-if="store.songInfo.songName" class="song-preview">
          <text class="song-name-display">♪ {{ store.songInfo.songName }}</text>
          <text class="song-artist-display">{{ store.songInfo.artist }}</text>
        </view>
        <text v-else class="empty-hint">点击输入歌曲信息</text>
      </view>

      <!-- 工具栏 -->
      <view v-if="hasPhoto" class="toolbar">
        <view class="tool-btn" @tap="showBgSheet = true"><text class="tool-icon">🎨</text><text>背景</text></view>
        <view class="tool-btn" @tap="showPlayerSheet = true"><text class="tool-icon">🎵</text><text>模板</text></view>
        <view class="tool-btn" @tap="showDecorSheet = true"><text class="tool-icon">✨</text><text>装饰</text></view>
        <view class="tool-btn" @tap="handleAddText"><text class="tool-icon">T</text><text>文字</text></view>
        <view class="tool-btn primary" @tap="handleExport"><text class="tool-icon">↓</text><text>导出</text></view>
      </view>

      <!-- 图层列表 -->
      <view v-if="hasPhoto" class="panel layer-panel">
        <view class="panel-row">
          <text class="panel-label">图层 ({{ layerCount }})</text>
          <view class="layer-actions">
            <text class="layer-action" :class="{ disabled: !store.canUndo }" @tap="store.undo()">↩</text>
            <text class="layer-action" :class="{ disabled: !store.canRedo }" @tap="store.redo()">↪</text>
          </view>
        </view>
      </view>

      <view class="spacer" />
    </scroll-view>

    <!-- 背景选择 -->
    <BottomSheet v-model:visible="showBgSheet" title="选择背景">
      <view class="sheet-grid">
        <view v-for="bg in bgOptions" :key="bg.type" class="sheet-card" :class="{ active: store.backgroundStyle.type === bg.type }" @tap="handleSelectBg(bg.type)">
          <text class="sheet-card-icon">{{ bg.icon }}</text>
          <text class="sheet-card-label">{{ bg.name }}</text>
        </view>
      </view>
      <text class="form-label">背景主色</text>
      <view class="palette-row"><view v-for="color in palette" :key="color.hex" class="palette-dot" :style="{ background: color.hex }" @tap="selectBackgroundColor(color.hex)" /></view>
    </BottomSheet>

    <!-- 播放器模板选择 -->
    <BottomSheet v-model:visible="showPlayerSheet" title="选择播放器样式">
      <view class="sheet-list">
        <view v-for="tpl in playerTemplates" :key="tpl.id" class="sheet-row" :class="{ active: store.playerTemplateId === tpl.id }" @tap="handleSelectPlayer(tpl.id)">
          <text class="sheet-row-name">{{ tpl.name }}</text>
          <text class="sheet-row-desc">{{ tpl.description }}</text>
        </view>
      </view>
      <view v-if="playerLayer" class="player-options">
        <view class="panel-row"><text>显示照片封面</text><switch :checked="playerLayer.showCover !== false" color="#8fbc93" @change="togglePlayerCover" /></view>
        <button class="randomize-btn" @tap="choosePlayerCover">选择独立封面</button>
        <text class="form-label">播放器配色</text>
        <view class="palette-row"><view class="palette-dot auto" @tap="setPlayerColor('auto')">自动</view><view v-for="color in palette" :key="color.hex" class="palette-dot" :style="{ background: color.hex }" @tap="setPlayerColor(color.hex)" /></view>
      </view>
    </BottomSheet>

    <!-- 歌曲信息 -->
    <BottomSheet v-model:visible="showSongSheet" title="歌曲信息">
      <view class="form-group">
        <text class="form-label">歌曲名</text>
        <input v-model="songForm.songName" class="form-input" placeholder="输入歌曲名" />
      </view>
      <view class="form-group">
        <text class="form-label">艺术家</text>
        <input v-model="songForm.artist" class="form-input" placeholder="输入艺术家" />
      </view>
      <view class="form-group">
        <text class="form-label">专辑 (选填)</text>
        <input v-model="songForm.album" class="form-input" placeholder="输入专辑名" />
      </view>
      <view class="form-group">
        <text class="form-label">日期</text>
        <input v-model="songForm.date" class="form-input" placeholder="2026.08.07" />
      </view>
      <view class="form-group"><text class="form-label">歌词片段</text><input v-model="songForm.lyrics" class="form-input" placeholder="输入一句歌词" /></view>
      <view class="time-inputs">
        <view class="form-group"><text class="form-label">当前时间</text><input v-model="songForm.currentTime" class="form-input" placeholder="1:24" /></view>
        <view class="form-group"><text class="form-label">总时长</text><input v-model="songForm.totalTime" class="form-input" placeholder="3:32" /></view>
      </view>
      <button class="form-submit" @tap="handleSaveSong">保存</button>
    </BottomSheet>

    <!-- 装饰选择 -->
    <BottomSheet v-model:visible="showDecorSheet" title="添加装饰">
      <view class="decor-categories">
        <view v-for="cat in decorCategories" :key="cat.key" class="decor-cat-chip" :class="{ active: activeDecorCat === cat.key }" @tap="activeDecorCat = cat.key">
          <text>{{ cat.name }}</text>
        </view>
      </view>
      <view class="sheet-grid">
        <view v-for="type in filteredDecorTypes" :key="type" class="sheet-card" @tap="handleAddDecor(type)">
          <text class="sheet-card-icon">{{ decorIcon(type) }}</text>
          <text class="sheet-card-label">{{ decorName(type) }}</text>
        </view>
      </view>
      <view v-if="store.decorations.length" class="active-decors">
        <text class="panel-label">已添加</text>
        <view v-for="(d, i) in store.decorations" :key="i" class="decor-row">
          <text @tap="activeDecorIndex = i">{{ decorName(d.type) }} ×{{ d.options?.count || '--' }}</text>
          <text class="decor-remove" @tap="store.removeDecoration(i)">×</text>
        </view>
        <view v-if="activeDecoration" class="decor-controls">
          <text>数量 {{ activeDecoration.options.count }}</text>
          <slider :value="activeDecoration.options.count" min="1" max="100" @changing="e => updateDecoration('count', e.detail.value)" @change="store.commit()" />
          <text>大小 {{ activeDecoration.options.size }}</text>
          <slider :value="activeDecoration.options.size" min="8" max="120" @changing="e => updateDecoration('size', e.detail.value)" @change="store.commit()" />
          <text>透明度 {{ Math.round(activeDecoration.options.opacity * 100) }}%</text>
          <slider :value="activeDecoration.options.opacity * 100" min="10" max="100" @changing="e => updateDecoration('opacity', e.detail.value / 100)" @change="store.commit()" />
          <button class="randomize-btn" @tap="rerollDecoration">重新随机</button>
        </view>
      </view>
    </BottomSheet>

    <!-- 导出 -->
    <BottomSheet v-model:visible="showExportSheet" title="导出卡片">
      <text class="panel-label">输出比例</text>
      <view class="ratio-row">
        <view v-for="r in ratioOptions" :key="r.value" class="ratio-chip" :class="{ active: exportRatio === r.value }" @tap="exportRatio = r.value">
          <text>{{ r.label }}</text>
        </view>
      </view>
      <button class="form-submit" :loading="exporting" @tap="handleExportConfirm">导出 PNG</button>
    </BottomSheet>

    <CustomToast ref="toastRef" />
  </view>
</template>

<script setup>
import { ref, computed, getCurrentInstance, nextTick, onMounted, watch } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import GlassNavBar from '../../components/GlassNavBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import CustomToast from '../../components/CustomToast.vue'
import { useMusicCardStore } from '../../stores/music-card'
import { readImagePixels } from '../../utils/dot-art/image-processor'
import { extractPalette } from '../../utils/music-card/color-extraction.mjs'
import { playerTemplates } from '../../utils/music-card/player-templates.mjs'
import { decorationCategories, getDecorationDefs } from '../../utils/music-card/decorations.mjs'
import { exportMusicCard, renderMusicCardPreview } from '../../utils/music-card/renderer.mjs'
import { angle, distance, normalizeAngleDelta } from '../../utils/collage/geometry.mjs'
import { findTopLayerAtPoint, layerBounds } from '../../utils/music-card/editor.mjs'

const store = useMusicCardStore()
const toastRef = ref(null)
const instance = getCurrentInstance()

// UI 状态
const photoChoosing = ref(false)
const showBgSheet = ref(false)
const showPlayerSheet = ref(false)
const showSongSheet = ref(false)
const showDecorSheet = ref(false)
const showExportSheet = ref(false)
const exporting = ref(false)
const previewPath = ref('')
const previewError = ref('')
const stageSize = ref({ width: 0, height: 0, left: 0, top: 0 })
const activeDecorIndex = ref(0)
let previewTimer = null
let previewVersion = 0
let gesture = null
const exportRatio = ref('4:3')
const activeDecorCat = ref('shape')
const songForm = ref({ songName: '', artist: '', album: '', lyrics: '', date: '', currentTime: '1:24', totalTime: '3:32' })

const palette = computed(() => store.palette)
const hasPhoto = computed(() => store.layers.some(l => l.type === 'photo'))
const layerCount = computed(() => store.layers.length)
const playerLayer = computed(() => store.layers.find(layer => layer.type === 'player'))
const selectedText = computed(() => store.selectedLayer?.type === 'text' ? store.selectedLayer : null)
const activeDecoration = computed(() => store.decorations[activeDecorIndex.value] || null)
const stageAspectStyle = computed(() => ({ aspectRatio: `${store.canvas.width} / ${store.canvas.height}` }))
const selectionStyle = computed(() => {
  const layer = store.selectedLayer
  if (!layer || layer.type === 'background' || !stageSize.value.width) return null
  const bounds = layerBounds(layer)
  const sx = stageSize.value.width / store.canvas.width
  const sy = stageSize.value.height / store.canvas.height
  return { left: `${bounds.x * sx}px`, top: `${bounds.y * sy}px`, width: `${bounds.width * sx}px`, height: `${bounds.height * sy}px`, transform: `rotate(${layer.rotation || 0}deg)` }
})

const bgOptions = [
  { type: 'gradient', name: '渐变', icon: '◐' },
  { type: 'solid', name: '纯色', icon: '■' },
  { type: 'watercolor', name: '水彩', icon: '🎨' },
  { type: 'paper', name: '纸纹', icon: '📄' },
  { type: 'blur', name: '毛玻璃', icon: '▧' },
  { type: 'film', name: '胶片', icon: '▦' }
]

const ratioOptions = [
  { value: '4:3', label: '4:3 横版' },
  { value: '1:1', label: '1:1 方形' },
  { value: '3:4', label: '3:4 竖版' },
  { value: '9:16', label: '9:16 竖版' }
]

const decorCategories = decorationCategories
const decorDefs = getDecorationDefs()
const filteredDecorTypes = computed(() =>
  Object.entries(decorDefs).filter(([, def]) => def.category === activeDecorCat.value).map(([type]) => type)
)
const decorName = (type) => decorDefs[type]?.name || type
const decorIcon = (type) => ({ star: '★', heart: '♥', flower: '✿', diamond: '◆', sparkle: '✦', rain: '🌧', cloud: '☁', snow: '❄', butterfly: '🦋', ribbon: '🎀', bubble: '🫧', circle: '○', line: '—', underline: '﹏', tape: '📎' })[type] || '·'

const scene = () => {
  const photo = store.layers.find(layer => layer.type === 'photo')
  return { schemaVersion: 1, canvas: { width: store.canvas.width, height: store.canvas.height },
    palette: store.palette, songInfo: store.songInfo, backgroundStyle: store.backgroundStyle,
    photoPath: photo?.imagePath, layers: store.layers }
}
const queryStage = () => new Promise(resolve => nextTick(() => {
  uni.createSelectorQuery().in(instance.proxy).select('#musicCardStage').fields({ size: true, rect: true })
    .exec(result => resolve(result?.[0] || null))
}))
const refreshStageSize = async () => {
  const result = await queryStage()
  if (result?.width) stageSize.value = { width: result.width, height: result.height, left: result.left || 0, top: result.top || 0 }
}
const renderPreview = async () => {
  if (!hasPhoto.value) return
  const version = ++previewVersion
  previewError.value = ''
  try {
    const result = await renderMusicCardPreview(scene(), 720)
    if (version === previewVersion) previewPath.value = result.filePath
  } catch (error) {
    if (version === previewVersion) previewError.value = error.message || '预览生成失败'
  }
  await refreshStageSize()
}
const schedulePreview = () => { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 100) }

onMounted(() => { store.reset(); store.initDefaults() })
onUnload(() => { clearTimeout(previewTimer); previewVersion++; previewPath.value = ''; store.reset() })
watch(() => store.snapshot(), schedulePreview, { deep: true })

// 选择照片 + 提取色彩
const handleChoosePhoto = () => {
  uni.chooseMedia({
    count: 1, mediaType: ['image'], sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: async (res) => {
      const path = res.tempFiles[0].tempFilePath
      photoChoosing.value = true
      try {
        const info = await new Promise((resolve, reject) => uni.getImageInfo({ src: path, success: resolve, fail: reject }))
        store.addPhoto(path, info)
        const pixelData = await readImagePixels(path, 400)
        const colors = extractPalette(pixelData, 5)
        if (!colors.length) colors.push(
          { hex: '#EEEFE8', name: '雪花米', ratio: 45 },
          { hex: '#8FBC93', name: '清新绿', ratio: 35 },
          { hex: '#FCEBBF', name: '柔桃黄', ratio: 20 }
        )
        store.setPalette(colors)
        toastRef.value?.showToast('色彩提取完成', 'check')
      } catch (e) {
        toastRef.value?.showToast('处理照片失败', 'error')
      } finally {
        photoChoosing.value = false
      }
    },
    fail: (error) => {
      if (String(error?.errMsg || '').includes('cancel')) return
      const message = String(error?.errMsg || '').includes('privacy')
        ? '请先在小程序隐私协议中授权选择照片'
        : '选择照片失败，请检查相册权限'
      uni.showModal({ title: '无法选择照片', content: message, showCancel: false })
    }
  })
}

// 背景
const handleSelectBg = (type) => {
  store.setBackground({ type })
  showBgSheet.value = false
}
const selectBackgroundColor = color => store.setBackground({ color })

// 播放器模板
const handleSelectPlayer = (id) => {
  store.setPlayerTemplate(id)
  showPlayerSheet.value = false
}
const togglePlayerCover = event => {
  if (!playerLayer.value) return
  store.updateLayer(playerLayer.value.id, { showCover: event.detail.value }); store.commit()
}
const setPlayerColor = color => {
  if (!playerLayer.value) return
  store.updateLayer(playerLayer.value.id, { colorMode: color }); store.commit()
}
const choosePlayerCover = () => uni.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'],
  sourceType: ['album', 'camera'], success: result => {
    if (!playerLayer.value) return
    store.updateLayer(playerLayer.value.id, { coverPath: result.tempFiles[0].tempFilePath, showCover: true }); store.commit()
  }, fail: error => { if (!String(error?.errMsg || '').includes('cancel')) uni.showToast({ title: '选择封面失败', icon: 'none' }) } })

// 歌曲信息
const handleSaveSong = () => {
  store.updateSongInfo(songForm.value)
  showSongSheet.value = false
  toastRef.value?.showToast('歌曲信息已保存', 'check')
}

// 装饰
const handleAddDecor = (type) => {
  const def = decorDefs[type]
  const color = store.palette[0]?.hex || '#6f8b8d'
  store.addDecorationLayer({ id: `decor_${Date.now()}`, type, bounds: { x: 0, y: 0, width: store.canvas.width, height: store.canvas.height },
    options: { count: def.defaultCount, size: def.defaultSize, sizeRandom: 0.8,
      opacity: 0.7, color, randomness: 1, seed: Date.now() % 100000 } })
  activeDecorIndex.value = store.decorations.length - 1
  toastRef.value?.showToast(`已添加${def.name}`)
}

const updateDecoration = (key, value) => {
  if (!activeDecoration.value) return
  activeDecoration.value.options[key] = value
  const layer = store.layers.find(item => item.type === 'decoration' && item.decorations?.[0]?.id === activeDecoration.value.id)
  if (layer) layer.decorations[0].options[key] = value
  schedulePreview()
}
const rerollDecoration = () => { updateDecoration('seed', Date.now() % 100000); store.commit() }
const removeSelected = () => { if (store.selectedLayer) store.removeLayer(store.selectedLayer.id) }
const updateSelectedText = (changes, shouldCommit = false) => {
  if (!selectedText.value) return
  store.updateLayer(selectedText.value.id, changes); if (shouldCommit) store.commit(); schedulePreview()
}
const setTextAlign = align => updateSelectedText({ align }, true)
const editSelectedText = () => uni.showModal({ title: '编辑文字', editable: true, content: selectedText.value?.text || '',
  success: result => { if (result.confirm && result.content?.trim()) updateSelectedText({ text: result.content.trim() }, true) } })

const touchPoint = touch => ({
  x: ((touch.clientX ?? touch.x) - stageSize.value.left) * store.canvas.width / stageSize.value.width,
  y: ((touch.clientY ?? touch.y) - stageSize.value.top) * store.canvas.height / stageSize.value.height
})
const pointsFromEvent = event => Array.from(event.touches || []).map(touchPoint)
const handleTouchStart = event => {
  const points = pointsFromEvent(event)
  if (points.length >= 2 && store.selectedLayer) {
    gesture = { type: 'transform', layerId: store.selectedLayer.id, startLayer: { ...store.selectedLayer },
      distance: Math.max(distance(points[0], points[1]), 1), angle: angle(points[0], points[1]), changed: false }
    return
  }
  if (points.length !== 1) return
  const layer = findTopLayerAtPoint(store.layers, points[0])
  store.selectedLayerId = layer?.id || null
  gesture = layer ? { type: 'drag', layerId: layer.id, start: points[0], startLayer: { ...layer }, changed: false } : null
}
const handleTouchMove = event => {
  if (!gesture) return
  const points = pointsFromEvent(event)
  if (points.length >= 2 && gesture.type === 'transform') {
    const factor = Math.max(distance(points[0], points[1]), 1) / gesture.distance
    store.updateLayer(gesture.layerId, { scale: Math.min(5, Math.max(0.2, (gesture.startLayer.scale || 1) * factor)),
      rotation: (gesture.startLayer.rotation || 0) + normalizeAngleDelta(angle(points[0], points[1]) - gesture.angle) })
    gesture.changed = true; schedulePreview(); return
  }
  if (points.length === 1 && gesture.type === 'drag') {
    store.updateLayer(gesture.layerId, { x: gesture.startLayer.x + points[0].x - gesture.start.x,
      y: gesture.startLayer.y + points[0].y - gesture.start.y })
    gesture.changed = true; schedulePreview()
  }
}
const handleTouchEnd = () => { if (gesture?.changed) store.commit(); gesture = null }

// 文字
const handleAddText = () => {
  uni.showModal({
    title: '添加文字',
    editable: true,
    placeholderText: '输入文字内容',
    success: (res) => {
      if (res.confirm && res.content) {
        store.addTextLayer({ text: res.content.trim(), fontSize: 28, fontFamily: 'serif',
          color: store.palette[0]?.hex ? '#2c2c2c' : '#2c2c2c' })
        toastRef.value?.showToast('文字已添加', 'check')
      }
    }
  })
}

// 导出
const handleExport = () => {
  exportRatio.value = store.canvasSize
  showExportSheet.value = true
}

const handleExportConfirm = async () => {
  if (exporting.value) return
  exporting.value = true
  try {
    store.setCanvasSize(exportRatio.value)
    const result = await exportMusicCard(scene(), 2)
    await new Promise((resolve, reject) => {
      uni.saveImageToPhotosAlbum({ filePath: result.filePath, success: resolve, fail: reject })
    })
    showExportSheet.value = false
    toastRef.value?.showToast('已保存至相册', 'check')
  } catch (e) {
    if (e.message?.includes('auth deny') || e.errMsg?.includes('auth deny')) {
      uni.showModal({
        title: '需要相册权限', content: '请在设置中允许保存图片到相册',
        confirmText: '去设置', success: (m) => m.confirm && uni.openSetting({})
      })
    } else {
      toastRef.value?.showToast('导出失败', 'error')
    }
  } finally { exporting.value = false }
}
</script>

<style lang="scss" scoped>
.mc-page { min-height: 100vh; color: #3f4d50; background: linear-gradient(180deg, #f7fde9 0%, #f2fbdd 58%, #eaf7d2 100%); }
.page-scroll { height: calc(100vh - 88rpx); }
.hero-section { padding: 40rpx 32rpx 30rpx; }
.eyebrow { display: block; color: #657668; font-size: 19rpx; font-weight: 600; letter-spacing: 4rpx; }
.page-title { display: block; margin-top: 10rpx; font-size: 36rpx; font-weight: 700; color: #3f4d50; }
.page-subtitle { display: block; margin-top: 8rpx; color: #6f766f; font-size: 23rpx; }
.panel { margin: 0 24rpx 22rpx; padding: 26rpx; border: 1rpx solid rgba(143,188,147,.38); border-radius: 24rpx; box-shadow: 0 8rpx 22rpx rgba(95,133,100,.05); background: rgba(238,239,232,.94); }
.editor-panel { margin: 0 24rpx 22rpx; padding: 18rpx; border-radius: 24rpx; background: rgba(238,239,232,.96); border: 1rpx solid rgba(143,188,147,.38); }
.editor-head { display: flex; justify-content: space-between; margin-bottom: 12rpx; font-size: 22rpx; color: #657668; }
.replace-photo { color: #5f8564; font-weight: 600; }
.stage-shell { position: relative; width: 100%; max-height: 58vh; overflow: hidden; border-radius: 18rpx; background: #fff; touch-action: none; }
.stage-preview { position: absolute; inset: 0; width: 100%; height: 100%; }
.preview-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #7b887c; font-size: 22rpx; }
.selection-box { position: absolute; box-sizing: border-box; border: 2rpx solid #5f8564; transform-origin: center; pointer-events: none; }
.selection-handle { position: absolute; right: -9rpx; bottom: -9rpx; width: 18rpx; height: 18rpx; border-radius: 50%; background: #5f8564; }
.selection-actions { display: flex; justify-content: space-around; padding-top: 16rpx; font-size: 22rpx; color: #5f8564; }
.selection-actions .disabled { opacity: .3; }
.text-controls { margin-top: 14rpx; padding: 14rpx; border-radius: 14rpx; background: #f8fbf3; display: flex; gap: 16rpx; align-items: center; flex-wrap: wrap; font-size: 20rpx; color: #5f8564; }
.text-controls slider { width: 100%; }
.panel-label { font-size: 24rpx; font-weight: 600; color: #3f4d50; }
.panel-hint { color: #6f766f; font-size: 21rpx; }
.panel-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; }
.empty-hint { color: #aab; font-size: 22rpx; text-align: center; padding: 20rpx 0; }
.upload-zone { display: flex; flex-direction: column; align-items: center; padding: 50rpx 0; }
.upload-mark { font-size: 64rpx; color: #8fbc93; }
.upload-title { margin-top: 16rpx; font-size: 28rpx; font-weight: 600; }
.upload-hint { margin-top: 8rpx; color: #6f766f; font-size: 21rpx; }

.palette-panel { padding-bottom: 20rpx; }
.palette-row { display: flex; gap: 12rpx; margin-top: 14rpx; flex-wrap: wrap; }
.palette-chip { flex: 1; min-width: 80rpx; padding: 18rpx 10rpx; border-radius: 14rpx; text-align: center; }
.palette-name { display: block; color: #fff; font-size: 19rpx; font-weight: 600; text-shadow: 0 0 6px rgba(0,0,0,.3); }
.palette-pct { display: block; color: rgba(255,255,255,.8); font-size: 17rpx; margin-top: 4rpx; }
.palette-dot { width: 56rpx; height: 56rpx; border-radius: 50%; border: 2rpx solid rgba(255,255,255,.9); box-shadow: 0 0 0 1rpx #ccd8c7; }
.palette-dot.auto { display: flex; align-items: center; justify-content: center; width: 76rpx; border-radius: 28rpx; background: #eef4e8; color: #5f8564; font-size: 18rpx; }
.player-options { margin: 18rpx 12rpx 0; padding: 18rpx; border-radius: 14rpx; background: #f8fbf3; }

.song-preview { margin-top: 10rpx; }
.song-name-display { display: block; font-size: 30rpx; font-weight: 700; color: #3f4d50; }
.song-artist-display { display: block; font-size: 22rpx; color: #6f766f; margin-top: 4rpx; }

.toolbar { display: flex; gap: 12rpx; margin: 0 24rpx 22rpx; }
.tool-btn { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 18rpx 0; border-radius: 16rpx; background: rgba(238,239,232,.94); border: 1rpx solid rgba(143,188,147,.38); font-size: 20rpx; color: #3f4d50; }
.tool-btn.primary { background: #5f8564; border-color: #5f8564; color: #fff; }
.tool-icon { font-size: 30rpx; margin-bottom: 4rpx; }

.layer-panel { }
.layer-actions { display: flex; gap: 16rpx; }
.layer-action { font-size: 32rpx; color: #3f4d50; }
.layer-action.disabled { opacity: .3; }

.spacer { height: 80rpx; }

/* BottomSheet 内容 */
.sheet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; padding: 0 12rpx; }
.sheet-card { display: flex; flex-direction: column; align-items: center; padding: 26rpx 0; border-radius: 16rpx; border: 1rpx solid #e0e0e0; }
.sheet-card.active { border-color: #5f8564; background: #e4f2e5; }
.sheet-card-icon { font-size: 36rpx; }
.sheet-card-label { margin-top: 8rpx; font-size: 22rpx; color: #3f4d50; }
.sheet-list { padding: 0 12rpx; }
.sheet-row { padding: 20rpx 16rpx; border-radius: 14rpx; margin-bottom: 8rpx; border: 1rpx solid #e0e0e0; }
.sheet-row.active { border-color: #5f8564; background: #e4f2e5; }
.sheet-row-name { font-size: 26rpx; font-weight: 600; }
.sheet-row-desc { display: block; font-size: 20rpx; color: #6f766f; margin-top: 4rpx; }

.form-group { margin-bottom: 18rpx; }
.form-label { display: block; font-size: 22rpx; font-weight: 600; color: #3f4d50; margin-bottom: 8rpx; }
.form-input { width: 100%; height: 80rpx; padding: 0 20rpx; border: 1rpx solid #dde8d1; border-radius: 12rpx; font-size: 24rpx; background: #f9faf5; }
.form-submit { width: 100%; height: 88rpx; margin-top: 20rpx; border-radius: 16rpx; background: #5f8564; color: #fff; font-size: 28rpx; font-weight: 600; border: none; }
.form-submit::after { border: none; }

.decor-categories { display: flex; gap: 10rpx; margin-bottom: 14rpx; flex-wrap: wrap; padding: 0 12rpx; }
.decor-cat-chip { padding: 10rpx 20rpx; border-radius: 999rpx; border: 1rpx solid #dde8d1; font-size: 21rpx; color: #6f766f; }
.decor-cat-chip.active { background: #5f8564; color: #fff; border-color: #5f8564; }
.active-decors { margin-top: 16rpx; padding: 0 12rpx; }
.decor-row { display: flex; justify-content: space-between; padding: 12rpx 0; border-bottom: 1rpx solid #eee; font-size: 22rpx; }
.decor-remove { color: #c44; font-size: 28rpx; font-weight: 700; padding: 0 10rpx; }
.decor-controls { margin-top: 18rpx; padding: 16rpx; border-radius: 14rpx; background: #f8fbf3; font-size: 21rpx; color: #58665a; }
.randomize-btn { margin-top: 10rpx; background: #8fbc93; color: #fff; font-size: 22rpx; border-radius: 12rpx; }
.time-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }

.ratio-row { display: flex; gap: 12rpx; margin: 12rpx 0 20rpx; }
.ratio-chip { flex: 1; padding: 24rpx 0; border-radius: 14rpx; border: 1rpx solid #dde8d1; text-align: center; font-size: 24rpx; color: #3f4d50; }
.ratio-chip.active { border-color: #5f8564; background: #e4f2e5; }
</style>
