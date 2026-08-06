<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">颜文字 / Emoji 管理</h2>
      <div class="flex gap-2">
        <label class="btn btn-default">导入 JSON<input type="file" accept=".json,application/json" hidden @change="handleImport" /></label>
        <button class="btn btn-primary" @click="openDialog()">+ 新增内容</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="search-bar" style="flex-wrap:wrap">
          <select v-model="filters.type" @change="typeChanged"><option value="">全部类型</option><option value="kaomoji">颜文字</option><option value="emoji">Emoji</option></select>
          <select v-model="filters.category" @change="search"><option value="">全部分类</option><option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option></select>
          <select v-model="filters.status" @change="search"><option value="">全部状态</option><option value="0">待审核</option><option value="1">已发布</option><option value="2">已拒绝</option><option value="3">已停用</option></select>
          <select v-model="filters.source" @change="search"><option value="">全部来源</option><option value="manual">手动</option><option value="cuteinternet">CuteInternet</option><option value="emojidb">EmojiDB</option></select>
          <select v-model="filters.riskLevel" @change="search"><option value="">全部风险</option><option value="safe">安全</option><option value="mild">轻度搞怪</option></select>
          <input v-model="filters.keyword" class="form-input" style="width:210px" placeholder="搜索内容、分类、标签" @keyup.enter="search" />
          <button class="btn btn-default" @click="search">搜索</button>
        </div>
      </div>

      <div v-if="selectedIds.length" class="card-body flex gap-2" style="border-bottom:1px solid #eee">
        <span>已选 {{ selectedIds.length }} 条</span>
        <button class="btn btn-success btn-sm" @click="batchStatus(1)">批量发布</button>
        <button class="btn btn-warning btn-sm" @click="batchStatus(2)">批量拒绝</button>
        <button class="btn btn-default btn-sm" @click="batchStatus(3)">批量停用</button>
      </div>

      <div class="card-body" style="padding:0;overflow:auto">
        <table class="data-table">
          <thead><tr><th><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th><th>ID</th><th>内容</th><th>类型</th><th>分类</th><th>来源</th><th>风险</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td><input v-model="selectedIds" type="checkbox" :value="item.id" /></td>
              <td>{{ item.id }}</td>
              <td><pre class="asset-preview">{{ item.content }}</pre></td>
              <td>{{ item.type === 'kaomoji' ? '颜文字' : 'Emoji' }}</td>
              <td>{{ item.category }}</td>
              <td><a v-if="item.sourceUrl" :href="item.sourceUrl" target="_blank">{{ item.source }}</a><span v-else>{{ item.source }}</span></td>
              <td><span :class="['tag', item.riskLevel === 'mild' ? 'tag-warning' : 'tag-success']">{{ item.riskLevel }}</span></td>
              <td><span class="tag">{{ statusLabels[item.status] }}</span></td>
              <td><div class="flex gap-2"><button class="btn btn-default btn-sm" @click="openDialog(item)">编辑</button><button v-if="item.status !== 1" class="btn btn-success btn-sm" @click="setStatus(item, 1)">发布</button><button v-else class="btn btn-warning btn-sm" @click="setStatus(item, 3)">停用</button><button class="btn btn-danger btn-sm" @click="remove(item)">删除</button></div></td>
            </tr>
            <tr v-if="!list.length"><td colspan="9" style="text-align:center;padding:32px;color:#999">暂无数据</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card-body"><div class="pagination"><button :disabled="page === 1" @click="changePage(page - 1)">上一页</button><span>第 <strong class="current">{{ page }}</strong> 页 / 共 {{ totalPages }} 页</span><button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button><span style="margin-left:12px">共 {{ total }} 条</span></div></div>
    </div>

    <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
      <div class="dialog">
        <div class="dialog-header"><span>{{ editingId ? '编辑内容' : '新增内容' }}</span><button class="dialog-close" @click="dialogVisible = false">&times;</button></div>
        <div class="dialog-body">
          <div class="form-group"><label class="form-label">内容</label><textarea v-model="form.content" class="form-input" rows="4" /></div>
          <div class="flex gap-3"><div class="form-group" style="flex:1"><label class="form-label">类型</label><select v-model="form.type" class="form-select" @change="loadFormCategories"><option value="kaomoji">颜文字</option><option value="emoji">Emoji</option></select></div><div class="form-group" style="flex:1"><label class="form-label">分类</label><select v-model="form.category" class="form-select"><option v-for="c in formCategories" :key="c.id" :value="c.name">{{ c.name }}</option></select></div></div>
          <div class="form-group"><label class="form-label">标签（逗号分隔）</label><input v-model="tagsInput" class="form-input" /></div>
          <div class="flex gap-3"><div class="form-group" style="flex:1"><label class="form-label">来源</label><select v-model="form.source" class="form-select"><option value="manual">手动</option><option value="cuteinternet">CuteInternet</option><option value="emojidb">EmojiDB</option></select></div><div class="form-group" style="flex:1"><label class="form-label">风险</label><select v-model="form.riskLevel" class="form-select"><option value="safe">安全</option><option value="mild">轻度搞怪</option></select></div></div>
          <div class="form-group"><label class="form-label">来源 URL</label><input v-model="form.sourceUrl" class="form-input" /></div>
          <div class="flex gap-3"><div class="form-group" style="flex:1"><label class="form-label">排序</label><input v-model.number="form.sortOrder" type="number" class="form-input" /></div><div class="form-group" style="flex:1"><label class="form-label">状态</label><select v-model.number="form.status" class="form-select"><option :value="0">待审核</option><option :value="1">已发布</option><option :value="2">已拒绝</option><option :value="3">已停用</option></select></div></div>
          <div class="form-actions"><button class="btn btn-default" @click="dialogVisible = false">取消</button><button class="btn btn-primary" @click="save">保存</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { batchUpdateTextAssetStatus, createTextAsset, deleteTextAsset, getActiveCategories, getTextAssets, importTextAssets, updateTextAsset, updateTextAssetStatus } from '../../api/admin'

