<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">兑换码管理</h2>
      <button class="btn btn-primary" @click="openGenerateDialog">生成兑换码</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="search-bar">
          <input v-model="searchKeyword" placeholder="搜索兑换码" @keyup.enter="search" />
          <select v-model="filterStatus" @change="search">
            <option value="">全部状态</option>
            <option value="0">未使用</option>
            <option value="1">已使用</option>
            <option value="2">已作废</option>
          </select>
          <select v-model="filterType" @change="search">
            <option value="">全部类型</option>
            <option value="monthly">月度会员</option>
            <option value="yearly">年度会员</option>
            <option value="permanent">永久会员</option>
          </select>
          <button class="btn btn-default btn-sm" @click="search">搜索</button>
        </div>
      </div>

      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>兑换码</th>
              <th>类型</th>
              <th>状态</th>
              <th>使用用户</th>
              <th>使用时间</th>
              <th>过期时间</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in list" :key="item.id">
              <td>{{ item.id }}</td>
              <td><code class="code-text">{{ item.code }}</code></td>
              <td>{{ typeLabel(item.type) }}</td>
              <td>
                <span :class="['tag', statusClass(item.status)]">{{ statusLabel(item.status) }}</span>
              </td>
              <td>{{ item.userId || '-' }}</td>
              <td class="text-sm">{{ formatTime(item.usedTime) }}</td>
              <td class="text-sm">{{ formatTime(item.expireTime) }}</td>
              <td class="text-sm">{{ formatTime(item.createdAt) }}</td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-default btn-sm" @click="copyCode(item.code)">复制</button>
                  <button
                    v-if="item.status === 0"
                    class="btn btn-warning btn-sm"
                    @click="handleDisable(item)"
                  >
                    作废
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="9" class="empty-cell">暂无兑换码</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-body">
        <div class="pagination">
          <button :disabled="page === 1" @click="changePage(page - 1)">上一页</button>
          <span>第 <strong class="current">{{ page }}</strong> 页 / 共 {{ totalPages }} 页</span>
          <button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
        </div>
      </div>
    </div>

    <div v-if="generateDialogVisible" class="dialog-overlay" @click.self="generateDialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span>生成兑换码</span>
          <button class="dialog-close" @click="generateDialogVisible = false">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">会员类型</label>
            <select v-model="generateForm.type" class="form-select">
              <option value="monthly">月度会员</option>
              <option value="yearly">年度会员</option>
              <option value="permanent">永久会员</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">生成数量</label>
            <input v-model.number="generateForm.count" type="number" min="1" max="500" class="form-input" />
            <div class="form-help">一次最多生成 500 个，每个码只能使用一次。</div>
          </div>
          <div class="form-group">
            <label class="form-label">兑换码过期时间</label>
            <input v-model="generateForm.expireTime" type="datetime-local" class="form-input" />
            <div class="form-help">留空表示兑换码本身不过期。</div>
          </div>
          <div v-if="generatedCodes.length" class="generated-box">
            <div class="generated-title">刚生成的兑换码</div>
            <textarea class="generated-textarea" :value="generatedCodesText" readonly />
            <button class="btn btn-default btn-sm" @click="copyCode(generatedCodesText)">复制全部</button>
          </div>
          <div class="form-actions">
            <button class="btn btn-default" @click="generateDialogVisible = false">关闭</button>
            <button class="btn btn-primary" :disabled="isGenerating" @click="handleGenerate">
              {{ isGenerating ? '生成中...' : '生成' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { disableRedeemCode, generateRedeemCodes, getRedeemCodes } from '../../api/admin'

const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const generateDialogVisible = ref(false)
const isGenerating = ref(false)
const generatedCodes = ref([])

const generateForm = reactive({
  type: 'monthly',
  count: 1,
  expireTime: ''
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const generatedCodesText = computed(() => generatedCodes.value.map(item => item.code).join('\n'))

onMounted(loadData)

async function loadData() {
  try {
    const params = { page: page.value, limit }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value !== '') params.status = filterStatus.value
    if (filterType.value) params.type = filterType.value
    const res = await getRedeemCodes(params)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    alert(e.message || '加载失败')
  }
}

function search() {
  page.value = 1
  loadData()
}

function changePage(p) {
  page.value = p
  loadData()
}

function openGenerateDialog() {
  generatedCodes.value = []
  generateForm.type = 'monthly'
  generateForm.count = 1
  generateForm.expireTime = ''
  generateDialogVisible.value = true
}

async function handleGenerate() {
  if (!generateForm.count || generateForm.count < 1 || generateForm.count > 500) {
    alert('生成数量必须在 1 到 500 之间')
    return
  }
  try {
    isGenerating.value = true
    const payload = {
      type: generateForm.type,
      count: generateForm.count
    }
    if (generateForm.expireTime) {
      payload.expireTime = generateForm.expireTime + ':00'
    }
    const res = await generateRedeemCodes(payload)
    generatedCodes.value = res.list || []
    loadData()
  } catch (e) {
    alert(e.message || '生成失败')
  } finally {
    isGenerating.value = false
  }
}

async function handleDisable(item) {
  if (!confirm(`确定作废兑换码 ${item.code} 吗？`)) return
  try {
    await disableRedeemCode(item.id)
    loadData()
  } catch (e) {
    alert(e.message || '作废失败')
  }
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code)
    alert('已复制')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = code
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制')
  }
}

function typeLabel(type) {
  const map = { monthly: '月度会员', yearly: '年度会员', permanent: '永久会员' }
  return map[type] || type
}

function statusLabel(status) {
  const map = { 0: '未使用', 1: '已使用', 2: '已作废' }
  return map[status] || status
}

function statusClass(status) {
  const map = { 0: 'tag-success', 1: 'tag-default', 2: 'tag-danger' }
  return map[status] || 'tag-default'
}

function formatTime(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').substring(0, 19)
}
</script>

<style scoped>
.code-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  color: #111;
}

.empty-cell {
  padding: 32px;
  text-align: center;
  color: #999;
}

.form-help {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

.generated-box {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fafafa;
}

.generated-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.generated-textarea {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  box-sizing: border-box;
}
</style>
