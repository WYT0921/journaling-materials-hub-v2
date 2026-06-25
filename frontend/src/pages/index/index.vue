<template>
  <view class="page-index">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="发现 · Discover">
      <template #right>
        <view class="notif-btn" @tap="handleNotifTap">
          <text class="notif-icon">🔔</text>
        </view>
      </template>
    </GlassNavBar>

    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon-text">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索素材"
          placeholder-style="color: #ccc; font-size: 26rpx;"
          confirm-type="search"
          @confirm="handleSearch"
          @input="handleSearchInput"
        />
        <view
          v-if="searchKeyword"
          class="clear-button"
          @tap="clearSearch"
        >
          <text class="clear-icon">×</text>
        </view>
        <view class="search-filter-btn" :class="{ active: showFilter }" @tap="handleFilterTap">
          <text class="filter-icon">☰</text>
        </view>
      </view>
    </view>

    <!-- 筛选面板 -->
    <view class="filter-panel" v-show="showFilter">
      <view class="filter-section">
        <text class="filter-label">排序方式</text>
        <view class="filter-options">
          <view
            v-for="option in sortOptions"
            :key="option.value"
            class="filter-chip"
            :class="{ active: materialStore.sortBy === option.value }"
            @tap="handleSortChange(option.value)"
          >
            <text class="filter-chip-text">{{ option.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分类 Chips -->
    <scroll-view class="category-scroll" scroll-x enable-flex show-scrollbar="false">
      <view class="category-list">
        <view
          class="category-item"
          :class="{ active: !materialStore.activeCategory }"
          @tap="handleCategoryTap('')"
        >
          <text class="category-text">全部</text>
        </view>
        <view
          v-for="item in materialStore.categories"
          :key="item.category || item.name"
          class="category-item"
          :class="{ active: materialStore.activeCategory === (item.category || item.name) }"
          @tap="handleCategoryTap(item.category || item.name)"
        >
          <text class="category-text">{{ item.category || item.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 素材列表 -->
    <scroll-view
      class="material-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <!-- 加载中 -->
      <LoadingSpinner v-if="materialStore.isLoading && materialStore.isEmpty" />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="materialStore.isEmpty"
        text="暂无素材"
        :show-retry="true"
        @retry="handleRefresh"
      />

      <!-- 瀑布流布局 -->
      <view v-else class="waterfall">
        <view class="waterfall-column">
          <MaterialCard
            v-for="item in materialStore.leftColumn"
            :key="item.id"
            :material="item"
            @select="handleMaterialTap"
          />
        </view>
        <view class="waterfall-column">
          <MaterialCard
            v-for="item in materialStore.rightColumn"
            :key="item.id"
            :material="item"
            @select="handleMaterialTap"
          />
        </view>
      </view>

      <!-- 加载更多 -->
      <LoadingSpinner
        v-if="materialStore.isLoading && !materialStore.isEmpty"
        text="加载更多..."
      />

      <!-- 已到底分隔线 -->
      <view v-if="!materialStore.hasMore && !materialStore.isEmpty" class="divider-end">
        <view class="divider-line" />
        <text class="divider-text">已到底了</text>
        <view class="divider-line" />
      </view>

      <!-- 底部占位，防止被固定 TabBar 遮挡 -->
      <view class="tabbar-placeholder" />
    </scroll-view>

    <!-- 底部 TabBar -->
    <CustomTabBar :current="0" />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { useMaterialStore } from '../../stores/material'
import MaterialCard from '../../components/MaterialCard.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import GlassNavBar from '../../components/GlassNavBar.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const materialStore = useMaterialStore()

const searchKeyword = ref('')
const isRefreshing = ref(false)
const showFilter = ref(false)

const sortOptions = [
  { label: '综合排序', value: 'default' },
  { label: '最新发布', value: 'newest' },
  { label: '最多下载', value: 'downloads' }
]

// 页面加载
onMounted(() => {
  initData()
})

// 页面显示
onShow(() => {
  // 如果是从其他页面返回，可能需要刷新
})

// 初始化数据
const initData = async () => {
  await Promise.all([
    materialStore.loadCategories(),
    materialStore.loadMaterials(true)
  ])
}

// 搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    materialStore.searchMaterials(searchKeyword.value.trim())
  }
}

// 搜索输入
const handleSearchInput = (e) => {
  searchKeyword.value = e.detail.value
  if (!searchKeyword.value.trim()) {
    materialStore.searchMaterials('')
  }
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  materialStore.searchMaterials('')
}

// 分类点击
const handleCategoryTap = (category) => {
  materialStore.switchCategory(category)
}

// 下拉刷新
const handleRefresh = async () => {
  isRefreshing.value = true
  await materialStore.refresh()
  isRefreshing.value = false
}

// 加载更多
const handleLoadMore = () => {
  materialStore.loadMore()
}

// 素材点击
const handleMaterialTap = (material) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${material.id}`
  })
}

// 通知按钮
const handleNotifTap = () => {
  uni.showToast({ title: '暂无新通知', icon: 'none' })
}

// 筛选按钮
const handleFilterTap = () => {
  showFilter.value = !showFilter.value
}

// 排序切换
const handleSortChange = (value) => {
  materialStore.setSortBy(value)
  showFilter.value = false
}

// 下拉刷新（uni-app 生命周期）
onPullDownRefresh(() => {
  handleRefresh()
  uni.stopPullDownRefresh()
})
</script>

<style lang="scss" scoped>
.page-index {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* ===== 搜索栏 ===== */
.search-bar {
  padding: 16rpx 24rpx;
  position: relative;
  z-index: 10;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #F7F7F7;
  border-radius: 100rpx;
  padding: 0 20rpx;
  height: 64rpx;
  border: 1rpx solid transparent;
  transition: background 0.2s, border-color 0.2s;
}

.search-input-wrapper:focus-within {
  background: #ffffff;
  border-color: #000;
}

.search-icon-text {
  font-size: 26rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  height: 64rpx;
  font-size: 26rpx;
  color: #333;
  background: transparent;
}

.clear-button {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8rpx;
}

.clear-icon {
  font-size: 32rpx;
  color: #999;
}

.search-filter-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4rpx;
  border-radius: 50%;
  transition: background 0.2s;

  &.active {
    background: #000;

    .filter-icon {
      color: #fff;
    }
  }
}

.filter-icon {
  font-size: 28rpx;
  color: #666;
}

/* ===== 筛选面板 ===== */
.filter-panel {
  background: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 10;
  animation: filterSlideIn 0.2s ease;
}

@keyframes filterSlideIn {
  from {
    opacity: 0;
    transform: translateY(-12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.filter-label {
  font-size: 24rpx;
  color: #999;
}

.filter-options {
  display: flex;
  gap: 16rpx;
}

.filter-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx 0;
  border-radius: 16rpx;
  border: 1rpx solid #EEEEEE;
  background: #F7F7F7;
  transition: all 0.15s;

  &.active {
    background: #000;
    border-color: #000;

    .filter-chip-text {
      color: #fff;
    }
  }
}

.filter-chip-text {
  font-size: 24rpx;
  color: #666;
}

/* ===== 分类 Chips ===== */
.category-scroll {
  white-space: nowrap;
  position: relative;
  z-index: 10;
}

.category-list {
  display: inline-flex;
  padding: 12rpx 24rpx;
  gap: 16rpx;
}

.category-item {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 28rpx;
  border-radius: 32rpx;
  white-space: nowrap;
  /* 未选态：1px 极淡边框 */
  border: 1rpx solid #EEEEEE;
  background: transparent;

  &.active {
    /* 选中态：黑底白字反显 */
    background: #000;
    border-color: #000;

    .category-text {
      color: #fff;
    }
  }
}

.category-text {
  font-size: 24rpx;
  color: #666;
}

/* ===== 素材瀑布流 ===== */
.material-list {
  flex: 1;
  height: 0;
}

.waterfall {
  display: flex;
  padding: 16rpx 20rpx;
  gap: 16rpx;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ===== 已到底分隔线 ===== */
.divider-end {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 60rpx;
  gap: 20rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #EEEEEE;
}

.divider-text {
  font-size: 22rpx;
  color: #ccc;
  white-space: nowrap;
}

/* 底部占位，防止被固定 TabBar 遮挡 */
.tabbar-placeholder {
  height: 120rpx;
}
</style>
