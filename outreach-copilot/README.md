# Outreach Copilot

Company → researched signals (sources that load) → two problem theses → POC → questions → Jev-scored cold sequence.

Rebuild of [outreach-copilot-kappa.vercel.app](https://outreach-copilot-kappa.vercel.app) for Cursor publish.

## Local

```bash
npm install
npm run dev
```

Optional env (also bindable as Cursor app secrets):

- `APP_PASSCODE` — gate API routes
- `ANTHROPIC_API_KEY` / `MOONSHOT_API_KEY` / `OPENROUTER_API_KEY` — server fallbacks when browser keys are empty
- `RESEND_API_KEY` + `FROM_EMAIL` — send Email 1 when approved for immediate send
- `DATABASE_URL` — set automatically on publish when Postgres is enabled

Browser Profile → API keys still override per request (stored only in localStorage).
