<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar">
          <input v-model="searchKeyword" placeholder="搜索昵称/手机号..." @keyup.enter="search" />
          <select v-model="filterStatus" @change="search">
            <option :value="null">全部状态</option>
            <option :value="1">正常</option>
            <option :value="0">禁用</option>
          </select>
          <select v-model="filterMemberType" @change="search">
            <option value="">全部会员</option>
            <option value="normal">普通用户</option>
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
              <th>ID</th><th>昵称</th><th>手机号</th><th>会员类型</th><th>会员到期</th><th>下载次数</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in list" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ u.nickname || '-' }}</td>
              <td>{{ u.phone || '-' }}</td>
              <td><span :class="['tag', u.memberType === 'normal' ? 'tag-default' : 'tag-warning']">{{ memberTypeLabel(u.memberType) }}</span></td>
              <td class="text-sm">{{ u.memberExpireTime || '-' }}</td>
              <td>{{ u.downloadCount }}</td>
              <td><span :class="['tag', u.status === 1 ? 'tag-success' : 'tag-danger']">{{ u.status === 1 ? '正常' : '禁用' }}</span></td>
              <td>
                <div class="flex gap-2">
                  <button class="btn btn-sm" :class="u.status === 1 ? 'btn-warning' : 'btn-success'" @click="toggleStatus(u)">
                    {{ u.status === 1 ? '禁用' : '启用' }}
                  </button>
                  <button class="btn btn-default btn-sm" @click="openMemberDialog(u)">会员</button>
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

    <!-- Member Dialog -->
    <div v-if="memberDialogVisible" class="dialog-overlay" @click.self="memberDialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span>调整会员 — {{ memberTarget?.nickname }}</span>
          <button class="dialog-close" @click="memberDialogVisible = false">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label class="form-label">会员类型</label>
            <select v-model="memberForm.memberType" class="form-select">
              <option value="normal">普通用户</option>
              <option value="monthly">月度会员</option>
              <option value="yearly">年度会员</option>
              <option value="permanent">永久会员</option>
            </select>
          </div>
          <div class="form-group" v-if="memberForm.memberType !== 'normal' && memberForm.memberType !== 'permanent'">
            <label class="form-label">到期时间</label>
            <input v-model="memberForm.memberExpireTime" type="datetime-local" class="form-input" />
          </div>
          <div class="form-actions">
            <button class="btn btn-default" @click="memberDialogVisible = false">取消</button>
            <button class="btn btn-primary" @click="handleMemberSave">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getUsers, updateUserStatus, updateUserMember } from '../../api/admin'

const list = ref([])
const total = ref(0)
const page = ref(1)
const limit = 20
const searchKeyword = ref('')
const filterStatus = ref(null)
const filterMemberType = ref('')
const memberDialogVisible = ref(false)
const memberTarget = ref(null)

const memberForm = reactive({ memberType: 'normal', memberExpireTime: '' })

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

onMounted(loadData)

async function loadData() {
  try {
    const params = { page: page.value, limit }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterStatus.value !== null) params.status = filterStatus.value
    if (filterMemberType.value) params.memberType = filterMemberType.value
    const res = await getUsers(params)
    list.value = res.list || []
    total.value = res.total || 0
  } catch (e) { console.error(e) }
}

function search() { page.value = 1; loadData() }
function changePage(p) { page.value = p; loadData() }

function memberTypeLabel(t) {
  const map = { normal: '普通', monthly: '月度', yearly: '年度', permanent: '永久' }
  return map[t] || t
}

async function toggleStatus(u) {
  const newStatus = u.status === 1 ? 0 : 1
  await updateUserStatus(u.id, newStatus)
  loadData()
}

function openMemberDialog(u) {
  memberTarget.value = u
  memberForm.memberType = u.memberType || 'normal'
  memberForm.memberExpireTime = u.memberExpireTime ? u.memberExpireTime.replace(' ', 'T').substring(0, 16) : ''
  memberDialogVisible.value = true
}

async function handleMemberSave() {
  try {
    const data = { memberType: memberForm.memberType }
    if (memberForm.memberExpireTime) {
      data.memberExpireTime = memberForm.memberExpireTime + ':00'
    }
    await updateUserMember(memberTarget.value.id, data)
    memberDialogVisible.value = false
    loadData()
  } catch (e) { alert(e.message || '保存失败') }
}
</script>
