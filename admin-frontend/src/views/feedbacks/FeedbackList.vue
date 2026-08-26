<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">反馈管理</h2>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar">
          <select v-model="filterStatus" @change="search">
            <option :value="null">全部状态</option>
            <option :value="0">未处理</option>
            <option :value="1">已处理</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>用户</th><th>内容 / 回复</th><th>状态</th><th>时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fb in list" :key="fb.id">
              <td>{{ fb.id }}</td>
              <td>{{ userNicknames[fb.userId] || (fb.userId ? '用户#' + fb.userId : '匿名') }}</td>
              <td style="max-width:360px;white-space:normal;word-break:break-all">
                <div>{{ fb.content }}</div>
                <div v-if="fb.reply" style="margin-top:8px;padding:8px 10px;background:#f3f8f4;border-radius:6px;color:#39734a">回复：{{ fb.reply }}</div>
              </td>
              <td><span :class="['tag', fb.status === 1 ? 'tag-success' : 'tag-warning']">{{ fb.status === 1 ? '已处理' : '未处理' }}</span></td>
              <td class="text-sm">{{ fb.createdAt }}</td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-success" @click="handleReply(fb)">{{ fb.reply ? '修改回复' : '回复' }}</button>
                  <button class="btn btn-sm" :class="fb.status === 1 ? 'btn-default' : 'btn-success'" @click="toggleStatus(fb)">
                    {{ fb.status === 1 ? '标记未处理' : '标记已处理' }}
                  </button>
                  <button class="btn btn-danger btn-sm" @click="handleDelete(fb)">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="list.length === 0">
              <td colspan="6" style="text-align:center;padding:32px;color:#999">暂无反馈</td>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFeedbacks, updateFeedbackStatus, replyFeedback, deleteFeedback } from '../../api/admin'

const list = ref([])
const userNicknames = ref({})
const total = ref(0)
const page = ref(1)
const limit = 20
const filterStatus = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

onMounted(loadData)

async function loadData() {
  try {
    const params = { page: page.value, limit }
    if (filterStatus.value !== null) params.status = filterStatus.value
    const res = await getFeedbacks(params)
    list.value = res.list || []
    userNicknames.value = res.userNicknames || {}
    total.value = res.total || 0
  } catch (e) { console.error(e) }
}

function search() { page.value = 1; loadData() }
function changePage(p) { page.value = p; loadData() }

async function toggleStatus(fb) {
  const newStatus = fb.status === 1 ? 0 : 1
  await updateFeedbackStatus(fb.id, newStatus)
  loadData()
}

async function handleReply(fb) {
  const reply = prompt('请输入回复内容（用户将在小程序中看到）', fb.reply || '')
  if (reply === null) return
  if (!reply.trim()) {
    alert('回复内容不能为空')
    return
  }
  await replyFeedback(fb.id, reply.trim())
  loadData()
}

async function handleDelete(fb) {
  if (!confirm('确定删除此反馈吗？')) return
  await deleteFeedback(fb.id)
  loadData()
}
</script>
