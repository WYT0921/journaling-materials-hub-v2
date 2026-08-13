<template>
  <section class="page">
    <header class="page-header">
      <div><h1>采集记录</h1><p>每日素材采集、AI 处理与待审核入库状态</p></div>
      <button :disabled="loading" @click="loadData">{{ loading ? '刷新中…' : '刷新' }}</button>
    </header>

    <div v-if="error" class="error" role="alert">{{ error }}</div>
    <div class="summary">
      <article><span>最近状态</span><strong>{{ statusLabel(list[0]?.status) }}</strong></article>
      <article><span>最近新增</span><strong>{{ list[0]?.insertedCount || 0 }}</strong></article>
      <article><span>AI 未完成</span><strong>{{ list[0]?.aiFailedCount || 0 }}</strong></article>
      <article><span>运行总数</span><strong>{{ total }}</strong></article>
    </div>

    <div class="table-card">
      <table>
        <thead><tr><th>开始时间</th><th>触发方式</th><th>状态</th><th>采集</th><th>候选</th><th>过滤</th><th>重复</th><th>新增待审核</th><th>AI失败</th><th>错误摘要</th></tr></thead>
        <tbody>
          <tr v-for="item in list" :key="item.id">
            <td>{{ item.startedAt }}</td><td>{{ triggerLabel(item.triggerType) }}</td>
            <td><span class="status" :class="`status--${item.status}`">{{ statusLabel(item.status) }}</span></td>
            <td>{{ item.collectedCount }}</td><td>{{ item.candidateCount }}</td><td>{{ item.filteredCount }}</td>
            <td>{{ item.duplicateCount }}</td><td>{{ item.insertedCount }}</td><td>{{ item.aiFailedCount }}</td>
            <td class="error-cell" :title="item.errorSummary">{{ item.errorSummary || '—' }}</td>
          </tr>
          <tr v-if="!loading && !list.length"><td colspan="10" class="empty">暂无采集记录</td></tr>
        </tbody>
      </table>
    </div>
    <footer class="pagination">
      <button :disabled="page <= 1 || loading" @click="changePage(-1)">上一页</button>
      <span>第 {{ page }} 页 · 共 {{ total }} 条</span>
      <button :disabled="page * limit >= total || loading" @click="changePage(1)">下一页</button>
    </footer>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getCollectorRuns } from '../../api/admin'
const list = ref([]); const total = ref(0); const page = ref(1); const limit = 20; const loading = ref(false); const error = ref('')
const statusLabel = status => ({ running: '运行中', succeeded: '成功', partial: '部分成功', failed: '失败' }[status] || '暂无')
const triggerLabel = trigger => ({ scheduled: '定时', manual: '手动', 'dry-run': '试运行' }[trigger] || trigger)
async function loadData() { loading.value = true; error.value = ''; try { const result = await getCollectorRuns({ page: page.value, limit }); list.value = result.list || []; total.value = result.total || 0 } catch (e) { error.value = e.message || '加载采集记录失败' } finally { loading.value = false } }
function changePage(delta) { page.value += delta; loadData() }
onMounted(loadData)
</script>

<style scoped>
.page { color:#30343b }.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.page-header h1{margin:0;font-size:28px}.page-header p{margin:8px 0 0;color:#7a818c}.page-header button,.pagination button{min-height:40px;padding:0 18px;border:1px solid #d9dde4;border-radius:8px;background:#fff;cursor:pointer}.page-header button:disabled,.pagination button:disabled{opacity:.45;cursor:not-allowed}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}.summary article{padding:18px;border:1px solid #e4e7ec;border-radius:10px;background:#fff}.summary span,.summary strong{display:block}.summary span{color:#777f8a;font-size:13px}.summary strong{margin-top:8px;font-size:24px}.table-card{overflow:auto;border:1px solid #e4e7ec;border-radius:10px;background:#fff}table{width:100%;min-width:1100px;border-collapse:collapse}th,td{padding:13px 14px;border-bottom:1px solid #edf0f3;text-align:left;font-size:13px}th{color:#626a75;background:#f8f9fb}.status{display:inline-block;padding:4px 9px;border-radius:999px;font-weight:600}.status--running{color:#315b91;background:#e8f1fc}.status--succeeded{color:#28794a;background:#e7f6ed}.status--partial{color:#8a621d;background:#fff3d8}.status--failed{color:#9a3d45;background:#fdebed}.error-cell{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty{padding:48px;text-align:center;color:#8a919b}.error{margin-bottom:16px;padding:12px 16px;border-radius:8px;color:#8e3640;background:#fdecef}.pagination{display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-top:18px;color:#6f7680}@media(max-width:900px){.summary{grid-template-columns:repeat(2,1fr)}.page-header{align-items:flex-start;gap:16px}}
</style>
