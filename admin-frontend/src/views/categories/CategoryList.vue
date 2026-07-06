<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <button class="btn btn-primary" @click="openDialog()">+ 新增分类</button>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar">
          <select v-model="filterType">
            <option value="">全部类型</option>
            <option value="material">素材分类</option>
            <option value="tool">工具分类</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>名称</th><th>类型</th><th>排序</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in filteredList" :key="cat.id">
              <td>{{ cat.id }}</td>
              <td>{{ cat.name }}</td>
              <td><span :class="['tag', cat.type === 'material' ? 'tag-info' : 'tag-success']">{{ cat.type === 'material' ? '素材' : '工具' }}</span></td>
              <td>{{ cat.sortOrder }}</td>
              <td><span :class="['tag', cat.status === 1 ? 'tag-success' : 'tag-default']">{{ cat.status === 1 ? '启用' : '禁用' }}</span></td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-default btn-sm" @click="openDialog(cat)">编辑</button>
                  <button class="btn btn-danger btn-sm" @click="handleDelete(cat)">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0">
              <td colspan="6" style="text-align:center;padding:32px;color:#999">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span>{{ dialogTitle }}</span>
          <button class="dialog-close" @click="dialogVisible = false">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">分类名称</label>
            <input v-model="form.name" class="form-input" placeholder="请输入分类名称" />
          </div>
          <div class="form-group">
            <label class="form-label">类型</label>
            <select v-model="form.type" class="form-select" :disabled="!!editingId">
              <option value="material">素材分类</option>
              <option value="tool">工具分类</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">排序序号</label>
            <input v-model.number="form.sortOrder" type="number" class="form-input" />
          </div>
          <div class="form-group" v-if="editingId">
            <label class="form-label">状态</label>
            <select v-model.number="form.status" class="form-select">
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn-default" @click="dialogVisible = false">取消</button>
            <button class="btn btn-primary" @click="handleSave">{{ editingId ? '保存' : '创建' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin'

const list = ref([])
const filterType = ref('')
const dialogVisible = ref(false)
const editingId = ref(null)

const form = reactive({ name: '', type: 'material', sortOrder: 0, status: 1 })

const dialogTitle = computed(() => editingId.value ? '编辑分类' : '新增分类')
const filteredList = computed(() =>
  filterType.value ? list.value.filter(c => c.type === filterType.value) : list.value
)

onMounted(loadData)

async function loadData() {
  try {
    const [material, tool] = await Promise.all([
      getCategories('material'),
      getCategories('tool')
    ])
    list.value = [...material, ...tool].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type)
      return a.sortOrder - b.sortOrder
    })
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

function openDialog(cat) {
  if (cat) {
    editingId.value = cat.id
    form.name = cat.name
    form.type = cat.type
    form.sortOrder = cat.sortOrder
    form.status = cat.status
  } else {
    editingId.value = null
    form.name = ''
    form.type = 'material'
    form.sortOrder = 0
    form.status = 1
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.name) return alert('请输入分类名称')
  try {
    if (editingId.value) {
      await updateCategory(editingId.value, { ...form })
    } else {
      await createCategory({ ...form })
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    alert(e.message || '保存失败')
  }
}

async function handleDelete(cat) {
  if (!confirm(`确定删除分类「${cat.name}」吗？`)) return
  try {
    await deleteCategory(cat.id)
    loadData()
  } catch (e) {
    alert(e.message || '删除失败')
  }
}
</script>
