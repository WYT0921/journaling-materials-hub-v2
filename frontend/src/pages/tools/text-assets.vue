<template>
  <view class="asset-page">
    <GlassNavBar title="颜文字与 Emoji" :show-back="true" />

    <view class="type-tabs">
      <view
        v-for="tab in typeTabs"
        :key="tab.value"
        class="type-tab"
        :class="{ active: activeType === tab.value }"
        @tap="switchType(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <view class="search-wrap">
      <text class="search-icon">⌕</text>
      <input
        v-model="searchInput"
        class="search-input"
        placeholder="搜索表情、分类或标签"
        confirm-type="search"
        @confirm="applySearch"
      />
      <text v-if="searchInput" class="search-clear" @tap="clearSearch">×</text>
    </view>

    <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
      <view class="category-row">
        <view
          v-for="category in categoryOptions"
          :key="category.name"
          class="category-chip"
          :class="{ active: activeCategory === category.name }"
          @tap="switchCategory(category.name)"
        >
          <text>{{ category.name }}</text>
          <text v-if="category.count !== undefined" class="category-count">{{ category.count }}</text>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="asset-scroll" scroll-y @scrolltolower="loadMore">
      <view v-if="initialLoading" class="skeleton-list" :class="{ grid: activeType === 'emoji' }">
        <view v-for="index in 6" :key="index" class="skeleton-card" />
      </view>

      <view v-else-if="loadError && !items.length" class="state-card">
        <text class="state-symbol">!</text>
        <text class="state-title">加载失败</text>
        <text class="state-desc">请检查网络后重试</text>
        <button class="retry-button" @tap="reload">重新加载</button>
      </view>

      <view v-else-if="!items.length" class="state-card">
        <text class="state-symbol">☺</text>
        <text class="state-title">没有找到相关内容</text>
        <text class="state-desc">换个关键词或分类试试</text>
      </view>

      <view v-else class="asset-list" :class="{ grid: activeType === 'emoji' }">
        <view
          v-for="item in items"
          :key="item.id"
          class="asset-card"
          hover-class="asset-card--active"
          hover-stay-time="80"
          @tap="copyAsset(item.content)"
        >
          <text class="asset-content" selectable>{{ item.content }}</text>
          <view class="asset-meta">
            <text class="asset-category">{{ item.category }}</text>
            <text class="copy-label">COPY</text>
          </view>
        </view>
      </view>

      <view v-if="items.length" class="list-footer">
        <text v-if="loadingMore">正在加载…</text>
        <text v-else-if="loadError" class="footer-retry" @tap="loadMore">加载失败，点击重试</text>
        <text v-else-if="!hasMore">已经到底啦</text>
        <text v-else>继续上滑加载</text>
      </view>
    </scroll-view>

    <CustomToast ref="toastRef" />
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GlassNavBar from '../../components/GlassNavBar.vue'
import CustomToast from '../../components/CustomToast.vue'
import { getTextAssetCategories, getTextAssets } from '../../api/text-assets'
import { hidePageShareMenu } from '../../utils/tool-share'
import { copyToClipboard } from '../../utils/clipboard'

const PAGE_SIZE = 30
const typeTabs = [
  { label: '颜文字', value: 'kaomoji' },
  { label: 'Emoji', value: 'emoji' }
]

const activeType = ref('kaomoji')
const activeCategory = ref('全部')
const categories = ref([])
const searchInput = ref('')
const keyword = ref('')
const items = ref([])
const page = ref(1)
const total = ref(0)
const initialLoading = ref(true)
const loadingMore = ref(false)
const loadError = ref(false)
const toastRef = ref(null)
let searchTimer = null
let requestVersion = 0

const categoryOptions = computed(() => [{ name: '全部', count: total.value }, ...categories.value])
const hasMore = computed(() => items.value.length < total.value)

watch(searchInput, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(applySearch, 300)
})

