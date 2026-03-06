# West Asia Conflict Tracker — Deployment Guide

Two repos, two deploys. Takes about 15 minutes total.

---

## Architecture

```
[Browser] → GitHub Pages (frontend/index.html)
               ↓ fetch /api/query
           [Render.com] (backend/server.js) — holds your API key securely
               ↓
           Anthropic API (web search + Claude)
```

---

## Step 1 — Deploy the Backend to Render (free)

The backend is a tiny Express proxy that keeps your API key out of the browser.

### 1a. Create a GitHub repo for the backend

```bash
cd backend/
git init
git add .
git commit -m "initial proxy"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/conflict-tracker-backend.git
git push -u origin main
```

### 1b. Deploy to Render

1. Go to **https://render.com** → Sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account → select `conflict-tracker-backend`
4. Fill in:
   - **Name:** `conflict-tracker-proxy`
   - **Region:** Oregon (US West) or Frankfurt
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Click **"Advanced"** → **"Add Environment Variable"**:
   - Key: `ANTHROPIC_API_KEY` → Value: `sk-ant-YOUR-KEY-HERE`
   - Key: `ALLOWED_ORIGIN` → Value: `https://YOUR-GITHUB-USERNAME.github.io` (you'll set this after step 2)
6. Click **"Create Web Service"**

Wait ~2 min for deploy. You'll get a URL like:
```
https://conflict-tracker-proxy.onrender.com
```

Test it:
```bash
curl https://conflict-tracker-proxy.onrender.com/
# Should return: {"status":"ok","service":"conflict-tracker-proxy"}
```

> ⚠️ **Free tier note:** Render free services spin down after 15 min of inactivity. First request after idle takes ~30 seconds to wake up. Upgrade to $7/mo Starter to keep it always-on.

---

## Step 2 — Deploy the Frontend to GitHub Pages

### 2a. Edit the PROXY_URL in index.html

Open `frontend/index.html` and replace line near the top:
```javascript
const PROXY_URL = 'https://YOUR-BACKEND.onrender.com/api/query';
```
With your actual Render URL:
```javascript
const PROXY_URL = 'https://conflict-tracker-proxy.onrender.com/api/query';
```

### 2b. Create a GitHub repo for the frontend

```bash
cd frontend/
git init
git add .
git commit -m "initial frontend"
# Create a NEW repo on github.com named: conflict-tracker  (or any name)
git remote add origin https://github.com/YOUR-USERNAME/conflict-tracker.git
git push -u origin main
```

### 2c. Enable GitHub Pages

1. Go to your frontend repo on GitHub
2. **Settings** → **Pages** (left sidebar)
3. Under **"Source"** → select **"Deploy from a branch"**
4. Branch: `main` / Folder: `/ (root)`
5. Click **Save**

Your site will be live at:
```
https://YOUR-USERNAME.github.io/conflict-tracker/
```
(Takes 1-2 minutes to first appear)

---

## Step 3 — Lock down CORS (recommended)

Go back to Render dashboard → your service → **Environment**:

Update `ALLOWED_ORIGIN` to your exact GitHub Pages URL:
```
https://YOUR-USERNAME.github.io
```

This prevents anyone else's website from using your proxy/API key.

Redeploy: Render will auto-redeploy when you save env vars.

---

## Updating the site

**Frontend changes:**
```bash
# edit frontend/index.html
git add . && git commit -m "update" && git push
# GitHub Pages auto-deploys in ~1 min
```

**Backend changes:**
```bash
# edit backend/server.js
git add . && git commit -m "update" && git push
# Render auto-deploys in ~2 min
```

---

## Custom domain (optional)

In GitHub Pages settings → **"Custom domain"** → enter your domain.
Add a CNAME record in your DNS pointing to `YOUR-USERNAME.github.io`.

---

## Cost summary

| Service | Cost |
|---|---|
| GitHub Pages | Free |
| Render Web Service (free tier) | Free (spins down when idle) |
| Render Starter (always-on) | $7/mo |
| Anthropic API | Pay per use (~$0.01–0.05 per refresh) |

---

## Troubleshooting

**"FETCH FAILED" on the frontend:**
- Check browser console for the actual error
- Visit `https://your-backend.onrender.com/` — if it 404s, the backend isn't running
- Check Render logs: Dashboard → your service → Logs

**CORS error in console:**
- Make sure `ALLOWED_ORIGIN` on Render matches your GitHub Pages URL exactly (no trailing slash)

**Render service sleeping:**
- Upgrade to Starter, or use a free uptime monitor like https://uptimerobot.com to ping it every 10 min

**API key error:**
- Double-check `ANTHROPIC_API_KEY` is set in Render env vars (not in your code!)
