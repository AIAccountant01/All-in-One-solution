# Helia monorepo

## V1 status: GATE OPEN

All four product-loop roles approved Helia **Version 1** (`product-loop/workspace/v1-status.json` → `"gate_open": true`).

Helia is a mobile personal health assistant (PWA) unifying Gabit, Ultrahuman, Google Fit, and Apple Health — with weekly summaries, dietitian-style guidance, and autonomous nudges.

### Run the app
```bash
npm install && npm run dev
```
Open on your phone or Chrome device mode → **Add to Home Screen** to install.

### Security (on-device vault)
- First launch: create a PIN (4–8 digits)
- Health data is encrypted at rest with **PBKDF2 + AES-GCM** in localStorage
- Auto-locks after **15 minutes** of inactivity; More → Lock now / Wipe vault
- PIN and keys never leave the device (demo integrations stay client-only)
- HTTP security headers: CSP, X-Frame-Options, nosniff, HSTS, Referrer-Policy

### Product loop (for future iterations)
```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
cd product-loop && npm install && npm run dev
```

### P1 (next)
- Live HealthKit / Health Connect / partner OAuth
- Native App Store / Play Store wrappers

Helia is a wellness assistant, not a medical device.
