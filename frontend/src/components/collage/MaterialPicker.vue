<template>
  <BottomSheet :visible="visible" title="添加单个素材" @update:visible="emit('update:visible', $event)">
    <view class="picker-search">
      <input v-model="keyword" placeholder="搜索素材" confirm-type="search" @confirm="refresh" />
      <button @tap="refresh">搜索</button>
    </view>
    <scroll-view class="picker-list" scroll-y @scrolltolower="loadMore">
      <view class="material-grid">
        <MaterialCard
          v-for="item in materials"
          :key="item.id"
          :material="item"
          @select="selectMaterial"
        />
      </view>
      <LoadingSpinner v-if="loading" text="加载中..." />
      <EmptyState v-else-if="materials.length === 0" text="暂无单个素材" />
      <text v-else-if="!hasMore" class="end-text">没有更多了</text>
    </scroll-view>
  </BottomSheet>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getMaterials } from '../../api/material'
import BottomSheet from '../BottomSheet.vue'
import MaterialCard from '../MaterialCard.vue'
import LoadingSpinner from '../LoadingSpinner.vue'
import EmptyState from '../EmptyState.vue'

const props = defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['update:visible', 'select'])
const materials = ref([])
const keyword = ref('')
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)

const load = async reset => {
  if (loading.value || (!reset && !hasMore.value)) return
  if (reset) {
    page.value = 1
    materials.value = []
    hasMore.value = true
  }
  loading.value = true
  try {
    const result = await getMaterials({
      materialType: 'single',
      keyword: keyword.value.trim() || undefined,
      page: page.value,
      limit: 12
    })
    const list = result.list || []
    materials.value.push(...list)
    hasMore.value = list.length === 12
    if (hasMore.value) page.value += 1
  } catch (error) {
    uni.showToast({ title: error.message || '素材加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const refresh = () => load(true)
const loadMore = () => load(false)
const selectMaterial = material => {
  emit('select', material)
  emit('update:visible', false)
}

watch(() => props.visible, value => {
  if (value && materials.value.length === 0) refresh()
})
</script>

<style scoped lang="scss">
.picker-search { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.picker-search input { flex: 1; height: 68rpx; padding: 0 24rpx; border-radius: 34rpx; background: #f5f5f5; }
.picker-search button { width: 120rpx; height: 68rpx; line-height: 68rpx; margin: 0; border-radius: 34rpx; background: #111; color: #fff; font-size: 24rpx; }
.picker-search button::after { border: none; }
.picker-list { height: 58vh; }
.material-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.end-text { display: block; padding: 30rpx; text-align: center; color: #aaa; font-size: 24rpx; }
</style>
