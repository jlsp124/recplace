# Recplace Professional Centre (Static Site)

Static multi-page site (home, leasing, design, location, updates, contact, admin).

## Run locally

For best results (so `data/updates.json` loads), serve the folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Admin access

- Admin page: `admin.html` code `Pahal123`

## Updating the Updates page

- Open `admin.html`, add a post, then download `updates.json`
- Replace `data/updates.json` with the downloaded file
- (Optional) Add any post images into `Assets/updates/` and reference them in the post
