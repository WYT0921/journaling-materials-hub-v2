import { fallbackCatalog } from '../catalog/fallbackCatalog'
import type { AuraCatalog } from '../types/aura'

const CACHE_KEY = 'aura.catalog.v1'
const ETAG_KEY = 'aura.catalog.etag'

export async function loadCatalog(): Promise<AuraCatalog> {
  const headers: HeadersInit = {}
  const etag = localStorage.getItem(ETAG_KEY)
  if (etag) headers['If-None-Match'] = etag
  try {
    const response = await fetch('/api/v2/aura/catalog', { headers, signal: AbortSignal.timeout(5000) })
    if (response.status === 304) return readCachedCatalog()
    if (!response.ok) throw new Error(`目录请求失败 ${response.status}`)
    const envelope = await response.json() as { success: boolean; data: AuraCatalog }
    if (!envelope.success || envelope.data.schemaVersion !== 1 || !envelope.data.templates.length) throw new Error('目录格式无效')
    const catalog = normalizeCatalog(envelope.data)
    localStorage.setItem(CACHE_KEY, JSON.stringify(catalog))
    const nextEtag = response.headers.get('etag')
    if (nextEtag) localStorage.setItem(ETAG_KEY, nextEtag)
    return catalog
  } catch {
    return readCachedCatalog()
  }
}

function readCachedCatalog(): AuraCatalog {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as AuraCatalog | null
    if (cached?.schemaVersion === 1 && cached.templates.length) return normalizeCatalog(cached)
  } catch { /* use bundled catalog */ }
  return fallbackCatalog
}

function normalizeCatalog(catalog: AuraCatalog): AuraCatalog {
  return {
    ...catalog,
    templates: catalog.templates.map(template => ({
      ...template,
      supportedRatios: template.supportedRatios.map(ratio => String(ratio) === '4:3' ? '3:4' : ratio)
    }))
  }
}
