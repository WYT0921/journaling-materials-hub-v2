<template>
  <view class="dot-art-page">
    <GlassNavBar title="图片转 Dot Art" :show-back="true" />

    <scroll-view class="page-scroll" scroll-y>
      <view class="hero-section">
        <text class="eyebrow">IMAGE TO DOT ART</text>
        <text class="page-title">把图片变成点阵文字</text>
        <text class="page-subtitle">图片仅在本机处理，不会上传服务器</text>
      </view>

      <view class="panel upload-panel">
        <view v-if="imagePath" class="image-preview-wrap" @tap="chooseImage">
          <image class="image-preview" :src="imagePath" mode="aspectFit" />
          <view class="replace-badge"><text>重新选择</text></view>
        </view>
        <button v-else class="upload-button" hover-class="button-pressed" @tap="chooseImage">
          <text class="upload-mark">＋</text>
          <text class="upload-title">选择一张图片</text>
          <text class="upload-hint">支持相册图片与拍照</text>
        </button>
      </view>

      <view class="panel settings-panel">
        <view class="panel-heading">
          <text class="panel-title">生成设置</text>
          <text class="width-value">微信适配 · {{ effectiveOutputWidth }} 字符宽</text>
        </view>

        <view class="mode-switch" aria-label="点阵模式">
          <view
            v-for="item in modes"
            :key="item.value"
            class="mode-option"
            :class="{ 'mode-option--active': mode === item.value }"
            @tap="setMode(item.value)"
          >
            <text>{{ item.label }}</text>
          </view>
        </view>

        <view class="setting-row setting-row--block">
          <view class="setting-copy">
            <text class="setting-label">点阵密度</text>
            <text class="setting-description">默认密集，主体轮廓和细节会更完整</text>
          </view>
          <view class="density-switch">
            <view v-for="item in densities" :key="item.value" class="density-option" :class="{ 'density-option--active': density === item.value }" @tap="setDensity(item.value)">
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="setting-row setting-row--block">
          <view class="setting-copy">
            <text class="setting-label">文字颜色</text>
            <text class="setting-description">颜色会用于预览和下载图片，复制文字不携带颜色</text>
          </view>
          <view class="color-palette">
            <view v-for="item in colors" :key="item.value" class="color-swatch" :class="{ 'color-swatch--active': textColor === item.value }" :style="{ backgroundColor: item.value }" :aria-label="item.label" @tap="setTextColor(item.value)" />
          </view>
          <view class="custom-color-row">
            <view class="custom-color-preview" :style="{ backgroundColor: textColor }" />
            <input
              v-model="customColorInput"
              class="color-hex-input"
              type="text"
              maxlength="7"
              placeholder="#RRGGBB"
              confirm-type="done"
              @confirm="applyCustomColor"
              @blur="applyCustomColor"
            />
            <button class="color-apply-button" @tap="applyCustomColor">应用</button>
          </view>
          <view class="rgb-controls">
            <view v-for="item in rgbChannels" :key="item.key" class="rgb-row">
              <text class="rgb-label">{{ item.label }}</text>
              <slider
                class="rgb-slider"
                :value="rgb[item.key]"
                :min="0"
                :max="255"
                :step="1"
                :active-color="item.color"
                background-color="#DDE3DA"
                block-color="#FFFFFF"
                block-size="18"
                @changing="handleRgbChange(item.key, $event)"
                @change="handleRgbChange(item.key, $event)"
              />
              <text class="rgb-value">{{ rgb[item.key] }}</text>
            </view>
          </view>
        </view>

        <view class="setting-row setting-row--slider">
          <view class="setting-copy">
            <text class="setting-label">精细度</text>
            <text class="setting-description">默认适配手机微信气泡，竖图约 24 行；点越细粘贴文字越长、聊天中可能会换行，在意换行可向左调低</text>
          </view>
          <slider
            class="width-slider"
            :value="outputWidth"
            :min="12"
            :max="40"
            :step="2"
            active-color="#8FBC93"
            background-color="#DDE8D1"
            block-color="#5F8564"
            block-size="22"
            @changing="handleWidthChanging"
            @change="handleWidthChange"
          />
          <view class="slider-labels"><text>简洁</text><text>细腻</text></view>
        </view>

        <view class="setting-row">
          <view class="setting-copy">
            <text class="setting-label">黑白反转</text>
            <text class="setting-description">适合浅色主体或深色背景图片</text>
          </view>
          <switch :checked="inverted" color="#8FBC93" @change="handleInvert" />
        </view>
      </view>

      <view class="panel result-panel">
        <view class="panel-heading">
          <text class="panel-title">生成结果</text>
          <text v-if="processing" class="processing-label">处理中…</text>
          <text v-else-if="dotText" class="result-size">{{ resultMeta }}</text>
        </view>

        <view v-if="processing" class="result-state">
          <view class="loading-dot" />
          <text>正在读取图片并生成点阵</text>
        </view>
        <view v-else-if="errorMessage" class="result-state result-state--error">
          <text>{{ errorMessage }}</text>
          <button class="retry-button" @tap="generate">重新生成</button>
        </view>
        <scroll-view v-else-if="dotText" class="result-scroll" scroll-x scroll-y>
          <text class="dot-output" :class="{ 'dot-output--ascii': mode === 'ascii' }" :style="dotOutputStyle" user-select>{{ dotText }}</text>
        </scroll-view>
        <view v-else class="result-state">
          <text class="empty-symbol">⠿</text>
          <text>选择图片后，这里会显示点阵结果</text>
        </view>

        <view class="action-row">
          <button class="action-button action-button--primary" :disabled="!canUseResult" @tap="copyResult">复制文字</button>
          <button class="action-button action-button--download" :loading="saving" :disabled="!canUseResult || saving" @tap="saveResult">下载图片</button>
        </view>
      </view>

      <view class="privacy-note">
        <text>图片仅在本机处理；只有点击“下载图片”时才会保存到相册。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import GlassNavBar from '../../components/GlassNavBar.vue'
