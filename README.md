# McCann Website — Webflow Integration Bundle

> Single-bundle JavaScript that gives our Webflow build accessibility-first behaviour (preloader, accordion, lightbox, nav hand-off) while keeping designers in charge of visuals.

---

## TL;DR

- Webflow owns layout + GSAP timelines. Our bundle wires behaviour, data, and accessibility.
- `src/app.js` auto-initialises every module on `DOMContentLoaded` and exposes `window.App.init`.
- Start with [`docs/DEV_ONBOARDING.md`](docs/DEV_ONBOARDING.md) for an at-a-glance breakdown of modules, events, JSON feeds, and debug tips.
- Ship changes with `npm run build` (or `npm run publish:assets` to push the CDN bundle).

---

## Quick Start

```bash
git clone <repo>
cd mccann-website
npm install
npm run dev            # serves http://127.0.0.1:3000/app.js (auto rebuild)
```

Need HTTPS inside Webflow Designer? `npx localtunnel --port 3000`.

### Production Build

```bash
npm run build          # dist/app.js + dist/style.css
npm run publish:assets # builds + syncs to GitHub Pages CDN
```

### Webflow Hook-up Checklist

1. Add the hosted bundle to **Project Settings → Footer Code** (CDN URL from `mccann-assets`).  
2. Drop the functional CSS + preconnect tags from `docs/webflow-custom-css-snippet.html` into **Head Code**.  
3. Ensure Webflow Interactions listen for our custom events (`lb:open`, `acc-open`, `logo-appear`, etc.). Names are case-sensitive—see the onboarding doc for the full matrix.

---

## Modules at a Glance

| Module | Role | Webflow handshake | Status |
|--------|------|-------------------|--------|
| `preloader.js` | Prefetch autoplay media, gate reveal, supports per-page loader overrides | Emits `load-completed`, `preloader:complete` | ✅ Active |
| `accordion.js` | Accessible accordion behaviour for `.accordeon` | Emits `acc-open`, `acc-close` | ✅ Active |
| `locations.js` | Hydrates office accordion from JSON before accordion init | n/a | ✅ Active |
| `slides.js` | Builds `.slide` elements from project JSON | Emits `slides:built` | ✅ Active |
| `lightbox.js` | Vimeo modal + state machine + details overlay | Emits `lb:open`, `lb:close`, `details:*` | ✅ Active (`debug: true` → verbose logs) |
| `nav-transition.js` | Shows preloader overlay on page transitions | Emits `navigation:start` | ✅ Active |
| `webflow-scrolltrigger.js` | Bridges ScrollTrigger to logo appear/hide events | Emits `logo-appear`, `logo-hide` | ✅ Active |

---

## Data & Hosted Assets

- Project content: `src/data/project-data.json` (slides/lightbox/preloader).  
- Office hierarchy: `src/data/mccann-locations.json` (locations accordion).  
- Production bundle: `https://becktothefuture.github.io/mccann-assets/app.js` + `style.css`. Update Webflow whenever these URLs change.

---

## Documentation Map

| Need | Reference |
|------|-----------|
| Orientation + module map | [`docs/DEV_ONBOARDING.md`](docs/DEV_ONBOARDING.md) |
| Architecture story (Webflow ↔ JS ↔ GSAP) | [`docs/GRAND_TOUR.md`](docs/GRAND_TOUR.md) |
| Quick selectors/events cheat sheet | [`docs/QUICK_REFERENCE.md`](docs/QUICK_REFERENCE.md) |
| Coding standards | [`docs/CODING_RULES.md`](docs/CODING_RULES.md) |
| Module setup checklists | `docs/*_WEBFLOW_SETUP.md` |
| Cleanup proposals & status | [`docs/CLEANUP_PLAN.md`](docs/CLEANUP_PLAN.md) |

---

## Observability & Debugging

- Logs are emoji-prefixed (`[LIGHTBOX] 🎯 …`) for fast scanning.
- Pass `{ debug: true }` to `initLightbox()` or `initPreloader()` to opt into verbose traces.
- Modules guard their DOM queries—missing nodes quietly skip features instead of erroring.
- Listen to everything from DevTools: `window.addEventListener('LIGHTBOX_OPEN', handler)` etc.

---

## Cleanup & Roadmap

Use [`docs/CLEANUP_PLAN.md`](docs/CLEANUP_PLAN.md) to capture future code removals or refactors so the team stays aligned.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build + watch + serve bundle (falls back through ports 3000–3019). |
| `npm run build` | Production build (minified IIFE, copies `style.css`). |
| `npm run publish:assets` | Build then sync to CDN repo (`mccann-assets`, override via `MCCANN_ASSETS_PATH`). |

---

## License

ISC

---

## Credits

Built by **MRM UK** for **McCann** (November 2025).  
Tech stack: Vanilla JavaScript, Webflow Interactions (GSAP).
