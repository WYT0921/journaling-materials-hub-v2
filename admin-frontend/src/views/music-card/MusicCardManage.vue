<template>
  <div class="mc-manage">
    <h2 class="page-title">♪ 音乐卡片管理</h2>

    <div class="tab-bar">
      <button :class="{ active: activeTab === 'templates' }" @click="activeTab = 'templates'">播放器模板</button>
      <button :class="{ active: activeTab === 'assets' }" @click="activeTab = 'assets'">装饰素材</button>
      <button :class="{ active: activeTab === 'creations' }" @click="activeTab = 'creations'">用户作品</button>
    </div>

    <!-- 播放器模板 -->
    <div v-if="activeTab === 'templates'">
      <div class="toolbar">
        <button class="btn btn-primary" @click="openTemplateDialog()">+ 新增模板</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>名称</th><th>描述</th><th>字号</th><th>进度条</th><th>控件</th><th>排序</th><th>状态</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in templates" :key="t.id">
            <td>{{ t.id }}</td>
            <td>{{ t.name }}</td>
            <td>{{ t.description }}</td>
            <td>{{ t.titleSize }}/{{ t.artistSize }}</td>
            <td>{{ t.showProgress ? '✓' : '—' }}</td>
            <td>{{ t.showControls ? '✓' : '—' }}</td>
            <td>{{ t.sortOrder }}</td>
            <td><span :class="['badge', t.status === 1 ? 'badge-success' : 'badge-muted']">{{ t.status === 1 ? '启用' : '停用' }}</span></td>
            <td class="actions">
              <button class="btn-sm" @click="openTemplateDialog(t)">编辑</button>
              <button class="btn-sm" @click="toggleTemplate(t)">{{ t.status === 1 ? '停用' : '启用' }}</button>
              <button class="btn-sm btn-danger" @click="removeTemplate(t)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 装饰素材 -->
    <div v-if="activeTab === 'assets'">
      <div class="toolbar">
        <button class="btn btn-primary" @click="openAssetDialog()">+ 新增素材</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>名称</th><th>类型</th><th>分类</th><th>排序</th><th>状态</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assets" :key="a.id">
            <td>{{ a.id }}</td>
            <td>{{ a.name }}</td>
            <td>{{ a.type }}</td>
            <td>{{ a.category }}</td>
            <td>{{ a.sortOrder }}</td>
            <td><span :class="['badge', a.status === 1 ? 'badge-success' : 'badge-muted']">{{ a.status === 1 ? '启用' : '停用' }}</span></td>
            <td class="actions">
              <button class="btn-sm" @click="openAssetDialog(a)">编辑</button>
              <button class="btn-sm" @click="toggleAsset(a)">{{ a.status === 1 ? '停用' : '启用' }}</button>
              <button class="btn-sm btn-danger" @click="removeAsset(a)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 用户作品 -->
    <div v-if="activeTab === 'creations'">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>用户ID</th><th>标题</th><th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in creations.list" :key="c.id">
            <td>{{ c.id }}</td>
            <td>{{ c.userId }}</td>
            <td>{{ c.title || '(无标题)' }}</td>
            <td>{{ c.createdAt }}</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <span>共 {{ creations.total }} 条</span>
        <button :disabled="creations.page <= 1" @click="loadCreations(creations.page - 1)">上一页</button>
        <span>{{ creations.page }}</span>
        <button @click="loadCreations(creations.page + 1)">下一页</button>
      </div>
    </div>

    <!-- 模板弹窗 -->
    <div v-if="templateDialog" class="modal-mask" @click.self="templateDialog = false">
      <div class="modal-panel">
        <h3>{{ templateForm.id ? '编辑模板' : '新增模板' }}</h3>
        <div class="form-group"><label>名称</label><input v-model="templateForm.name" class="form-input" /></div>
        <div class="form-group"><label>描述</label><input v-model="templateForm.description" class="form-input" /></div>
        <div class="form-row">
          <div class="form-group"><label>封面比例</label><input v-model.number="templateForm.coverSize" class="form-input" type="number" step="0.01" /></div>
          <div class="form-group"><label>圆角</label><input v-model.number="templateForm.albumArtBorderRadius" class="form-input" type="number" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>标题字号</label><input v-model.number="templateForm.titleSize" class="form-input" type="number" /></div>
          <div class="form-group"><label>艺术家字号</label><input v-model.number="templateForm.artistSize" class="form-input" type="number" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>字体</label><select v-model="templateForm.fontFamily" class="form-input"><option value="sans-serif">sans-serif</option><option value="serif">serif</option><option value="monospace">monospace</option></select></div>
          <div class="form-group"><label>排序</label><input v-model.number="templateForm.sortOrder" class="form-input" type="number" /></div>
        </div>
        <div class="form-checks">
          <label><input v-model="templateForm.showProgress" type="checkbox" :true-value="1" :false-value="0" /> 显示进度条</label>
          <label><input v-model="templateForm.showControls" type="checkbox" :true-value="1" :false-value="0" /> 显示控件</label>
          <label><input v-model="templateForm.showWaveform" type="checkbox" :true-value="1" :false-value="0" /> 显示波形</label>
          <label><input v-model="templateForm.showVinyl" type="checkbox" :true-value="1" :false-value="0" /> 黑胶样式</label>
        </div>
        <div class="form-group"><label>颜色配置 (JSON)</label><textarea v-model="templateForm.colors" class="form-input" rows="3" /></div>
        <div class="modal-actions">
          <button class="btn btn-default" @click="templateDialog = false">取消</button>
          <button class="btn btn-primary" @click="saveTemplate">保存</button>
        </div>
      </div>
    </div>

    <!-- 素材弹窗 -->
    <div v-if="assetDialog" class="modal-mask" @click.self="assetDialog = false">
      <div class="modal-panel">
        <h3>{{ assetForm.id ? '编辑素材' : '新增素材' }}</h3>
        <div class="form-group"><label>名称</label><input v-model="assetForm.name" class="form-input" /></div>
        <div class="form-row">
          <div class="form-group"><label>类型</label><select v-model="assetForm.type" class="form-input"><option value="sticker">sticker</option><option value="doodle">doodle</option><option value="tape">tape</option><option value="texture">texture</option><option value="background">background</option></select></div>
          <div class="form-group"><label>分类</label><select v-model="assetForm.category" class="form-input"><option value="shape">shape</option><option value="weather">weather</option><option value="cute">cute</option><option value="handdraw">handdraw</option><option value="tape">tape</option><option value="">(无)</option></select></div>
        </div>
        <div class="form-group"><label>配置 (JSON)</label><textarea v-model="assetForm.config" class="form-input" rows="3" placeholder='{"type":"star","defaultCount":8,"defaultSize":20}' /></div>
        <div class="form-group"><label>排序</label><input v-model.number="assetForm.sortOrder" class="form-input" type="number" /></div>
        <div class="modal-actions">
          <button class="btn btn-default" @click="assetDialog = false">取消</button>
          <button class="btn btn-primary" @click="saveAsset">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getMusicCardTemplates, createMusicCardTemplate, updateMusicCardTemplate, updateMusicCardTemplateStatus, deleteMusicCardTemplate, getMusicCardAssets, createMusicCardAsset, updateMusicCardAsset, updateMusicCardAssetStatus, deleteMusicCardAsset, getMusicCardCreations } from '../../api/admin'

