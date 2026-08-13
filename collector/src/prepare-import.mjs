import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) {
  throw new Error('用法: node src/prepare-import.mjs <candidates.json> <output-dir>')
}

const payload = JSON.parse(await readFile(resolve(inputPath), 'utf8'))
const items = Array.isArray(payload.items) ? payload.items : []
if (!items.length) throw new Error('候选数据为空')

await mkdir(resolve(outputPath), { recursive: true })
const batchSize = 500
for (let offset = 0; offset < items.length; offset += batchSize) {
  const batch = items.slice(offset, offset + batchSize)
  const filename = `batch-${String(offset / batchSize + 1).padStart(2, '0')}.json`
  await writeFile(resolve(outputPath, filename), JSON.stringify({ items: batch }), 'utf8')
}

process.stdout.write(`已将 ${items.length} 条候选拆分为 ${Math.ceil(items.length / batchSize)} 批\n`)