import { readImagePixels } from '../../utils/dot-art/image-processor.js'
import { DOT_ART_DEFAULT_WIDTH, generateDotArt, getDensityOutputWidth, getFixedPreviewFontSize, isDotArtEmpty } from '../../utils/dot-art/dot-art.mjs'
import { saveDotArtToAlbum } from '../../utils/dot-art/exporter.js'
import { hidePageShareMenu } from '../../utils/tool-share'
import { copyToClipboard } from '../../utils/clipboard'

const modes = [
  { label: 'Braille 点阵', value: 'braille' },
  { label: 'ASCII 字符', value: 'ascii' }
]
const densities = [
  { label: '清爽', value: 'light' },
  { label: '标准', value: 'normal' },
  { label: '密集', value: 'dense' }
]
const colors = [
  { label: '黑色', value: '#202522' },
  { label: '墨绿', value: '#315F3D' },
  { label: '粉色', value: '#D96B8A' },
  { label: '紫色', value: '#7356A8' },
  { label: '蓝色', value: '#3978A8' },
  { label: '橙色', value: '#C96F32' }
]
const rgbChannels = [
  { label: 'R', key: 'r', color: '#D96B6B' },
  { label: 'G', key: 'g', color: '#67A56E' },
  { label: 'B', key: 'b', color: '#628BC2' }
]

const imagePath = ref('')
const mode = ref('braille')
const outputWidth = ref(DOT_ART_DEFAULT_WIDTH)
const inverted = ref(false)
const density = ref('dense')
const textColor = ref(colors[0].value)
const customColorInput = ref(colors[0].value)
const rgb = reactive({ r: 32, g: 37, b: 34 })
const saving = ref(false)
const dotText = ref('')
const processing = ref(false)
const errorMessage = ref('')
let generationId = 0
let generationTimer
let cachedImagePath = ''
let cachedImagePixels = null
let imageReadPath = ''
let imageReadPromise = null

onMounted(hidePageShareMenu)
onUnmounted(() => {
  clearTimeout(generationTimer)
  generationId += 1
  cachedImagePixels = null
  imageReadPromise = null
})

const canUseResult = computed(() => Boolean(dotText.value) && !processing.value && !isDotArtEmpty(dotText.value))
const effectiveOutputWidth = computed(() => getDensityOutputWidth(outputWidth.value, density.value))
const dotOutputStyle = computed(() => ({
  color: textColor.value,
  fontSize: `${getFixedPreviewFontSize(effectiveOutputWidth.value)}rpx`
}))
const resultMeta = computed(() => {
  const lines = dotText.value.split('\n')
  const columns = Math.max(0, ...lines.map(line => [...line].length))
  return `${columns} × ${lines.length}`
})

