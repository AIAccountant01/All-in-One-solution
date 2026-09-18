# Helia monorepo

## V1 status: GATE OPEN

All four product-loop roles approved Helia **Version 1** (`product-loop/workspace/v1-status.json` → `"gate_open": true`).

Helia is a mobile personal health assistant (PWA) unifying Gabit, Ultrahuman, Google Fit, and Apple Health — with weekly summaries, dietitian-style guidance, and autonomous nudges.

### Run the app
```bash
npm install && npm run dev
```
Open on your phone or Chrome device mode → **Add to Home Screen** to install.

### Product loop (for future iterations)
```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
cd product-loop && npm install && npm run dev
```

### P1 (next)
- Live HealthKit / Health Connect / partner OAuth
- Native App Store / Play Store wrappers

Helia is a wellness assistant, not a medical device.
