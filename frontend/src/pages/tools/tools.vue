<template>
  <view class="page-tools">
    <!-- 顶部标题 -->
    <view class="tools-header">
      <text class="tools-title">创作工具箱</text>
      <text class="tools-subtitle">精选设计工具，提升创作效率 · 点击复制链接即用</text>
    </view>

    <!-- 分割线 -->
    <view class="divider" />

    <!-- 默认工具 2 列网格 -->
    <view class="tool-grid">
      <ToolCard
        v-for="tool in toolsStore.allTools.filter(t => t.isDefault)"
        :key="tool.id"
        :tool="tool"
        @copy="handleCopyLink"
      />
    </view>

    <!-- 自定义工具区域 -->
    <view v-if="toolsStore.hasCustomTools">
      <view class="custom-divider">
        <view class="divider-line" />
        <text class="custom-divider-text">自定义工具</text>
        <view class="divider-line" />
      </view>

      <view class="tool-grid">
        <ToolCard
          v-for="tool in toolsStore.customTools"
          :key="tool.id"
          :tool="tool"
          @copy="handleCopyLink"
          @delete="handleDeleteTool"
        />
      </view>
    </view>

    <!-- 添加新工具按钮 -->
    <view class="add-tool-section">
      <view class="add-tool-btn" @tap="showAddSheet = true">
        <text class="add-tool-icon">+</text>
        <text class="add-tool-text">添加新工具</text>
      </view>
    </view>

    <!-- 添加工具弹窗 -->
    <BottomSheet
      v-model:visible="showAddSheet"
      title="添加工具"
    >
      <view class="add-form">
        <!-- 工具名称 -->
        <view class="form-group">
          <text class="form-label">工具名称</text>
          <input
            class="form-input"
            v-model="formData.name"
            placeholder="例如「我的配色助手」"
            placeholder-style="color: #ccc; font-size: 26rpx;"
            maxlength="20"
          />
        </view>

        <!-- 描述 -->
        <view class="form-group">
          <text class="form-label">描述</text>
          <input
            class="form-input"
            v-model="formData.description"
            placeholder="一句话说明作用"
            placeholder-style="color: #ccc; font-size: 26rpx;"
            maxlength="40"
          />
        </view>

        <!-- 图标选择器 -->
        <view class="form-group">
          <text class="form-label">图标</text>
          <IconPicker v-model="formData.icon" />
        </view>

        <!-- 工具链接 -->
        <view class="form-group">
          <text class="form-label">工具链接</text>
          <input
            class="form-input"
            v-model="formData.url"
            placeholder="https:// 或 /tools/xxx"
            placeholder-style="color: #ccc; font-size: 26rpx;"
          />
        </view>

        <!-- 校验错误 -->
        <text v-if="formError" class="form-error">{{ formError }}</text>
      </view>

      <template #footer>
        <button class="submit-btn" :disabled="isSubmitting" @tap="handleAddTool">
          <text class="submit-btn-text">{{ isSubmitting ? '添加中...' : '添加工具' }}</text>
        </button>
      </template>
    </BottomSheet>

    <!-- CustomToast -->
    <CustomToast ref="toastRef" />

    <!-- 底部 TabBar -->
    <CustomTabBar :current="1" />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToolsStore } from '../../stores/tools'
import ToolCard from '../../components/ToolCard.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import IconPicker from '../../components/IconPicker.vue'
import CustomToast from '../../components/CustomToast.vue'
import CustomTabBar from '../../components/CustomTabBar.vue'

const toolsStore = useToolsStore()

const showAddSheet = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const toastRef = ref(null)

const formData = reactive({
  name: '',
  description: '',
  icon: '',
  url: ''
})

onMounted(() => {
  toolsStore.fetchTools()
})

// 复制链接
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

// 删除自定义工具
function handleDeleteTool(tool) {
  toolsStore.removeTool(tool.id)
  toastRef.value?.showToast('工具已删除', 'check')
}

// 添加工具
function handleAddTool() {
  // 校验
  formError.value = ''
  if (!formData.name.trim()) {
    formError.value = '请输入工具名称'
    return
  }
  if (!formData.url.trim()) {
    formError.value = '请输入工具链接'
    return
  }

  isSubmitting.value = true

  // 模拟延迟
  setTimeout(() => {
    toolsStore.addTool({
      name: formData.name.trim(),
      description: formData.description.trim(),
      icon: formData.icon || '🔧',
      url: formData.url.trim()
    })

    // 重置表单
    formData.name = ''
    formData.description = ''
    formData.icon = ''
    formData.url = ''

    isSubmitting.value = false
    showAddSheet.value = false
    toastRef.value?.showToast('工具已添加', 'check')
  }, 300)
}
</script>

<style lang="scss" scoped>
.page-tools {
  min-height: 100vh;
  padding-bottom: 140rpx; /* 给底部TabBar让位 */
}

/* ===== 顶部标题 ===== */
.tools-header {
  padding: 28rpx 28rpx 16rpx;
}

.tools-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  display: block;
}

.tools-subtitle {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

/* ===== 分割线 ===== */
.divider {
  height: 1rpx;
  background: #eee;
  margin: 0 28rpx 20rpx;
}

/* ===== 工具网格 ===== */
.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  padding: 0 24rpx;
}

/* ===== 自定义工具分割线 ===== */
.custom-divider {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 40rpx 28rpx 20rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: #eee;
}

.custom-divider-text {
  font-size: 24rpx;
  color: #bbb;
  white-space: nowrap;
}

/* ===== 添加新工具 ===== */
.add-tool-section {
  padding: 16rpx 24rpx 40rpx;
}

.add-tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 80rpx;
  border: 2rpx dashed #ddd;
  border-radius: 16rpx;
  background: rgba(255,255,255,0.5);
}

.add-tool-btn:active {
  background: rgba(255,255,255,0.8);
}

.add-tool-icon {
  font-size: 32rpx;
  color: #999;
}

.add-tool-text {
  font-size: 26rpx;
  color: #999;
}

/* ===== 添加工具表单 ===== */
.add-form {
  padding: 8rpx 0;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  height: 72rpx;
  padding: 0 20rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #333;
  border: 1rpx solid transparent;
  transition: background 0.2s, border-color 0.2s;
}

.form-input:focus {
  background: #fff;
  border-color: #000;
}

.form-error {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-top: 8rpx;
  display: block;
}

/* 提交按钮 */
.submit-btn {
  height: 88rpx;
  background: #000;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  margin: 0;
  width: 100%;
  line-height: 88rpx;
}

.submit-btn::after {
  border: none;
}

.submit-btn[disabled] {
  opacity: 0.5;
}

.submit-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 500;
}
</style>