function toHex(value) {
  return Math.max(0, Math.min(255, Number(value) || 0)).toString(16).padStart(2, '0').toUpperCase()
}

function normalizeHex(value) {
  const input = String(value || '').trim()
  const withHash = input.startsWith('#') ? input : `#${input}`
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    return `#${[...withHash.slice(1)].map(char => char.repeat(2)).join('')}`.toUpperCase()
  }
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash.toUpperCase() : ''
}

function setTextColor(value) {
  const normalized = normalizeHex(value)
  if (!normalized) return false
  textColor.value = normalized
  customColorInput.value = normalized
  rgb.r = Number.parseInt(normalized.slice(1, 3), 16)
  rgb.g = Number.parseInt(normalized.slice(3, 5), 16)
  rgb.b = Number.parseInt(normalized.slice(5, 7), 16)
  return true
}

function handleRgbChange(channel, event) {
  rgb[channel] = Number(event.detail.value)
  setTextColor(`#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`)
}

function applyCustomColor() {
  if (setTextColor(customColorInput.value)) return
  customColorInput.value = textColor.value
  uni.showToast({ title: '请输入正确的颜色值', icon: 'none' })
}

function chooseImage() {
  if (processing.value) return
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    sizeType: ['compressed'],
    success: result => {
      const path = result.tempFilePaths?.[0] || result.tempFiles?.[0]?.path || result.tempFiles?.[0]?.tempFilePath
      if (!path) {
        uni.showToast({ title: '未能读取图片', icon: 'none' })
        return
      }
      imagePath.value = path
      cachedImagePath = ''
      cachedImagePixels = null
      imageReadPath = ''
      imageReadPromise = null
      dotText.value = ''
      errorMessage.value = ''
      generate()
    },
    fail: error => {
      const message = String(error?.errMsg || '')
      if (message.includes('cancel')) return
      console.error('chooseImage failed', error)
      uni.showModal({
        title: '选择照片失败',
        content: message.replace(/^chooseImage:fail\s*/i, '') || '请检查微信的照片权限后重试。',
        showCancel: false,
        confirmText: '知道了'
      })
    }
  })
}

function setMode(value) {
  if (mode.value === value) return
  mode.value = value
  scheduleGenerate()
}

function setDensity(value) {
  if (density.value === value) return
  density.value = value
  scheduleGenerate()
}

function handleWidthChanging(event) {
  outputWidth.value = Number(event.detail.value)
}

function handleWidthChange(event) {
  outputWidth.value = Number(event.detail.value)
  scheduleGenerate(0)
}

function handleInvert(event) {
  inverted.value = Boolean(event.detail.value)
  scheduleGenerate()
}

function scheduleGenerate(delay = 160) {
  if (!imagePath.value) return
  clearTimeout(generationTimer)
  generationTimer = setTimeout(generate, delay)
}

async function generate() {
  if (!imagePath.value) return
  const currentId = ++generationId
  const currentPath = imagePath.value
  processing.value = true
  errorMessage.value = ''
  try {
    let pixels = cachedImagePath === currentPath ? cachedImagePixels : null
    if (!pixels) {
      if (!imageReadPromise || imageReadPath !== currentPath) {
        imageReadPath = currentPath
        imageReadPromise = readImagePixels(currentPath)
      }
      const currentRead = imageReadPromise
      try {
        pixels = await currentRead
      } finally {
        if (imageReadPromise === currentRead) {
          imageReadPromise = null
          imageReadPath = ''
        }
      }
      if (currentId !== generationId || currentPath !== imagePath.value) return
      cachedImagePath = currentPath
      cachedImagePixels = pixels
    }
    const result = generateDotArt(pixels, {
      mode: mode.value,
      outputWidth: effectiveOutputWidth.value,
      maxRows: density.value === 'dense' ? 32 : density.value === 'light' ? 20 : 24,
      density: density.value,
      inverted: inverted.value
    })
    if (currentId !== generationId) return
    if (isDotArtEmpty(result)) {
      dotText.value = ''
      errorMessage.value = '未识别到清晰主体，请尝试黑白反转或选择对比更明显的图片。'
      return
    }
    dotText.value = result
  } catch (error) {
    if (currentId !== generationId) return
    dotText.value = ''
    errorMessage.value = error?.message || '生成失败，请重新选择图片后再试。'
  } finally {
    if (currentId === generationId) processing.value = false
  }
}

