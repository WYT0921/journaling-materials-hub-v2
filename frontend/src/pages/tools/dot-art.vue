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
          <text class="width-value">{{ outputWidth }} 字符宽</text>
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

        <view class="setting-row setting-row--slider">
          <view class="setting-copy">
            <text class="setting-label">精细度</text>
            <text class="setting-description">越高越接近原图，也会产生更多字符</text>
          </view>
          <slider
            class="width-slider"
            :value="outputWidth"
            :min="24"
            :max="96"
            :step="4"
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
          <text class="dot-output" :class="{ 'dot-output--ascii': mode === 'ascii' }" user-select>{{ dotText }}</text>
        </scroll-view>
        <view v-else class="result-state">
          <text class="empty-symbol">⠿</text>
          <text>选择图片后，这里会显示点阵结果</text>
        </view>

        <view class="action-row">
          <button class="action-button action-button--primary" :disabled="!canUseResult" @tap="copyResult">复制文字</button>
        </view>
      </view>

      <view class="privacy-note">
        <text>本工具不会保存图片或生成记录，退出页面后内容自动清除。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import GlassNavBar from '../../components/GlassNavBar.vue'
import { convertImageToDotArt } from '../../utils/dot-art/image-processor.js'
import { isDotArtEmpty } from '../../utils/dot-art/dot-art.mjs'
import { hidePageShareMenu } from '../../utils/tool-share'

const modes = [
  { label: 'Braille 点阵', value: 'braille' },
  { label: 'ASCII 字符', value: 'ascii' }
]

const imagePath = ref('')
const mode = ref('braille')
const outputWidth = ref(48)
const inverted = ref(false)
const dotText = ref('')
const processing = ref(false)
const errorMessage = ref('')
let generationId = 0
let generationTimer

onMounted(hidePageShareMenu)

const canUseResult = computed(() => Boolean(dotText.value) && !processing.value && !isDotArtEmpty(dotText.value))
const resultMeta = computed(() => {
  const lines = dotText.value.split('\n')
  const columns = Math.max(0, ...lines.map(line => [...line].length))
  return `${columns} × ${lines.length}`
})

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
  processing.value = true
  errorMessage.value = ''
  try {
    const result = await convertImageToDotArt(imagePath.value, {
      mode: mode.value,
      outputWidth: outputWidth.value,
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
  uni.setClipboardData({
    data: dotText.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败，请重试', icon: 'none' })
  })
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
.setting-copy { flex: 1; }
.setting-label, .setting-description { display: block; }
.setting-label { font-size: 25rpx; font-weight: 600; }
.setting-description { margin-top: 8rpx; color: #68746a; font-size: 20rpx; line-height: 1.5; }
.width-slider { margin: 20rpx 0 0; }
.slider-labels { display: flex; justify-content: space-between; padding: 0 8rpx; color: #748079; font-size: 19rpx; }
.result-panel { background: #f9edf0; }
.result-scroll { box-sizing: border-box; width: 100%; height: 500rpx; margin-top: 22rpx; border: 1rpx solid rgba(233, 172, 187, 0.45); border-radius: 18rpx; background: #fffdf9; }
.dot-output { display: block; width: max-content; min-width: 100%; box-sizing: border-box; padding: 24rpx; color: #25362f; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 22rpx; line-height: 1.05; white-space: pre; }
.dot-output--ascii { line-height: 1.1; }
.result-state { display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; height: 320rpx; margin-top: 22rpx; padding: 30rpx; border-radius: 18rpx; color: #68746a; text-align: center; font-size: 22rpx; line-height: 1.6; background: rgba(255, 255, 255, 0.55); }
.result-state--error { color: #815b63; }
.empty-symbol { margin-bottom: 14rpx; color: #8fbc93; font-size: 52rpx; }
.loading-dot { width: 24rpx; height: 24rpx; margin-bottom: 20rpx; border-radius: 50%; background: #8fbc93; animation: pulse 900ms ease-in-out infinite alternate; }
.retry-button { min-width: 180rpx; min-height: 76rpx; margin-top: 22rpx; border-radius: 999rpx; color: #3f5943; font-size: 22rpx; background: #dcebd7; }
.action-row { display: grid; grid-template-columns: 1fr; margin-top: 22rpx; }
.action-button { display: flex; align-items: center; justify-content: center; min-height: 92rpx; margin: 0; border-radius: 18rpx; font-size: 24rpx; font-weight: 600; line-height: 1; }
.action-button--primary { color: #29412e; background: #bcd9b9; }
.action-button[disabled] { opacity: 0.42; }
.privacy-note { margin: 0 42rpx; padding: 4rpx 0 calc(52rpx + env(safe-area-inset-bottom)); color: #647269; font-size: 20rpx; line-height: 1.6; text-align: center; }
@keyframes pulse { from { opacity: 0.35; transform: scale(0.78); } to { opacity: 1; transform: scale(1); } }
</style>
