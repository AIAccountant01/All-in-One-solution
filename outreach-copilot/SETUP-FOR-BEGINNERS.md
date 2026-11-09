# Outreach Copilot — setup for absolute beginners

This guide assumes you have never run a coding project before. Follow every step in order. Do not skip steps.

---

## What you will end up with

A website on your computer called **Outreach Copilot**.  
You type a company name → it researches the company → it drafts cold emails.

---

## Step 1 — Install Node.js (required)

1. Open this page in your browser: https://nodejs.org/
2. Click the big green button that says **LTS** (Long Term Support).
3. Download the installer for your computer (Mac or Windows).
4. Open the downloaded file and click **Next / Continue / Install** until it finishes.
5. Restart your computer (recommended).

### Check that it worked

1. On **Mac**: open **Terminal** (Spotlight → type `Terminal` → Enter).  
   On **Windows**: open **Command Prompt** or **PowerShell**.
2. Type this exactly and press Enter:

```bash
node -v
```

3. You should see something like `v22.x.x` or `v20.x.x`.  
   If you see “command not found”, Node.js is not installed — repeat Step 1.

4. Also check npm:

```bash
npm -v
```

You should see a number like `10.x.x`.

---

## Step 2 — Get the project folder

Someone will send you a file named something like:

`outreach-copilot-share.zip`

1. Download that zip to your computer (e.g. Downloads).
2. Unzip it:
   - **Mac**: double-click the zip.
   - **Windows**: right-click → **Extract All…**
3. You should get a folder. Rename it to `outreach-copilot` if you want (optional).
4. Move that folder somewhere easy, for example:
   - Mac: `/Users/YOURNAME/Desktop/outreach-copilot`
   - Windows: `C:\Users\YOURNAME\Desktop\outreach-copilot`

---

## Step 3 — Open a terminal inside the project folder

### Mac

1. Open **Terminal**.
2. Type `cd ` (with a space after cd), then drag the `outreach-copilot` folder into the Terminal window, then press Enter.  
   Or type the full path, for example:

```bash
cd ~/Desktop/outreach-copilot
```

### Windows

1. Open **Command Prompt** or **PowerShell**.
2. Type:

```bash
cd Desktop\outreach-copilot
```

(If your folder is elsewhere, use that path instead.)

### Confirm you are in the right place

Type:

```bash
ls
```

(On Windows Command Prompt use `dir` instead of `ls`.)

You should see files like `package.json`, `app`, `lib`, `README.md`.  
If you do **not**, you are in the wrong folder — fix the `cd` path and try again.

---

## Step 4 — Install the project dependencies

Still in that same terminal window, run:

```bash
npm install
```

Wait. This can take 1–3 minutes.  
You will see lots of scrolling text. That is normal.

When it finishes, you should be back at a prompt with no big red error.  
If you see `npm ERR!`, copy the last 20 lines and send them to whoever shared this project with you.

---

## Step 5 — Start the app

In the same terminal, run:

```bash
npm run dev
```

Leave this window open. Do not close it while you use the app.

You should see something like:

```text
▲ Next.js ...
- Local: http://localhost:3000
```

---

## Step 6 — Open the app in your browser

1. Open Chrome / Safari / Edge.
2. Go to: http://localhost:3000
3. You should see **Outreach Copilot** with tabs: Run, Scheduled, History, Profile.

If the page does not load:

- Make sure Step 5 is still running.
- Try http://127.0.0.1:3000 instead.
- Check the terminal for red errors.

---

## Step 7 — Add at least one AI API key (required to Research)

Without a key, Research will fail.

You need **at least one** of these (Moonshot / Kimi or OpenRouter is enough to start):

| Provider | Where to get a key | Where to paste it in the app |
| --- | --- | --- |
| Moonshot / Kimi | https://platform.moonshot.ai/ or https://platform.kimi.ai/ | Profile → API keys → Kimi / Moonshot |
| OpenRouter | https://openrouter.ai/ | Profile → API keys → OpenRouter |
| Anthropic (Claude) | https://console.anthropic.com/ | Profile → API keys → Anthropic |

### How to paste a key in the app

1. In the app, click **Profile** (top right).
2. Scroll to **API keys**.
3. Paste your key into the matching box.
4. Click **Save & test**.
5. Wait for “Key works.”  
   If it fails, the key is wrong, expired, or that model is not allowed on your account.

**Important:** Keys stay in **your browser only**. Do not commit keys into git. Do not email keys in plain text if you can avoid it.

---

## Step 8 — Run your first research

1. Click the **Run** tab.
2. Type a company name (example: `Emergent` or `Desible.ai`).
3. Click **Research**.
4. Wait (can take 30–90 seconds).
5. Follow the on-screen steps:
   - Research results
   - Build theses
   - Pick a person
   - Answer a few questions
   - Get your email sequence

---

## Step 9 — Stop the app when you are done

1. Go back to the terminal where `npm run dev` is running.
2. Press `Ctrl + C` (Mac and Windows).
3. The site at http://localhost:3000 will stop working until you run Step 5 again.

---

## Step 10 — Next time you want to use it

1. Open Terminal / Command Prompt.
2. `cd` into the `outreach-copilot` folder (Step 3).
3. Run `npm run dev` (Step 5).  
   You do **not** need `npm install` again unless someone sent you a new zip.
4. Open http://localhost:3000.

---

## Optional — deploy to the internet (Vercel)

Only do this if you want a public URL for yourself (not just localhost).

1. Create a free account at https://vercel.com/
2. Install Vercel CLI (in Terminal):

```bash
npm install -g vercel
```

3. In the `outreach-copilot` folder:

```bash
vercel login
vercel
```

4. Follow the prompts (link to your account, accept defaults).
5. In the Vercel project settings → **Environment Variables**, add any keys you want on the server:
   - `MOONSHOT_API_KEY`
   - `OPENROUTER_API_KEY`
   - `ANTHROPIC_API_KEY` (optional)
   - `APP_PASSCODE` (optional — locks the APIs)
6. Redeploy after adding env vars.

---

## Common problems

### “command not found: npm” or “node”

Node.js is not installed or Terminal was not restarted. Redo Step 1, then reopen Terminal.

### `npm install` fails

- Check you are inside `outreach-copilot` (Step 3).
- Make sure you have internet.
- Try:

```bash
npm install --legacy-peer-deps
```

### Research says model not found / permission denied

Your Moonshot/Kimi key may not include that model.  
Add an **OpenRouter** key in Profile as well, then try again.

### Research is slow or empty

- Company name may be too vague — try the real website name.
- DuckDuckGo search can be flaky; try again once.
- Check your API key still has credits / free quota.

### Port 3000 already in use

Run on another port:

```bash
npm run dev -- -p 3001
```

Then open http://localhost:3001

---

## What this project is (short)

- **Folder:** `outreach-copilot`
- **Stack:** Next.js (React) web app
- **Flow:** Company → research → theses → contact → questions → email sequence
- **Your keys:** used from Profile (browser) or server env vars

---

## Checklist (print this)

- [ ] Step 1: Node.js installed (`node -v` works)
- [ ] Step 2: Unzipped the project
- [ ] Step 3: Terminal is inside `outreach-copilot`
- [ ] Step 4: `npm install` finished
- [ ] Step 5: `npm run dev` is running
- [ ] Step 6: http://localhost:3000 opens
- [ ] Step 7: At least one API key saved & tested
- [ ] Step 8: Research on a company works
