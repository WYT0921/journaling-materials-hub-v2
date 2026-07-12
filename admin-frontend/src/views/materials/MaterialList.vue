<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">素材管理</h2>
      <button class="btn btn-primary" @click="openDialog()">+ 新增素材</button>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar">
          <input v-model="searchKeyword" placeholder="搜索标题..." @keyup.enter="search" />
          <select v-model="filterCategory" @change="search">
            <option value="">全部分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
          </select>
          <select v-model="filterMaterialType" @change="search">
            <option value="">全部类型</option>
            <option v-for="t in materialTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <select v-model="filterStatus" @change="search">
            <option :value="null">全部状态</option>
            <option :value="1">上架</option>
            <option :value="0">下架</option>
          </select>
          <button class="btn btn-default btn-sm" @click="search">搜索</button>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>缩略图</th><th>标题</th><th>类型</th><th>分类</th><th>VIP</th><th>下载</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in list" :key="m.id">
              <td>{{ m.id }}</td>
              <td><img v-if="m.thumbnailUrl" :src="m.thumbnailUrl" style="width:48px;height:48px;object-fit:cover;border-radius:4px" /></td>
              <td class="truncate" style="max-width:160px">{{ m.title }}</td>
              <td>{{ getMaterialTypeLabel(m.materialType) }}</td>
              <td>{{ m.category }}</td>
              <td><span :class="['tag', m.isPremium ? 'tag-warning' : 'tag-default']">{{ m.isPremium ? 'VIP' : '免费' }}</span></td>
              <td>{{ m.downloadCount }}</td>
              <td><span :class="['tag', m.status === 1 ? 'tag-success' : 'tag-danger']">{{ m.status === 1 ? '上架' : '下架' }}</span></td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-default btn-sm" @click="openDialog(m)">编辑</button>
                  <button class="btn btn-sm" :class="m.status === 1 ? 'btn-warning' : 'btn-success'" @click="toggleStatus(m)">
                    {{ m.status === 1 ? '下架' : '上架' }}
                  </button>
                  <button class="btn btn-danger btn-sm" @click="handleDelete(m)">删除</button>
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

    <!-- Dialog -->
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
      <div class="dialog" style="width:620px">
        <div class="dialog-header">
          <span>{{ dialogTitle }}</span>
          <button class="dialog-close" @click="dialogVisible = false">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">标题</label>
            <input v-model="form.title" class="form-input" placeholder="素材标题" />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="form.description" class="form-textarea" placeholder="素材描述"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="form.category" class="form-select">
              <option value="">请选择</option>
              <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">素材类型</label>
            <select v-model="form.materialType" class="form-select">
              <option v-for="t in materialTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">图片上传</label>
            <input type="file" accept="image/*" @change="handleUpload" />
            <div class="form-hint">上传后自动填充原图和缩略图 URL</div>
          </div>
          <div class="form-group">
            <label class="form-label">原图 URL</label>
            <input v-model="form.imageUrl" class="form-input" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label class="form-label">缩略图 URL</label>
            <input v-model="form.thumbnailUrl" class="form-input" placeholder="https://..." />
          </div>
          <div class="flex gap-3">
            <div class="form-group" style="flex:1">
              <label class="form-label">是否 VIP</label>
              <select v-model="form.isPremium" class="form-select">
                <option :value="false">免费</option>
                <option :value="true">VIP</option>
              </select>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">状态</label>
              <select v-model.number="form.status" class="form-select">
                <option :value="1">上架</option>
                <option :value="0">下架</option>
              </select>
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">排序权重</label>
              <input v-model.number="form.sortOrder" type="number" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">标签 (JSON 数组)</label>
            <input v-model="form.tags" class="form-input" placeholder='["标签1","标签2"]' />
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
import { getMaterials, createMaterial, updateMaterial, updateMaterialStatus, deleteMaterial, uploadImage, getActiveCategories } from '../../api/admin'

const list = ref([])
const categories = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const searchKeyword = ref('')
const filterCategory = ref('')
const filterMaterialType = ref('')
const filterStatus = ref(null)
const dialogVisible = ref(false)
const editingId = ref(null)

const form = reactive({
  title: '', description: '', category: '', materialType: 'single', imageUrl: '', thumbnailUrl: '',
  isPremium: false, status: 1, sortOrder: 0, tags: ''
})

const materialTypes = [
  { label: '单个素材', value: 'single' },
  { label: '合并素材', value: 'bundle' }
]

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const dialogTitle = computed(() => editingId.value ? '编辑素材' : '新增素材')

onMounted(async () => {
  await loadCategories()
  loadData()
})

async function loadCategories() {
  try { categories.value = await getActiveCategories('material') } catch (e) { console.error(e) }
}

async function loadData() {
  try {
    const params = { page: page.value, limit }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategory.value) params.category = filterCategory.value
    if (filterMaterialType.value) params.materialType = filterMaterialType.value
    if (filterStatus.value !== null) params.status = filterStatus.value
    const res = await getMaterials(params)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) { console.error(e) }
}

function search() { page.value = 1; loadData() }
function changePage(p) { page.value = p; loadData() }

function getMaterialTypeLabel(type) {
  return type === 'bundle' ? '合并素材' : '单个素材'
}

function openDialog(m) {
  if (m) {
    editingId.value = m.id
    Object.assign(form, {
      title: m.title, description: m.description || '', category: m.category || '', materialType: m.materialType || 'single',
      imageUrl: m.imageUrl, thumbnailUrl: m.thumbnailUrl || '',
      isPremium: m.isPremium, status: m.status, sortOrder: m.sortOrder || 0,
      tags: typeof m.tags === 'string' ? m.tags : JSON.stringify(m.tags || [])
    })
  } else {
    editingId.value = null
    Object.assign(form, { title: '', description: '', category: '', materialType: 'single', imageUrl: '', thumbnailUrl: '', isPremium: false, status: 1, sortOrder: 0, tags: '' })
  }
  dialogVisible.value = true
}

async function handleUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const res = await uploadImage(file)
    form.imageUrl = res.imageUrl
    form.thumbnailUrl = res.thumbnailUrl
  } catch (err) { alert('上传失败: ' + (err.message || '未知错误')) }
}

async function handleSave() {
  if (!form.title) return alert('请输入标题')
  try {
    const data = { ...form, tags: form.tags || '[]' }
    if (editingId.value) {
      await updateMaterial(editingId.value, data)
    } else {
      await createMaterial(data)
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { alert(e.message || '保存失败') }
}

async function toggleStatus(m) {
  const newStatus = m.status === 1 ? 0 : 1
  await updateMaterialStatus(m.id, newStatus)
  loadData()
}

async function handleDelete(m) {
  if (!confirm(`确定删除素材「${m.title}」吗？`)) return
  await deleteMaterial(m.id)
  loadData()
}
</script>
