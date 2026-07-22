<template>
  <view class="page-tools">
    <GlassNavBar title="工具" />

    <scroll-view class="tools-scroll" scroll-y>
      <view class="tools-header">
        <text class="tools-title">创作工具箱</text>
        <text class="tools-subtitle">精选设计工具，提升创作效率 · 点击复制链接即用</text>
      </view>

      <scroll-view class="category-scroll" scroll-x enable-flex show-scrollbar="false">
        <view class="category-list">
          <view
            v-for="category in toolCategories"
            :key="category.value"
            class="category-item"
            :class="{ active: activeCategory === category.value }"
            @tap="activeCategory = category.value"
          >
            <text class="category-text">{{ category.label }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="tool-grid">
        <ToolCard
          v-for="tool in filteredTools"
          :key="tool.id"
          :tool="tool"
          @copy="handleCopyLink"
        />
      </view>

      <view v-if="filteredTools.length === 0" class="empty-tools">
        <text class="empty-title">暂无工具</text>
        <text class="empty-desc">切换其他分类看看</text>
      </view>
    </scroll-view>

    <CustomToast ref="toastRef" />
    <CustomTabBar :current="2" />
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useToolsStore } from '../../stores/tools'
import GlassNavBar from '../../components/GlassNavBar.vue'
import ToolCard from '../../components/ToolCard.vue'
import CustomToast from '../../components/CustomToast.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const toolsStore = useToolsStore()
const toastRef = ref(null)
const activeCategory = ref('')

const toolCategories = computed(() => {
  const cats = [{ label: '全部', value: '' }]
  toolsStore.categories.forEach((c) => {
    cats.push({ label: c.name, value: c.name })
  })
  return cats
})

const filteredTools = computed(() => {
  if (!activeCategory.value) return toolsStore.allTools
  return toolsStore.allTools.filter((tool) => tool.category === activeCategory.value)
})

onMounted(() => {
  toolsStore.fetchTools()
  toolsStore.fetchCategories()
})

function handleCopyLink(tool) {
  uni.setClipboardData({
    data: tool.url,
    success: () => {
      toastRef.value?.showToast('链接已复制', 'check')
    },
    fail: () => {
      toastRef.value?.showToast('复制失败，请重试', 'error')
    }
  })
}
</script>

<style lang="scss" scoped>
.page-tools {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tools-scroll {
  flex: 1;
  height: 0;
}

.tools-header {
  padding: 24rpx 28rpx 12rpx;
}

.tools-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #111;
  display: block;
  line-height: 1.25;
}

.tools-subtitle {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
  line-height: 1.35;
}

.category-scroll {
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  gap: 14rpx;
  padding: 12rpx 24rpx 18rpx;
}

.category-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 24rpx;
  border-radius: 32rpx;
  border: 1rpx solid #eeeeee;
  background: rgba(255, 255, 255, 0.65);
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;

  &.active {
    background: #000;
    border-color: #000;

    .category-text {
      color: #fff;
    }
  }
}

.category-text {
  font-size: 24rpx;
  color: #555;
  line-height: 1.2;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  padding: 0 24rpx 24rpx;
  box-sizing: border-box;
}

.empty-tools {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 96rpx 24rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.empty-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
