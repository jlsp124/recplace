const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const live = process.argv.includes("--live");
const failures = [];

const pages = [
  ["index.html", "/"],
  ["leasing/index.html", "/leasing/"],
  ["plans/index.html", "/plans/"],
  ["location/index.html", "/location/"],
  ["updates/index.html", "/updates/"],
  ["contact/index.html", "/contact/"],
  ["design/index.html", "/design/"],
  ["explore/index.html", "/explore/"],
];
const canonicalBase = "https://recplace.ca";

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return result;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => ({
    raw: match[0],
    attrs: attrs(match[0]),
  }));
}

function meta(html, name) {
  return tags(html, "meta").find((tag) => tag.attrs.name?.toLowerCase() === name.toLowerCase())?.attrs.content;
}

function metaProperty(html, property) {
  return tags(html, "meta").find((tag) => tag.attrs.property?.toLowerCase() === property.toLowerCase())?.attrs.content;
}

function link(html, rel) {
  return tags(html, "link").find((tag) => tag.attrs.rel?.toLowerCase().split(/\s+/).includes(rel))?.attrs.href;
}

function routeToFile(route) {
  if (route === "/") return "index.html";
  if (route.endsWith("/")) return `${route.slice(1)}index.html`;
  return route.slice(1);
}

function validateJsonLd(relativePath, html) {
  const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [index, block] of blocks.entries()) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      fail(`${relativePath}: JSON-LD block ${index + 1} is malformed (${error.message})`);
    }
  }
}

function validateLocalReferences(relativePath, html) {
  const references = [];
  for (const tagName of ["a", "link", "script", "img", "source", "video"]) {
    for (const tag of tags(html, tagName)) {
      for (const key of ["href", "src", "poster"]) {
        if (tag.attrs[key]) references.push(tag.attrs[key]);
      }
      if (tag.attrs.srcset) {
        references.push(...tag.attrs.srcset.split(",").map((entry) => entry.trim().split(/\s+/)[0]));
      }
    }
  }

  for (const reference of references) {
    if (!reference.startsWith("/") || reference.startsWith("//")) continue;
    const [withoutQuery, fragment = ""] = reference.split("#");
    const clean = withoutQuery.split("?")[0];
    const target = routeToFile(clean || "/");
    const absolute = path.join(root, target);
    if (!fs.existsSync(absolute)) {
      fail(`${relativePath}: broken local reference ${reference}`);
      continue;
    }
    if (fragment && absolute.endsWith(".html") && !read(target).includes(`id="${fragment}"`)) {
      fail(`${relativePath}: missing fragment target ${reference}`);
    }
  }
}

const titles = new Map();
const descriptions = new Map();

for (const [relativePath, route] of pages) {
  const html = read(relativePath);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
  const description = meta(html, "description")?.trim();
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const canonical = link(html, "canonical");
  const robots = meta(html, "robots") || "";

  if (!title) fail(`${relativePath}: missing title`);
  else if (titles.has(title)) fail(`${relativePath}: duplicate title also used by ${titles.get(title)}`);
  else titles.set(title, relativePath);
  if (!description) fail(`${relativePath}: missing meta description`);
  else if (descriptions.has(description)) fail(`${relativePath}: duplicate description also used by ${descriptions.get(description)}`);
  else descriptions.set(description, relativePath);
  if (h1Count !== 1) fail(`${relativePath}: expected one H1, found ${h1Count}`);
  if (canonical !== `${canonicalBase}${route}`) fail(`${relativePath}: incorrect canonical ${canonical || "(missing)"}`);
  if (/noindex/i.test(robots)) fail(`${relativePath}: canonical public page is noindex`);
  if (metaProperty(html, "og:site_name") !== "RECPLACE") fail(`${relativePath}: og:site_name must be RECPLACE`);

  for (const required of ["/Assets/favicon.svg", "/Assets/favicon-48.png", "/favicon.ico", "/Assets/apple-touch-icon.png", "/site.webmanifest"]) {
    if (!html.includes(`href="${required}"`)) fail(`${relativePath}: missing favicon/manifest reference ${required}`);
  }
  for (const coreRoute of ["/", "/leasing/", "/plans/", "/location/", "/updates/", "/contact/"]) {
    if (!html.includes(`href="${coreRoute}"`)) fail(`${relativePath}: initial HTML is missing core navigation link ${coreRoute}`);
  }

  for (const image of tags(html, "img")) {
    if (!("alt" in image.attrs) || !image.attrs.alt.trim()) fail(`${relativePath}: image is missing meaningful alt text (${image.attrs.src || "unknown source"})`);
  }

  validateJsonLd(relativePath, html);
  validateLocalReferences(relativePath, html);
}

