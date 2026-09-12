// Start a local static server, then pass its origin (defaults to port 8765).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765';
const out = path.resolve(__dirname, '../.qa/explore-media');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/');
      await page.waitForFunction(() => {
        const v = document.querySelector('[data-hero-video]');
        return v.currentTime > .1 && !v.paused;
      });
      const video = page.locator('[data-hero-video]');
      assert.match(await video.evaluate(v => v.currentSrc), width > 900 ? /1440\.mp4$/ : /1080\.mp4$/);
      assert.equal(await page.locator('.home-building').count(), 0);
      await page.locator('[data-hero-playback]').click();
      assert(await video.evaluate(v => v.paused));
      await page.screenshot({ path: path.join(out, `home-${width}.png`) });
      await page.locator('[data-hero-playback]').click();
      await page.waitForFunction(() => !document.querySelector('[data-hero-video]').paused);
      await page.locator('#explore-recplace').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('[data-hero-video]').paused);
      await page.goto(base + '/explore/');
      await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'ready');
      await page.waitForTimeout(650);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(out, `explore-${width}.png`), fullPage: true });
      await page.locator('[data-3d-orbit]').click();
      assert.equal(await page.locator('[data-3d-orbit]').getAttribute('aria-pressed'), 'true');
      const before = await page.locator('canvas').screenshot();
      await page.waitForTimeout(600);
      assert(!before.equals(await page.locator('canvas').screenshot()), 'Orbit did not animate');
      await page.locator('canvas').focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('[data-3d-orbit]').getAttribute('aria-pressed'), 'false');
      await page.locator('[data-3d-expand]').click();
      assert.equal(await page.locator('[data-recplace-3d]').getAttribute('aria-modal'), 'true');
      const box = await page.locator('[data-recplace-3d]').boundingBox();
      assert.equal(box.x, 0); assert.equal(box.y, 0); assert.equal(box.width, width);
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
      await page.waitForTimeout(650);
      await page.screenshot({ path: path.join(out, `expanded-${width}.png`) });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-3d-expand]').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      assert.equal(await page.locator('[data-3d-expand]').evaluate(el => el === document.activeElement), true);
      await page.locator('[data-3d-view="overview"]').click();
      await page.waitForTimeout(800);
      await page.locator('canvas').screenshot({ path: path.join(out, `roof-${width}.png`) });
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${width}px: responsive video, pause, offscreen suspension, dedicated 3D, orbit and expansion`);
    }
    for (const preference of ['reduced-motion', 'save-data']) {
      const context = await browser.newContext({ reducedMotion: preference === 'reduced-motion' ? 'reduce' : 'no-preference' });
      const page = await context.newPage();
      if (preference === 'save-data') await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }));
      const videos = [];
      page.on('request', r => { if (/\.mp4/.test(r.url())) videos.push(r.url()); });
      await page.goto(base + '/');
      await page.waitForTimeout(800);
      assert.deepEqual(videos, []);
      assert(await page.locator('.home-hero__poster').isVisible());
      assert.equal(await page.locator('[data-hero-playback]').isVisible(), false);
      if (preference === 'reduced-motion') {
        await page.goto(base + '/explore/');
        await page.waitForFunction(() => document.querySelector('[data-recplace-3d]').dataset.state === 'ready');
        assert.equal(await page.locator('[data-3d-orbit]').isVisible(), false);
      }
      await context.close();
      console.log(`PASS ${preference}: still poster without video downloads`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
