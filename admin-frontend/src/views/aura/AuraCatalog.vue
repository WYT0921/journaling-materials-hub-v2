<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">AURA 音乐卡片</h2>
        <p class="page-subtitle">维护 App 使用的版本化模板、装饰、纹理和字体资源</p>
      </div>
      <button class="btn btn-primary" @click="openDialog()">+ 新增{{ activeTab === 'templates' ? '模板' : '资源' }}</button>
    </div>

    <div class="aura-tabs">
      <button :class="{ active: activeTab === 'templates' }" @click="activeTab = 'templates'">播放器模板</button>
      <button :class="{ active: activeTab === 'assets' }" @click="activeTab = 'assets'">装饰与资源</button>
    </div>

    <div class="card" v-if="activeTab === 'templates'">
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>预览</th><th>键 / 名称</th><th>风格</th><th>比例</th><th>版本</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in templates" :key="item.id">
              <td><img v-if="item.previewUrl" :src="item.previewUrl" class="aura-preview" /><span v-else>—</span></td>
              <td><strong>{{ item.name }}</strong><small>{{ item.templateKey }}</small></td>
              <td>{{ styleLabels[item.style] || item.style }}</td>
              <td>{{ parseRatios(item.supportedRatios).join(' / ') }}</td>
              <td>v{{ item.configVersion }}</td><td>{{ item.sortOrder }}</td>
              <td><span :class="['tag', item.status === 1 ? 'tag-success' : 'tag-default']">{{ item.status === 1 ? '已上架' : '草稿' }}</span></td>
              <td><div class="flex gap-2"><button class="btn btn-default btn-sm" @click="openDialog(item)">编辑</button><button class="btn btn-default btn-sm" @click="toggleTemplate(item)">{{ item.status === 1 ? '下架' : '上架' }}</button><button class="btn btn-danger btn-sm" @click="removeTemplate(item)">删除</button></div></td>
            </tr>
            <tr v-if="!templates.length"><td colspan="8" class="empty-row">暂无模板</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" v-else>
      <div class="card-header"><select v-model="assetFilter" @change="loadAssets"><option value="">全部资源</option><option value="decoration">装饰</option><option value="texture">纹理</option><option value="font">字体</option></select></div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead><tr><th>预览</th><th>键 / 名称</th><th>类型</th><th>版本</th><th>SHA-256</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in assets" :key="item.id">
              <td><img v-if="item.previewUrl || item.type !== 'font'" :src="item.previewUrl || item.fileUrl" class="aura-preview" /><span v-else>Aa</span></td>
              <td><strong>{{ item.name }}</strong><small>{{ item.assetKey }}</small></td>
              <td>{{ assetTypeLabels[item.type] || item.type }}</td><td>v{{ item.resourceVersion }}</td><td class="hash">{{ item.sha256 }}</td><td>{{ item.sortOrder }}</td>
              <td><span :class="['tag', item.status === 1 ? 'tag-success' : 'tag-default']">{{ item.status === 1 ? '已上架' : '草稿' }}</span></td>
              <td><div class="flex gap-2"><button class="btn btn-default btn-sm" @click="openDialog(item)">编辑</button><button class="btn btn-default btn-sm" @click="toggleAsset(item)">{{ item.status === 1 ? '下架' : '上架' }}</button><button class="btn btn-danger btn-sm" @click="removeAsset(item)">删除</button></div></td>
            </tr>
            <tr v-if="!assets.length"><td colspan="8" class="empty-row">暂无资源</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="dialogVisible" class="dialog-overlay" @click.self="dialogVisible = false">
      <div class="dialog aura-dialog">
        <div class="dialog-header"><span>{{ editingId ? '编辑' : '新增' }}{{ activeTab === 'templates' ? '模板' : '资源' }}</span><button class="dialog-close" @click="dialogVisible = false">&times;</button></div>
        <div class="dialog-body">
          <template v-if="activeTab === 'templates'">
            <div class="form-grid"><label>稳定键<input v-model.trim="templateForm.templateKey" class="form-input" placeholder="fresh-rounded" /></label><label>名称<input v-model.trim="templateForm.name" class="form-input" /></label><label>风格<select v-model="templateForm.style" class="form-select"><option v-for="(label,key) in styleLabels" :key="key" :value="key">{{ label }}</option></select></label><label>配置版本<input v-model.number="templateForm.configVersion" type="number" min="1" class="form-input" /></label><label class="span-2">预览 URL<input v-model.trim="templateForm.previewUrl" class="form-input" /></label><label>支持比例<div class="ratio-checks"><span v-for="ratio in allRatios" :key="ratio"><input v-model="templateForm.supportedRatios" type="checkbox" :value="ratio" /> {{ ratio }}</span></div></label><label>排序<input v-model.number="templateForm.sortOrder" type="number" class="form-input" /></label></div>
            <label class="json-label">模板 JSON<textarea v-model="templateForm.configText" class="form-input json-input" spellcheck="false"></textarea></label>
          </template>
          <template v-else>
            <div class="upload-box"><input type="file" accept=".png,.jpg,.jpeg,.webp,.ttf,.otf" @change="handleUpload" /><span>{{ uploading ? '正在上传…' : '上传后自动填写 URL 和 SHA-256' }}</span></div>
            <div class="form-grid"><label>稳定键<input v-model.trim="assetForm.assetKey" class="form-input" placeholder="sparkle-soft" /></label><label>名称<input v-model.trim="assetForm.name" class="form-input" /></label><label>类型<select v-model="assetForm.type" class="form-select"><option v-for="(label,key) in assetTypeLabels" :key="key" :value="key">{{ label }}</option></select></label><label>资源版本<input v-model.number="assetForm.resourceVersion" type="number" min="1" class="form-input" /></label><label class="span-2">文件 URL<input v-model.trim="assetForm.fileUrl" class="form-input" /></label><label class="span-2">预览 URL<input v-model.trim="assetForm.previewUrl" class="form-input" /></label><label class="span-2">SHA-256<input v-model.trim="assetForm.sha256" class="form-input" /></label><label>排序<input v-model.number="assetForm.sortOrder" type="number" class="form-input" /></label></div>
            <label class="json-label">元数据 JSON<textarea v-model="assetForm.metadataText" class="form-input json-input small" spellcheck="false"></textarea></label>
          </template>
          <div class="form-actions"><button class="btn btn-default" @click="dialogVisible = false">取消</button><button class="btn btn-primary" @click="save">保存</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { createAuraAsset, createAuraTemplate, deleteAuraAsset, deleteAuraTemplate, getAuraAssets, getAuraTemplates, updateAuraAsset, updateAuraAssetStatus, updateAuraTemplate, updateAuraTemplateStatus, uploadAuraAsset } from '../../api/admin'

