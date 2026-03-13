const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const START_URL = 'https://edifis.ca/en/';
const OUT_DIR = path.resolve(process.cwd(), 'playwright-capture');
const ASSET_DIR = path.join(OUT_DIR, 'assets');
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots');
const SNAPSHOT_DIR = path.join(OUT_DIR, 'snapshots');
const LOG_DIR = path.join(OUT_DIR, 'logs');

for (const dir of [OUT_DIR, ASSET_DIR, SCREENSHOT_DIR, SNAPSHOT_DIR, LOG_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(input) {
  return input.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 180);
}

function uniqueFilePath(basePath) {
  if (!fs.existsSync(basePath)) return basePath;
  const ext = path.extname(basePath);
  const name = basePath.slice(0, -ext.length);
  let i = 1;
  while (true) {
    const candidate = `${name}_${i}${ext}`;
    if (!fs.existsSync(candidate)) return candidate;
    i++;
  }
}

function getExtensionFromContentType(contentType, urlObj) {
  const pathnameExt = path.extname(urlObj.pathname || '');
  if (pathnameExt) return pathnameExt;

  const ct = (contentType || '').split(';')[0].trim().toLowerCase();
  const map = {
    'text/html': '.html',
    'text/css': '.css',
    'application/javascript': '.js',
    'text/javascript': '.js',
    'application/json': '.json',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'font/woff': '.woff',
    'font/woff2': '.woff2',
    'video/mp4': '.mp4',
    'application/xml': '.xml',
    'text/plain': '.txt',
  };
  return map[ct] || '.bin';
}

function assetPathForUrl(url, contentType) {
  const u = new URL(url);
  const host = sanitizeFilename(u.hostname);
  let pathname = decodeURIComponent(u.pathname || '/');
  if (pathname.endsWith('/')) pathname += 'index';
  const cleanPath = pathname
    .split('/')
    .filter(Boolean)
    .map(sanitizeFilename)
    .join(path.sep);

  const ext = getExtensionFromContentType(contentType, u);
  let fullPath = path.join(ASSET_DIR, host, cleanPath);

  if (!path.extname(fullPath)) {
    fullPath += ext;
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  return uniqueFilePath(fullPath);
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 350);
    });
  });
}

async function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  // downloadsPath is supported in launch(), but this script mainly saves responses manually.
  // Playwright can also persist page downloads using the download event / downloadsPath. :contentReference[oaicite:1]{index=1}
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari'
  });

  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true
  });

  const page = await context.newPage();

  const requests = [];
  const responses = [];
  const failures = [];
  const downloaded = new Set();

  page.on('request', (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });

  page.on('requestfailed', (request) => {
    failures.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: request.failure()
    });
  });

  page.on('response', async (response) => {
    const url = response.url();
    const request = response.request();
    const headers = await response.allHeaders().catch(() => ({}));
    const contentType = headers['content-type'] || '';

    responses.push({
      url,
      status: response.status(),
      ok: response.ok(),
      resourceType: request.resourceType(),
      contentType
    });

    // Save only "interesting" assets and only successful GET responses.
    if (!response.ok() || request.method() !== 'GET') return;

    const type = request.resourceType();
    const saveableTypes = new Set([
      'document',
      'stylesheet',
      'script',
      'image',
      'font',
      'media',
      'xhr',
      'fetch'
    ]);

    if (!saveableTypes.has(type)) return;
    if (downloaded.has(url)) return;

    try {
      const body = await response.body();
      if (!body || body.length === 0) return;

      const outputPath = assetPathForUrl(url, contentType);
      fs.writeFileSync(outputPath, body);
      downloaded.add(url);
    } catch (err) {
      failures.push({
        url,
        method: request.method(),
        resourceType: type,
        failure: { errorText: `save-failed: ${String(err.message || err)}` }
      });
    }
  });

  // Some pages have intro overlays. Give it a chance to load first.
  await page.goto(START_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 120000
  });

  await page.waitForTimeout(4000);

  // Try pressing Enter in case the intro gate expects it.
  await page.keyboard.press('Enter').catch(() => {});

  // Try a few generic dismiss / start clicks without hard failing.
  const candidates = [
    'text=Enter',
    'text=Press enter',
    'text=Open',
    'text=Start',
    'button',
    '[role="button"]'
  ];

  for (const selector of candidates) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locator.click({ timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(1000);
      }
    } catch {}
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '00-initial.png'),
    fullPage: true
  });

  // Scroll slowly so lazy assets and motion sections have time to load.
  await autoScroll(page);
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01-fullpage-after-scroll.png'),
    fullPage: true
  });

  // Scroll back to capture the top after everything loaded.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02-top-after-load.png'),
    fullPage: false
  });

  // Save rendered HTML snapshots.
  const html = await page.content();
  fs.writeFileSync(path.join(SNAPSHOT_DIR, 'rendered-page.html'), html, 'utf8');

  const title = await page.title().catch(() => '');
  const finalUrl = page.url();

  await saveJson(path.join(LOG_DIR, 'requests.json'), requests);
  await saveJson(path.join(LOG_DIR, 'responses.json'), responses);
  await saveJson(path.join(LOG_DIR, 'failures.json'), failures);
  await saveJson(path.join(LOG_DIR, 'summary.json'), {
    startUrl: START_URL,
    finalUrl,
    title,
    totalRequests: requests.length,
    totalResponses: responses.length,
    totalFailures: failures.length,
    totalSavedAssets: downloaded.size
  });

  await context.tracing.stop({
    path: path.join(OUT_DIR, 'trace.zip')
  });

  await browser.close();

  console.log('Done.');
  console.log(`Output folder: ${OUT_DIR}`);
})();