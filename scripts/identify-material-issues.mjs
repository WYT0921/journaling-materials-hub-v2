import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { resolveIssueCandidate } from './lib/material-issue-parser.mjs'

const apiBase = (process.env.MATERIAL_API_BASE || 'https://shouzhangku.store/api').replace(/\/$/, '')
const token = process.env.ADMIN_TOKEN
if (!token) throw new Error('请通过临时环境变量 ADMIN_TOKEN 提供管理端令牌')

const outputArgIndex = process.argv.indexOf('--output')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19)
const outputPath = outputArgIndex >= 0
  ? path.resolve(process.argv[outputArgIndex + 1])
  : path.resolve('release', `material-issue-recognition-${timestamp}.json`)

async function fetchMaterials() {
  const materials = []
  for (let page = 1; ; page++) {
    const response = await fetch(`${apiBase}/v2/admin/materials?page=${page}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`管理 API 请求失败: HTTP ${response.status}`)
    const payload = await response.json()
    if (!payload.success) throw new Error(payload.error?.message || '管理 API 返回失败')
    const list = payload.data?.list || []
    materials.push(...list)
    if (materials.length >= Number(payload.data?.total || 0) || list.length === 0) return materials
  }
}

function collectObjects(value, result = []) {
  if (Array.isArray(value)) value.forEach(item => collectObjects(item, result))
  else if (value && typeof value === 'object') {
    result.push(value)
    Object.values(value).forEach(item => collectObjects(item, result))
  }
  return result
}

async function loadReportIndex() {
  const index = new Map()
  const files = (await readdir(path.resolve('release'))).filter(name => name.endsWith('.json'))
  for (const file of files) {
    try {
      const content = JSON.parse(await readFile(path.resolve('release', file), 'utf8'))
      for (const item of collectObjects(content)) {
        const keys = [item.id, item.materialId, item.recordId, item.title]
          .filter(value => value !== undefined && value !== null && value !== '')
          .map(String)
        for (const key of keys) {
          const entries = index.get(key) || []
          entries.push({ file, text: JSON.stringify(item) })
          index.set(key, entries)
        }
      }
    } catch {
      // 非 JSON、编码异常或不完整的历史报告不阻断其他报告识别。
    }
  }
  return index
}

const materials = await fetchMaterials()
const reportIndex = await loadReportIndex()
const records = materials.map(material => {
  const sources = [
    { source: 'title', text: material.title },
    { source: 'description', text: material.description },
    { source: 'tags', text: typeof material.tags === 'string' ? material.tags : JSON.stringify(material.tags || []) }
  ]
  const reports = [
    ...(reportIndex.get(String(material.id)) || []),
    ...(reportIndex.get(String(material.title)) || [])
  ]
  reports.forEach(report => sources.push({ source: `report:${report.file}`, text: report.text }))
  return { materialId: material.id, title: material.title, ...resolveIssueCandidate(sources) }
})

const summary = records.reduce((acc, item) => {
  acc[item.confidence] = (acc[item.confidence] || 0) + 1
  return acc
}, {})
await writeFile(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), apiBase, summary, records }, null, 2), 'utf8')
console.log(JSON.stringify({ outputPath, total: records.length, summary }, null, 2))