onMounted(() => {
  hidePageShareMenu()
  reload()
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function buildParams(targetPage) {
  const params = { type: activeType.value, page: targetPage, limit: PAGE_SIZE }
  if (activeCategory.value !== '全部') params.category = activeCategory.value
  if (keyword.value) params.keyword = keyword.value
  return params
}

async function fetchCategories() {
  try {
    categories.value = await getTextAssetCategories(activeType.value)
  } catch (error) {
    categories.value = []
  }
}

async function fetchPage(targetPage, append = false) {
  const version = ++requestVersion
  loadError.value = false
  if (append) loadingMore.value = true
  else initialLoading.value = true

  try {
    const result = await getTextAssets(buildParams(targetPage))
    if (version !== requestVersion) return
    const list = result?.list || []
    items.value = append ? [...items.value, ...list] : list
    total.value = Number(result?.total || 0)
    page.value = targetPage
  } catch (error) {
    if (version === requestVersion) loadError.value = true
  } finally {
    if (version === requestVersion) {
      initialLoading.value = false
      loadingMore.value = false
    }
  }
}

async function reload() {
  items.value = []
  page.value = 1
  await Promise.all([fetchCategories(), fetchPage(1)])
}

function switchType(type) {
  if (type === activeType.value) return
  activeType.value = type
  activeCategory.value = '全部'
  reload()
}

function switchCategory(category) {
  if (category === activeCategory.value) return
  activeCategory.value = category
  fetchPage(1)
}

function applySearch() {
  const normalized = searchInput.value.trim()
  if (normalized === keyword.value) return
  keyword.value = normalized
  fetchPage(1)
}

function clearSearch() {
  searchInput.value = ''
  keyword.value = ''
  fetchPage(1)
}

function loadMore() {
  if (initialLoading.value || loadingMore.value || !hasMore.value) return
  fetchPage(page.value + 1, true)
}

function copyAsset(content) {
  copyToClipboard(content, {
    onSuccess: () => toastRef.value?.showToast('复制成功', 'check'),
    onFailure: (message, error) => {
      console.error('颜文字复制失败:', error)
      toastRef.value?.showToast(message, 'error')
    }
  })
}
</script>

<style lang="scss" scoped>
.asset-page { display: flex; flex-direction: column; height: 100vh; color: #3f4541; background: linear-gradient(180deg, #f7fde9 0%, #f2fbdd 58%, #eaf7d2 100%); }
.type-tabs { display: flex; margin: 24rpx 24rpx 18rpx; padding: 6rpx; border: 1rpx solid rgba(201,178,151,.72); border-radius: 22rpx; background: rgba(238,239,232,.82); }
.type-tab { flex: 1; padding: 20rpx; border-radius: 16rpx; color: #6f766f; font-size: 25rpx; font-weight: 600; text-align: center; }
.type-tab.active { color: #704f58; background: #f8dfe5; }
.search-wrap { display: flex; align-items: center; margin: 0 24rpx 18rpx; padding: 0 22rpx; border: 1rpx solid rgba(201,178,151,.72); border-radius: 20rpx; background: rgba(238,239,232,.9); }
.search-icon { margin-right: 12rpx; color: #6f8b8d; font-size: 32rpx; }
.search-input { flex: 1; height: 76rpx; font-size: 24rpx; }
.search-clear { padding: 14rpx; color: #6f8b8d; font-size: 34rpx; }
.category-scroll { flex-shrink: 0; width: 100%; white-space: nowrap; }
.category-row { display: inline-flex; gap: 12rpx; padding: 0 24rpx 20rpx; }
.category-chip { display: flex; align-items: center; gap: 8rpx; padding: 14rpx 22rpx; border: 1rpx solid rgba(201,178,151,.72); border-radius: 999rpx; color: #606963; font-size: 21rpx; background: rgba(238,239,232,.76); }
.category-chip.active { border-color: rgba(143,188,147,.72); color: #4f7356; background: #e4f2e5; }
.category-count { opacity: .65; font-size: 18rpx; }
.asset-scroll { flex: 1; height: 0; }
.asset-list, .skeleton-list { padding: 4rpx 24rpx 24rpx; }
.asset-list.grid, .skeleton-list.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; }
.asset-card { margin-bottom: 16rpx; padding: 28rpx 26rpx 20rpx; overflow: hidden; border: 1rpx solid rgba(201,178,151,.72); border-radius: 20rpx; background: rgba(238,239,232,.9); transition: transform 120ms ease, background 120ms ease; }
.grid .asset-card { display: flex; flex-direction: column; min-height: 210rpx; margin-bottom: 0; }
.asset-card--active { background: #fcebbf; transform: scale(.988); }
.asset-content { display: block; flex: 1; overflow-wrap: anywhere; font-size: 32rpx; line-height: 1.6; white-space: pre-wrap; }
.grid .asset-content { font-size: 31rpx; text-align: center; }
.asset-meta { display: flex; justify-content: space-between; margin-top: 24rpx; padding-top: 16rpx; border-top: 1rpx solid #dce9e5; }
.asset-category, .copy-label { color: #6f766f; font-size: 17rpx; letter-spacing: 2rpx; }
.copy-label { color: #4f7356; font-weight: 700; }
.skeleton-card { height: 170rpx; margin-bottom: 16rpx; border-radius: 20rpx; background: linear-gradient(90deg, #dceeed 25%, #f5fbe9 50%, #dceeed 75%); background-size: 200% 100%; animation: shimmer 1.3s infinite; }
.grid .skeleton-card { height: 220rpx; margin-bottom: 0; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.state-card { display: flex; flex-direction: column; align-items: center; margin: 20rpx 24rpx; padding: 90rpx 24rpx; border: 1rpx solid rgba(201,178,151,.72); border-radius: 20rpx; background: rgba(238,239,232,.82); }
.state-symbol { font-family: Georgia, serif; font-size: 62rpx; }
.state-title { margin-top: 18rpx; font-size: 27rpx; font-weight: 600; }
.state-desc { margin-top: 8rpx; color: #6f766f; font-size: 21rpx; }
.retry-button { margin-top: 28rpx; padding: 0 34rpx; border-radius: 999rpx; color: #34494b; font-size: 22rpx; background: #fff4a8; }
.retry-button::after { border: 0; }
.list-footer { padding: 20rpx 24rpx 54rpx; color: #6f766f; font-size: 20rpx; text-align: center; }
.footer-retry { color: #486b6d; text-decoration: underline; }
</style>
