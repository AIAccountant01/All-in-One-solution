# Outreach Copilot — do exactly this (for beginners)

You do **not** need to know coding.  
Just follow the steps **in order**. One step at a time.  
If something looks wrong, stop and ask for help — do not invent your own steps.

---

## Before you start — what you need

- A computer (Mac or Windows)
- Internet
- About 20–30 minutes the first time
- The zip file someone sent you: `outreach-copilot-share.zip`
- Later: your **own** API key (free options exist). You will get this in Step 7.

You do **not** need anyone else’s API keys.

---

## Step 1 — Install Node.js

Node.js is a free program. The app needs it to run.

1. Open your browser (Chrome / Safari / Edge).
2. Go to: **https://nodejs.org/**
3. Click the big green button that says **LTS**.
4. Save the installer.
5. Open the installer.
6. Click **Next / Continue / Agree / Install** until it says it finished.
7. On Mac you may need your password.
8. When done, **close and reopen** Terminal / Command Prompt (important).

### Check Step 1 worked

1. Open:
   - **Mac:** Spotlight (Cmd+Space) → type `Terminal` → Enter  
   - **Windows:** Start menu → type `cmd` → Enter (Command Prompt)
2. Type this and press Enter:

```text
node -v
```

3. Good result = a version number, like `v22.11.0`  
4. Bad result = `command not found` or similar → install failed. Redo Step 1.

5. Also type:

```text
npm -v
```

Good result = a number like `10.9.0`.

✅ Only continue when both commands show numbers.

---

## Step 2 — Unzip the project

1. Find `outreach-copilot-share.zip` (usually in **Downloads**).
2. Unzip it:
   - **Mac:** double-click the zip
   - **Windows:** right-click → **Extract All…** → Extract
3. You should get a folder with files inside.
4. Move that folder to your **Desktop**.
5. Rename the folder to exactly:

```text
outreach-copilot
```

(Right-click → Rename.)

Your Desktop should now have a folder named `outreach-copilot`.

---

## Step 3 — Open Terminal inside that folder

### Mac

1. Open **Terminal**.
2. Copy-paste this and press Enter:

```bash
cd ~/Desktop/outreach-copilot
```

### Windows

1. Open **Command Prompt**.
2. Copy-paste this and press Enter:

```bat
cd %USERPROFILE%\Desktop\outreach-copilot
```

### Check you are in the right folder

Mac / PowerShell:

```bash
ls
```

Windows Command Prompt:

```bat
dir
```

You **must** see names like:

- `package.json`
- `app`
- `lib`
- `SETUP-FOR-BEGINNERS.md`

If you do not see those names, you are in the wrong folder. Fix the `cd` path and try again.

✅ Stay in this same Terminal window for the next steps.

---

## Step 4 — Install the app pieces

In that Terminal window, copy-paste this and press Enter:

```bash
npm install
```

What you will see:

- Lots of text scrolling
- Waiting 1–3 minutes is normal
- At the end you get your prompt back

❌ If you see big red `npm ERR!` lines, copy the last screen of text and send it to whoever gave you the zip.

✅ If there is no big red error, continue.

---

## Step 5 — Start the app

In the **same** Terminal window, copy-paste:

```bash
npm run dev
```

Good signs:

- You see text about **Next.js**
- You see something like `Local: http://localhost:3000`

**Do not close this Terminal window.**  
Closing it stops the app.

Leave it open and go to Step 6.

---

## Step 6 — Open the website

1. Open your browser.
2. Click the address bar.
3. Type exactly:

```text
http://localhost:3000
```

4. Press Enter.

You should see:

- Title: **Outreach Copilot**
- Tabs: **Run**, **Scheduled**, **History**, **Profile**

If the page is blank / cannot connect:

- Look at the Terminal from Step 5 — is it still running?
- Try: `http://127.0.0.1:3000`
- Ask for help with a screenshot of the Terminal

---

## Step 7 — Add YOUR API key (required)

Without a key, **Research will fail**.

You need **at least one** key. Easiest free-ish options:

1. **OpenRouter** → https://openrouter.ai/  
   Create account → Keys → Create key → copy it
2. **Moonshot / Kimi** → https://platform.moonshot.ai/ or https://platform.kimi.ai/  
   Create account → API key → copy it

### Put the key into the app

1. In the website, click **Profile** (top right).
2. Scroll down to **API keys**.
3. Paste your key in the matching box:
   - OpenRouter key → OpenRouter box
   - Moonshot/Kimi key → Kimi / Moonshot box
4. Click **Save & test**.
5. Wait.
6. Good = message like “Key works.”
7. Bad = red error → key is wrong, or account has no access. Make a new key and try again.

⚠️ Never send your key in a public chat.  
⚠️ Do not put keys into random files unless someone who knows the project asks you to.

---

## Step 8 — Try Research

1. Click **Run** (top).
2. In the box “Which company?”, type a real company, example:

```text
Stripe
```

3. Click the yellow **Research** button.
4. Wait 30–90 seconds. Do not spam-click.
5. Follow the screens:
   - Read research
   - Build theses
   - Pick a person
   - Answer short questions
   - Get email drafts

If you see an error in red:

- Take a screenshot
- Make sure Step 7 key still says it works
- Try again once
- Then ask for help with the screenshot

---

## Step 9 — Stop the app

When you are done for the day:

1. Click the Terminal window from Step 5.
2. Press **Ctrl + C** (Windows and Mac).
3. The site will stop. That is normal.

---

## Step 10 — Start it again tomorrow

You do **not** need to unzip or `npm install` again.

1. Open Terminal / Command Prompt.
2. Go to the folder again (same as Step 3).
3. Run:

```bash
npm run dev
```

4. Open http://localhost:3000
5. Your API key should still be saved in the browser (same computer + same browser).

---

## Tiny checklist

Print or tick these:

1. [ ] `node -v` works  
2. [ ] Folder `outreach-copilot` is on Desktop  
3. [ ] Terminal is inside that folder (`ls` / `dir` shows `package.json`)  
4. [ ] `npm install` finished with no red error  
5. [ ] `npm run dev` is running and left open  
6. [ ] http://localhost:3000 shows Outreach Copilot  
7. [ ] Profile → API key → Save & test works  
8. [ ] Research on a company works  

---

## Common mistakes (read this)

| Mistake | Fix |
| --- | --- |
| Closed the Terminal | Run `npm run dev` again |
| Typed `npm install` in the wrong folder | `cd` to Desktop/outreach-copilot first |
| Used someone else’s API key | Make your own key in Step 7 |
| Opened the zip but never unzipped | Extract first (Step 2) |
| Opened `file://...` instead of localhost | Use http://localhost:3000 |
| Double-clicked random files inside the folder | Don’t. Use Terminal + browser only |

---

## Still stuck?

Send **three screenshots** to the person who shared this:

1. Your Terminal after `node -v` and `npm -v`
2. Your Terminal after `npm install` / `npm run dev`
3. The browser page (or the red error)

That is enough for them to help you.
