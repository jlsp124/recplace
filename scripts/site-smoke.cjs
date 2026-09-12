const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const routes = ["/", "/leasing/", "/plans/", "/location/", "/updates/", "/contact/", "/design/", "/explore/"];
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const outputRoot = path.join(root, ".qa", "seo-site-smoke");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function localFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const relative = pathname.endsWith("/") ? `${pathname.slice(1)}index.html` : pathname.slice(1);
  const resolved = path.resolve(root, relative || "index.html");
  return resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

const server = http.createServer((request, response) => {
  const filename = localFile(request.url);
  if (!filename || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filename).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filename).pipe(response);
});

function slug(route) {
  return route === "/" ? "home" : route.replaceAll("/", "");
}

(async () => {
  fs.mkdirSync(outputRoot, { recursive: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const browserErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.resourceType() !== "media") browserErrors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });

    for (const route of routes) {
      browserErrors.length = 0;
      const response = await page.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(250);
      const state = await page.evaluate(() => ({
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        h1Count: document.querySelectorAll("h1").length,
        navLinks: [...document.querySelectorAll("#site-header a[href]")].map((link) => link.getAttribute("href")),
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        title: document.title,
      }));

      if (response?.status() !== 200) failures.push(`${viewport.name} ${route}: HTTP ${response?.status()}`);
      if (!state.title) failures.push(`${viewport.name} ${route}: missing title`);
      if (state.h1Count !== 1) failures.push(`${viewport.name} ${route}: expected one H1, found ${state.h1Count}`);
      if (state.canonical !== `https://recplace.ca${route}`) failures.push(`${viewport.name} ${route}: incorrect canonical ${state.canonical}`);
      if (state.overflow > 1) failures.push(`${viewport.name} ${route}: horizontal overflow of ${state.overflow}px`);
      for (const coreRoute of ["/", "/leasing/", "/plans/", "/location/", "/updates/", "/contact/"]) {
        if (!state.navLinks.includes(coreRoute)) failures.push(`${viewport.name} ${route}: header missing ${coreRoute}`);
      }
      if (browserErrors.length) failures.push(`${viewport.name} ${route}: browser errors: ${browserErrors.join(" | ")}`);

      if (viewport.name === "mobile") {
        await page.locator("[data-nav-toggle]").click();
        if (!(await page.locator("[data-nav-root]").evaluate((node) => node.classList.contains("is-open")))) {
          failures.push(`${viewport.name} ${route}: menu did not open`);
        }
        await page.keyboard.press("Escape");
      }

      if (route === "/updates/" && (await page.locator("#updates-list .journal-entry").count()) !== 6) {
        failures.push(`${viewport.name} ${route}: expected six rendered updates`);
      }

      await page.screenshot({ path: path.join(outputRoot, `${viewport.name}-${slug(route)}.png`), fullPage: true });
    }
    await context.close();
  }

  await browser.close();
  server.close();
  if (failures.length) {
    console.error(`Site smoke failed (${failures.length}):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }
  console.log(`Site smoke passed across ${routes.length} routes at desktop and mobile viewports.`);
  console.log(`Screenshots: ${outputRoot}`);
})().catch((error) => {
  server.close();
  console.error(error);
  process.exitCode = 1;
});
