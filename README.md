# RECPLACE Professional Centre

A responsive website for RECPLACE Professional Centre, a professional and commercial development in Prince George, British Columbia.

<!-- Add after taking a screenshot:
![Recplace Professional Centre homepage](docs/images/recplace-home.png)
-->

## About

This website presents the building, leasing opportunities, design, location, construction updates, and contact information for RECPLACE Professional Centre.

I built it to give the development a polished online presence while keeping the content clear, responsive, and easy to update as construction progresses.

## Features

- Responsive multi-page website
- Building overview
- Leasing information
- Design and building details
- Location information
- Construction updates
- Contact page
- Mobile navigation
- Desktop and mobile layouts
- Browser testing with Playwright
- Click-to-load interactive building exterior on Home and Plans, with a larger dedicated Explore page
- Current drone video with quality-focused desktop and mobile exports

See [Interactive 3D implementation](docs/INTERACTIVE_3D.md) for source provenance,
model limitations, build commands, browser QA, and the future leasing mapping.

## Pages

- Home
- Leasing
- Plans / building overview
- Location
- Updates
- Contact
- Design

## Technology

- HTML
- CSS
- JavaScript
- Playwright

## Run Locally

Clone the repository:

```bash
git clone https://github.com/jlsp124/recplace.git
cd recplace
```

Start a local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Verify changes

Run the static SEO and content checks, followed by responsive browser QA:

```bash
npm test
npm run qa:site
```

See `SEO_OPERATIONS.md` for canonical URL, sitemap, index-control, GSC Wizard, Bing, IndexNow, and release procedures.

## Screenshots

Screenshots will be added under:

```text
docs/images/
```

Planned screenshots:

- `recplace-home.png`
- `recplace-mobile.png`
- `recplace-leasing.png`
- `recplace-updates.png`

## My Role

I worked on:

- Website design
- Frontend development
- Responsive behaviour
- Page and content structure
- Mobile navigation
- Construction-update presentation
- Browser testing

## Status

The website is actively maintained as the development progresses.
