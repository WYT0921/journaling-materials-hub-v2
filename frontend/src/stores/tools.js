import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as toolsApi from '../api/tools'

const STORAGE_KEY = 'custom_tools'

// 默认工具（后端不可用时的 fallback）
const DEFAULT_TOOLS = [
  { id: 'default-1', name: 'Notion', description: '万能笔记和项目管理工具', icon: '📝', url: 'https://www.notion.so', isDefault: true },
  { id: 'default-2', name: 'Canva', description: '在线设计平台，海量模板', icon: '🎨', url: 'https://www.canva.cn', isDefault: true },
  { id: 'default-3', name: 'Color Hunt', description: '精选配色方案集合', icon: '🎯', url: 'https://colorhunt.co', isDefault: true },
  { id: 'default-4', name: 'Coolors', description: '快速生成配色方案', icon: '🌈', url: 'https://coolors.co', isDefault: true },
  { id: 'default-5', name: 'Google Fonts', description: '免费开源字体库', icon: '🔤', url: 'https://fonts.google.com', isDefault: true },
  { id: 'default-6', name: 'DaFont', description: '英文字体下载站', icon: '✒️', url: 'https://www.dafont.com', isDefault: true },
  { id: 'default-7', name: 'Freepik', description: '免费矢量图和 PSD 素材', icon: '🖼️', url: 'https://www.freepik.com', isDefault: true },
  { id: 'default-8', name: 'Unsplash', description: '高质量免费图片', icon: '📷', url: 'https://unsplash.com', isDefault: true }
]

export const useToolsStore = defineStore('tools', () => {
  const allTools = ref([...DEFAULT_TOOLS])
  const customTools = ref([])

  const hasCustomTools = computed(() => customTools.value.length > 0)

  // 从后端加载工具
  async function fetchTools() {
    try {
      const tools = await toolsApi.getTools()
      if (tools && tools.length > 0) {
        allTools.value = tools
        customTools.value = tools.filter(t => !t.isDefault)
        // 同步到本地缓存
        saveLocalCustomTools()
        return
      }
    } catch (e) {
      console.warn('从后端加载工具失败，使用本地缓存:', e)
    }
    // fallback：加载本地存储
    loadLocalCustomTools()
  }

  // 从本地存储加载
  function loadLocalCustomTools() {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored) {
        customTools.value = JSON.parse(stored)
        allTools.value = [...DEFAULT_TOOLS, ...customTools.value]
      }
    } catch (e) {
      console.error('加载本地工具失败:', e)
    }
  }

  // 保存自定义工具到本地
  function saveLocalCustomTools() {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(customTools.value))
    } catch (e) {
      console.error('保存本地工具失败:', e)
    }
  }

  // 添加自定义工具
  async function addTool(tool) {
    try {
      const created = await toolsApi.addTool(tool)
      customTools.value.push(created)
      allTools.value.push(created)
      saveLocalCustomTools()
      return created
    } catch (e) {
      console.warn('后端添加工具失败，保存到本地:', e)
      // fallback：仅本地添加
      const localTool = {
        id: 'custom-' + Date.now(),
        name: tool.name,
        description: tool.description,
        icon: tool.icon || '🔧',
        url: tool.url,
        isDefault: false
      }
      customTools.value.push(localTool)
      allTools.value.push(localTool)
      saveLocalCustomTools()
      return localTool
    }
  }

  // 删除自定义工具
  async function removeTool(toolId) {
    try {
      await toolsApi.removeTool(toolId)
    } catch (e) {
      console.warn('后端删除工具失败:', e)
    }
    customTools.value = customTools.value.filter(t => t.id !== toolId)
    allTools.value = allTools.value.filter(t => t.id !== toolId || t.isDefault)
    saveLocalCustomTools()
  }

  return {
    allTools,
    customTools,
    hasCustomTools,
    fetchTools,
    addTool,
    removeTool
  }
})
