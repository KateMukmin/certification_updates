# Add Certification — Prototype

Interactive prototype for the single-instance certification flow on a worker's
profile (Field Control Analytics). Built as a static HTML + React (in-browser
Babel) app — **no build step required**.

## What's here

| Path | Purpose |
|------|---------|
| `index.html` | App entry point |
| `app.jsx` | Root app — cert list page + state orchestration |
| `modals.jsx` | Add/Edit cert modal, View popup, See Requirements modal |
| `components.jsx` | Shared UI components (inputs, dropdown, badges, toasts) |
| `data.js` | Mock worker / project / certification data |
| `styles.css` | Prototype styles, mapped onto the design system tokens |
| `ds/` | Field Control Analytics design system (tokens + base styles) |
| `assets/` | FCA logo |
| `tweaks-panel.jsx` | In-prototype tweak controls |

## Run locally

It's static — just serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL.

## Deploy to Vercel via GitHub

1. **Push to GitHub** (see below).
2. In Vercel, **Add New → Project** and import the GitHub repo.
3. Framework preset: **Other**. Leave **Build Command** empty and set
   **Output Directory** to the repo root (`.`). There is nothing to build.
4. **Deploy.** `vercel.json` is already configured for a static deploy.

### Push to GitHub

```bash
git init
git add .
git commit -m "Add Certification prototype"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

## Notes

- React, ReactDOM, and Babel load from the unpkg CDN with pinned versions +
  integrity hashes. In-browser Babel is fine for a prototype but is not
  intended for production traffic.
- The prototype is designed at a 1440px desktop width.
