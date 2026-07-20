import { chromium } from 'file:///C:/Users/wyt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(process.cwd());
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

const names = [
  'xhs-01-cover',
  'xhs-02-home-functions',
  'xhs-03-detail-functions',
  'xhs-04-tool-functions',
  'xhs-05-profile-functions',
];

for (let i = 0; i < names.length; i += 1) {
  await page.locator(`#xhs-0${i + 1}`).screenshot({ path: path.join(root, 'output', `${names[i]}.png`) });
}

await browser.close();