const homepage = read("index.html");
for (const route of ["/leasing/", "/plans/", "/location/", "/updates/", "/contact/"]) {
  if (!homepage.includes(`href="${route}"`)) fail(`index.html: missing core homepage link to ${route}`);
}

const websiteSchema = [...homepage.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => JSON.parse(match[1]))
  .flatMap((value) => value["@graph"] || [value])
  .find((value) => value["@type"] === "WebSite");
if (!websiteSchema || websiteSchema.name !== "RECPLACE" || websiteSchema.alternateName !== "RECPLACE Professional Centre") {
  fail("index.html: WebSite schema must identify RECPLACE with RECPLACE Professional Centre as its alternate name");
}

const updates = JSON.parse(read("data/updates.json"));
const updatesInitialHtml = read("updates/index.html").split('<script id="updates-data"')[0];
for (const update of updates) {
  if (!updatesInitialHtml.includes(`<h2>${update.title}</h2>`)) fail(`updates/index.html: ${update.title} is absent from initial HTML`);
}

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedSitemapUrls = pages.map(([, route]) => `${canonicalBase}${route}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail("sitemap.xml: duplicate URL");
for (const url of expectedSitemapUrls) if (!sitemapUrls.includes(url)) fail(`sitemap.xml: missing ${url}`);
for (const url of sitemapUrls) {
  if (!expectedSitemapUrls.includes(url)) fail(`sitemap.xml: non-canonical or redirecting URL ${url}`);
}

const robots = read("robots.txt");
if (!/Allow:\s*\//i.test(robots)) fail("robots.txt: public crawling is not explicitly allowed");
if (!robots.includes("Sitemap: https://recplace.ca/sitemap.xml")) fail("robots.txt: canonical sitemap declaration missing");
if (/Disallow:\s*\/(?:Assets|css|js|leasing|plans|location|updates|contact|design)/i.test(robots)) fail("robots.txt: public content or assets are blocked");

const noindexFiles = ["404.html", "admin.html", "contact.html", "design.html", "leasing.html", "location.html", "plans.html", "updates.html", ...fs.readdirSync(path.join(root, "next"), { recursive: true })
  .filter((entry) => String(entry).endsWith(".html"))
  .map((entry) => path.join("next", String(entry)))];
for (const relativePath of noindexFiles) {
  const robotsMeta = meta(read(relativePath), "robots") || "";
  if (!/noindex/i.test(robotsMeta)) fail(`${relativePath}: must remain noindex`);
}

const manifest = JSON.parse(read("site.webmanifest"));
if (manifest.short_name !== "RECPLACE") fail("site.webmanifest: short_name must be RECPLACE");
for (const relativePath of ["Assets/favicon.svg", "Assets/favicon-48.png", "Assets/favicon-192.png", "Assets/apple-touch-icon.png", "favicon.ico"]) {
  const stat = fs.statSync(path.join(root, relativePath));
  if (!stat.isFile() || stat.size < 100) fail(`${relativePath}: favicon asset is missing or empty`);
}
const png48 = fs.readFileSync(path.join(root, "Assets", "favicon-48.png"));
if (png48.readUInt32BE(16) !== 48 || png48.readUInt32BE(20) !== 48) fail("Assets/favicon-48.png: expected 48x48 dimensions");

async function validateLive() {
  const checks = [...expectedSitemapUrls, `${canonicalBase}/robots.txt`, `${canonicalBase}/sitemap.xml`, `${canonicalBase}/favicon.ico`, `${canonicalBase}/Assets/favicon-48.png`, `${canonicalBase}/site.webmanifest`];
  for (const url of checks) {
    const response = await fetch(url, { redirect: "manual" });
    if (response.status !== 200) fail(`live: ${url} returned ${response.status}`);
  }
}

(async () => {
  if (live) await validateLive();
  if (failures.length) {
    console.error(`SEO checks failed (${failures.length}):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }
  console.log(`SEO checks passed for ${pages.length} canonical pages${live ? " plus live production endpoints" : ""}.`);
})();
