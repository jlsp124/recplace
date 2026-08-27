# RECPLACE SEO operations

This document is the operating contract for search-facing changes to the RECPLACE website. It contains no credentials or private Search Console data.

## Canonical site and public URLs

The only canonical hostname is `https://recplace.ca`. Internal links must point directly to these indexable URLs:

- `https://recplace.ca/`
- `https://recplace.ca/leasing/`
- `https://recplace.ca/plans/`
- `https://recplace.ca/location/`
- `https://recplace.ca/updates/`
- `https://recplace.ca/contact/`
- `https://recplace.ca/design/`

Each public page must have one self-referencing canonical, one distinct title, one distinct description, and one H1. The homepage owns the RECPLACE entity. Internal pages use intent-first titles and copy.

## Non-indexable areas

`/next/`, root `.html` compatibility files, `admin.html`, and the 404 page are not public search destinations. They must keep a `noindex` robots meta tag and must never enter the sitemap.

The admin gate is client-side convenience, not secure authentication. Do not place private data or real credentials behind it. A future sensitive admin tool requires server-side authentication and authorization.

`robots.txt` intentionally allows crawlers to fetch the site, including non-indexable pages, so they can see each page's `noindex` directive. Do not use a robots disallow as the only index-control mechanism.

## Redirect and duplicate policy

GitHub Pages enforces HTTPS and redirects the `www` hostname and the GitHub Pages origin to the custom domain. Preserve the exact `CNAME` value `recplace.ca` and keep GitHub Pages HTTPS enforcement enabled.

The static host cannot define page-specific HTTP redirects. Legacy `.html` files therefore use a canonical, `noindex`, meta refresh, and JavaScript navigation as compatibility fallbacks. Do not link to them. If the site later moves behind a configurable edge, replace these fallbacks with permanent server-side redirects after testing every route.

## Sitemap and robots

`sitemap.xml` contains only the seven canonical pages above. Update a page's `lastmod` only when its indexable content or search-facing metadata materially changes. Do not refresh every date to simulate freshness.

`robots.txt` must allow public HTML, CSS, JavaScript, images, icons, and the sitemap. It must declare `https://recplace.ca/sitemap.xml`.

## Search identity and favicon

The authorized source mark is `Assets/favicon.svg`. Derived search/browser assets are:

- `Assets/favicon-48.png`
- `Assets/favicon-192.png`
- `Assets/apple-touch-icon.png`
- `favicon.ico`
- `site.webmanifest`

Run `npm run build:favicons` after an authorized source-mark change, then regenerate `favicon.ico` with an image tool that preserves 16, 32, and 48 pixel sizes. Never substitute an unapproved logo.

The homepage exposes one `WebSite` entity with `name` set to `RECPLACE`, `alternateName` set to `RECPLACE Professional Centre`, and the canonical homepage URL. Do not add duplicate `WebSite` entities or unsupported review, availability, or business markup.

## GSC Wizard and Google Search Console

Use the `sc-domain:recplace.ca` property. For every material release:

1. Before deployment, record 28-day and 90-day site summaries, query-plus-page data, page data, sitemap performance, and URL Inspection results for all seven canonical URLs.
2. Keep the seven canonical URLs in the indexing tracker.
3. After production deployment, inspect the seven canonical URLs, recheck the sitemap, and add a dated deployment annotation if available.
4. Do not use Google's Indexing API for ordinary pages. Rely on crawlable HTML, internal links, the sitemap, and normal recrawling.

The dataset is small. Do not infer demand or causality from one or two impressions, and do not treat an inspection or sitemap status as a ranking guarantee.

## Bing, DuckDuckGo, and IndexNow

Bing Webmaster Tools must be connected by an authorized account owner before GSC Wizard can retrieve Bing data or submit IndexNow URLs. Keep API keys and OAuth material out of this repository.

After connection:

