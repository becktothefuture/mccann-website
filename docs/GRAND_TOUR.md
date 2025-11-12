# McCann Website — Grand Tour

> High-level architecture snapshot. For module-by-module detail, start with [`docs/DEV_ONBOARDING.md`](./DEV_ONBOARDING.md).

---

## 1. Three-Layer Model

| Layer | Owned by | Responsibilities |
|-------|----------|------------------|
| Visual & Motion | **Webflow** | Layout, styling, GSAP timelines configured as Custom Event triggers |
| Behaviour | **Our bundle** | DOM wiring, data hydration, accessibility, event emission |
| Data | **JSON + Webflow CMS** | Project metadata, office locations, background videos |

Communication happens through:
- Custom events (`lb:open`, `acc-open`, etc.) → Webflow animations
- DOM state (classes, data attributes) → CSS hooks
- JSON hydration → Modules inject content before animations run

---

## 2. Boot Sequence (DOMContentLoaded)

```
patchVimeoAllowTokens()
initPreloader()            // blocks page until loader finishes
initLocations()            // JSON → accordion scaffold
initAccordion()
initSlides()               // JSON → slides (before lightbox)
initLightbox()
initWebflowScrollTriggers()
initNavTransition()
```

Every module no-ops if it cannot find its root element, keeping templates resilient.

---

## 3. Key Responsibilities

| Module | Why it exists | Notes |
|--------|----------------|-------|
| `preloader.js` | Guarantees autoplay media is ready, exposes per-page loader hooks, doubles as resize cover | Emits `load-completed` (pre animation) and `preloader:complete` (post animation) |
| `slides.js` → `lightbox.js` | Slides populate from JSON first, lightbox reads the same data to avoid duplication | Lightbox now supports `{ debug: true }` to toggle rich logging |
| `locations.js` → `accordion.js` | Locations JSON hydrates markup; accordion handles ARIA + animations | Accordion emits `acc-open` / `acc-close` to Webflow |
| `nav-transition.js` | Re-uses the preloader overlay for page transitions | Respects `prefers-reduced-motion` |
| `webflow-scrolltrigger.js` | Bridges ScrollTrigger to custom events for persistent logo | Works with native scrolling (no extra library required) |

See the onboarding doc for the full table including optional/internal utilities.

---

## 4. Event Flow (JS → Webflow)

| Event | Purpose | Triggered when |
|-------|---------|----------------|
| `lb:open` / `lb:close` | Run modal open/close timelines | Lightbox state machine changes state |
| `details:show` / `details:hide` | Animate the details overlay | Lightbox details button / overlay handler |
| `acc-open` / `acc-close` | Animate accordion children | Panel expands/collapses |
| `navigation:start` | Run page transition overlay | Navigation intercept passes validation |
| `load-completed` | Kick hero entrance animations | Preloader is about to hide (`eventLeadMs` before) |
| `preloader:complete` | Safe to enable scroll interactions | Preloader fully hidden |
| `logo-appear` / `logo-hide` | Persistent logo choreography | ScrollTrigger callbacks |

Each custom event is mirrored as a `CustomEvent` on `window` for analytics or debug tooling.

---

## 5. Data Flow

1. `project-data.json` → `slides.js` builds `.slide[data-project]`.  
   `lightbox.js` reads the same JSON to mount Vimeo, copy text, render awards.
2. `mccann-locations.json` → `locations.js` creates accordion markup before `accordion.js` initialises.
3. Preloader receives both datasets to decide which Vimeo IDs to preload (now via page-loader map in `preloader.js`).

---

## 6. Webflow Touchpoints Checklist

- Custom events configured: `lb:open`, `lb:close`, `details:show`, `details:hide`, `acc-open`, `acc-close`, `logo-appear`, `logo-hide`, `navigation:start`, `load-completed`.
- `#preloader` HTML embed inserted at the very top of `<body>`.
- `.accordeon` root present wherever accordion behaviour is required.
- `.slide` elements are optional in Designer; JSON rebuilds them on load.
- Functional CSS from `docs/webflow-custom-css-snippet.html` loaded in project head.

---

## 7. Observability

- Emoji-prefixed console logs surface validation and guard-rail checks (`[LIGHTBOX] 🎯 …`, `[PRELOADER] ✓ …`).
- `{ debug: true }` options on preloader/lightbox unlock richer traces without touching source.
- Missing elements are logged as warnings (`❌ Element not found`) but never throw.

---

That’s the tour—combine this mental model with the onboarding doc and the module-specific setup guides for deeper dives.
