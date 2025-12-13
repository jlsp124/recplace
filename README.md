# Recplace Professional Centre (Static Site)

Static multi-page site built from the project spec (landing, leasing, design, plans gate, location, updates, contact, admin).

## Run locally

For best results (so `data/updates.json` loads), serve the folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Access-code gates (deterrent only)

- Plans page: `plans.html` → code `RecPlacePro2740`
- Admin page: `admin.html` → code `Pahal123`

Static gates on GitHub Pages can be bypassed; use real hosting/auth if you need true protection.

## Updating the Updates page

- Open `admin.html`, add a post, then download `updates.json`
- Replace `data/updates.json` with the downloaded file
- (Optional) Add any post images into `Assets/updates/` and reference them in the post

## Comments

`updates.html` includes a giscus embed snippet template. Fill in your repo/category IDs to enable comments.
