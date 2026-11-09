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
| `OPENROUTER_API_KEY` | OpenRouter (free thinking/decision models first) |
| `OPENROUTER_THINKING_MODELS` | Optional comma-separated free model ids for research/theses/draft |
| `OPENROUTER_DECISION_MODELS` | Optional comma-separated free model ids for POC / live checks |
| `ANTHROPIC_API_KEY` | Claude (optional) |
| `APP_PASSCODE` | Extra lock behind `x-passcode` (published app also requires Cursor sign-in) |
| `RESEND_API_KEY` / `FROM_EMAIL` | Optional email send on approve |
| `DATABASE_URL` | Scheduled sequences (Postgres) |

Default free models: Nemotron reasoning / Gemma 4 31B / Flint / `openrouter/free` for thinking; Gemma + Nemotron + `openrouter/free` for decision checks.

Browser **Profile → API keys** override per request and stay in localStorage only.
