import assert from 'node:assert/strict'
import test from 'node:test'
import { AiClient, ApifyClient, BackendClient } from '../src/clients.mjs'
import { collectThreads, deduplicateCandidates, enrichWithAi, splitDiscoveryText, threadsRecord } from '../src/pipeline.mjs'

const jsonResponse = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data })

test('Threads adapter accepts common post and reply field names without retaining usernames', () => {
  assert.deepEqual(threadsRecord({ post_text: '(｡･ω･｡)', post_url: 'https://threads.net/t/1', username: 'private' }),
    { text: '(｡･ω･｡)', url: 'https://threads.net/t/1', createdAt: null })
  assert.deepEqual(splitDiscoveryText('hello\n₊˚⊹♡\n₊˚⊹♡'), ['hello', '₊˚⊹♡'])
})

test('Threads orchestration searches then fetches replies and extracts candidates', async () => {
  const apify = {
    search: async () => [{ text: '(｡･ω･｡)', postUrl: 'https://threads.net/t/1' }],
    replies: async urls => { assert.deepEqual(urls, ['https://threads.net/t/1']); return [{ replyText: '₊˚⊹♡', threadUrl: urls[0] }] }
  }
  const result = await collectThreads(apify, ['kaomoji'])
  assert.equal(result.source.collected, 2)
  assert.equal(result.candidates.length, 2)
  assert.ok(result.candidates.every(item => item.source === 'threads'))
})

test('cross-source deduplication keeps the first normalized content', () => {
  const result = deduplicateCandidates([{ content: '♡', source: 'a' }, { content: '♡', source: 'b' }])
  assert.equal(result.candidates.length, 1); assert.equal(result.duplicates, 1)
})

test('AI enrichment applies structured decisions and falls back on failure', async () => {
  const source = [{ content: '(｡･ω･｡)', type: 'kaomoji', category: '可爱', tags: [], riskLevel: 'safe' }]
  const ai = { model: 'test-model', classify: async () => [{ index: 0, keep: true, type: 'kaomoji', category: '开心', tags: ['可爱'], riskLevel: 'safe', confidence: 0.9, reason: '有效' }] }
  const enriched = await enrichWithAi(source, ai)
  assert.equal(enriched.candidates[0].category, '开心'); assert.equal(enriched.candidates[0].aiModel, 'test-model'); assert.equal(enriched.failed, 0)
  const failed = await enrichWithAi(source, { model: 'x', classify: async () => { throw new Error('offline') } })
  assert.equal(failed.failed, 1); assert.match(failed.candidates[0].reviewNote, /offline/)
})

test('AI enrichment rejects invented types and categories', async () => {
  const source = [{ content: '₊˚⊹♡', type: 'emoji', category: '爱心', tags: [], riskLevel: 'safe' }]
  const ai = { model: 'test-model', classify: async () => [{ index: 0, keep: true, type: 'unknown', category: '不存在', riskLevel: 'unsafe' }] }
  const enriched = await enrichWithAi(source, ai)
  assert.equal(enriched.candidates[0].type, 'emoji')
  assert.equal(enriched.candidates[0].category, '爱心')
  assert.equal(enriched.candidates[0].riskLevel, 'safe')
})

test('OpenAI compatible client validates JSON response', async () => {
  const ai = new AiClient({ baseUrl: 'https://ai.test', apiKey: 'key', model: 'model', fetchImpl: async () => jsonResponse({ choices: [{ message: { content: '{"items":[]}' } }] }) })
  assert.deepEqual(await ai.classify([]), [])
})

test('Apify and backend clients send expected authenticated requests', async () => {
  const calls = []
  const fetchImpl = async (url, options) => { calls.push({ url, options }); return jsonResponse(url.includes('apify') ? [] : { code: 200, data: { id: 8 } }) }
  const apify = new ApifyClient({ token: 'secret', fetchImpl }); await apify.search(['kaomoji'])
  const backend = new BackendClient({ baseUrl: 'http://backend:8080', token: 'collector-token', fetchImpl }); await backend.startRun({ triggerType: 'manual' })
  assert.match(calls[0].url, /magicfingers~threads-scraper/)
  assert.equal(calls[1].options.headers['X-Collector-Token'], 'collector-token')
})
