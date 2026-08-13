const timeoutSignal = milliseconds => AbortSignal.timeout(milliseconds)

export class BackendClient {
  constructor({ baseUrl, token, fetchImpl = fetch }) {
    this.baseUrl = String(baseUrl || '').replace(/\/$/, '')
    this.token = token
    this.fetch = fetchImpl
  }
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (this.token) headers['X-Collector-Token'] = this.token
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      ...options,
      signal: timeoutSignal(30000),
      headers
    })
    let payload
    try {
      payload = await response.json()
    } catch {
      throw new Error(`Backend 响应解析失败 (HTTP ${response.status})`)
    }
    if (!response.ok || (payload && payload.code && payload.code !== 200)) throw new Error(payload.message || `Backend HTTP ${response.status}`)
    return payload.data
  }
  startRun(body) { return this.request('/api/v2/internal/collector/runs/start', { method: 'POST', body: JSON.stringify(body) }) }
  finishRun(id, body) { return this.request(`/api/v2/internal/collector/runs/${id}`, { method: 'PUT', body: JSON.stringify(body) }) }
  importItems(items) { return this.request('/api/v2/internal/collector/import', { method: 'POST', body: JSON.stringify({ items }) }) }
}

export class ApifyClient {
  constructor({ token, actorId = 'magicfingers/threads-scraper', fetchImpl = fetch }) {
    this.token = token; this.actorId = actorId; this.fetch = fetchImpl
  }
  async run(input) {
    if (!this.token) throw new Error('APIFY_TOKEN 未配置')
    const actor = encodeURIComponent(this.actorId).replace('%2F', '~')
    const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(this.token)}&timeout=240`
    const response = await this.fetch(url, { method: 'POST', signal: timeoutSignal(260000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
    if (!response.ok) throw new Error(`Apify HTTP ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  }
  search(queries, maxResults = 25) { return this.run({ scrapeType: 'search', searchQueries: queries, maxResults, includeReplies: false }) }
  replies(urls, maxResults = 20) { return urls.length ? this.run({ scrapeType: 'threadReplies', threadUrls: urls, maxResults }) : Promise.resolve([]) }
}

const extractJson = value => {
  const text = String(value || '').replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(text)
}

export class AiClient {
  constructor({ baseUrl, apiKey, model, fetchImpl = fetch }) {
    this.baseUrl = String(baseUrl || '').replace(/\/$/, '')
    this.apiKey = apiKey; this.model = model; this.fetch = fetchImpl
  }
  get configured() { return Boolean(this.baseUrl && this.apiKey && this.model) }
  async classify(items) {
    if (!this.configured) throw new Error('AI 接口未配置')
    const input = items.map((item, index) => ({ index, content: item.content, suggestedType: item.type, suggestedCategory: item.category }))
    const response = await this.fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST', signal: timeoutSignal(60000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, temperature: 0, response_format: { type: 'json_object' }, messages: [
        { role: 'system', content: '你是 Unicode 颜文字素材审核器。返回 JSON：{"items":[{"index":0,"keep":true,"type":"kaomoji|emoji","category":"可爱|开心|难过|生气|动物|动作|爱心|星星|花朵|天气|食物|装饰","tags":["最多5个中文标签"],"riskLevel":"safe|mild","confidence":0.0,"reason":"简短原因"}]}。只保留可复制的颜文字、Emoji组合或装饰符号，拒绝普通句子、广告、用户名、URL和危险内容。' },
        { role: 'user', content: JSON.stringify(input) }
      ] })
    })
    if (!response.ok) throw new Error(`AI HTTP ${response.status}`)
    const payload = await response.json()
    const parsed = extractJson(payload.choices?.[0]?.message?.content)
    if (!Array.isArray(parsed.items)) throw new Error('AI 返回格式错误')
    return parsed.items
  }
}