const activeTab = ref('templates'), templates = ref([]), assets = ref([]), assetFilter = ref(''), dialogVisible = ref(false), editingId = ref(null), uploading = ref(false)
const allRatios = ['1:1', '4:3', '9:16']
const styleLabels = { fresh: '清新圆角', cute: '可爱粉色', vintage: '复古纸质', vinyl: '黑胶唱片', waveform: '波形线' }
const assetTypeLabels = { decoration: '装饰', texture: '纹理', font: '字体' }
const defaultConfig = { layers: [{ id: 'background-main', type: 'background', x: 0, y: 0, width: 1, height: 1 }, { id: 'photo-main', type: 'photo', x: 0.05, y: 0.42, width: 0.9, height: 0.53 }, { id: 'player-main', type: 'player', x: 0.08, y: 0.08, width: 0.84, height: 0.28 }] }
const templateForm = reactive({ templateKey: '', name: '', style: 'fresh', previewUrl: '', supportedRatios: [...allRatios], configVersion: 1, sortOrder: 0, status: 0, configText: JSON.stringify(defaultConfig, null, 2) })
const assetForm = reactive({ assetKey: '', name: '', type: 'decoration', fileUrl: '', previewUrl: '', sha256: '', resourceVersion: 1, sortOrder: 0, status: 0, metadataText: '{}' })

