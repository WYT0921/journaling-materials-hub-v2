import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { adapters } from './adapters.mjs'
import { contentHash, processCandidates } from './core.mjs'

export const DEFAULT_KEYWORDS = ['kaomoji', 'cute symbols', 'aesthetic symbols', 'emoji combo', 'kawaii emoticon', 'text divider', 'bio symbols', '顔文字']
const ALLOWED_CATEGORIES = {
  kaomoji: new Set(['可爱', '开心', '难过', '生气', '动物', '动作']),
  emoji: new Set(['爱心', '星星', '花朵', '天气', '食物', '装饰'])
}
const normalizeDecision = (decision, candidate) => {
  const type = decision?.type === 'kaomoji' || decision?.type === 'emoji' ? decision.type : candidate.type
  const category = ALLOWED_CATEGORIES[type]?.has(decision?.category) ? decision.category :
    (ALLOWED_CATEGORIES[type]?.has(candidate.category) ? candidate.category : type === 'kaomoji' ? '可爱' : '装饰')
  const riskLevel = decision?.riskLevel === 'mild' ? 'mild' : candidate.riskLevel === 'mild' ? 'mild' : 'safe'
  return { type, category, riskLevel }
}
export const splitDiscoveryText = text => [...new Set(String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean))]
export const threadsRecord = row => ({
  text: row.text || row.postText || row.post_text || row.text_content || row.caption || row.replyText || '',
  url: row.postUrl || row.post_url || row.url || row.threadUrl || '',
  createdAt: row.createdAt || row.created_at || row.postedAt || row.posted_at || null
})

async function browserSnapshot(page) {
  return page.evaluate(() => ({
    clipboardTexts: [...document.querySelectorAll('[data-clipboard-text]')].map(node => node.getAttribute('data-clipboard-text')),
    copyTexts: [...document.querySelectorAll('button, [role="button"], [class*="copy"]')].map(node => node.textContent),
    emojiTexts: [...document.querySelectorAll('[class*="emoji"], [class*="kaomoji"], code')].map(node => node.textContent),
    bodyText: document.body?.innerText || ''
  }))
}

export async function collectWeb(targets, { delayMs = 2000, retries = 2, browserFactory = () => chromium.launch({ headless: true }) } = {}) {
  const browser = await browserFactory(); const candidates = []; const pages = []; const seen = new Set()
  try {
    for (const target of targets) {
      const page = await browser.newPage(); let error; let extracted = []
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        try { await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 }); extracted = adapters[target.source](await browserSnapshot(page)); error = null; break }
        catch (caught) { error = caught; if (attempt < retries) await new Promise(resolveWait => setTimeout(resolveWait, delayMs)) }
      }
      if (error) pages.push({ source: target.source, status: 'failed', error: error.message })
      else { const result = processCandidates(extracted, target.source, target.url, seen); candidates.push(...result.candidates); pages.push({ source: target.source, status: 'ok', collected: extracted.length, candidates: result.candidates.length, duplicates: result.duplicates, filtered: Object.values(result.filtered).reduce((a, b) => a + b, 0) }) }
      await page.close(); await new Promise(resolveWait => setTimeout(resolveWait, delayMs))
    }
  } finally { await browser.close() }
  return { candidates, sources: pages }
}

export async function collectThreads(apify, keywords = DEFAULT_KEYWORDS) {
  const searchRows = (await apify.search(keywords, 25)).slice(0, 200)
  const search = searchRows.map(threadsRecord).filter(item => item.text)
  const replyUrls = [...new Set(search.map(item => item.url).filter(Boolean))].slice(0, 20)
  const replyRows = (await apify.replies(replyUrls, 20)).slice(0, 400)
  const records = [...search, ...replyRows.map(threadsRecord)].slice(0, 600)
  const candidates = []; const seen = new Set(); let filtered = 0, duplicates = 0
  for (const record of records) {
    const result = processCandidates(splitDiscoveryText(record.text), 'threads', record.url, seen)
    candidates.push(...result.candidates); duplicates += result.duplicates
    filtered += Object.values(result.filtered).reduce((a, b) => a + b, 0)
  }
  return { candidates, source: { source: 'threads', status: 'ok', collected: records.length, candidates: candidates.length, duplicates, filtered } }
}

export async function enrichWithAi(candidates, ai, batchSize = 20) {
  const output = []; let failed = 0
  for (let offset = 0; offset < candidates.length; offset += batchSize) {
    const batch = candidates.slice(offset, offset + batchSize)
    try {
      const decisions = await ai.classify(batch); const byIndex = new Map(decisions.map(item => [item.index, item]))
      batch.forEach((candidate, index) => {
        const decision = byIndex.get(index)
        if (!decision?.keep) return
        const normalized = normalizeDecision(decision, candidate)
        output.push({ ...candidate, ...normalized,
          tags: Array.isArray(decision.tags) ? decision.tags.filter(tag => typeof tag === 'string' && tag.trim()).slice(0, 5) : [],
          aiModel: ai.model, aiConfidence: Number.isFinite(Number(decision.confidence)) ? Math.max(0, Math.min(1, Number(decision.confidence))) : null,
          reviewNote: decision.reason || null })
      })
    } catch (error) {
      failed += batch.length
      output.push(...batch.map(item => ({ ...item, reviewNote: `AI 未完成：${error.message}` })))
    }
  }
  return { candidates: output, failed }
}

export const deduplicateCandidates = candidates => {
  const seen = new Set(); let duplicates = 0
  const unique = candidates.filter(item => { const hash = contentHash(item.content); if (seen.has(hash)) { duplicates += 1; return false } seen.add(hash); return true })
  return { candidates: unique, duplicates }
}

export async function writeReport(dataDir, runId, report) {
  const directory = resolve(dataDir, 'runs', String(runId)); await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  return directory
}
