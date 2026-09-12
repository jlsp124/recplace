// End-to-end checks run against the committed static artifacts, with an isolated
// local server. Browser viewports are emulations, not physical-device testing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.qa/recplace-3d');
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

const results = [];
async function check(name, fn) {
  await fn();
  results.push({ name, result: 'pass' });
  console.log('PASS', name);
}

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    await check('Preserved SEO, construction hero, and clean routes', async () => {
      for (const file of ['index.html', 'plans/index.html', 'leasing/index.html']) {
        const old = execFileSync('git', ['show', `HEAD:${file}`], { cwd: root, encoding: 'utf8' }).replace(/\r\n/g, '\n');
        const next = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
        const seo = (s) => s.match(/<title>.*?<\/title>|<meta\b[^>]*>|<link\b[^>]*rel="canonical"[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/g);
        // Current construction photos are intentionally refreshed over time.
        const stableSeo = (s) => seo(s).filter((tag) => !/(?:og:image|twitter:image)"/.test(tag));
        assert.deepEqual(stableSeo(next), stableSeo(old), `${file}: SEO changed`);
        if (file === 'index.html') {
          assert.equal(next.match(/<h1 class="home-hero__title"[\s\S]*?<\/h1>/)[0], old.match(/<h1 class="home-hero__title"[\s\S]*?<\/h1>/)[0]);
          assert(next.includes('class="home-hero__poster"'));
          assert(next.includes('class="home-hero__actions"'));
        }
      }
      for (const route of ['/', '/plans/', '/leasing/', '/location/', '/design/', '/updates/', '/contact/', '/404.html']) {
        assert.equal((await fetch(base + route)).status, 200, route);
      }
    });
    await check('Small delivery artifacts and stable floor mapping', async () => {
      assert(fs.statSync(path.join(root, 'Assets/3d/recplace-exterior.glb')).size < 500000);
      assert(fs.statSync(path.join(root, 'js/3d/recplace-viewer.bundle.js')).size < 700000);
      assert(fs.statSync(path.join(root, 'js/recplace-3d.js')).size < 8000);
      const map = JSON.parse(fs.readFileSync(path.join(root, 'Assets/3d/recplace-interactions.json')));
      assert.equal(map.floors.length, 3);
      assert.deepEqual(map.floors.map((f) => f.elevation), [0, 4.258, 8.16]);
      assert.equal(map.suites.length, 0, 'No invented suite boundaries or availability');
      assert(map.batches.every((b) => b.parts.length && b.parts.every((p) => p.indexCount > 0)));
    });

    for (const device of [
      { name: 'desktop', width: 1440, height: 1000, dpr: 1 },
      { name: 'tablet', width: 768, height: 1024, dpr: 2, touch: true },
      { name: 'mobile', width: 390, height: 844, dpr: 3, touch: true },
      { name: 'small-mobile', width: 320, height: 740, dpr: 2, touch: true },
    ]) {
      await check(`${device.name}: lazy loading, controls, layout and disposal`, async () => {
        const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, deviceScaleFactor: device.dpr, isMobile: !!device.touch, hasTouch: !!device.touch });
        const page = await context.newPage();
        const errors = [];
        const requests = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('request', (request) => requests.push(request.url()));
        await page.addInitScript(() => {
          document.addEventListener('DOMContentLoaded', () => {
            document.querySelector('[data-recplace-3d]')?.addEventListener('recplace:viewer-ready', (e) => { window.qaViewer = e.detail.viewer; });
          });
        });
        await page.goto(base + '/', { waitUntil: 'networkidle' });
        await page.locator('#explore-recplace').scrollIntoViewIfNeeded();
        await page.waitForTimeout(450);
        assert(!requests.some((url) => /\.glb|recplace-viewer\.bundle/.test(url)), '3D fetched before activation');
        await page.locator('#explore-recplace').screenshot({ path: path.join(out, `${device.name}-poster.png`), animations: 'disabled' });
        await page.locator('[data-3d-launch]').click();
        await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'ready', { timeout: 30000 });
        await page.waitForTimeout(700);
        assert.equal(requests.filter((url) => url.endsWith('.glb')).length, 1);
        assert.equal(await page.locator('[data-3d-stage] canvas').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
        assert(await page.evaluate(() => ['floor-01', 'floor-02', 'floor-03'].every((id) => window.qaViewer.getFloor(id)?.children.length > 0)));
        const ratio = await page.locator('canvas').evaluate((canvas) => canvas.width / canvas.clientWidth);
        assert(ratio <= 1.76, 'DPR not capped');
        await page.locator('#explore-recplace').screenshot({ path: path.join(out, `${device.name}-interactive.png`), animations: 'disabled' });
        const before = await page.locator('[data-3d-stage]').screenshot({ animations: 'disabled' });
        await page.locator('[data-3d-view="opposite"]').click();
        await page.waitForTimeout(800);
        const after = await page.locator('[data-3d-stage]').screenshot({ animations: 'disabled' });
        assert(!before.equals(after), 'Named view did not change the rendering');
        await page.locator('[data-3d-view="overview"]').click();
        await page.waitForTimeout(800);
        await page.locator('[data-3d-stage]').screenshot({ path: path.join(out, `${device.name}-overview.png`), animations: 'disabled' });
        await page.locator('canvas').focus();
        await page.keyboard.press('Home');
        await page.waitForTimeout(750);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('+');
        await page.waitForTimeout(150);
        assert(!before.equals(await page.locator('[data-3d-stage]').screenshot({ animations: 'disabled' })), 'Keyboard interaction did not change the rendering');
        if (device.touch) {
          assert.equal(await page.locator('canvas').evaluate((canvas) => getComputedStyle(canvas).touchAction), 'pan-y');
          const box = await page.locator('canvas').boundingBox();
          const cdp = await context.newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 100, y: box.y + box.height / 2 }] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 170, y: box.y + box.height / 2 }] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await cdp.detach();
        }
        await page.locator('[data-3d-stop]').click();
        assert.equal(await page.locator('canvas').count(), 0, 'Canvas was not disposed');
        assert(await page.locator('[data-3d-poster]').isVisible());
        assert.equal(await page.locator('[data-3d-launch]').evaluate((el) => el === document.activeElement), true, 'Focus not restored');
        assert.deepEqual(errors, []);
        await context.close();
      });
    }

    await check('Plans integration, reduced motion, and resource cleanup/reopen', async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(base + '/plans/#explore-recplace');
      for (let i = 0; i < 2; i++) {
        await page.locator('[data-3d-launch]').click();
        await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'ready');
        assert.equal(await page.locator('canvas').evaluate((c) => getComputedStyle(c).animationName), 'none');
        await page.locator('[data-3d-stop]').click();
      }
      assert.equal(await page.locator('.recplace-explore__links a').first().getAttribute('href'), '#floor-summary');
      await context.close();
    });

    await check('No JavaScript: useful rendering and floor links', async () => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(base + '/');
      await page.locator('#explore-recplace').scrollIntoViewIfNeeded();
      assert(await page.locator('[data-3d-poster] img').isVisible());
      assert(await page.locator('.recplace-explore noscript').isVisible());
      assert.equal(await page.locator('[data-3d-launch]').isVisible(), false);
      await page.locator('#explore-recplace').screenshot({ path: path.join(out, 'no-javascript.png') });
      await context.close();
    });

    for (const fault of ['no-webgl', 'model-error', 'engine-error', 'context-lost', 'cancel-loading']) {
      await check(`Graceful fallback: ${fault}`, async () => {
        const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
        const page = await context.newPage();
        if (fault === 'no-webgl') await page.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (kind, ...args) { return kind.includes('webgl') ? null : original.call(this, kind, ...args); };
        });
        if (fault === 'model-error') await page.route('**/recplace-exterior.glb', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
        if (fault === 'engine-error') await page.route('**/recplace-viewer.bundle.js', (route) => route.abort());
        if (fault === 'cancel-loading') await page.route('**/recplace-exterior.glb', async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.continue().catch(() => {}); });
        await page.goto(base + '/');
        await page.locator('[data-3d-launch]').click();
        if (fault === 'context-lost') {
          await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'ready');
          await page.locator('canvas').evaluate((c) => c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
        }
        if (fault === 'cancel-loading') {
          await page.locator('[data-3d-stop]').click();
          await page.waitForTimeout(1700);
          assert.equal(await page.locator('[data-recplace-3d]').getAttribute('data-state'), 'poster');
        } else {
          await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'fallback');
          assert.match(await page.locator('[data-3d-status]').textContent(), /unavailable/);
        }
        assert(await page.locator('[data-3d-poster]').isVisible());
        assert.equal(await page.locator('canvas').count(), 0);
        if (fault === 'model-error' || fault === 'context-lost' || fault === 'engine-error') {
          await page.unroute('**/recplace-exterior.glb');
          await page.unroute('**/recplace-viewer.bundle.js');
          await page.locator('[data-3d-launch]').click();
          await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'ready');
        }
        await context.close();
      });
    }
  } finally {
    await browser.close();
    server.close();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ browser: 'Chromium / software WebGL', results }, null, 2));
  }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });
