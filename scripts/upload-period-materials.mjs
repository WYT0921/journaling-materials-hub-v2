import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.API_BASE || 'https://shouzhangku.store/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ROOTS = {
  third: 'E:\\图片\\手账素材\\2026\\第三期',
  fourth: 'E:\\图片\\手账素材\\2026\\第四期'
};
const PERIOD_LABELS = { third: '第三期', fourth: '第四期' };
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const args = new Set(process.argv.slice(2));
const periodArg = process.argv[process.argv.indexOf('--period') + 1] || 'third,fourth';
const selectedPeriods = periodArg.split(',').filter((period) => ROOTS[period]);
const manifestPath = new URL('./fourth-material-renames.json', import.meta.url);

function stem(filename) {
  return path.basename(filename, path.extname(filename));
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

function isBundle(title) {
  return /白底|透明底|合集|整版|满版/.test(title);
}

async function readImages(root) {
  return (await fs.readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

async function validateManifest(manifest, root) {
  if (manifest.length !== 26) throw new Error(`Expected 26 rename entries, got ${manifest.length}`);
  const sources = new Set();
  const targets = new Set();
  const current = new Set(await readImages(root));
  for (const item of manifest) {
    if (!IMAGE_EXTENSIONS.has(path.extname(item.source).toLowerCase()) || !IMAGE_EXTENSIONS.has(path.extname(item.target).toLowerCase())) {
      throw new Error(`Unsupported image extension: ${item.source} -> ${item.target}`);
    }
    if (sources.has(item.source)) throw new Error(`Duplicate source: ${item.source}`);
    if (targets.has(item.target)) throw new Error(`Duplicate target: ${item.target}`);
    sources.add(item.source);
    targets.add(item.target);
    const sourceExists = current.has(item.source);
    const targetExists = current.has(item.target);
    if (!sourceExists && !targetExists) throw new Error(`Missing source and target: ${item.source}`);
    if (sourceExists && targetExists && item.source !== item.target) throw new Error(`Occupied target: ${item.target}`);
  }
  return { pending: manifest.filter((item) => current.has(item.source) && item.source !== item.target).length };
}

async function renameFourth(manifest, root) {
  const validation = await validateManifest(manifest, root);
  const renamed = [];
  for (const item of manifest) {
    const source = path.join(root, item.source);
    const target = path.join(root, item.target);
    try {
      await fs.access(source);
    } catch {
      continue;
    }
    try {
      await fs.access(target);
      throw new Error(`Refusing to overwrite existing target: ${target}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.rename(source, target);
    renamed.push({ source: item.source, target: item.target });
  }
  const files = await readImages(root);
  if (files.length !== 30) throw new Error(`Expected 30 fourth-period images after rename, got ${files.length}`);
  return { pending: validation.pending, renamed, files };
}

async function buildEntries(periods) {
  const entries = [];
  for (const period of periods) {
    for (const filename of await readImages(ROOTS[period])) {
      const baseTitle = stem(filename);
      entries.push({
        period,
        periodLabel: PERIOD_LABELS[period],
        filePath: path.join(ROOTS[period], filename),
        filename,
        baseTitle,
        category: '贴纸',
        materialType: isBundle(baseTitle) ? 'bundle' : 'single'
      });
    }
  }
  return entries;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: ADMIN_TOKEN, ...(options.headers || {}) }
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  if (!response.ok || body?.code >= 400) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  return body;
}

async function allMaterials() {
  const body = await requestJson(`${API_BASE}/v2/admin/materials?page=1&limit=500`);
  return body?.data?.list || body?.data?.records || [];
}

function resolveTitle(entry, materials) {
  const exact = materials.filter((item) => item.title === entry.baseTitle);
  const corresponding = exact.find((item) => String(item.description || '').includes(entry.periodLabel));
  if (corresponding) return { title: entry.baseTitle, existing: corresponding };
  if (!exact.length) return { title: entry.baseTitle, existing: null };
  const prefixed = `${entry.periodLabel}-${entry.baseTitle}`;
  const prefixedExisting = materials.find((item) => item.title === prefixed);
  return { title: prefixed, existing: prefixedExisting || null };
}

async function uploadFile(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType(filePath) }), path.basename(filePath));
  return (await requestJson(`${API_BASE}/v2/admin/upload`, { method: 'POST', body: form })).data;
}

async function createMaterial(entry, title, uploaded) {
  const payload = {
    title,
    description: `2026 ${entry.periodLabel}`,
    category: entry.category,
    materialType: entry.materialType,
    imageUrl: uploaded.imageUrl,
    thumbnailUrl: uploaded.thumbnailUrl,
    isPremium: true,
    status: 1,
    sortOrder: 0,
    tags: JSON.stringify([entry.periodLabel, entry.category, entry.materialType === 'bundle' ? '合并素材' : '单个素材'])
  };
  return (await requestJson(`${API_BASE}/v2/admin/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })).data;
}

async function writeReport(report) {
  await fs.mkdir(path.join(process.cwd(), 'release'), { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const reportPath = path.join(process.cwd(), 'release', `upload-period-materials-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return reportPath;
}

async function uploadEntries(entries) {
  if (!ADMIN_TOKEN) throw new Error('Missing ADMIN_TOKEN');
  const materials = await allMaterials();
  const report = { apiBase: API_BASE, periods: selectedPeriods, total: entries.length, uploaded: 0, skipped: 0, failed: 0, items: [] };
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const resolved = resolveTitle(entry, materials);
    const label = `[${index + 1}/${entries.length}] ${resolved.title}`;
    try {
      if (resolved.existing) {
        report.skipped += 1;
        report.items.push({ period: entry.periodLabel, filename: entry.filename, title: resolved.title, status: 'skipped', id: resolved.existing.id });
        console.log(`${label} skipped id=${resolved.existing.id}`);
        continue;
      }
      const uploaded = await uploadFile(entry.filePath);
      const material = await createMaterial(entry, resolved.title, uploaded);
      materials.push(material);
      report.uploaded += 1;
      report.items.push({ period: entry.periodLabel, filename: entry.filename, title: resolved.title, status: 'uploaded', id: material.id, materialType: entry.materialType });
      console.log(`${label} uploaded id=${material.id} type=${entry.materialType}`);
    } catch (error) {
      report.failed += 1;
      report.items.push({ period: entry.periodLabel, filename: entry.filename, title: resolved.title, status: 'failed', error: error.message });
      console.error(`${label} failed: ${error.message}`);
    }
  }
  const reportPath = await writeReport(report);
  console.log(`Summary: total=${report.total}, uploaded=${report.uploaded}, skipped=${report.skipped}, failed=${report.failed}`);
  console.log(`Report: ${reportPath}`);
  if (report.failed) process.exitCode = 1;
}

async function verifyEntries(entries) {
  if (!ADMIN_TOKEN) throw new Error('Missing ADMIN_TOKEN');
  const materials = await allMaterials();
  const matched = [];
  const missing = [];
  for (const entry of entries) {
    const resolved = resolveTitle(entry, materials);
    if (resolved.existing) matched.push({ entry, material: resolved.existing });
    else missing.push({ period: entry.periodLabel, title: resolved.title });
  }
  const invalid = matched.filter(({ entry, material }) => material.category !== entry.category || material.materialType !== entry.materialType || material.status !== 1 || !material.imageUrl || !material.thumbnailUrl);
  const assetResults = await Promise.all(matched.flatMap(({ material }) => [material.imageUrl, material.thumbnailUrl]).map(async (url) => {
    try { const response = await fetch(url, { method: 'HEAD' }); return { url, ok: response.ok, status: response.status }; }
    catch (error) { return { url, ok: false, error: error.message }; }
  }));
  const result = { expected: entries.length, matched: matched.length, missing, invalid: invalid.map(({ material }) => material.id), assetChecks: assetResults.length, assetChecksOk: assetResults.filter((item) => item.ok).length, failedAssets: assetResults.filter((item) => !item.ok) };
  console.log(JSON.stringify(result, null, 2));
  if (missing.length || invalid.length || result.assetChecks !== result.assetChecksOk) process.exitCode = 1;
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (args.has('--dry-run')) {
    const validation = await validateManifest(manifest, ROOTS.fourth);
    const files = await readImages(ROOTS.fourth);
    console.log(JSON.stringify({ images: files.length, pendingRenames: validation.pending, collisions: 0 }, null, 2));
    return;
  }
  if (args.has('--rename-only')) {
    console.log(JSON.stringify(await renameFourth(manifest, ROOTS.fourth), null, 2));
    return;
  }
  const entries = await buildEntries(selectedPeriods);
  if (args.has('--upload')) return uploadEntries(entries);
  if (args.has('--verify')) return verifyEntries(entries);
  throw new Error('Choose one of --dry-run, --rename-only, --upload, or --verify');
}

main().catch((error) => { console.error(error); process.exit(1); });