const list = ref([]), total = ref(0), page = ref(1), categories = ref([]), formCategories = ref([]), selectedIds = ref([])
const limit = 20, dialogVisible = ref(false), editingId = ref(null), tagsInput = ref('')
const filters = reactive({ type: '', category: '', status: '', source: '', riskLevel: '', keyword: '' })
const form = reactive({ content: '', type: 'kaomoji', category: '', tags: [], source: 'manual', sourceUrl: '', riskLevel: 'safe', sortOrder: 0, status: 0 })
const statusLabels = { 0: '待审核', 1: '已发布', 2: '已拒绝', 3: '已停用' }
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const allSelected = computed(() => list.value.length > 0 && list.value.every(item => selectedIds.value.includes(item.id)))

onMounted(loadData)
async function loadCategories(type) { return type ? await getActiveCategories(type) : [] }
function parseTags(value) { if (Array.isArray(value)) return value; try { return JSON.parse(value || '[]') } catch { return [] } }
async function loadData() { const params = { page: page.value, limit }; Object.entries(filters).forEach(([key, value]) => { if (value !== '') params[key] = value }); const result = await getTextAssets(params); list.value = (result.list || []).map(item => ({ ...item, tags: parseTags(item.tags) })); total.value = result.total || 0; selectedIds.value = []; categories.value = await loadCategories(filters.type) }
function search() { page.value = 1; loadData() }
function changePage(value) { page.value = value; loadData() }
async function typeChanged() { filters.category = ''; categories.value = await loadCategories(filters.type); search() }
async function loadFormCategories() { formCategories.value = await loadCategories(form.type); if (!formCategories.value.some(c => c.name === form.category)) form.category = formCategories.value[0]?.name || '' }
async function openDialog(item) { editingId.value = item?.id || null; Object.assign(form, item ? { ...item } : { content: '', type: 'kaomoji', category: '', tags: [], source: 'manual', sourceUrl: '', riskLevel: 'safe', sortOrder: 0, status: 0 }); tagsInput.value = Array.isArray(item?.tags) ? item.tags.join(', ') : ''; await loadFormCategories(); dialogVisible.value = true }
async function save() { if (!form.content || !form.category) return alert('请填写内容和分类'); const data = { ...form, tags: tagsInput.value.split(/[,，]/).map(v => v.trim()).filter(Boolean) }; if (editingId.value) await updateTextAsset(editingId.value, data); else await createTextAsset(data); dialogVisible.value = false; loadData() }
async function setStatus(item, status) { await updateTextAssetStatus(item.id, status); loadData() }
async function batchStatus(status) { await batchUpdateTextAssetStatus(selectedIds.value, status); loadData() }
function toggleAll(event) { selectedIds.value = event.target.checked ? list.value.map(item => item.id) : [] }
async function remove(item) { if (!confirm('确定删除这条内容吗？')) return; await deleteTextAsset(item.id); loadData() }
async function handleImport(event) { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; try { const parsed = JSON.parse(await file.text()); const items = Array.isArray(parsed) ? parsed : parsed.items || parsed.candidates; if (!Array.isArray(items)) throw new Error('JSON 中未找到素材数组'); let summary = { inserted: 0, duplicates: 0, filtered: 0, failed: 0 }; for (let index = 0; index < items.length; index += 500) { const result = await importTextAssets(items.slice(index, index + 500)); Object.keys(summary).forEach(key => { summary[key] += Number(result[key] || 0) }) } alert(`导入完成：新增 ${summary.inserted}，重复 ${summary.duplicates}，过滤 ${summary.filtered}，失败 ${summary.failed}`); loadData() } catch (error) { alert(error.message || '导入失败') } }
</script>

<style scoped>
.asset-preview { max-width: 360px; margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; font: 18px/1.5 system-ui, sans-serif; }
</style>
