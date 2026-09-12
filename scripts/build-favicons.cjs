const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const svg = fs.readFileSync(path.join(root, "Assets", "favicon.svg"), "utf8");
const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const outputs = [
  ["favicon-48.png", 48],
  ["favicon-192.png", 192],
  ["apple-touch-icon.png", 180],
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const [filename, size] of outputs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`
      <style>
        html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
        img { display: block; width: 100%; height: 100%; }
      </style>
      <img src="${source}" alt="">
    `);
    await page.locator("img").waitFor();
    await page.locator("img").screenshot({
      path: path.join(root, "Assets", filename),
      omitBackground: true,
    });
  }

  await browser.close();
  console.log(`Generated ${outputs.length} favicon PNGs from Assets/favicon.svg.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
