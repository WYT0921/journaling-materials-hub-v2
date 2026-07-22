<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">工具管理</h2>
      <button class="btn btn-primary" @click="openDialog()">+ 新增工具</button>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar">
          <select v-model="filterCategory" @change="search">
            <option value="">全部分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
          </select>
          <select v-model="filterStatus" @change="search">
            <option :value="null">全部状态</option>
            <option :value="1">上架</option>
            <option :value="0">下架</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>图标</th><th>名称</th><th>分类</th><th>链接</th><th>排序</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in list" :key="t.id">
              <td>{{ t.id }}</td>
              <td style="font-size:22px">{{ t.icon }}</td>
              <td>{{ t.name }}</td>
              <td>{{ t.category }}</td>
              <td class="truncate" style="max-width:160px"><a :href="t.url" target="_blank">{{ t.url }}</a></td>
              <td>{{ t.sortOrder }}</td>
              <td><span :class="['tag', t.status === 1 ? 'tag-success' : 'tag-danger']">{{ t.status === 1 ? '上架' : '下架' }}</span></td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-default btn-sm" @click="openDialog(t)">编辑</button>
                  <button class="btn btn-sm" :class="t.status === 1 ? 'btn-warning' : 'btn-success'" @click="toggleStatus(t)">
                    {{ t.status === 1 ? '下架' : '上架' }}
                  </button>
                  <button class="btn btn-danger btn-sm" @click="handleDelete(t)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-body">
        <div class="pagination">
          <button :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
          <span>第 <strong class="current">{{ page }}</strong> 页 / 共 {{ totalPages }} 页</span>
          <button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
          <span style="margin-left:12px">共 {{ total }} 条</span>
        </div>
      </div>
    </div>

    <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span>{{ dialogTitle }}</span>
          <button class="dialog-close" @click="dialogVisible = false">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">工具名称</label>
            <input v-model="form.name" class="form-input" placeholder="工具名称" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <input v-model="form.description" class="form-input" placeholder="简要描述" />
          </div>
          <div class="form-group">
            <label class="form-label">图标 (Emoji)</label>
            <input v-model="form.icon" class="form-input" placeholder="🔧" />
          </div>
          <div class="form-group">
            <label class="form-label">链接 URL</label>
            <input v-model="form.url" class="form-input" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="form.category" class="form-select">
              <option value="">请选择</option>
              <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div class="flex gap-3">
            <div class="form-group" style="flex:1">
              <label class="form-label">排序序号</label>
              <input v-model.number="form.sortOrder" type="number" class="form-input" />
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">状态</label>
              <select v-model.number="form.status" class="form-select">
                <option :value="1">上架</option>
                <option :value="0">下架</option>
              </select>
            </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { getTools, createTool, updateTool, updateToolStatus, deleteTool, getActiveCategories } from '../../api/admin'

const list = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const filterCategory = ref('')
const filterStatus = ref(null)
const dialogVisible = ref(false)
const editingId = ref(null)

const form = reactive({ name: '', description: '', icon: '', url: '', category: '', sortOrder: 0, status: 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const dialogTitle = computed(() => editingId.value ? '编辑工具' : '新增工具')

onMounted(async () => {
  await loadCategories()
  loadData()
})

async function loadCategories() {
  try { categories.value = await getActiveCategories('tool') } catch (e) { console.error(e) }
}

async function loadData() {
  try {
    const params = { page: page.value, limit }
    if (filterCategory.value) params.category = filterCategory.value
    if (filterStatus.value !== null) params.status = filterStatus.value
    const res = await getTools(params)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) { console.error(e) }
}

function search() { page.value = 1; loadData() }
function changePage(p) { page.value = p; loadData() }

function openDialog(t) {
  if (t) {
    editingId.value = t.id
    Object.assign(form, { name: t.name, description: t.description || '', icon: t.icon, url: t.url, category: t.category || '', sortOrder: t.sortOrder, status: t.status })
  } else {
    editingId.value = null
    Object.assign(form, { name: '', description: '', icon: '', url: '', category: '', sortOrder: 0, status: 1 })
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.name || !form.url) return alert('请填写名称和链接')
  try {
    if (editingId.value) {
      await updateTool(editingId.value, { ...form })
    } else {
      await createTool({ ...form })
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { alert(e.message || '保存失败') }
}

async function toggleStatus(t) {
  await updateToolStatus(t.id, t.status === 1 ? 0 : 1)
  loadData()
}

async function handleDelete(t) {
  if (!confirm(`确定删除工具「${t.name}」吗？`)) return
  await deleteTool(t.id)
  loadData()
}
</script>
