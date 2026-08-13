import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) {
  throw new Error('用法: node src/prepare-import-sql.mjs <candidates.json> <output.sql>')
}

const payload = JSON.parse(await readFile(resolve(inputPath), 'utf8'))
const items = Array.isArray(payload.items) ? payload.items : []
if (!items.length) throw new Error('候选数据为空')

const sqlString = value => {
  if (value == null) return 'NULL'
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\u0000/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u001a/g, '\\Z')
    .replace(/'/g, "\\'")
  return `'${escaped}'`
}

const rows = items.map(item => {
  const content = String(item.content ?? '').replace(/\r\n?/g, '\n').normalize('NFC').trim()
  const hash = createHash('sha256').update(content, 'utf8').digest('hex')
  return `(${[
    sqlString(content), sqlString(hash), sqlString(item.type), sqlString(item.category),
    sqlString(JSON.stringify(item.tags || [])), sqlString(item.source), sqlString(item.sourceUrl),
    sqlString(item.riskLevel || 'safe'), '0', '0'
  ].join(', ')})`
})

const statements = []
for (let offset = 0; offset < rows.length; offset += 100) {
  statements.push(`INSERT IGNORE INTO text_assets\n  (content, content_hash, type, category, tags, source, source_url, risk_level, status, sort_order)\nVALUES\n  ${rows.slice(offset, offset + 100).join(',\n  ')};`)
}

const sql = ['SET NAMES utf8mb4;', 'START TRANSACTION;', ...statements, 'COMMIT;', ''].join('\n')
await writeFile(resolve(outputPath), sql, 'utf8')
process.stdout.write(`已生成 ${items.length} 条待审核素材的幂等事务 SQL\n`)
