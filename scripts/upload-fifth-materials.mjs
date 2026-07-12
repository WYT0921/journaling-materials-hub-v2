import fs from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.API_BASE || 'https://shouzhangku.store/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const ROOT = process.argv[2] || 'E:\\图片\\手账素材\\2026\\第五期';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const CATEGORY = process.env.MATERIAL_CATEGORY || '贴纸';
const PERIOD_TAG = process.env.PERIOD_TAG || '第五期';
const REPORT_PREFIX = process.env.REPORT_PREFIX || 'upload-fifth-materials';

if (!ADMIN_TOKEN) {
  console.error('Missing ADMIN_TOKEN environment variable.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripExtension(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function normalizeLayoutName(filePath) {
  return stripExtension(filePath).replace(/_layout$/i, '');
}

function getNumericPrefix(filename) {
  const match = path.basename(filename).match(/^(\d{2})[_-]/);
  return match ? match[1] : null;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

function folderTags(folderName) {
  const map = {
    '爱心': ['爱心', '甜心涂鸦'],
    '韩系古早风贴纸': ['韩系', '古早风'],
    '像素Q版娃娃': ['像素', 'Q版', '软糖像素'],
    '像素矢量1': ['像素', '矢量']
  };
  return map[folderName] || [];
}

function inferMaterialType(title) {
  return /合集|sheet|preview|白底|透明底|white|A6|transparent/i.test(title)
    ? 'bundle'
    : 'single';
}

function compactLayoutTags(layouts) {
  const tags = [];
  for (const item of layouts) {
    tags.push(`json:${item.layout}`);
    if (item.seed !== undefined) tags.push(`seed:${item.seed}`);
    if (item.canvas) tags.push(`canvas:${item.canvas}`);
    if (item.outputKind) tags.push(`output:${item.outputKind}`);
    if (item.placement) {
      tags.push(`pos:${item.placement.x},${item.placement.y}`);
      tags.push(`size:${item.placement.width}x${item.placement.height}`);
      tags.push(`rot:${item.placement.rotation ?? 0}`);
    }
  }
  return tags;
}

async function parseLayoutFiles(jsonFiles) {
  const byPrefix = new Map();
  const byOutputName = new Map();
  const parseErrors = [];

  for (const jsonPath of jsonFiles) {
    try {
      const raw = await fs.readFile(jsonPath, 'utf8');
      const data = JSON.parse(raw);
      const layout = normalizeLayoutName(jsonPath);
      const canvas = data.canvas?.format || (
        data.canvas?.width && data.canvas?.height
          ? `${data.canvas.width}x${data.canvas.height}`
          : undefined
      );
      const base = { layout, seed: data.seed, canvas };
      const placements = [
        ...(Array.isArray(data.placements) ? data.placements : []),
        ...(Array.isArray(data.added_bottom_icons) ? data.added_bottom_icons : [])
      ];

      for (const placement of placements) {
        const prefix = getNumericPrefix(placement.file || '');
        if (!prefix) continue;
        const existing = byPrefix.get(prefix) || [];
        existing.push({ ...base, placement });
        byPrefix.set(prefix, existing);
      }

      if (data.output && typeof data.output === 'object') {
        for (const [outputKind, filename] of Object.entries(data.output)) {
          byOutputName.set(String(filename).toLowerCase(), { ...base, outputKind });
        }
      }
    } catch (error) {
      parseErrors.push({ file: jsonPath, error: error.message });
    }
  }

  return { byPrefix, byOutputName, parseErrors };
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

async function findExistingByTitle(title) {
  const url = new URL(`${API_BASE}/v2/admin/materials`);
  url.searchParams.set('page', '1');
  url.searchParams.set('limit', '20');
  url.searchParams.set('keyword', title);
  const body = await requestJson(url);
  const list = body?.data?.list || body?.data?.records || [];
  return list.find((item) => item.title === title) || null;
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

async function createMaterial(payload) {
  const body = await requestJson(`${API_BASE}/v2/admin/materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return body.data;
}

function buildMaterialPayload(filePath, layoutIndex) {
  const title = stripExtension(filePath);
  const folderName = path.basename(path.dirname(filePath));
  const materialType = inferMaterialType(title);
  const filename = path.basename(filePath);
  const prefix = getNumericPrefix(filename);

  const layouts = [];
  if (prefix && layoutIndex.byPrefix.has(prefix)) {
    layouts.push(...layoutIndex.byPrefix.get(prefix));
  }
  const outputLayout = layoutIndex.byOutputName.get(filename.toLowerCase());
  if (outputLayout) {
    layouts.push(outputLayout);
  }

  const tags = [
    PERIOD_TAG,
    CATEGORY,
    folderName,
    materialType === 'bundle' ? '合并素材' : '单个素材',
    ...folderTags(folderName),
    ...compactLayoutTags(layouts)
  ];

  return {
    title,
    description: layouts.length
      ? `2026 ${PERIOD_TAG} / ${folderName} / 已关联JSON布局标签`
      : `2026 ${PERIOD_TAG} / ${folderName}`,
    category: CATEGORY,
    materialType,
    isPremium: true,
    status: 1,
    sortOrder: 0,
    tags: JSON.stringify([...new Set(tags)])
  };
}

async function main() {
  const allFiles = await listFiles(ROOT);
  const jsonFiles = allFiles.filter((file) => path.extname(file).toLowerCase() === '.json');
  const imageFiles = allFiles
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));

  const layoutIndex = await parseLayoutFiles(jsonFiles);
  const summary = {
    root: ROOT,
    apiBase: API_BASE,
    totalImages: imageFiles.length,
    jsonFiles: jsonFiles.length,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    parseErrors: layoutIndex.parseErrors,
    items: []
  };

  console.log(`Found ${imageFiles.length} images and ${jsonFiles.length} JSON files.`);
  if (layoutIndex.parseErrors.length) {
    console.warn(`JSON parse warnings: ${layoutIndex.parseErrors.length}`);
  }

  for (let index = 0; index < imageFiles.length; index += 1) {
    const filePath = imageFiles[index];
    const payload = buildMaterialPayload(filePath, layoutIndex);
    const label = `[${index + 1}/${imageFiles.length}] ${payload.title}`;

    try {
      const existing = await findExistingByTitle(payload.title);
      if (existing) {
        summary.skipped += 1;
        summary.items.push({ title: payload.title, status: 'skipped', id: existing.id });
        console.log(`${label} skipped existing id=${existing.id}`);
        continue;
      }

      const uploaded = await uploadFile(filePath);
      const material = await createMaterial({
        ...payload,
        imageUrl: uploaded.imageUrl,
        thumbnailUrl: uploaded.thumbnailUrl
      });
      summary.uploaded += 1;
      summary.items.push({
        title: payload.title,
        status: 'uploaded',
        id: material.id,
        materialType: payload.materialType,
        tags: JSON.parse(payload.tags)
      });
      console.log(`${label} uploaded id=${material.id} type=${payload.materialType}`);
      await sleep(120);
    } catch (error) {
      summary.failed += 1;
      summary.items.push({ title: payload.title, status: 'failed', error: error.message });
      console.error(`${label} failed: ${error.message}`);
      await sleep(300);
    }
  }

  await fs.mkdir(path.join(process.cwd(), 'release'), { recursive: true });
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  const reportPath = path.join(process.cwd(), 'release', `${REPORT_PREFIX}-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(`Summary: uploaded=${summary.uploaded}, skipped=${summary.skipped}, failed=${summary.failed}`);
  console.log(`Report: ${reportPath}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
