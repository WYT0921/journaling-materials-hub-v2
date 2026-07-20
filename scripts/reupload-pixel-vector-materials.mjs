import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.API_BASE || 'https://shouzhangku.store/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ROOT = process.argv[2] || 'E:\\图片\\手账素材\\2026\\第五期\\像素矢量1';

const OLD_IDS = [75, 76, 77, 78, 79, 80, 81];
const FILES = [
  '像素元素-01-黑猫盒子.png',
  '像素元素-02-复古随身听.png',
  '像素元素-03-小动物图标组.png',
  '像素元素-04-黑胶音符.png',
  '像素元素-05-耳机小幽灵.png',
  '像素元素-06-像素蝴蝶结.png',
  '像素元素-07-灰色趴趴猫.png'
];

if (!ADMIN_TOKEN) {
  console.error('Missing ADMIN_TOKEN environment variable.');
  process.exit(1);
}

function stripExtension(filename) {
  return path.basename(filename, path.extname(filename));
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: ADMIN_TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok || body?.code >= 400) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }
  return body;
}

async function deleteMaterial(id) {
  return requestJson(`${API_BASE}/v2/admin/materials/${id}`, { method: 'DELETE' });
}

async function uploadFile(filePath) {
  const buffer = await fs.readFile(filePath);
  const blob = new Blob([buffer], { type: getMimeType(filePath) });
  const form = new FormData();
  form.append('file', blob, path.basename(filePath));
  const body = await requestJson(`${API_BASE}/v2/admin/upload`, {
    method: 'POST',
    body: form
  });
  return body.data;
}

async function createMaterial(filePath, uploadResult) {
  const title = stripExtension(filePath);
  const payload = {
    title,
    description: '2026 第五期 / 像素矢量1',
    category: '贴纸',
    materialType: 'single',
    imageUrl: uploadResult.imageUrl,
    thumbnailUrl: uploadResult.thumbnailUrl,
    isPremium: true,
    status: 1,
    sortOrder: 0,
    tags: JSON.stringify(['第五期', '贴纸', '像素矢量1', '单个素材', '像素', '矢量'])
  };

  const body = await requestJson(`${API_BASE}/v2/admin/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return body.data;
}

async function main() {
  const summary = {
    deleted: [],
    uploaded: [],
    failed: []
  };

  for (const id of OLD_IDS) {
    try {
      await deleteMaterial(id);
      summary.deleted.push(id);
      console.log(`deleted old material id=${id}`);
    } catch (error) {
      summary.failed.push({ action: 'delete', id, error: error.message });
      console.error(`delete failed id=${id}: ${error.message}`);
    }
  }

  for (const filename of FILES) {
    const filePath = path.join(ROOT, filename);
    try {
      await fs.access(filePath);
      const uploadResult = await uploadFile(filePath);
      const material = await createMaterial(filePath, uploadResult);
      summary.uploaded.push({ id: material.id, title: material.title });
      console.log(`uploaded ${material.title} id=${material.id}`);
    } catch (error) {
      summary.failed.push({ action: 'upload', filename, error: error.message });
      console.error(`upload failed ${filename}: ${error.message}`);
    }
  }

  await fs.mkdir(path.join(process.cwd(), 'release'), { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const reportPath = path.join(process.cwd(), 'release', `reupload-pixel-vector-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(`Summary: deleted=${summary.deleted.length}, uploaded=${summary.uploaded.length}, failed=${summary.failed.length}`);
  console.log(`Report: ${reportPath}`);

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