1. Import or verify `recplace.ca` in Bing Webmaster Tools.
2. Verify the sitemap and inspect the homepage plus all core pages.
3. Submit only newly changed canonical URLs through GSC Wizard's IndexNow workflow.
4. Record whether Bing selected the declared canonical and when it last crawled each URL.
5. Recheck DuckDuckGo after Bing refreshes. If Bing is current while DuckDuckGo is stale, classify it as downstream propagation lag.

Do not repeatedly submit unchanged URLs. IndexNow helps discovery; it does not guarantee indexing or rankings.

## Cloudflare

Cloudflare currently provides DNS nameservers, while the public site resolves directly to GitHub Pages rather than through the Cloudflare proxy. Crawler Hints, edge redirects, cache rules, WAF, and bot settings cannot be assumed active from repository state.

An authorized account owner must review the dashboard before changing proxy state or enabling Crawler Hints. Do not enable the proxy merely for SEO without validating GitHub Pages HTTPS, redirects, caching, and normal Googlebot/Bingbot access.

## Content and internal-link policy

Primary navigation must remain present in initial HTML and use the concise anchors Home, Leasing, Plans, Location, Updates, and Contact. The logo/name links to `/`. JavaScript may enhance this markup but must not be its only source.

Construction updates must remain meaningful in the initial HTML as well as in `data/updates.json`. When adding an update, synchronize both representations and run the checks below.

Architectural plan files were deliberately removed from the public repository in April 2026. Do not restore them from Git history without explicit project-owner authorization. Do not infer dimensions by measuring drawings.

Do not publish changing lease rates, availability, completion dates, occupancy dates, signed tenants, or similar claims without current authorized source material.

## Regression checks

Run before every pull request and deployment:

```powershell
npm test
npm run qa:site
git diff --check
node --check js/site.js
node --check js/updates.js
```

`npm test` checks public titles, descriptions, H1s, canonicals, internal references, sitemap membership, robots policy, `noindex` controls, JSON-LD parsing, initial update content, image alt text, homepage hierarchy, and favicon assets. `npm run qa:site` opens every canonical route at desktop and mobile viewports, checks navigation and overflow, and writes ignored screenshots under `.qa/seo-site-smoke`. Pull requests and pushes to `main` run the static check in GitHub Actions.

After production deployment, run `npm run seo:check:live`. It validates 200 responses for all sitemap pages and the core search-identity endpoints. A live failure blocks the SEO sign-off even if CI passed.

## Adding a page

1. Confirm that the page serves a distinct user intent and is not a thin keyword variant.
2. Add a clean directory URL with an `index.html` file.
3. Add unique metadata, one H1, a self-canonical, favicon links, meaningful image alt text, and only accurate JSON-LD.
4. Link it from the smallest appropriate part of the hierarchy.
5. Add it to `sitemap.xml` with an accurate `lastmod` and to `scripts/seo-check.cjs`.
6. Add it to GSC Wizard's tracker after production deployment and verify it in Google and Bing.

## Removing a page

1. Remove internal links and sitemap membership.
2. Prefer a permanent server-side redirect to the closest genuine replacement; do not redirect every removed page to the homepage.
3. If the static host cannot issue the needed redirect, keep a minimal `noindex` compatibility file until edge/server redirects are available.
4. Preserve historical Search Console data. Do not try to erase old URL history.

## Branded SERP monitoring

Check `recplace.ca`, `recplace`, `RECPLACE Prince George`, `RECPLACE Professional Centre`, and `2740 Recplace Drive` on Google, Bing, DuckDuckGo, and Brave. Record the primary URL, title, site name, favicon, snippet, secondary URLs, and visible sitelinks. Use a fresh search context and treat one result page as presentation evidence, not a guaranteed rank.

Review crawl and favicon state after 48–72 hours, query/page selection after 1–2 weeks, and meaningful performance after 4–6 weeks. Sitelinks are algorithmic and cannot be forced.

## Prohibited shortcuts

Do not add doorway pages, hidden text, keyword-stuffed footers, fake reviews, fake locations, fake availability, bought links, mass directory submissions, or unsupported schema. Do not redesign or migrate the lightweight static architecture merely for SEO.
