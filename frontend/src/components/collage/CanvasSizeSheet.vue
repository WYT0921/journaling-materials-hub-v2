<template>
  <BottomSheet :visible="visible" title="选择画布" :mask-closable="false">
    <view class="size-section">
      <text class="section-label">纸张尺寸</text>
      <view class="option-row">
        <button
          v-for="item in paperOptions"
          :key="item.value"
          class="option-button"
          :class="{ active: paperSize === item.value }"
          @tap="paperSize = item.value"
        >{{ item.label }}</button>
      </view>
    </view>
    <view class="size-section">
      <text class="section-label">画布方向</text>
      <view class="option-row">
        <button
          v-for="item in orientationOptions"
          :key="item.value"
          class="option-button"
          :class="{ active: orientation === item.value }"
          @tap="orientation = item.value"
        >{{ item.label }}</button>
      </view>
    </view>
    <view class="preview-wrap">
      <view class="paper-preview" :class="orientation" />
    </view>
    <template #footer>
      <button class="confirm-button" @tap="confirm">创建画布</button>
    </template>
  </BottomSheet>
</template>

<script setup>
import { ref } from 'vue'
import BottomSheet from '../BottomSheet.vue'

defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['confirm'])
const paperSize = ref('A6')
const orientation = ref('portrait')
const paperOptions = [{ label: 'A6', value: 'A6' }, { label: 'A4', value: 'A4' }]
const orientationOptions = [
  { label: '竖版', value: 'portrait' },
  { label: '横版', value: 'landscape' }
]

const confirm = () => emit('confirm', {
  paperSize: paperSize.value,
  orientation: orientation.value
})
</script>

<style scoped lang="scss">
.size-section { margin-bottom: 28rpx; }
.section-label { display: block; margin-bottom: 14rpx; color: #666; font-size: 26rpx; }
.option-row { display: flex; gap: 16rpx; }
.option-button { flex: 1; margin: 0; border: 1rpx solid #eee; border-radius: 18rpx; background: #f7f7f7; color: #555; font-size: 28rpx; }
.option-button::after { border: none; }
.option-button.active { background: #111; color: #fff; border-color: #111; }
.preview-wrap { height: 220rpx; display: flex; align-items: center; justify-content: center; }
.paper-preview { background: #fff; border: 2rpx solid #ddd; box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, .08); }
.paper-preview.portrait { width: 112rpx; height: 158rpx; }
.paper-preview.landscape { width: 158rpx; height: 112rpx; }
.confirm-button { margin: 0; border-radius: 100rpx; background: #111; color: #fff; }
.confirm-button::after { border: none; }
</style>
