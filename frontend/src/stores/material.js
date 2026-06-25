/**
 * 素材状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as materialApi from '../api/material'

export const useMaterialStore = defineStore('material', () => {
  // 状态
  const materials = ref([])
  const leftColumn = ref([])
  const rightColumn = ref([])
  const page = ref(1)
  const limit = ref(10)
  const total = ref(0)
  const hasMore = ref(true)
  const isLoading = ref(false)
  const activeCategory = ref('')
  const keyword = ref('')
  const sortBy = ref('default')
  const categories = ref([])

  // 计算属性
  const isEmpty = computed(() => materials.value.length === 0 && !isLoading.value)

  /**
   * 加载素材列表
   */
  const loadMaterials = async (isRefresh = false) => {
    if (isLoading.value) return

    try {
      isLoading.value = true

      if (isRefresh) {
        page.value = 1
        materials.value = []
        leftColumn.value = []
        rightColumn.value = []
        hasMore.value = true
      }

      if (!hasMore.value) return

      const params = {
        page: page.value,
        limit: limit.value
      }

      if (activeCategory.value) {
        params.category = activeCategory.value
      }

      if (keyword.value) {
        params.keyword = keyword.value
      }

      if (sortBy.value !== 'default') {
        params.sortBy = sortBy.value
      }

      const result = await materialApi.getMaterials(params)
      const newMaterials = result.list || []

      // 瀑布流分配
      newMaterials.forEach((item, index) => {
        if (index % 2 === 0) {
          leftColumn.value.push(item)
        } else {
          rightColumn.value.push(item)
        }
      })

      materials.value = [...materials.value, ...newMaterials]
      total.value = result.total || 0

      // 判断是否还有更多
      if (newMaterials.length < limit.value) {
        hasMore.value = false
      } else {
        page.value++
      }
    } catch (error) {
      console.error('加载素材列表失败:', error)
      uni.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 搜索素材
   */
  const searchMaterials = async (searchKeyword) => {
    keyword.value = searchKeyword
    await loadMaterials(true)
  }

  /**
   * 加载更多
   */
  const loadMore = async () => {
    if (!hasMore.value || isLoading.value) return
    await loadMaterials()
  }

  /**
   * 重置并加载
   */
  const resetAndLoad = async () => {
    page.value = 1
    materials.value = []
    leftColumn.value = []
    rightColumn.value = []
    hasMore.value = true
    await loadMaterials()
  }

  /**
   * 切换分类
   */
  const switchCategory = async (category) => {
    activeCategory.value = category
    await resetAndLoad()
  }

  /**
   * 设置排序方式
   */
  const setSortBy = async (value) => {
    sortBy.value = value
    await resetAndLoad()
  }

  /**
   * 加载分类列表
   */
  const loadCategories = async () => {
    try {
      const result = await materialApi.getCategories()
      categories.value = result || []
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  /**
   * 刷新（下拉刷新）
   */
  const refresh = async () => {
    await loadMaterials(true)
  }

  return {
    materials,
    leftColumn,
    rightColumn,
    page,
    limit,
    total,
    hasMore,
    isLoading,
    activeCategory,
    keyword,
    sortBy,
    categories,
    isEmpty,
    loadMaterials,
    searchMaterials,
    loadMore,
    resetAndLoad,
    switchCategory,
    setSortBy,
    loadCategories,
    refresh
  }
})