function copyResult() {
  if (!canUseResult.value) return
  copyToClipboard(dotText.value, {
    onSuccess: () => uni.showToast({ title: '已复制', icon: 'success' }),
    onFailure: message => uni.showToast({ title: message, icon: 'none' })
  })
}

async function saveResult() {
  if (!canUseResult.value || saving.value) return
  saving.value = true
  try {
    await saveDotArtToAlbum(dotText.value, { textColor: textColor.value })
    uni.showToast({ title: '已保存到相册', icon: 'success' })
  } catch (error) {
    const message = String(error?.errMsg || error?.message || '')
    if (/cancel|未获得相册权限/i.test(message)) return
    console.error('save dot art failed', error)
    uni.showToast({ title: error?.message || '保存失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

</script>

<style lang="scss" scoped>
.dot-art-page { min-height: 100vh; color: #3f4d50; background: linear-gradient(180deg, #f7fde9 0%, #f2fbdd 58%, #eaf7d2 100%); }
.page-scroll { height: calc(100vh - 88rpx); }
.hero-section { padding: 40rpx 32rpx 30rpx; }
.eyebrow { display: block; color: #657668; font-size: 19rpx; font-weight: 600; letter-spacing: 4rpx; }
.page-title { display: block; margin-top: 12rpx; font-family: Georgia, 'Times New Roman', serif; font-size: 44rpx; font-weight: 600; }
.page-subtitle { display: block; margin-top: 12rpx; color: #59695d; font-size: 23rpx; line-height: 1.6; }
.panel { margin: 0 24rpx 22rpx; padding: 26rpx; border: 1rpx solid rgba(143, 188, 147, 0.38); border-radius: 24rpx; box-shadow: 0 8rpx 22rpx rgba(95, 133, 100, 0.05); background: rgba(238, 239, 232, 0.94); }
.upload-panel { padding: 18rpx; background: #fcebbf; }
.upload-button { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300rpx; margin: 0; border: 2rpx dashed rgba(95, 133, 100, 0.48); border-radius: 18rpx; color: #3f4d50; background: rgba(255, 255, 255, 0.4); }
.upload-button::after, .action-button::after, .retry-button::after { border: 0; }
.upload-mark { font-size: 56rpx; font-weight: 300; line-height: 1; }
.upload-title { margin-top: 18rpx; font-size: 28rpx; font-weight: 600; }
.upload-hint { margin-top: 8rpx; color: #68746a; font-size: 21rpx; }
.button-pressed { opacity: 0.82; }
.image-preview-wrap { position: relative; height: 360rpx; overflow: hidden; border-radius: 18rpx; background: rgba(255, 255, 255, 0.62); }
.image-preview { width: 100%; height: 100%; }
.replace-badge { position: absolute; right: 16rpx; bottom: 16rpx; padding: 12rpx 20rpx; border-radius: 999rpx; color: #fff; font-size: 21rpx; background: rgba(63, 77, 80, 0.78); }
.settings-panel { background: #eef0e8; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.panel-title { font-size: 28rpx; font-weight: 600; }
.width-value, .result-size, .processing-label { color: #607065; font-size: 21rpx; }
.mode-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 10rpx; margin-top: 24rpx; padding: 8rpx; border-radius: 18rpx; background: #dfe8d9; }
.mode-option { display: flex; align-items: center; justify-content: center; min-height: 82rpx; border-radius: 14rpx; color: #68746a; font-size: 24rpx; }
.mode-option--active { color: #35513a; font-weight: 600; box-shadow: 0 4rpx 12rpx rgba(95, 133, 100, 0.08); background: #fff; }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding-top: 28rpx; margin-top: 24rpx; border-top: 1rpx solid rgba(95, 133, 100, 0.15); }
.setting-row--slider { display: block; }
.setting-row--block { display: block; }
.setting-copy { flex: 1; }
.setting-label, .setting-description { display: block; }
.setting-label { font-size: 25rpx; font-weight: 600; }
.setting-description { margin-top: 8rpx; color: #68746a; font-size: 20rpx; line-height: 1.5; }
.width-slider { margin: 20rpx 0 0; }
.slider-labels { display: flex; justify-content: space-between; padding: 0 8rpx; color: #748079; font-size: 19rpx; }
.density-switch { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10rpx; margin-top: 18rpx; padding: 7rpx; border-radius: 16rpx; background: #dfe8d9; }
.density-option { display: flex; align-items: center; justify-content: center; min-height: 64rpx; border-radius: 12rpx; color: #68746a; font-size: 22rpx; }
.density-option--active { color: #35513a; font-weight: 600; background: #fff; }
.color-palette { display: flex; flex-wrap: wrap; gap: 18rpx; margin-top: 20rpx; }
.color-swatch { width: 52rpx; height: 52rpx; box-sizing: border-box; border: 5rpx solid #eef0e8; border-radius: 50%; box-shadow: 0 0 0 1rpx rgba(63,77,80,.18); }
.color-swatch--active { border-color: #fff; box-shadow: 0 0 0 4rpx #8fbc93; }
.custom-color-row { display: flex; align-items: center; gap: 14rpx; margin-top: 22rpx; }
.custom-color-preview { flex: 0 0 52rpx; width: 52rpx; height: 52rpx; box-sizing: border-box; border: 5rpx solid #fff; border-radius: 14rpx; box-shadow: 0 0 0 1rpx rgba(63,77,80,.18); }
.color-hex-input { flex: 1; height: 64rpx; box-sizing: border-box; padding: 0 18rpx; border: 1rpx solid rgba(95,133,100,.25); border-radius: 14rpx; color: #3f4d50; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 23rpx; background: rgba(255,255,255,.72); }
.color-apply-button { display: flex; align-items: center; justify-content: center; width: 112rpx; height: 64rpx; margin: 0; padding: 0; border-radius: 14rpx; color: #35513a; font-size: 21rpx; line-height: 1; background: #dcebd7; }
.color-apply-button::after { border: 0; }
.rgb-controls { margin-top: 16rpx; padding: 12rpx 16rpx; border-radius: 16rpx; background: rgba(255,255,255,.48); }
.rgb-row { display: flex; align-items: center; min-height: 58rpx; }
.rgb-label { width: 34rpx; font-size: 21rpx; font-weight: 600; }
.rgb-slider { flex: 1; margin: 0 8rpx; }
.rgb-value { width: 54rpx; color: #68746a; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 19rpx; text-align: right; }
.result-panel { background: #f9edf0; }
.result-scroll { box-sizing: border-box; width: 100%; height: 500rpx; margin-top: 22rpx; border: 1rpx solid rgba(233, 172, 187, 0.45); border-radius: 18rpx; background: #fffdf9; }
.dot-output { display: block; width: max-content; min-width: 100%; box-sizing: border-box; padding: 32rpx; color: #25362f; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 22rpx; line-height: 1.05; white-space: pre; }
.dot-output--ascii { line-height: 1.1; }
.result-state { display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; height: 320rpx; margin-top: 22rpx; padding: 30rpx; border-radius: 18rpx; color: #68746a; text-align: center; font-size: 22rpx; line-height: 1.6; background: rgba(255, 255, 255, 0.55); }
.result-state--error { color: #815b63; }
.empty-symbol { margin-bottom: 14rpx; color: #8fbc93; font-size: 52rpx; }
.loading-dot { width: 24rpx; height: 24rpx; margin-bottom: 20rpx; border-radius: 50%; background: #8fbc93; animation: pulse 900ms ease-in-out infinite alternate; }
.retry-button { min-width: 180rpx; min-height: 76rpx; margin-top: 22rpx; border-radius: 999rpx; color: #3f5943; font-size: 22rpx; background: #dcebd7; }
.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; margin-top: 22rpx; }
.action-button { display: flex; align-items: center; justify-content: center; min-height: 92rpx; margin: 0; border-radius: 18rpx; font-size: 24rpx; font-weight: 600; line-height: 1; }
.action-button--primary { color: #29412e; background: #bcd9b9; }
.action-button--download { color: #674654; background: #f1cad5; }
.action-button[disabled] { opacity: 0.42; }
.privacy-note { margin: 0 42rpx; padding: 4rpx 0 calc(52rpx + env(safe-area-inset-bottom)); color: #647269; font-size: 20rpx; line-height: 1.6; text-align: center; }
@keyframes pulse { from { opacity: 0.35; transform: scale(0.78); } to { opacity: 1; transform: scale(1); } }
</style>
