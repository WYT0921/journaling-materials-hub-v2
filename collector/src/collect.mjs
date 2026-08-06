import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { adapters } from './adapters.mjs'
import { processCandidates } from './core.mjs'

const collectorRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const acknowledged = process.argv.includes('--acknowledge-source-terms')
if (!acknowledged) {
  throw new Error('采集前请确认 robots.txt 与站点条款，然后添加 --acknowledge-source-terms')
}

const config = JSON.parse(await readFile(resolve(collectorRoot, 'config.json'), 'utf8'))
const allowedHosts = new Set(['cuteinternet.com', 'emojidb.org'])
for (const target of config.targets) {
  const parsed = new URL(target.url)
  if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname)) throw new Error(`目标不在允许列表: ${target.url}`)
  if (!adapters[target.source]) throw new Error(`未知来源适配器: ${target.source}`)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outputDir = resolve(collectorRoot, 'output', stamp)
await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
const candidates = [], pages = [], seen = new Set()

async function wait(ms) { return new Promise(resolveWait => setTimeout(resolveWait, ms)) }
async function snapshot(page) {
  return page.evaluate(() => ({
    clipboardTexts: [...document.querySelectorAll('[data-clipboard-text]')].map(node => node.getAttribute('data-clipboard-text')),
    copyTexts: [...document.querySelectorAll('button, [role="button"], [class*="copy"]')].map(node => node.textContent),
    emojiTexts: [...document.querySelectorAll('[class*="emoji"], [class*="kaomoji"], code')].map(node => node.textContent),
    bodyText: document.body?.innerText || ''
  }))
}

try {
  for (const target of config.targets) {
    const page = await browser.newPage()
    let lastError = null, extracted = []
    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 })
        const data = await snapshot(page)
        extracted = adapters[target.source](data)
        lastError = null
        break
      } catch (error) {
        lastError = error
        if (attempt < config.retries) await wait(config.delayMs)
      }
    }
    if (lastError) {
      pages.push({ source: target.source, url: target.url, status: 'failed', error: lastError.message })
    } else {
      const result = processCandidates(extracted, target.source, target.url, seen)
      candidates.push(...result.candidates)
      pages.push({ source: target.source, url: target.url, status: 'ok', extracted: extracted.length,
        accepted: result.candidates.length, duplicates: result.duplicates, filtered: result.filtered })
    }
    await page.close()
    await wait(config.delayMs)
  }
} finally {
  await browser.close()
}

const report = { createdAt: new Date().toISOString(), candidates: candidates.length, pages }
await writeFile(resolve(outputDir, 'candidates.json'), JSON.stringify({ items: candidates }, null, 2), 'utf8')
await writeFile(resolve(outputDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
process.stdout.write(`已输出 ${candidates.length} 条候选数据到 ${outputDir}\n`)