onMounted(() => Promise.all([loadTemplates(), loadAssets()]))
watch(activeTab, () => { editingId.value = null })
async function loadTemplates() { templates.value = await getAuraTemplates() }
async function loadAssets() { assets.value = await getAuraAssets(assetFilter.value) }
function parseJson(value, fallback) { try { return typeof value === 'string' ? JSON.parse(value) : value || fallback } catch { return fallback } }
function parseRatios(value) { return parseJson(value, []) }
function openDialog(item) {
  editingId.value = item?.id || null
  if (activeTab.value === 'templates') Object.assign(templateForm, item ? { ...item, supportedRatios: parseRatios(item.supportedRatios), configText: JSON.stringify(parseJson(item.configJson, {}), null, 2) } : { templateKey: '', name: '', style: 'fresh', previewUrl: '', supportedRatios: [...allRatios], configVersion: 1, sortOrder: 0, status: 0, configText: JSON.stringify(defaultConfig, null, 2) })
  else Object.assign(assetForm, item ? { ...item, metadataText: JSON.stringify(parseJson(item.metadataJson, {}), null, 2) } : { assetKey: '', name: '', type: 'decoration', fileUrl: '', previewUrl: '', sha256: '', resourceVersion: 1, sortOrder: 0, status: 0, metadataText: '{}' })
  dialogVisible.value = true
}
async function save() {
  try {
    if (activeTab.value === 'templates') {
      const payload = { ...templateForm, config: JSON.parse(templateForm.configText) }; delete payload.configText
      editingId.value ? await updateAuraTemplate(editingId.value, payload) : await createAuraTemplate(payload); await loadTemplates()
    } else {
      const payload = { ...assetForm, metadata: JSON.parse(assetForm.metadataText) }; delete payload.metadataText
      editingId.value ? await updateAuraAsset(editingId.value, payload) : await createAuraAsset(payload); await loadAssets()
    }
    dialogVisible.value = false
  } catch (error) { alert(error instanceof SyntaxError ? 'JSON 格式错误' : error.message || '保存失败') }
}
async function handleUpload(event) { const file = event.target.files?.[0]; if (!file) return; uploading.value = true; try { const result = await uploadAuraAsset(file); assetForm.fileUrl = result.fileUrl; assetForm.sha256 = result.sha256 } catch (e) { alert(e.message || '上传失败') } finally { uploading.value = false; event.target.value = '' } }
async function toggleTemplate(item) { await updateAuraTemplateStatus(item.id, item.status === 1 ? 0 : 1); await loadTemplates() }
async function toggleAsset(item) { await updateAuraAssetStatus(item.id, item.status === 1 ? 0 : 1); await loadAssets() }
async function removeTemplate(item) { if (confirm(`确定删除模板「${item.name}」吗？`)) { await deleteAuraTemplate(item.id); await loadTemplates() } }
async function removeAsset(item) { if (confirm(`确定删除资源「${item.name}」吗？`)) { await deleteAuraAsset(item.id); await loadAssets() } }
</script>

<style scoped>
.page-subtitle{margin:6px 0 0;color:#888;font-size:13px}.aura-tabs{display:flex;gap:8px;margin-bottom:16px}.aura-tabs button{padding:10px 18px;border:1px solid #ddd;background:#fff;border-radius:6px;cursor:pointer}.aura-tabs button.active{color:#fff;background:#6f8f71;border-color:#6f8f71}.aura-preview{width:58px;height:58px;object-fit:cover;border-radius:8px;background:#f3f0ea}.data-table strong,.data-table small{display:block}.data-table small{margin-top:4px;color:#999}.hash{max-width:150px;font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis}.empty-row{text-align:center;padding:32px!important;color:#999}.aura-dialog{width:min(760px,90vw);max-height:90vh;overflow:auto}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.form-grid label,.json-label{font-size:13px;color:#555}.form-grid input,.form-grid select{margin-top:6px}.span-2{grid-column:span 2}.ratio-checks{display:flex;gap:14px;margin-top:12px}.json-label{display:block;margin-top:18px}.json-input{height:220px;margin-top:6px;font-family:monospace;line-height:1.5;resize:vertical}.json-input.small{height:100px}.upload-box{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding:14px;background:#f6f4ef;border:1px dashed #c9c1b5;border-radius:6px}.upload-box span{font-size:12px;color:#777}
</style>
