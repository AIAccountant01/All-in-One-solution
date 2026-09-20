# Helia monorepo

## V1 status: GATE OPEN

All four product-loop roles approved Helia **Version 1** (`product-loop/workspace/v1-status.json` → `"gate_open": true`).

Helia is a mobile personal health assistant (PWA) unifying Gabit, Ultrahuman, Google Fit, and Apple Health — with weekly summaries, dietitian-style guidance, and autonomous nudges.

### Install / open
**Public app:** https://helia-pwa.vercel.app  

On phone: open the link → create a PIN → browser menu → **Add to Home Screen**.

> Note: `all-in-one-solution.vercel.app` still serves an old Create Next App stub. Use the URL above.

### Security (on-device vault)
- First launch: create a PIN (4–8 digits)
- Health data is encrypted at rest with **PBKDF2 + AES-GCM** in localStorage
- Auto-locks after **15 minutes** of inactivity; More → Lock now / Wipe vault
- PIN and keys never leave the device
- HTTP security headers: CSP, X-Frame-Options, nosniff, HSTS, Referrer-Policy

### Live connections (P1)
1. **Google Fit** — Connect runs Google OAuth when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set (redirect URI: `/oauth/google`). Without it, Connect still uses the live sync pipeline in demo mode.
2. **Apple Health** — Connect + **Import export** (Health app → Export All Health Data `.zip` / `export.xml`).
3. **Gabit / Ultrahuman** — Connect after a hub is linked; sync flows through Apple Health / Google Fit until partner OAuth exists.
4. Tap **Sync now** on any connected priority app to refresh Today.

### Product loop (for future iterations)
```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
cd product-loop && npm install && npm run dev
```

### P1 (next)
- Live HealthKit / Health Connect / partner OAuth
- Native App Store / Play Store wrappers

Helia is a wellness assistant, not a medical device.