const activeTab = ref('templates')
const templates = ref([])
const assets = ref([])
const creations = reactive({ list: [], total: 0, page: 1 })

const templateDialog = ref(false)
const templateForm = reactive({ id: null, name: '', description: '', coverSize: 0.4, showProgress: 1, showControls: 1, showWaveform: 0, showVinyl: 0, albumArtBorderRadius: 16, fontFamily: 'sans-serif', titleSize: 26, artistSize: 18, colors: '{}', sortOrder: 0 })

const assetDialog = ref(false)
const assetForm = reactive({ id: null, name: '', type: 'sticker', category: 'shape', config: '{}', sortOrder: 0 })

// ---- 模板 ----
async function loadTemplates() {
  try { templates.value = (await getMusicCardTemplates()).list || [] } catch (e) { console.error(e) }
}
function openTemplateDialog(item) {
  Object.assign(templateForm, item ? { ...item } : { id: null, name: '', description: '', coverSize: 0.4, showProgress: 1, showControls: 1, showWaveform: 0, showVinyl: 0, albumArtBorderRadius: 16, fontFamily: 'sans-serif', titleSize: 26, artistSize: 18, colors: '{}', sortOrder: 0 })
  templateDialog.value = true
}
async function saveTemplate() {
  try {
    const data = { ...templateForm }
    delete data.id
    if (templateForm.id) await updateMusicCardTemplate(templateForm.id, data)
    else await createMusicCardTemplate(data)
    templateDialog.value = false
    loadTemplates()
  } catch (e) { alert(e.message || '保存失败') }
}
async function toggleTemplate(t) {
  try { await updateMusicCardTemplateStatus(t.id, t.status === 1 ? 0 : 1); loadTemplates() } catch (e) { alert(e.message) }
}
async function removeTemplate(t) {
  if (!confirm(`确定删除模板「${t.name}」？`)) return
  try { await deleteMusicCardTemplate(t.id); loadTemplates() } catch (e) { alert(e.message) }
}

