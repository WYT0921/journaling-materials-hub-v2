<template>
  <view class="page-favorites">
    <!-- 毛玻璃导航栏 -->
    <GlassNavBar title="我的收藏" :show-back="true" />

    <!-- 加载中 -->
    <LoadingSpinner v-if="isLoading && isEmpty" />

    <!-- 空状态 -->
    <EmptyState
      v-else-if="isEmpty"
      text="还没有收藏素材"
      :show-retry="false"
    />

    <!-- 瀑布流 -->
    <scroll-view
      v-else
      class="fav-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <view class="waterfall">
        <view class="waterfall-column">
          <MaterialCard
            v-for="item in leftColumn"
            :key="item.id"
            :material="item"
            @select="handleMaterialTap"
          />
        </view>
        <view class="waterfall-column">
          <MaterialCard
            v-for="item in rightColumn"
            :key="item.id"
            :material="item"
            @select="handleMaterialTap"
          />
        </view>
      </view>

      <!-- 加载更多 -->
      <LoadingSpinner
        v-if="isLoading && !isEmpty"
        text="加载更多..."
      />

      <!-- 已到底 -->
      <view v-if="!hasMore && !isEmpty" class="divider-end">
        <view class="divider-line" />
        <text class="divider-text">已到底了</text>
        <view class="divider-line" />
      </view>

      <view class="tabbar-placeholder" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFavorites } from '../../api/favorite'
import { requireLogin } from '../../utils/auth'
import GlassNavBar from '../../components/GlassNavBar.vue'
import MaterialCard from '../../components/MaterialCard.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'

const list = ref([])
const page = ref(1)
const limit = 20
const hasMore = ref(true)
const isLoading = ref(false)
const isRefreshing = ref(false)

const isEmpty = computed(() => !isLoading.value && list.value.length === 0)

// 瀑布流左右分栏（奇偶交替）
const leftColumn = computed(() => list.value.filter((_, i) => i % 2 === 0))
const rightColumn = computed(() => list.value.filter((_, i) => i % 2 === 1))

// 加载收藏列表
const loadFavorites = async (reset = false) => {
  if (!requireLogin()) return
  if (isLoading.value) return

  try {
    isLoading.value = true
    if (reset) {
      page.value = 1
      hasMore.value = true
    }

    const result = await getFavorites({ page: page.value, limit })
    const items = (result.list || []).map(fav => ({
      ...fav.material,
      id: fav.material?.id || fav.materialId,
      favoriteId: fav.id
    }))

    if (reset) {
      list.value = items
    } else {
      list.value = [...list.value, ...items]
    }

    hasMore.value = page.value < (result.totalPages || 1)
    page.value++
  } catch (error) {
    console.error('加载收藏失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

// 下拉刷新
const handleRefresh = async () => {
  isRefreshing.value = true
  await loadFavorites(true)
  isRefreshing.value = false
}

// 加载更多
const handleLoadMore = () => {
  if (hasMore.value && !isLoading.value) {
    loadFavorites()
  }
}

// 素材点击
const handleMaterialTap = (material) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${material.id}`
  })
}

// 页面加载
onLoad(() => {
  loadFavorites(true)
})
</script>

<style lang="scss" scoped>
.page-favorites {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.fav-list {
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

/* 已到底 */
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

.tabbar-placeholder {
  height: 40rpx;
}
</style>
