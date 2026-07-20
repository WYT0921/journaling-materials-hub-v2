import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.API_BASE || 'https://shouzhangku.store/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ROOTS = process.argv.slice(2);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

if (!ADMIN_TOKEN || ROOTS.length === 0) {
  console.error('Usage: ADMIN_TOKEN="Bearer ..." node scripts/upload-sixth-materials.mjs <folder>...');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: ADMIN_TOKEN, ...(options.headers || {}) }
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  if (!response.ok || body?.code >= 400) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }
  return body;
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

function isBundle(title) {
  return /白底|透明底|A6|合集|合并/.test(title);
}

async function findExisting(title) {
  const url = new URL(`${API_BASE}/v2/admin/materials`);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '100');
  url.searchParams.set('keyword', title);
  const body = await requestJson(url);
  const list = body?.data?.list || body?.data?.records || [];
  return list.find((item) => item.title === title) || null;
}

async function uploadFile(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType(filePath) }), path.basename(filePath));
  return (await requestJson(`${API_BASE}/v2/admin/upload`, { method: 'POST', body: form })).data;
}

async function createMaterial(payload) {
  return (await requestJson(`${API_BASE}/v2/admin/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })).data;
}

async function main() {
  const files = [];
  for (const root of ROOTS) {
    for (const entry of await fs.readdir(root, { withFileTypes: true })) {
      if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push({ root, filePath: path.join(root, entry.name) });
      }
    }
  }
  files.sort((a, b) => a.filePath.localeCompare(b.filePath, 'zh-Hans-CN'));

  const summary = { apiBase: API_BASE, roots: ROOTS, total: files.length, uploaded: 0, skipped: 0, failed: 0, items: [] };
  for (let i = 0; i < files.length; i += 1) {
    const { root, filePath } = files[i];
    const title = path.basename(filePath, path.extname(filePath));
    const folder = process.env.SOURCE_FOLDER_NAME || path.basename(root);
    const materialType = isBundle(title) ? 'bundle' : 'single';
    const label = `[${i + 1}/${files.length}] ${title}`;
    try {
      const existing = await findExisting(title);
      if (existing) {
        summary.skipped += 1;
        summary.items.push({ title, folder, status: 'skipped', id: existing.id, materialType: existing.materialType });
        console.log(`${label} skipped id=${existing.id}`);
        continue;
      }
      const uploaded = await uploadFile(filePath);
      const material = await createMaterial({
        title,
        description: `2026 第六期 / ${folder}`,
        category: '贴纸',
        materialType,
        imageUrl: uploaded.imageUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        isPremium: true,
        status: 1,
        sortOrder: 0,
        tags: JSON.stringify(['第六期', '贴纸', folder, materialType === 'bundle' ? '合并素材' : '单个素材', '韩系'])
      });
      summary.uploaded += 1;
      summary.items.push({ title, folder, status: 'uploaded', id: material.id, materialType });
      console.log(`${label} uploaded id=${material.id} type=${materialType}`);
      await sleep(120);
    } catch (error) {
      summary.failed += 1;
      summary.items.push({ title, folder, status: 'failed', error: error.message });
      console.error(`${label} failed: ${error.message}`);
      await sleep(300);
    }
  }

  await fs.mkdir(path.join(process.cwd(), 'release'), { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const reportPath = path.join(process.cwd(), 'release', `upload-sixth-materials-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`Summary: total=${summary.total}, uploaded=${summary.uploaded}, skipped=${summary.skipped}, failed=${summary.failed}`);
  console.log(`Report: ${reportPath}`);
  if (summary.failed) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(1); });