// ---- 素材 ----
async function loadAssets() {
  try { assets.value = (await getMusicCardAssets()).list || [] } catch (e) { console.error(e) }
}
function openAssetDialog(item) {
  Object.assign(assetForm, item ? { ...item } : { id: null, name: '', type: 'sticker', category: 'shape', config: '{}', sortOrder: 0 })
  assetDialog.value = true
}
async function saveAsset() {
  try {
    const data = { ...assetForm }
    delete data.id
    if (assetForm.id) await updateMusicCardAsset(assetForm.id, data)
    else await createMusicCardAsset(data)
    assetDialog.value = false
    loadAssets()
  } catch (e) { alert(e.message || '保存失败') }
}
async function toggleAsset(a) {
  try { await updateMusicCardAssetStatus(a.id, a.status === 1 ? 0 : 1); loadAssets() } catch (e) { alert(e.message) }
}
async function removeAsset(a) {
  if (!confirm(`确定删除素材「${a.name}」？`)) return
  try { await deleteMusicCardAsset(a.id); loadAssets() } catch (e) { alert(e.message) }
}

// ---- 作品 ----
async function loadCreations(page = 1) {
  try { const r = await getMusicCardCreations({ page, limit: 20 }); creations.list = r.list || []; creations.total = r.total || 0; creations.page = page } catch (e) { console.error(e) }
}

onMounted(() => { loadTemplates(); loadAssets(); loadCreations() })
</script>

<style scoped>
.mc-manage { padding: 24px; }
.page-title { margin: 0 0 20px; font-size: 24px; }
.tab-bar { display: flex; gap: 8px; margin-bottom: 20px; }
.tab-bar button { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
.tab-bar button.active { background: #5f8564; color: #fff; border-color: #5f8564; }
.toolbar { margin-bottom: 12px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; }
.data-table th { background: #f9faf5; font-weight: 600; }
.actions { white-space: nowrap; }
.actions button { margin-right: 4px; }
.badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.badge-success { background: #e4f2e5; color: #4f7356; }
.badge-muted { background: #f0f0f0; color: #999; }
.btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; background: #fff; }
.btn-primary { background: #5f8564; color: #fff; border-color: #5f8564; }
.btn-danger { color: #c44; }
.btn-sm { padding: 4px 10px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #fff; }
.pagination { margin-top: 16px; display: flex; gap: 12px; align-items: center; font-size: 14px; }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-panel { background: #fff; border-radius: 12px; padding: 24px; width: 560px; max-height: 80vh; overflow-y: auto; }
.modal-panel h3 { margin: 0 0 16px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.form-input { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.form-checks { display: flex; gap: 16px; margin-bottom: 12px; font-size: 13px; flex-wrap: wrap; }
.form-checks label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
</style>
