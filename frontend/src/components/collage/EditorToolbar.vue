<template>
  <scroll-view class="toolbar-scroll" scroll-x enable-flex :show-scrollbar="false">
    <view class="toolbar-row">
      <button class="tool primary" @tap="emit('add')"><text>＋</text><text>素材</text></button>
      <button class="tool" :disabled="!canUndo" @tap="emit('undo')"><text>↶</text><text>撤销</text></button>
      <button class="tool" :disabled="!canRedo" @tap="emit('redo')"><text>↷</text><text>重做</text></button>
      <button class="tool" :disabled="!hasSelection" @tap="emit('duplicate')"><text>⧉</text><text>复制</text></button>
      <button class="tool" :disabled="!hasSelection" @tap="emit('remove')"><text>×</text><text>删除</text></button>
      <button class="tool" :disabled="layerCount === 0" @tap="emit('layers')"><text>▱</text><text>图层</text></button>
      <button class="tool export" :disabled="layerCount === 0 || exporting" @tap="emit('export')">
        <text>⇩</text><text>{{ exporting ? '导出中' : '导出' }}</text>
      </button>
    </view>
  </scroll-view>
</template>

<script setup>
defineProps({
  canUndo: Boolean,
  canRedo: Boolean,
  hasSelection: Boolean,
  layerCount: { type: Number, default: 0 },
  exporting: Boolean
})
const emit = defineEmits(['add', 'undo', 'redo', 'duplicate', 'remove', 'layers', 'export'])
</script>

<style scoped lang="scss">
.toolbar-scroll { width: 100%; white-space: nowrap; background: rgba(255, 255, 255, .98); }
.toolbar-row { display: inline-flex; gap: 10rpx; padding: 14rpx 20rpx calc(14rpx + env(safe-area-inset-bottom)); }
.tool { width: 104rpx; height: 82rpx; margin: 0; padding: 6rpx 0; border-radius: 18rpx; background: #f3f3f3; color: #333; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 22rpx; line-height: 1.25; }
.tool::after { border: none; }
.tool[disabled] { opacity: .35; }
.tool.primary { background: #111; color: #fff; }
.tool.export { background: #e9f6ec; color: #26743b; }
.tool text:first-child { font-size: 30rpx; line-height: 1; }
</style>
