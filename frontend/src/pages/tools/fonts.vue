<template>
  <view class="font-page">
    <GlassNavBar title="特殊字体" :show-back="true" />

    <scroll-view class="font-scroll" scroll-y>
      <view class="hero-section">
        <text class="eyebrow">SPECIAL TYPE STUDIO</text>
        <text class="page-title">特殊字体生成器</text>
        <text class="page-subtitle">输入文字，即时生成可复制的 Unicode 字体</text>
      </view>

      <view class="input-card">
        <view class="input-heading">
          <text class="input-label">输入文字</text>
          <text class="input-count">{{ sourceText.length }}/200</text>
        </view>
        <textarea
          v-model="sourceText"
          class="font-input"
          :maxlength="200"
          :auto-height="true"
          :show-confirm-bar="false"
          placeholder="输入英文、数字、符号或 emoji"
          placeholder-class="font-input-placeholder"
        />
        <view class="input-footer">
          <text class="input-tip">中文和未支持字符将保持原样</text>
          <view v-if="sourceText" class="clear-button" @tap="clearInput">
            <text class="clear-text">清空</text>
          </view>
        </view>
      </view>

      <view class="results-heading">
        <view>
          <text class="results-title">生成结果</text>
          <text class="results-subtitle">点击任意卡片即可复制</text>
        </view>
        <text class="results-count">{{ results.length }}</text>
      </view>

      <view v-if="results.length" class="results-list">
        <view
          v-for="(item, index) in results"
          :key="item.id"
          class="font-result-card"
          hover-class="font-result-card--active"
          hover-stay-time="80"
          @tap="copyResult(item.text)"
        >
          <view class="result-meta">
            <text class="result-number">{{ String(index + 1).padStart(2, '0') }}</text>
            <text class="result-name">{{ item.name }}</text>
          </view>
          <text class="result-preview" selectable>{{ item.text }}</text>
          <view class="copy-row">
            <view class="copy-line" />
            <text class="copy-label">COPY</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-symbol">Aa</text>
        <text class="empty-title">输入文字开始生成</text>
        <text class="empty-desc">支持英文、数字、标点和 emoji</text>
      </view>

      <view class="page-footnote">
        <text>UNICODE STYLES · NO FONT INSTALLATION</text>
      </view>
    </scroll-view>

    <CustomToast ref="toastRef" />
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GlassNavBar from '../../components/GlassNavBar.vue'
import CustomToast from '../../components/CustomToast.vue'
import fontStyles from '../../utils/fonts/fonts.json'
import { generateFontResults } from '../../utils/fonts/font-generator.mjs'

const sourceText = ref('fancy text')
const convertedText = ref(sourceText.value)
const toastRef = ref(null)
let debounceTimer = null

const results = computed(() => generateFontResults(convertedText.value, fontStyles))

watch(sourceText, value => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    convertedText.value = value
  }, 300)
})

onMounted(() => {
  if (typeof uni.hideShareMenu === 'function') {
    uni.hideShareMenu()
  }
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
})

function clearInput() {
  sourceText.value = ''
}

function copyResult(text) {
  uni.setClipboardData({
    data: text,
    success: () => toastRef.value?.showToast('复制成功', 'check'),
    fail: () => toastRef.value?.showToast('复制失败，请重试', 'error')
  })
}
</script>

<style lang="scss" scoped>
.font-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #171512;
  background: #f4efe6;
}

.font-scroll {
  flex: 1;
  height: 0;
}

.hero-section {
  padding: 44rpx 32rpx 28rpx;
}

.eyebrow {
  display: block;
  color: #8f887c;
  font-size: 19rpx;
  font-weight: 600;
  letter-spacing: 5rpx;
}

.page-title {
  display: block;
  margin-top: 14rpx;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 52rpx;
  font-weight: 500;
  line-height: 1.2;
}

.page-subtitle {
  display: block;
  margin-top: 12rpx;
  color: #706b63;
  font-size: 24rpx;
  line-height: 1.5;
}

.input-card {
  margin: 0 24rpx;
  padding: 28rpx;
  border: 1rpx solid #d8d1c5;
  background: rgba(255, 253, 249, 0.92);
}

.input-heading,
.input-footer,
.results-heading,
.result-meta,
.copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-label {
  font-size: 22rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.input-count {
  color: #999185;
  font-size: 20rpx;
}

.font-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 104rpx;
  max-height: 260rpx;
  margin-top: 20rpx;
  color: #171512;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 36rpx;
  line-height: 1.5;
}

:deep(.font-input-placeholder) {
  color: #b8b1a6;
  font-size: 28rpx;
}

.input-footer {
  min-height: 48rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #ece6dc;
}

.input-tip {
  color: #9a9388;
  font-size: 20rpx;
}

.clear-button {
  padding: 8rpx 0 8rpx 24rpx;
}

.clear-text {
  color: #4f4a43;
  font-size: 22rpx;
  text-decoration: underline;
}

.results-heading {
  padding: 42rpx 28rpx 18rpx;
}

.results-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}

.results-subtitle {
  display: block;
  margin-top: 6rpx;
  color: #8d867c;
  font-size: 21rpx;
}

.results-count {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 48rpx;
  font-style: italic;
}

.results-list {
  padding: 0 24rpx;
}

.font-result-card {
  margin-bottom: 18rpx;
  padding: 24rpx 26rpx 20rpx;
  overflow: hidden;
  border: 1rpx solid #d8d1c5;
  background: rgba(255, 253, 249, 0.92);
  transition: background-color 120ms ease, transform 120ms ease;
}

.font-result-card--active {
  background: #ebe3d7;
  transform: scale(0.992);
}

.result-number,
.result-name {
  color: #8f887e;
  font-size: 18rpx;
  letter-spacing: 2rpx;
}

.result-name {
  max-width: 72%;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-preview {
  display: block;
  margin: 30rpx 0 28rpx;
  overflow-wrap: anywhere;
  color: #111;
  font-size: 36rpx;
  line-height: 1.55;
}

.copy-line {
  flex: 1;
  height: 1rpx;
  margin-right: 22rpx;
  background: #ded7cc;
}

.copy-label {
  color: #292621;
  font-size: 19rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 24rpx;
  padding: 90rpx 24rpx;
  border: 1rpx solid #d8d1c5;
  background: rgba(255, 253, 249, 0.72);
}

.empty-symbol {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 68rpx;
  font-style: italic;
}

.empty-title {
  margin-top: 22rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.empty-desc {
  margin-top: 8rpx;
  color: #918a80;
  font-size: 22rpx;
}

.page-footnote {
  padding: 44rpx 24rpx 72rpx;
  color: #aaa297;
  font-size: 17rpx;
  letter-spacing: 3rpx;
  text-align: center;
}
</style>
