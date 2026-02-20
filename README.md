![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)

# Homelab Control Center

A clean, Apple-style dashboard to manage Docker containers via the Portainer CE API. Optimized for touch screens (e.g. Raspberry Pi) and fullscreen kiosk use.

<!-- Screenshot: add an image of the dashboard here if desired -->

## What is this?

- **Next.js 14** (App Router) + **Tailwind** + **shadcn/ui** + **lucide-react** + **SWR**
- Lists containers from a Portainer CE endpoint; view logs, start/stop/restart with confirmation and toasts
- All Portainer requests go through the Next.js backend; **no credentials are ever sent to the browser**
- Optional **demo mode** to run and test without any Portainer setup
- Optional **services config** (YAML) to map container names to “Open” URLs (e.g. reverse proxy)

## Security warning

- **Do not expose this app publicly** without proper access control. It allows starting/stopping/restarting containers and reading logs. Use a reverse proxy with authentication, VPN, or restrict by IP. Never commit `.env` or `config/services.yml` if they contain sensitive URLs or tokens.

- **Never expose** your Portainer API key publicly.

## Requirements

- Node.js 18+
- Portainer CE
- Docker environment connected to Portainer

## Setup

1. **Copy environment file**

   ```bash
   cp .env.example .env
   ```

2. **Configure `.env`**

   - **Required** (unless using demo mode): `PORTAINER_URL`, `PORTAINER_ENDPOINT_ID`
   - **Auth**: set either `PORTAINER_API_KEY` (recommended) or `PORTAINER_USERNAME` + `PORTAINER_PASSWORD`
   - **Optional**: `PORTAINER_INSECURE_TLS=false`, `DEMO_MODE=false`

   See `.env.example` for all variables and comments.

3. **Get `PORTAINER_ENDPOINT_ID`**

   After logging in to Portainer, get the endpoint (Docker environment) ID via the API:

   ```bash
   JWT=$(curl -s -X POST "${PORTAINER_URL}/api/auth" \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"YOUR_PASSWORD"}' | jq -r '.jwt')
   curl -s -H "Authorization: Bearer $JWT" "${PORTAINER_URL}/api/endpoints" | jq '.[].Id'
   ```

   Use that `Id` (often `1`) as `PORTAINER_ENDPOINT_ID`.

4. **Run the app**

   ```bash
   npm install
   npm run build
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000). Use **Setup** (footer) or [/setup](/setup) to check configuration status.

## Demo mode

Set in `.env`:

```env
DEMO_MODE=true
```

No Portainer URL or credentials are needed. The app shows mock containers (jellyfin, mc, pihole, portainer, filebrowser), fake logs, and start/stop/restart return success without calling Portainer. A **“DEMO MODE ACTIVE”** banner is shown. Useful for local testing and screenshots.

## Docker

- **Build**

  ```bash
  docker build -t homelab-control-center .
  ```

- **Run**

  ```bash
  docker run -p 3000:3000 --env-file .env homelab-control-center
  ```

- **Compose**

  ```bash
  docker compose up -d
  ```

  Uses `env_file: .env` and exposes port **3000**.

  Make sure `.env` is present before running the container.

## Reverse proxy example

Example Caddy snippet so the app is served at `https://control.home` with TLS:

```caddy
control.home {
  reverse_proxy localhost:3000
}
```

Put authentication in front (e.g. Caddy auth plugin, Cloudflare Access, or VPN) so the app is not publicly open.

## Open URLs (services config)

To show an “Open” button per container with a custom URL (e.g. reverse proxy), copy the example and edit:

```bash
cp config/services.example.yml config/services.yml
```

Edit `config/services.yml` (see `services.example.yml` for structure). If the file is missing, the app still works; built-in defaults or no “Open” button are used.

## Theme (Light / Dark / System)

The app supports three theme modes via the toggle in the top-right header: **System** (default, follows OS/browser `prefers-color-scheme`), **Light**, and **Dark**. The choice is stored in `localStorage` and applied immediately without a flash on load. Tailwind uses `darkMode: "class"` and CSS variables for colors so all UI (including shadcn components) stays consistent in both themes.

## Favicon and brand assets

Assets live under **`public/`** at the repo root. Paths and names must match:

- **Header logo:** `public/brand/logo.png` → `/brand/logo.png`. Square, transparent background. See `public/brand/README.md`.
- **Favicon:** `public/favicon.ico` → `/favicon.ico`. Optional variants (see `public/README.md`): `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180×180). The app references all of these in layout metadata and `<link>` tags; add the PNGs if you want to avoid 404s and get correct sizes everywhere.

If a file is missing, the app still runs; the browser may fall back to another icon or show a default.

**If the favicon doesn’t update** after changing files: hard refresh (Ctrl+F5 / Cmd+Shift+R), clear cache, or open the site in a private/incognito window.

## Project structure (high level)

- `src/app/` — App Router pages and API routes
- `src/components/` — UI (cards, dialogs, banners)
- `src/lib/` — Portainer client, env, validation, services config loader
- `src/config/` — Client-side service URL helper
- `config/services.example.yml` — Optional Open URL mapping (copy to `services.yml`)

## Community & Security

- **Security:** See [SECURITY.md](SECURITY.md) for supported versions and how to report vulnerabilities (please do not report security issues in public).
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run locally, demo mode, and how to open PRs.
- **Questions and ideas:** Use [GitHub Discussions](https://github.com/KaillouxWebDev/homelab-control-center/discussions). For support and feature requests, see [SUPPORT.md](SUPPORT.md).

**CI:** Push and pull requests to `main` run lint and build checks (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

## License

MIT. See [LICENSE](LICENSE).
