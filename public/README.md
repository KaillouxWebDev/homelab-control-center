# Public assets

Static files in this folder are served at the site root (e.g. `public/brand/logo.png` → `/brand/logo.png`).

## Required for full functionality

| File | Purpose |
|------|---------|
| `brand/logo.png` | Header logo (square, transparent background recommended). |
| `favicon.ico` | Browser tab icon (fallback). |

## Optional favicon variants

The app references these for better compatibility; add them if you want to avoid 404s and get correct sizes everywhere:

| File | Sizes | Purpose |
|------|--------|--------|
| `favicon-16x16.png` | 16×16 | Small browser tab / bookmarks. |
| `favicon-32x32.png` | 32×32 | Standard favicon. |
| `apple-touch-icon.png` | 180×180 | Add to home screen (iOS, etc.). |

**Generating them:** Use `favicon.ico` or `brand/logo.png` as source and export the sizes above with any image editor or a favicon generator (e.g. realfavicongenerator.net). If a file is missing, the app still runs; the browser may fall back to `favicon.ico` or show a default icon.
