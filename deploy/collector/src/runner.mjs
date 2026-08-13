import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { AiClient, ApifyClient, BackendClient } from './clients.mjs'
import { collectThreads, collectWeb, deduplicateCandidates, enrichWithAi, writeReport } from './pipeline.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const command = process.argv[2] || 'run-once'
const env = process.env
const config = JSON.parse(await readFile(env.COLLECTOR_CONFIG || resolve(root, 'config.json'), 'utf8'))
const dataDir = env.COLLECTOR_DATA_DIR || resolve(root, 'output')
const backend = new BackendClient({ baseUrl: env.BACKEND_URL || 'http://backend:8080', token: env.COLLECTOR_TOKEN })
const apify = new ApifyClient({ token: env.APIFY_TOKEN, actorId: env.APIFY_ACTOR_ID })
const ai = new AiClient({ baseUrl: env.AI_BASE_URL, apiKey: env.AI_API_KEY, model: env.AI_MODEL })

const sum = (sources, key) => sources.reduce((total, item) => total + Number(item[key] || 0), 0)
async function execute(trigger, dryRun = false) {
  const lockToken = randomUUID(); let runId = `dry-${Date.now()}`; const startedAt = new Date().toISOString(); const errors = []; let inserted = 0, backendDuplicates = 0, backendFiltered = 0, backendFailed = 0
  if (!dryRun) runId = (await backend.startRun({ triggerType: trigger, lockToken })).id
  const sources = []; const all = []
  try {
    try { const web = await collectWeb(config.targets, config); sources.push(...web.sources); all.push(...web.candidates) }
    catch (error) { errors.push(`web: ${error.message}`); sources.push({ source: 'web', status: 'failed', error: error.message }) }
    try { const threads = await collectThreads(apify); sources.push(threads.source); all.push(...threads.candidates) }
    catch (error) { errors.push(`threads: ${error.message}`); sources.push({ source: 'threads', status: 'failed', error: error.message }) }
    const limited = deduplicateCandidates(all).candidates.slice(0, 500)
    const enriched = await enrichWithAi(limited, ai)
    if (!dryRun) {
      for (let offset = 0; offset < enriched.candidates.length; offset += 500) {
        const result = await backend.importItems(enriched.candidates.slice(offset, offset + 500))
        inserted += Number(result.inserted || 0); backendDuplicates += Number(result.duplicates || 0)
        backendFiltered += Number(result.filtered || 0); backendFailed += Number(result.failed || 0)
        if (result.failed) errors.push(`backend import failed: ${result.failed}`)
      }
    }
    const status = errors.length ? (sources.some(item => item.status === 'ok') ? 'partial' : 'failed') : 'succeeded'
    const report = { runId, trigger, status, startedAt, finishedAt: new Date().toISOString(), dryRun,
      collectedCount: sum(sources, 'collected'), candidateCount: enriched.candidates.length,
      filteredCount: sum(sources, 'filtered') + backendFiltered, duplicateCount: sum(sources, 'duplicates') + backendDuplicates,
      insertedCount: inserted, aiFailedCount: enriched.failed, sources, errors }
    await writeReport(dataDir, runId, report)
    if (!dryRun) await backend.finishRun(runId, { ...report, sourceStats: sources, errorSummary: errors.join('; '), lockToken })
    process.stdout.write(`${JSON.stringify({ event: 'collector_complete', ...report })}\n`)
    return report
  } catch (error) {
    const report = { runId, trigger, status: 'failed', startedAt, finishedAt: new Date().toISOString(), dryRun, collectedCount: 0, candidateCount: 0, filteredCount: 0, duplicateCount: 0, insertedCount: inserted, aiFailedCount: 0, sources, errors: [...errors, error.message] }
    await writeReport(dataDir, runId, report)
    if (!dryRun && typeof runId === 'number') await backend.finishRun(runId, { ...report, sourceStats: sources, errorSummary: report.errors.join('; '), lockToken }).catch(() => {})
    throw error
  }
}

function nextDelay(cron = '30 2 * * *') {
  const [minute, hour] = cron.trim().split(/\s+/).map(Number)
  if (!Number.isInteger(minute) || !Number.isInteger(hour) || minute > 59 || hour > 23) throw new Error('COLLECTOR_CRON 仅支持“分 时 * * *”格式')
  const now = new Date(); const next = new Date(now); next.setHours(hour, minute, 0, 0); if (next <= now) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}
async function schedule() {
  if (String(env.COLLECTOR_ENABLED).toLowerCase() !== 'true') {
    process.stdout.write('{"event":"collector_disabled"}\n')
    setInterval(() => {}, 24 * 60 * 60 * 1000)
    return
  }
  const arm = () => setTimeout(async () => { try { await execute('scheduled') } catch (error) { console.error(error) } arm() }, nextDelay(env.COLLECTOR_CRON))
  arm(); process.stdout.write('{"event":"collector_scheduled"}\n')
}

if (command === 'dry-run') await execute('dry-run', true)
else if (command === 'run-once') await execute('manual')
else if (command === 'scheduled') await schedule()
else throw new Error(`未知命令: ${command}`)

export { execute, nextDelay }
