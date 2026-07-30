<template>
  <BottomSheet
    :visible="visible"
    title="添加单个素材"
    max-height="68vh"
    @update:visible="emit('update:visible', $event)"
  >
    <view class="source-tabs" role="tablist">
      <button
        class="source-tab"
        :class="{ active: activeSource === 'all' }"
        hover-class="source-tab-pressed"
        @tap="switchSource('all')"
      >全部素材</button>
      <button
        class="source-tab"
        :class="{ active: activeSource === 'favorites' }"
        hover-class="source-tab-pressed"
        @tap="switchSource('favorites')"
      >我的收藏</button>
    </view>
    <view v-if="activeSource === 'all'" class="picker-search">
      <input v-model="keyword" placeholder="搜索素材" confirm-type="search" @confirm="refresh" />
      <button @tap="refresh">搜索</button>
    </view>
    <scroll-view
      class="picker-list"
      :class="{ 'picker-list-favorites': activeSource === 'favorites' }"
      scroll-y
      @scrolltolower="loadMore"
    >
      <view class="material-grid">
        <MaterialCard
          v-for="item in materials"
          :key="item.id"
          :material="item"
          @select="selectMaterial"
        />
      </view>
      <LoadingSpinner v-if="loading" text="加载中..." />
      <EmptyState v-else-if="materials.length === 0" :text="emptyText" />
      <text v-else-if="!hasMore" class="end-text">没有更多了</text>
    </scroll-view>
  </BottomSheet>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { getMaterials } from '../../api/material'
import { getFavorites } from '../../api/favorite'
import { requireLogin } from '../../utils/auth'
import { favoriteRecordsToMaterials } from '../../utils/collage/material-picker.mjs'
import BottomSheet from '../BottomSheet.vue'
import MaterialCard from '../MaterialCard.vue'
import LoadingSpinner from '../LoadingSpinner.vue'
import EmptyState from '../EmptyState.vue'

const props = defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['update:visible', 'select'])
const PAGE_SIZE = 12
const createListState = () => ({
  items: [],
  page: 1,
  loading: false,
  hasMore: true,
  loaded: false
})

const activeSource = ref('all')
const keyword = ref('')
const states = reactive({
  all: createListState(),
  favorites: createListState()
})

const activeState = computed(() => states[activeSource.value])
const materials = computed(() => activeState.value.items)
const loading = computed(() => activeState.value.loading)
const hasMore = computed(() => activeState.value.hasMore)
const emptyText = computed(() => (
  activeSource.value === 'favorites' ? '还没有收藏单个素材' : '暂无单个素材'
))

const resetState = state => {
  state.items = []
  state.page = 1
  state.hasMore = true
  state.loaded = false
}

const resolveHasMore = (result, currentPage, receivedCount) => {
  const totalPages = Number(result.totalPages)
  if (Number.isFinite(totalPages) && totalPages > 0) return currentPage < totalPages
  const total = Number(result.total)
  if (Number.isFinite(total) && total >= 0) return currentPage * PAGE_SIZE < total
  return receivedCount === PAGE_SIZE
}

const loadAllMaterials = async state => {
  const currentPage = state.page
  const normalizedKeyword = keyword.value.trim()
  const params = {
    materialType: 'single',
    page: currentPage,
    limit: PAGE_SIZE
  }
  if (normalizedKeyword) params.keyword = normalizedKeyword
  const result = await getMaterials(params)
  const list = result.list || []
  state.items.push(...list)
  state.hasMore = resolveHasMore(result, currentPage, list.length)
  state.page = currentPage + 1
}

const loadFavoriteMaterials = async state => {
  let added = []
  do {
    const currentPage = state.page
    const result = await getFavorites({ page: currentPage, limit: PAGE_SIZE })
    const records = result.list || []
    added = favoriteRecordsToMaterials(records)
    state.items.push(...added)
    state.hasMore = resolveHasMore(result, currentPage, records.length)
    state.page = currentPage + 1
  } while (added.length === 0 && state.hasMore)
}

const load = async (source, reset = false) => {
  const state = states[source]
  if (state.loading || (!reset && !state.hasMore)) return
  if (reset) resetState(state)
  state.loading = true
  try {
    if (source === 'favorites') await loadFavoriteMaterials(state)
    else await loadAllMaterials(state)
    state.loaded = true
  } catch (error) {
    uni.showToast({ title: error.message || '素材加载失败', icon: 'none' })
  } finally {
    state.loading = false
  }
}

const refresh = () => load(activeSource.value, true)
const loadMore = () => load(activeSource.value)

const switchSource = source => {
  if (source === activeSource.value) return
  if (source === 'favorites' && !requireLogin(() => switchSource('favorites'))) return
  activeSource.value = source
  if (!states[source].loaded) load(source, true)
}

const selectMaterial = material => {
  emit('select', material)
  emit('update:visible', false)
}

watch(() => props.visible, value => {
  if (value && !activeState.value.loaded) refresh()
})
</script>

<style scoped lang="scss">
.source-tabs { display: flex; gap: 12rpx; padding: 6rpx; margin-bottom: 16rpx; border-radius: 48rpx; background: #f3f3f3; }
.source-tab { flex: 1; height: 88rpx; line-height: 88rpx; margin: 0; padding: 0; border-radius: 44rpx; background: transparent; color: #777; font-size: 26rpx; font-weight: 500; transition: background-color 180ms ease, color 180ms ease; }
.source-tab::after { border: none; }
.source-tab.active { background: #111; color: #fff; }
.source-tab-pressed { opacity: 0.72; }
.picker-search { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.picker-search input { flex: 1; height: 68rpx; padding: 0 24rpx; border-radius: 34rpx; background: #f5f5f5; }
.picker-search button { width: 120rpx; height: 68rpx; line-height: 68rpx; margin: 0; border-radius: 34rpx; background: #111; color: #fff; font-size: 24rpx; }
.picker-search button::after { border: none; }
.picker-list { height: calc(68vh - 290rpx); }
.picker-list-favorites { height: calc(68vh - 202rpx); }
.material-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.end-text { display: block; padding: 30rpx; text-align: center; color: #aaa; font-size: 24rpx; }
</style>
