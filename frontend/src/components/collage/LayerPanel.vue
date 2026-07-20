<template>
  <BottomSheet :visible="visible" title="图层管理" @update:visible="emit('update:visible', $event)">
    <scroll-view class="layer-list" scroll-y>
      <view
        v-for="(layer, index) in reversedLayers"
        :key="layer.id"
        class="layer-item"
        :class="{ active: layer.id === selectedLayerId }"
        @tap="emit('select', layer.id)"
      >
        <image :src="layer.localImagePath" mode="aspectFit" />
        <view class="layer-info">
          <text class="layer-title">{{ layer.title }}</text>
          <text class="layer-index">图层 {{ layers.length - index }}（越上越靠前）</text>
        </view>
      </view>
      <EmptyState v-if="layers.length === 0" text="暂无图层" />
    </scroll-view>
    <template #footer>
      <view class="layer-actions">
        <button :disabled="!selectedLayerId" @tap="emit('move', 'back')">置底</button>
        <button :disabled="!selectedLayerId" @tap="emit('move', 'down')">下移</button>
        <button :disabled="!selectedLayerId" @tap="emit('move', 'up')">上移</button>
        <button :disabled="!selectedLayerId" @tap="emit('move', 'front')">置顶</button>
      </view>
    </template>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import BottomSheet from '../BottomSheet.vue'
import EmptyState from '../EmptyState.vue'

const props = defineProps({
  visible: Boolean,
  layers: { type: Array, default: () => [] },
  selectedLayerId: { type: String, default: null }
})
const emit = defineEmits(['update:visible', 'select', 'move'])
const reversedLayers = computed(() => [...props.layers].reverse())
</script>

<style scoped lang="scss">
.layer-list { max-height: 52vh; }
.layer-item { display: flex; align-items: center; gap: 18rpx; padding: 14rpx; margin-bottom: 12rpx; border: 2rpx solid transparent; border-radius: 16rpx; background: #f7f7f7; }
.layer-item.active { border-color: #111; background: #fff; }
.layer-item image { width: 92rpx; height: 92rpx; border-radius: 10rpx; background: #fff; }
.layer-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.layer-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 27rpx; }
.layer-index { color: #999; font-size: 21rpx; }
.layer-actions { display: flex; gap: 10rpx; }
.layer-actions button { flex: 1; margin: 0; padding: 0; height: 70rpx; line-height: 70rpx; border-radius: 14rpx; background: #f2f2f2; font-size: 23rpx; }
.layer-actions button::after { border: none; }
</style>
