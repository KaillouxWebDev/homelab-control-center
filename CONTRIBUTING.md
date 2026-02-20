# Contributing to Homelab Control Center

Thank you for your interest in contributing. This document covers how to run the project, our conventions, and how to submit changes.

## Running locally

1. **Clone and install**

   ```bash
   git clone https://github.com/KaillouxWebDev/homelab-control-center.git
   cd homelab-control-center
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env`. For local development without Portainer you can set:

   ```env
   DEMO_MODE=true
   ```

   Then run:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). In demo mode you’ll see mock containers and can test the UI without a real Portainer instance.

## Demo mode

With `DEMO_MODE=true` in `.env`, the app does not call Portainer. Use it to develop and test the UI, run the linter, and verify the build. No Portainer URL or credentials are required.

## Coding conventions

- **TypeScript:** Use strict mode; avoid `any` unless justified.
- **Patterns:** Follow existing patterns (e.g. API routes return `NextResponse.json`, use `@/lib/validate` for input validation).
- **Secrets:** Do not commit `.env`, `config/services.yml`, or any real credentials. Do not add `NEXT_PUBLIC_*` for sensitive data.

## Commits and pull requests

- **Commits:** Prefer clear, short messages (e.g. “Add theme toggle”, “Fix container id validation”).
- **PRs:** Open a pull request against the default branch. Fill in the PR template. Keep changes focused and documented.
- **Checks:** Ensure `npm run lint` and `npm run build` pass. CI will run these on push and PRs.

## Adding a new feature

- Propose the change in an issue or discussion first if it’s large.
- Implement in small steps: one logical change per commit when possible.
- Update docs (e.g. README) if you add options or behavior that users need to know about.

## Reporting bugs

Open an issue and include:

- **Version:** Homelab Control Center version (or commit).
- **Environment:** OS, Node version, how you run the app (Docker vs `npm run dev`/`npm start`).
- **Portainer:** Portainer version and endpoint type (local Docker, remote, etc.) if relevant.
- **Steps to reproduce:** Clear, minimal steps.
- **Expected vs actual:** What you expected and what happened.
- **Logs:** A relevant snippet (no secrets).

## Feature requests

Open an issue with a clear description of the problem, your proposed solution, and any alternatives you’ve considered. This helps maintainers and others discuss scope and design.

## Security

- Never expose Portainer credentials or API keys in the client. All Portainer calls must go through the Next.js API routes.
- Report security issues privately (see [SECURITY.md](SECURITY.md)); do not disclose them in public issues.
