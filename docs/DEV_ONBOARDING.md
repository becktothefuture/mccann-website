# McCann Website — Developer Onboarding

> Short, opinionated orientation for new contributors. Everything else in `docs/` dives deeper—start here first.

---

## 1. How the Pieces Fit (30 seconds)

- **Webflow** owns layout, styling, and GSAP timelines (configured via the Interactions panel).
- **`src/app.js`** runs once on `DOMContentLoaded`, wiring every module and exposing `window.App.init`.
- **Custom events** are the handshake: JavaScript emits (`lb:open`, `acc-open`, etc.), Webflow animates in response.
- **Data** lives in JSON (`src/data/`) and is injected into the DOM by dedicated modules (`slides`, `locations`).

Keep this mental model handy:

```
Webflow design & timelines  →  JS emits events  →  Webflow animates
                       ↘  JS reads data/json  ↙
```

---

## 2. Modules at a Glance

| Module | Role | Auto-initialised from | Webflow handshake | Status |
|--------|------|-----------------------|-------------------|--------|
| `preloader.js` | Prefetch videos, gate page reveal, emit page-level loader events | `initPreloader()` in `app.js` (always) | Emits `load-completed`, `preloader:complete` | ✅ Active (now supports per-page loader map) |
| `accordion.js` | ARIA accordion behaviour for `.accordeon` | `initAccordion()` in `app.js` | Emits `acc-open`, `acc-close` | ✅ Active |
| `locations.js` | Builds office accordion content from JSON | `initLocations()` in `app.js` **before** accordion | No Webflow dependency | ✅ Active |
| `slides.js` | Generates `.slide` elements from project JSON | `initSlides()` in `app.js` **before** lightbox | Emits `slides:built` | ✅ Active |
| `lightbox.js` | Modal player + state machine + Vimeo mount | `initLightbox()` in `app.js` | Emits `lb:open`, `lb:close`, `details:*` | ✅ Active (`debug: true` enables verbose logs) |
| `nav-transition.js` | Shows preloader overlay during nav changes | `initNavTransition()` in `app.js` | Emits `navigation:start` | ✅ Active |
| `webflow-scrolltrigger.js` | Sends logo appear/hide events from ScrollTrigger | `initWebflowScrollTriggers()` in `app.js` | Emits `logo-appear`, `logo-hide` | ✅ Active |
| `vimeo.js` | Mounts privacy-first Vimeo embeds | Imported by lightbox & slides | n/a | 🔧 Internal |
| `core/events.js` | Thin custom event helper | Imported by modules | n/a | 🔧 Internal |
| `core/scrolllock.js` | iOS-safe scroll locking | Imported by preloader/lightbox | n/a | 🔧 Internal |

---

## 3. Data & Content Sources

- `src/data/project-data.json` — project metadata & video IDs for slides/lightbox/preloader.
- `src/data/mccann-locations.json` — office data hydrated into the locations accordion.
- Webflow CMS delivers everything else.

If you add fields to either JSON file, update the relevant module and adjust the docs (`docs/OFFICES_ACCORDION_WEBFLOW_SETUP.md`, `docs/LIGHTBOX_WEBFLOW_SETUP.md`).

---

## 4. Build, Serve, Publish

| Task | Command | Notes |
|------|---------|-------|
| Install deps | `npm install` | Node 18+ |
| Watch & serve bundle | `npm run dev` | Outputs `http://127.0.0.1:3000/app.js` |
| Production bundle | `npm run build` | Writes `dist/app.js` & `dist/style.css` |
| Publish to GitHub Pages CDN | `npm run publish:assets` | Requires sibling `mccann-assets` repo or `MCCANN_ASSETS_PATH` |

Need HTTPS inside Webflow Designer? Tunnel the dev server: `npx localtunnel --port 3000`.

---

## 5. Webflow Touchpoints

| Interaction | Expected Custom Event | Triggered by |
|-------------|-----------------------|--------------|
| Lightbox open/close | `lb:open`, `lb:close` | `lightbox.js` state machine |
| Lightbox details overlay | `details:show`, `details:hide` | `lightbox.js` details handler |
| Accordion panel | `acc-open`, `acc-close` | `accordion.js` |
| Preloader exit | `load-completed`, `preloader:complete` | `preloader.js` (`eventLeadMs` controls timing) |
| Logo animation | `logo-appear`, `logo-hide` | `webflow-scrolltrigger.js` |
| Nav transition | `navigation:start` | `nav-transition.js` |

Double-check names in Webflow Interactions—they are case-sensitive.

---

## 6. Observability & Debugging

- All logs are emoji-tagged with `[MODULE]` prefixes.
- Pass `{ debug: true }` into `initLightbox()` or `initPreloader()` options for verbose traces.
- Modules short-circuit gracefully when required DOM nodes are missing—no runtime crashes.
- Need to listen in DevTools? `window.addEventListener('LIGHTBOX_OPEN', handler)` etc.

---

## 7. Cleanup Queue (Things to Prune Soon)

| Candidate | Why it can go | Proposed action |
|-----------|---------------|-----------------|
| Legacy logo ScrollTrigger wiring (double check) | We now emit logo events via IntersectionObserver + ScrollTrigger. Confirm only one path is needed. | Audit `webflow-scrolltrigger.js` now that smooth scroll has been removed. |

Track decisions in `docs/CLEANUP_PLAN.md` so everyone stays aligned.

---

## 8. What to Read Next

- **Need architectural context?** `docs/GRAND_TOUR.md` → high-level story of Webflow ↔ JS.
- **Need implementation detail?** Module-specific guides (`docs/*_WEBFLOW_SETUP.md`).
- **Need quick syntax reminders?** `docs/QUICK_REFERENCE.md`.
- **Coding conventions?** `docs/CODING_RULES.md`.

Welcome aboard—ship fast, keep accessibility first, and prefer removing dead weight over adding cleverness.

