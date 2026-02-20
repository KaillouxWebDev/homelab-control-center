# Security Policy

## Supported versions

We support the current major version with security updates. Upgrade to the latest release to receive fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Important note about deployment

**This application can start, stop, and restart Docker containers and read logs.** Do not expose it publicly without access control. Use authentication (e.g. reverse proxy with auth), VPN, or network restrictions. Never commit `.env` or `config/services.yml`; they may contain Portainer credentials or API keys.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

- **Preferred contact:** peprent@pm.me
- **What to include:** product version, steps to reproduce, impact, and any suggested fix if you have one.
- **What to expect:** We will acknowledge quickly and respond on a best-effort basis. We may ask for more details or suggest a fix timeline. We will not disclose the issue publicly until a fix is available or we agree otherwise.

Thank you for helping keep this project and its users safe.
