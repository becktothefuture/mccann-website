# McCann Website — Quick Reference

> Fast lookup for day-to-day development. For orientation read [`docs/DEV_ONBOARDING.md`](./DEV_ONBOARDING.md).

---

## Module Cheat Sheet

| Module | Purpose | Auto init? | Status |
|--------|---------|------------|--------|
| `preloader.js` | Prefetch autoplay media, gate page reveal, emit page events | Yes (`app.js`) | ✅ Active |
| `accordion.js` | ARIA accordion behaviour on `.accordeon` | Yes | ✅ Active |
| `locations.js` | Hydrates office accordion from JSON | Yes (runs before accordion) | ✅ Active |
| `slides.js` | Builds `.slide` cards from project JSON | Yes (runs before lightbox) | ✅ Active |
| `lightbox.js` | Vimeo modal + state machine + details overlay | Yes | ✅ Active (`debug` option) |
| `nav-transition.js` | Shows preloader overlay during nav changes | Yes | ✅ Active |
| `webflow-scrolltrigger.js` | Emits logo appear/hide from ScrollTrigger | Yes | ✅ Active |

Need full context or debug tips? See [`docs/DEV_ONBOARDING.md`](./DEV_ONBOARDING.md).

---

## Custom Events (JS → Webflow)

| Event | Emitted by | When | Notes |
|-------|------------|------|-------|
| `lb:open` / `lb:close` | `lightbox.js` | Modal open/close | Drives Webflow IX timelines |
| `details:show` / `details:hide` | `lightbox.js` | Details overlay toggle | Targets `.lightbox__overlay` |
| `acc-open` / `acc-close` | `accordion.js` | Panel expand/collapse | Make sure Webflow listens to the same casing |
| `load-completed` | `preloader.js` | `eventLeadMs` before hide | Use to kick entrance animations |
| `preloader:complete` | `preloader.js` | After preloader fully hidden | Safe to start scroll interactions |
| `navigation:start` | `nav-transition.js` | Before SPA navigation | Hooks the preloader overlay |
| `logo-appear` / `logo-hide` | `webflow-scrolltrigger.js` | ScrollTrigger callbacks | Coordinates persistent logo |
| `slides:built` | `slides.js` | After slides render | Useful for analytics hooks |

All events also bubble as `CustomEvent`s on `window`.

---

## DOM Selectors (Most Used)

```
.accordeon              # Accordion root
.acc-trigger            # Toggle buttons
.acc-list               # Accordion panels
#lightbox               # Lightbox container
.lightbox__overlay      # Details overlay
.slide[data-project]    # Lightbox triggers
#preloader              # Preloader / resize cover
.video-area             # Lightbox video mount target
```

Data sources:
- `src/data/project-data.json`
- `src/data/mccann-locations.json`

---

## Common Tasks

| Task | Steps |
|------|-------|
| Add a new module | Copy Swiss-grid header + section layout from existing module, export named `initX`, wire it inside `src/app.js`. |
| Emit Webflow event | Import `emit` from `src/core/events.js`, dispatch `emit('event-name', target)` and configure Webflow interaction with the exact event name. |
| Debug preloader timing | Pass `{ preloader: { debug: true } }` to `window.App.init()` and watch `[PRELOADER]` logs. |
| Toggle lightbox verbose logs | Call `initLightbox({ debug: true })` or set `window.App.init({ lightbox: { debug: true } })` if you expose a wrapper. |
| Inject custom page loader logic | Provide `pageLoaders` map to `initPreloader` (see `preloader.js` for helper signatures). |

---

## Debug Snippets

```js
// Check bundle status
document.querySelector('#lightbox');
window.App?.init?.({ lightboxRoot: '#lightbox', lightbox: { debug: true } });

// Listen for modal lifecycle
window.addEventListener('LIGHTBOX_OPEN', (e) => console.log('Lightbox opened:', e.detail));
window.addEventListener('preloader:complete', () => console.log('Preloader done'));

// Force rebuild slides
window.App?.slides?.rebuild?.();
```

---

## Console Prefixes

- `[PRELOADER]`, `[LIGHTBOX]`, `[ACCORDION]`, `[SLIDES]`, `[NAV-TRANSITION]`, `[WEBFLOW-SCROLLTRIGGER]`
- Success → `✓`, warnings → `