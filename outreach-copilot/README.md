# Outreach Copilot

Company → researched signals (sources that actually load) → two problem theses → POC → questions → cold email sequence.

## New here?

**Read [SETUP-FOR-BEGINNERS.md](./SETUP-FOR-BEGINNERS.md)** — full Step 1 → Step 10 guide.

## Quick start (if you already know Node)

```bash
npm install
npm run dev
```

Open http://localhost:3000 → **Profile** → add a Moonshot/Kimi or OpenRouter API key → **Run** → research a company.

## Optional server env

| Variable | Purpose |
| --- | --- |
| `MOONSHOT_API_KEY` | Kimi / Moonshot (server fallback) |
| `OPENROUTER_API_KEY` | OpenRouter fallback + live-web check |
| `ANTHROPIC_API_KEY` | Claude (optional) |
| `APP_PASSCODE` | Lock APIs behind `x-passcode` |
| `RESEND_API_KEY` / `FROM_EMAIL` | Optional email send on approve |
| `DATABASE_URL` | Scheduled sequences (Postgres) |

Browser **Profile → API keys** override per request and stay in localStorage only.
