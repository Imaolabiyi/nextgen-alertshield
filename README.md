# 🛡 AlertShield

**Protecting Small Businesses from Fake Payment Alerts**

A community-powered fraud detection platform for Nigerian merchants. Detect suspicious payment alerts before releasing goods — powered by AI analysis and real merchant reports.

---

## 🚀 Deploy to Netlify (3 ways)

### Option 1 — Drag & Drop (Fastest, no GitHub needed)

1. Run the build locally:
   ```bash
   npm install
   npm run build
   ```
2. Go to [app.netlify.com](https://app.netlify.com)
3. Drag the **`dist/`** folder onto the Netlify dashboard
4. Your site is live instantly ✅

---

### Option 2 — GitHub + Netlify (Recommended for ongoing updates)

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial AlertShield deploy"
   git remote add origin https://github.com/YOUR_USERNAME/alertshield.git
   git push -u origin main
   ```

2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**

3. Connect your GitHub account and select the `alertshield` repo

4. Netlify auto-detects the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 20

5. Click **Deploy site** — done ✅

Every `git push` to `main` will automatically redeploy.

---

### Option 3 — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
alertshield/
├── public/
│   └── shield.svg          # Favicon
├── src/
│   ├── main.jsx            # React entry point
│   └── App.jsx             # Full application (all 6 pages)
├── index.html              # HTML shell
├── vite.config.js          # Vite configuration
├── netlify.toml            # Netlify build + redirect config
├── package.json
└── .gitignore
```

---

## 📄 Pages

| Page | Route (SPA) | Description |
|------|-------------|-------------|
| Landing | `/` | Hero, features, how it works, community stats |
| Check Alert | nav | Paste SMS or upload screenshot for analysis |
| Fraud Result | nav | Risk score gauge, detected issues, verdict |
| Fraud Awareness | nav | 4 scam types + merchant protection checklist |
| Report Fraud | nav | Community fraud reporting form |
| Dashboard | nav | Stats, pattern insights, alert history table |

---

## ⚙️ Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool (fast HMR + optimized production builds)
- **Netlify** — Hosting + CI/CD
- Zero external UI libraries — all styles are inline/CSS-in-JS

---

## 🔧 Customization

- **Colors:** Edit the `C` object at the top of `src/App.jsx`
- **Analysis rules:** Edit the `analyzeText()` function in `src/App.jsx`
- **Demo alert:** Edit the `DEMO_ALERT` constant in `src/App.jsx`
- **Community stats:** Update seed data in `DashboardPage` and `ReportPage`

---

## 📬 Support

Built with AlertShield — Community-Powered Fraud Detection for Small Businesses.
