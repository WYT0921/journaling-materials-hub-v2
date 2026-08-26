<template>
  <view class="decor-page">
    <GlassNavBar title="Text Decoration ♡" :show-back="true" />

    <scroll-view class="decor-scroll" scroll-y>
      <view class="hero">
        <text class="eyebrow">UNICODE DECOR STUDIO</text>
        <text class="title">文字装饰生成器</text>
        <text class="subtitle">为每一句话加一点可爱、浪漫与闪闪发光</text>
      </view>

      <view class="paper-card input-card">
        <view class="card-heading">
          <text class="card-label">输入文字</text>
          <text class="count">{{ sourceCount }}/200</text>
        </view>
        <textarea
          v-model="sourceText"
          class="decor-input"
          maxlength="200"
          :auto-height="true"
          :show-confirm-bar="false"
          placeholder="Enter something ♡"
        />
        <view class="input-footer">
          <text>支持中文、英文、数字、Emoji 和特殊符号</text>
          <text v-if="sourceText" class="clear" @tap="sourceText = ''">清空</text>
        </view>
      </view>

      <view class="action-row">
        <button class="action-button random-button" :disabled="loading || !templates.length" @tap="randomDecor">
          <text class="button-symbol">✦</text>
          <text>Random Decor ♡</text>
        </button>
        <button class="action-button choose-button" :disabled="loading" @tap="pickerOpen = true">
          <text class="button-symbol">୨୧</text>
          <text>Choose Decor</text>
        </button>
      </view>

      <view class="preview-heading">
        <view>
          <text class="preview-label">Preview ♡</text>
          <text class="preview-name">{{ selectedTemplate?.name || '等待选择模板' }}</text>
        </view>
        <text v-if="selectedTemplate" class="type-badge">{{ selectedTemplate.type }}</text>
      </view>

      <view v-if="loading" class="paper-card state-card">
        <text class="state-symbol">⋆｡°</text>
        <text>正在取来装饰模板…</text>
      </view>
      <view v-else-if="loadError" class="paper-card state-card">
        <text class="state-symbol">!</text>
        <text>模板加载失败，请检查网络</text>
        <button class="retry" @tap="loadTemplates">重新加载</button>
      </view>
      <view v-else class="paper-card preview-card">
        <text class="preview-text" selectable>{{ previewText || 'Enter something ♡' }}</text>
        <button class="copy-button" :disabled="!previewText" @tap="copyPreview">
          COPY
        </button>
      </view>

      <view class="category-summary">
        <text>10 CATEGORIES</text><text>·</text><text>{{ templates.length }} DECORS</text>
      </view>
    </scroll-view>

    <view v-if="pickerOpen" class="picker-mask" @tap="pickerOpen = false">
      <view class="picker-sheet" @tap.stop>
        <view class="picker-handle" />
        <view class="picker-header">
          <view>
            <text class="picker-title">Choose Decor ✧</text>
            <text class="picker-subtitle">选择一个真实效果预览</text>
          </view>
          <text class="picker-close" @tap="pickerOpen = false">×</text>
        </view>

        <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
          <view class="category-row">
            <view
              v-for="category in categories"
              :key="category.value"
              class="category-chip"
              :class="{ active: activeCategory === category.value }"
              @tap="activeCategory = category.value"
            >
              <text>{{ category.icon }} {{ category.label }}</text>
            </view>
          </view>
        </scroll-view>

        <scroll-view class="template-scroll" scroll-y>
          <view
            v-for="item in filteredTemplates"
            :key="item.id"
            class="template-item"
            :class="{ selected: selectedTemplate?.id === item.id }"
            @tap="selectTemplate(item)"
          >
            <text class="template-preview">{{ renderDecoration(item, sourceText || item.previewText || 'hello') }}</text>
            <view class="template-meta">
              <text>{{ item.name }}</text>
              <text>{{ item.unicodeLevel }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <CustomToast ref="toastRef" />
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import GlassNavBar from '../../components/GlassNavBar.vue'
import CustomToast from '../../components/CustomToast.vue'
import { getTextDecorationTemplates } from '../../api/text-decoration'
import { chooseRandomTemplate, renderDecoration } from '../../utils/text-decoration.mjs'
import { copyToClipboard } from '../../utils/clipboard'
import { hidePageShareMenu } from '../../utils/tool-share'

const categories = [
  { label: 'All', value: 'all', icon: '✧' },
  { label: 'Heart', value: 'heart', icon: '♡' },
  { label: 'Star', value: 'star', icon: '☆' },
  { label: 'Flower', value: 'flower', icon: '✿' },
  { label: 'Plant', value: 'plant', icon: '🌿' },
  { label: 'Ribbon', value: 'ribbon', icon: '୨୧' },
  { label: 'Dreamy', value: 'dreamy', icon: '☁' },
  { label: 'Y2K', value: 'y2k', icon: '💿' },
  { label: 'Minimal', value: 'minimal', icon: '─' },
  { label: 'Frame', value: 'frame', icon: '▣' },
  { label: 'Divider', value: 'divider', icon: '⋆' }
]

const sourceText = ref('hello')
const templates = ref([])
const selectedTemplate = ref(null)
const activeCategory = ref('all')
const pickerOpen = ref(false)
const loading = ref(true)
const loadError = ref(false)
const toastRef = ref(null)

const previewText = computed(() => renderDecoration(selectedTemplate.value, sourceText.value))
const sourceCount = computed(() => Array.from(sourceText.value).length)
const filteredTemplates = computed(() => activeCategory.value === 'all'
  ? templates.value
  : templates.value.filter(item => item.category === activeCategory.value))

onMounted(() => {
  hidePageShareMenu()
  loadTemplates()
})

async function loadTemplates() {
  loading.value = true
  loadError.value = false
  try {
    templates.value = await getTextDecorationTemplates()
    selectedTemplate.value = templates.value[0] || null
  } catch (error) {
    console.error('文字装饰模板加载失败:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function randomDecor() {
  const pool = activeCategory.value === 'all' ? templates.value : filteredTemplates.value
  const next = chooseRandomTemplate(pool, selectedTemplate.value?.id)
  if (next) selectedTemplate.value = next
}

function selectTemplate(item) {
  selectedTemplate.value = item
  pickerOpen.value = false
}

function copyPreview() {
  copyToClipboard(previewText.value, {
    onSuccess: () => toastRef.value?.showToast('装饰文字已复制', 'check'),
    onFailure: (message, error) => {
      console.error('文字装饰复制失败:', error)
      toastRef.value?.showToast(message, 'error')
    }
  })
}
</script>

<style lang="scss" scoped>
.decor-page { display: flex; flex-direction: column; height: 100vh; color: #3f4541; background: linear-gradient(180deg, #fff8ed 0%, #f9f1f8 48%, #eef7df 100%); }
.decor-scroll { flex: 1; height: 0; }
.hero { padding: 44rpx 32rpx 28rpx; }
.eyebrow { display: block; color: #88748b; font-size: 18rpx; font-weight: 600; letter-spacing: 5rpx; }
.title { display: block; margin-top: 14rpx; font-family: Georgia, serif; font-size: 52rpx; line-height: 1.2; }
.subtitle { display: block; margin-top: 12rpx; color: #6d666c; font-size: 23rpx; line-height: 1.5; }
.paper-card { margin: 0 24rpx; border: 1rpx solid rgba(201, 178, 151, .55); border-radius: 24rpx; background: rgba(255, 255, 255, .78); box-shadow: 0 12rpx 30rpx rgba(103, 81, 105, .06); }
.input-card { padding: 26rpx 28rpx 22rpx; }
.card-heading, .input-footer, .preview-heading, .picker-header, .template-meta { display: flex; align-items: center; justify-content: space-between; }
.card-label { font-size: 23rpx; font-weight: 600; letter-spacing: 2rpx; }
.count, .input-footer { color: #77706f; font-size: 19rpx; }
.decor-input { box-sizing: border-box; width: 100%; min-height: 116rpx; max-height: 260rpx; margin-top: 18rpx; color: #463f46; font-family: Georgia, serif; font-size: 36rpx; line-height: 1.55; }
.input-footer { padding-top: 16rpx; border-top: 1rpx solid #e8ded6; }
.clear { padding-left: 24rpx; color: #7d627f; text-decoration: underline; }
.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; margin: 22rpx 24rpx 0; }
.action-button { display: flex; align-items: center; justify-content: center; gap: 10rpx; height: 92rpx; margin: 0; border-radius: 22rpx; font-size: 22rpx; font-weight: 600; line-height: 1; }
.action-button::after, .copy-button::after, .retry::after { border: 0; }
.random-button { color: #573f59; background: #f4dce8; }
.choose-button { color: #405a47; background: #e1efdc; }
.button-symbol { font-size: 30rpx; }
.preview-heading { padding: 38rpx 28rpx 17rpx; }
.preview-label { display: block; font-family: Georgia, serif; font-size: 31rpx; }
.preview-name { display: block; margin-top: 5rpx; color: #77706f; font-size: 19rpx; }
.type-badge { padding: 9rpx 15rpx; border-radius: 999rpx; color: #806b82; font-size: 16rpx; letter-spacing: 2rpx; background: #f1e4f1; }
.preview-card { min-height: 250rpx; padding: 38rpx 28rpx 24rpx; }
.preview-text { display: flex; align-items: center; justify-content: center; min-height: 130rpx; overflow-wrap: anywhere; color: #423941; font-size: 34rpx; line-height: 1.65; text-align: center; white-space: pre-wrap; }
.copy-button { height: 76rpx; margin: 24rpx 0 0; border-radius: 999rpx; color: #fff; font-size: 20rpx; font-weight: 700; letter-spacing: 5rpx; background: #778f73; }
.copy-button[disabled] { color: #918c88; background: #e5e1dc; }
.state-card { display: flex; flex-direction: column; align-items: center; padding: 74rpx 24rpx; color: #746d70; font-size: 22rpx; }
.state-symbol { margin-bottom: 15rpx; font-size: 42rpx; }
.retry { margin-top: 22rpx; color: #526a50; font-size: 21rpx; background: #e1efdc; }
.category-summary { display: flex; justify-content: center; gap: 16rpx; padding: 40rpx 24rpx 70rpx; color: #917f8c; font-size: 16rpx; letter-spacing: 3rpx; }
.picker-mask { position: fixed; z-index: 100; inset: 0; display: flex; align-items: flex-end; background: rgba(48, 40, 47, .38); }
.picker-sheet { display: flex; flex-direction: column; width: 100%; height: 78vh; overflow: hidden; border-radius: 34rpx 34rpx 0 0; background: #fffaf3; }
.picker-handle { flex-shrink: 0; width: 76rpx; height: 8rpx; margin: 16rpx auto 8rpx; border-radius: 999rpx; background: #d6cac7; }
.picker-header { flex-shrink: 0; padding: 20rpx 28rpx 18rpx; }
.picker-title { display: block; font-family: Georgia, serif; font-size: 36rpx; }
.picker-subtitle { display: block; margin-top: 5rpx; color: #817878; font-size: 19rpx; }
.picker-close { padding: 10rpx; color: #756d70; font-size: 48rpx; font-weight: 300; }
.category-scroll { flex-shrink: 0; width: 100%; white-space: nowrap; }
.category-row { display: inline-flex; gap: 12rpx; padding: 0 24rpx 18rpx; }
.category-chip { padding: 14rpx 20rpx; border: 1rpx solid #dfd4ca; border-radius: 999rpx; color: #70686b; font-size: 20rpx; background: #fff; }
.category-chip.active { border-color: #d6aebf; color: #6f5364; background: #f7e4ec; }
.template-scroll { flex: 1; height: 0; padding: 0 24rpx; box-sizing: border-box; }
.template-item { margin-bottom: 15rpx; padding: 24rpx; border: 1rpx solid #e3d9cf; border-radius: 20rpx; background: rgba(255,255,255,.88); }
.template-item.selected { border-color: #bb91a7; box-shadow: inset 0 0 0 2rpx rgba(187,145,167,.18); background: #fff1f6; }
.template-preview { display: block; overflow-wrap: anywhere; font-size: 29rpx; line-height: 1.55; text-align: center; white-space: pre-wrap; }
.template-meta { margin-top: 18rpx; padding-top: 13rpx; border-top: 1rpx solid #eee5dd; color: #867d7b; font-size: 16rpx; letter-spacing: 1rpx; }
</style>
