# McCann Website — Webflow Integration Bundle

> A single-bundle JavaScript integration for Webflow sites. Provides accessibility-first UI behaviors—accordion, lightbox with Vimeo, video preloading with animated signet—plus weighted smooth scrolling (Lenis) and scroll-triggered logo animations. Built for McCann's brand site.

**Core principle**: JavaScript handles behavior and function. Webflow handles visual design and layout. Clean separation, minimal global footprint, graceful degradation when elements are missing.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Hosted Assets](#hosted-assets)
- [Webflow Integration](#webflow-integration)
- [Modules](#modules)
- [API Reference](#api-reference)
- [Event System](#event-system)
- [Troubleshooting](#troubleshooting)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Development](#development)
- [License](#license)

---

## Features

- **Preloader** — Prefetches autoplay videos (HTML5 + Vimeo) with progress tracking, includes resize cover to prevent visual jank during window resizing
- **Accordion** — Two-level nested accordion with full ARIA support and smooth transitions
- **Locations** — Dynamic office locations accordion built from JSON data
- **Lightbox** — Focus-trapped modal with Vimeo mounting and scroll lock
- **Smooth Scroll** — Weighted momentum scrolling via Lenis with GSAP integration
- **Logo Animations** — Scroll-triggered logo animations via Webflow IX
- **Accessibility First** — Full ARIA, keyboard support, focus management, `prefers-reduced-motion`
- **Privacy Conscious** — No analytics, no storage, Vimeo DNT enabled
- **Performance Optimized** — Throttled events, batched DOM operations, lazy initialization

---

## Tech Stack

- **Vanilla JavaScript** (ES modules → single IIFE bundle via esbuild)
- **GSAP** (via Webflow IX; no direct dependency)
- **Lenis** (weighted smooth scroll with momentum)
- **No frameworks, no bloat** — just what's needed, nothing more

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd mccann-website
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start development server
   ```bash
   npm run dev
   # → Dev server at http://127.0.0.1:3000/app.js
   # → Auto-rebuilds on file changes
   # → Falls back to ports 3001–3019 if 3000 is busy
   ```

### Production Build

```bash
npm run build
# → Output: dist/app.js (minified IIFE)
# → Deploy to your CDN and reference in Webflow
# → Use npm run publish:assets to push updates to GitHub Pages
```

---

## Hosted Assets

Use the GitHub Pages deployment from `becktothefuture/mccann-assets` for production-ready URLs:

- JavaScript: `https://becktothefuture.github.io/mccann-assets/app.js`
- Stylesheet: `https://becktothefuture.github.io/mccann-assets/style.css`

Update Webflow's Custom Code settings with these URLs whenever you need the live bundle.

### Publish New Builds

```bash
npm run publish:assets
```

The helper script will:

- Run `npm run build`
- Copy `dist/` into the sibling `mccann-assets` repo (override with `MCCANN_ASSETS_PATH=/absolute/path`)
- Commit and push the changes, triggering the GitHub Pages workflow (~1 minute)

---

## Webflow Integration

### 1. Add HEAD Preconnects

In **Project Settings → Custom Code → Head**, paste:

```html
<link rel="preconnect" href="https://player.vimeo.com">
<link rel="preconnect" href="https://i.vimeocdn.com">
```

This optimizes Vimeo loading by establishing connections early.

### 2. Add Custom CSS

In **Project Settings → Custom Code → Head**, paste the contents of `docs/webflow-custom-css-snippet.html` (includes `<style>` tags). This CSS includes: text selection prevention, widows/orphans control, accordion transition styles.

### 3. Load the Bundle

In **Project Settings → Custom Code → Footer** (or page-level Embed), add:

```html
<script src="https://your.cdn.example.com/mccann/dist/app.js" defer></script>
```

**Auto-initialization**: The bundle runs on `DOMContentLoaded`. No further action needed for default behavior.

**Manual configuration** (optional):

```html
<script>
  window.App && window.App.init({
    lightboxRoot: '#lightbox',              // Lightbox container selector
    lerp: 0.08,                             // Smooth scroll weight (0.05–0.2; lower = heavier)
    preloader: {
      selector: '#preloader',               // Preloader container
      videoSelector: 'video[autoplay], video[data-autoplay]',
      minLoadTime: 1000,                    // Minimum display time (ms)
      pulseDuration: 3000,                  // Signet pulse speed
      pulseOpacity: 0.2                     // Signet pulse depth
    }
  });
</script>
```

### 4. Webflow Interactions

The site uses custom event interactions in Webflow to coordinate GSAP animations with JavaScript module behavior. These interactions are already configured in the Webflow project.

**Logo Animation**

Two custom event interactions handle logo appearance/disappearance:

- **`logo-appear`** (forward animation):
  - Event: Custom → `logo-appear`
  - Target: Logo element
  - Animation: Timeline from hidden/small → visible/big
  - Control: **Play from start**
  - Fires when: `#intro-slide` scrolls out of view (scrolling down)

- **`logo-hide`** (reverse animation):
  - Event: Custom → `logo-hide`
  - Target: Same logo element
  - Animation: Same timeline as `logo-appear`
  - Control: **Reverse**
  - Fires when: `#intro-slide` scrolls back into view (scrolling up)

**Accordion Animations**

Two custom event interactions on `.accordeon` root handle panel animations:

- **`acc-open`** (panel opening):
  - Event: Custom → `acc-open`
  - Target: Class `.acc-item` → Scope: Children
  - Animation: Staggered fade-in + slide-up (opacity 0→100%, y 16px→0)
  - Duration: ~0.20s, Stagger: 0.06–0.08s, Ease: Power2/BackOut
  - Control: **Play from beginning**
  - Condition: Affects only children with `.acc-anim` class (active panel)

- **`acc-close`** (panel closing):
  - Event: Custom → `acc-close`
  - Target: Same as above
  - Animation: Same timeline
  - Control: **Reverse**

**Lightbox Animations**

Two custom event interactions on `#lightbox` handle modal animations:

- **`lb:open`** (lightbox opening):
  - Event: Custom → `lb:open`
  - Target: `#lightbox` or `.lightbox__inner`
  - Animation: Fade in, scale up, or other configured animation
  - Control: **Play from start**

- **`lb:close`** (lightbox closing):
  - Event: Custom → `lb:close`
  - Target: Same
  - Animation: Reverse or configured close animation
  - Control: **Play from start** or **Reverse** (depending on setup)

For detailed setup instructions including markup requirements and troubleshooting, see:
- `docs/ACCORDION_WEBFLOW_SETUP.md`
- `docs/LIGHTBOX_WEBFLOW_SETUP.md`
- `docs/PRELOADER_WEBFLOW_SETUP.md`
- `docs/WEBFLOW_ANIMATION_SETUP.md`

---

## Modules

### Preloader

**Selector**: `#preloader`  
**Video Selector**: `video[data-wf-ignore], video[autoplay], video[data-autoplay]`

Prefetches all autoplay videos (HTML5 + Vimeo) before showing page content. Displays TruthWellTold signet with configurable pulse animation. Real-time progress tracking, intelligent retry logic, graceful timeout fallbacks. **Resize Cover**: Automatically shows preloader during browser window resize to prevent visual jank, with instant fade-in and smooth fade-out. Emits `PRELOADER_COMPLETE` when done.

**Configuration**:
- `minLoadTime` (ms): Minimum display time (default: 1000)
- `pulseDuration` (ms): Signet pulse speed (default: 3000)
- `pulseOpacity` (0–1): Pulse depth (default: 0.2)
- `vimeoPreload`: Strategy for Vimeo (`'none'`, `'metadata'`, `'prefetch'`)
- `vimeoBufferLimit`: Buffer seconds for Vimeo (default: 5)
- `enableResizeCover` (boolean): Show preloader during resize (default: true)
- `resizeFadeDuration` (ms): Fade-out duration during resize (default: 150)
- `resizeShowDelay` (ms): Delay before showing cover again after hiding (default: 800)

**Events**: `PRELOADER_COMPLETE` (bubbles to window)

**Graceful Failures**:
- Missing preloader element → no-op
- No videos found → shows content immediately
- Video load errors → retries with exponential backoff, then proceeds anyway
- Timeout after 30s → proceeds regardless of video state

### Accordion

**Selector**: `.accordeon` (root), `.acc-item`, `.acc-trigger`, `.acc-list` (panel)

Two-level nested accordion with full ARIA implementation, keyboard navigation, smooth height transitions via `max-height`, sibling auto-close behavior. Uses `ResizeObserver` to adapt to dynamic content. Emits `acc-open`/`acc-close` events for GSAP coordination via Webflow IX.

**States**:
- `aria-expanded="true|false"` on triggers
- `data-state="collapsed|opening|open|closing"` on panels
- `.is-active` class during opening/open/closing
- `data-acc-animate="true"` on items being animated (target for GSAP)

**Events**:
- `acc-open` — fired when panel opens (trigger GSAP)
- `acc-close` — fired when panel closes (trigger GSAP reverse)
- Legacy aliases: `accordeon-open`, `accordeon-close`

**Keyboard**:
- Enter/Space: Toggle
- Arrow Up/Down: Navigate between triggers
- Home/End: First/last trigger

### Lightbox

**Selector**: `#lightbox` (container), `.lightbox__inner`, `.video-area` (video mount point)

Modal overlay with focus trap, scroll lock (iOS-safe), outside-click and Escape to close, Vimeo video mounting. Coordinates with Webflow IX via `lb:open`/`lb:close` events for GSAP animations. Respects `prefers-reduced-motion`.

**Events**:
- `lb:open` — emitted to Webflow IX for open animation
- `lb:close` — emitted to Webflow IX for close animation
- `LIGHTBOX_OPEN` — bubbles to window with video/title/text details
- `LIGHTBOX_CLOSE` — bubbles to window
- `LIGHTBOX_CLOSED_DONE` — bubbles after close animation completes

**Keyboard**:
- Escape: Close
- Tab: Cycles focus within lightbox (trapped)

**Accessibility**:
- `role="dialog"`, `aria-modal="true"`
- `aria-hidden` toggled on open/close
- Focus trap with fallback inert polyfill
- Scroll lock with position restore

### Smooth Scroll

Weighted momentum scrolling via Lenis. Auto-detects pages with scroll-snap containers (`.perspective-wrapper`) and disables itself to preserve native snap behavior. Configurable `lerp` (0.05–0.2; lower = heavier). Syncs with GSAP ScrollTrigger. Pauses during lightbox interaction.

**Auto-detection**: Disables on pages with `.perspective-wrapper` (scroll-snap container)

**Why**: Scroll-snap pages scroll inside a specific container, not the window. Window-level smooth scroll would conflict with native snap behavior.

**Configuration**:
- `lerp` (0.05–0.2): Momentum weight (lower = heavier/slower, higher = lighter/faster). Default: 0.1
- `wheelMultiplier`: Scroll speed multiplier. Default: 1.0
- `forceEnableOnSnap`: Override auto-detection (not recommended)

**GSAP Integration**: Automatically syncs with ScrollTrigger when available

**Lightbox Integration**: Pauses on lightbox open, resumes on close

**When Active**: Only on pages WITHOUT `.perspective-wrapper`. Provides weighted momentum scrolling with configurable physics.

### Webflow ScrollTrigger Bridge

**Selectors**: `.perspective-wrapper` (scroller), `#intro-slide` (driver)

Wires GSAP ScrollTrigger to scroll container. Emits events as user scrolls to coordinate logo animations via Webflow IX. Fully compatible with scroll-snap and Lenis smooth scroll.

**Events**:
- `logo-appear` — emitted when scrolling down (`#intro-slide` exits viewport)
- `logo-hide` — emitted when scrolling back up (`#intro-slide` re-enters viewport)

**ScrollTrigger Config**:
- Trigger: `#intro-slide`
- Start: `bottom 20%`
- Scroller: `.perspective-wrapper`
- Callbacks: `onEnter` (appear), `onLeaveBack` (hide)

**How It Works**: When the bottom of `#intro-slide` passes 20% from the top of the viewport, fires `logo-appear`. When scrolling back and it re-enters, fires `logo-hide`.

### Vimeo Helper

Parses Vimeo IDs from bare numerics or common URL formats. Mounts privacy-respecting iframes with `dnt=1`. Accepts additional query params for autoplay, muted, background modes.

### Core Utilities

**Events** (`src/core/events.js`)  
Tiny `emit(name, target, detail)` helper. Dispatches bubbling `CustomEvent` on target element and also on `window` for easy cross-module listening. No dependencies, no overhead.

**Scroll Lock** (`src/core/scrolllock.js`)  
iOS-safe scroll lock using fixed-body approach. Captures and restores scroll position precisely. Adds `body.modal-open` class for styling hooks. Optional delay on unlock for animated overlays.

---

## API Reference

### Auto-Initialization

On `DOMContentLoaded`, the bundle:
1. Patches Vimeo iframe allow tokens
2. Calls `init()` with defaults
3. Logs initialization status to console

No manual action required for default behavior.

### Manual Initialization

```js
window.App && window.App.init({
  lightboxRoot: '#lightbox',              // Lightbox container selector (default: '#lightbox')
  lerp: 0.1,                              // Smooth scroll weight (default: 0.1)
  snapLerp: 0.15,                         // Smooth scroll weight for snap pages (default: 0.15)
  smoothScroll: {},                       // Additional Lenis options
    preloader: {                            // Preloader configuration
      selector: '#preloader',
      videoSelector: 'video[autoplay], video[data-autoplay]',
      minLoadTime: 1000,
      pulseDuration: 3000,
      pulseOpacity: 0.2,
      vimeoPreload: 'prefetch',
      vimeoBufferLimit: 5,
      enableResizeCover: true,              // Show cover during resize (default: true)
      resizeFadeDuration: 150,              // Fade-out duration (ms, default: 150)
      resizeShowDelay: 800                  // Delay before showing again (ms, default: 800)
    }
});
```

### Exposed APIs

**`window.App.init(options)`** — Initialize or re-initialize all modules

**`window.App.smoothScroll`** (only on non-snap pages):
- `.stop()` — Pause smooth scroll
- `.start()` — Resume smooth scroll  
- `.instance` — Lenis instance

---

## Event System

All modules emit bubbling `CustomEvent`s on both their target elements and `window`. Listen globally:

```js
window.addEventListener('LIGHTBOX_OPEN', (e) => {
  const { video, title, text } = e.detail || {};
  console.log('Lightbox opened with video:', video);
});

window.addEventListener('acc-open', (e) => {
  console.log('Accordion panel opened:', e.target);
});

window.addEventListener('PRELOADER_COMPLETE', () => {
  console.log('All videos loaded, content revealed');
});
```

**Accordion Events**: `acc-open`, `acc-close` (also legacy: `accordeon-open`, `accordeon-close`)  
**Lightbox Events**: `lb:open`, `lb:close`, `LIGHTBOX_OPEN`, `LIGHTBOX_CLOSE`, `LIGHTBOX_CLOSED_DONE`  
**Preloader Events**: `PRELOADER_COMPLETE`  
**Logo Events**: `logo-appear`, `logo-hide`

---

## Troubleshooting

### Lightbox doesn't open
- Verify `#lightbox` exists in DOM
- Check `.slide` elements have `data-video` attribute (Vimeo ID/URL)
- Ensure `.video-area` container exists inside `#lightbox`
- Check console for `[LIGHTBOX]` logs

### Accordion doesn't animate
- Verify Webflow Interactions listen to `acc-open`/`acc-close` events
- Check GSAP target configuration: use `.acc-item[data-acc-animate]` or scope to children with `.acc-anim` class
- Ensure CSS transition is applied (see `style.css`)
- Check console for `[ACCORDION]` logs

### Smooth scroll doesn't work
- Check if page has `.perspective-wrapper` — smooth scroll auto-disables on snap pages
- Verify Lenis initialization in console: `[SMOOTH-SCROLL]` logs
- Try adjusting `lerp` value (0.05–0.2)

### Logo animation doesn't trigger
- Verify `.perspective-wrapper` and `#intro-slide` exist in DOM
- Check that GSAP ScrollTrigger is loaded (provided by Webflow)
- Ensure Webflow IX Interactions are set up for `logo-appear` and `logo-hide` events
- Check console for `[WEBFLOW]` logs showing initialization status
- Verify ScrollTrigger is targeting the correct element (should see setup confirmation in console)

### Videos don't preload
- Check `#preloader` element exists
- Verify `video[autoplay]` or `video[data-autoplay]` elements exist
- Check console for `[PRELOADER]` logs with real-time progress
- Preloader will timeout after 30s and proceed regardless

### CORS errors in Webflow Designer
- Don't load `http://127.0.0.1:3000/app.js` directly (cross-origin)
- Use LocalTunnel for HTTPS: `npx localtunnel --port 3000`
- Or test on published/staging site

---

## Performance

**Optimization Checklist**:
- ✓ Throttled scroll/mousemove/resize via `requestAnimationFrame`
- ✓ Passive event listeners for scroll/touch
- ✓ Batched DOM reads before writes (no layout thrash)
- ✓ CSS transforms/opacity for animations (GPU-accelerated)
- ✓ `ResizeObserver` for accordion height (no polling)
- ✓ GSAP ScrollTrigger for efficient scroll-based animations
- ✓ Single timeline reuse in Webflow GSAP (no duplicate animations)
- ✓ Lazy initialization (modules only run when elements exist)
- ✓ Minimal bundle size (~15KB minified + Lenis dependency)

**What Not To Do**:
- ❌ Animate layout properties (width, height, padding) — use `transform` instead
- ❌ Query DOM in loops or high-frequency event handlers
- ❌ Use `setTimeout`/`setInterval` for animations — use RAF
- ❌ Add non-passive scroll/touch listeners
- ❌ Mix inline styles with CSS animations (state conflicts)
- ❌ Create duplicate GSAP timelines for similar animations

---

## Accessibility

**Required for All Interactive Elements**:
- ✓ ARIA roles (`role="button"`, `role="dialog"`)
- ✓ ARIA states (`aria-expanded`, `aria-hidden`, `aria-modal`)
- ✓ ARIA relationships (`aria-controls`, `aria-labelledby`)
- ✓ Keyboard support (Enter/Space/Escape/Tab/Arrows)
- ✓ Focus management (visible focus indicators, logical tab order)
- ✓ Focus trapping in modals
- ✓ `prefers-reduced-motion` respect

**Implemented Throughout**:
- Accordion: Full ARIA, keyboard navigation, focus management
- Lightbox: Focus trap, inert fallback, Escape/outside-click close
- Smooth scroll: Respects `prefers-reduced-motion` (disables when set)
- All animations: Check for `prefers-reduced-motion` and skip or reduce when active

---

## Browser Support

**Modern Evergreen Browsers**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Required Features**:
- ES6 modules (bundled to IIFE for Webflow)
- `ResizeObserver`
- `CustomEvent`
- `requestAnimationFrame`
- GSAP ScrollTrigger (provided by Webflow)

**Polyfills**: None required for target browsers. Older browsers will gracefully degrade (no animations, no smooth scroll, but core content remains accessible).

---

## Development

### Architecture Decisions

**Single IIFE Bundle**  
Webflow doesn't provide ESM or a module loader. An IIFE bundle (`format: 'iife'`) means one `<script>` tag works everywhere without polluting globals beyond a single `window.App` namespace.

**Minimal Global API**  
`window.App` exposes only what's necessary: `init()` for manual configuration, `smoothScroll` API for external control. Everything else is encapsulated.

**Progressive Enhancement**  
Modules check for required DOM elements on init. Missing elements → no-op, no error. Pages work across templates and CMS variations without brittle dependencies.

**Privacy Conscious**  
- Vimeo embeds: `dnt=1` (Do Not Track)
- No analytics, no telemetry, no storage
- YouTube `allow` tokens normalized to minimum necessary

**Performance Obsessed**  
- Throttled high-frequency events via `requestAnimationFrame`
- Passive listeners for scroll/touch
- DOM reads batched before writes (no layout thrash)
- `ResizeObserver` for smooth panel transitions
- CSS transforms/opacity (GPU-accelerated) over layout properties
- Lazy initialization — modules only run when their elements exist

### Coding Style

Swiss-grid box headers, early returns, minimal nesting, emoji-prefixed console logs, verb-based function names, BEM CSS classes, kebab-case events. See `docs/CODING_RULES.md` for full guidelines.

**No Storage**: Code stores nothing locally, makes no remote calls by default. Privacy-first approach.

**Graceful Degradation**: Missing elements → no-op, no error. Features fail silently and don't break the site.

**Event-Driven**: Modules communicate via `CustomEvent`s, not direct calls. Loose coupling, easy testing.

**Single Responsibility**: Each module does one thing well. No kitchen-sink utilities.

### File Structure

```
src/
├── app.js                              Entry point; wires modules, exposes window.App
├── core/
│   ├── events.js                       Tiny emit() helper for CustomEvents
│   └── scrolllock.js                   iOS-safe scroll lock with position restore
├── modules/
│   ├── preloader.js                    Video prefetching with TruthWellTold signet
│   ├── accordion.js                    Two-level ARIA accordion with smooth transitions
│   ├── locations.js                    Dynamic office locations accordion builder
│   ├── lightbox.js                     Focus-trapped modal with Vimeo mounting
│   ├── smooth-scroll.js                Lenis-powered weighted momentum scroll
│   ├── webflow-scrolltrigger.js        GSAP ScrollTrigger bridge for logo animation
│   └── vimeo.js                        Vimeo ID parser and iframe mounter
└── data/
    ├── project-data.json               Project metadata for preloader
    └── mccann-locations.json           Office locations hierarchy

docs/
├── ACCORDION_WEBFLOW_SETUP.md          Complete accordion setup guide
├── OFFICES_ACCORDION_WEBFLOW_SETUP.md  Office locations accordion setup guide
├── LIGHTBOX_WEBFLOW_SETUP.md           Complete lightbox setup guide
├── PRELOADER_WEBFLOW_SETUP.md          Complete preloader setup guide
├── WEBFLOW_ANIMATION_SETUP.md          Animation coordination guide
├── CODING_RULES.md                     Coding standards and patterns
├── GRAND_TOUR.md                       Architecture walkthrough
├── QUICK_REFERENCE.md                  Quick lookup reference
└── PRD.md                              Product requirements

dist/
└── app.js                              Built bundle (single IIFE, minified in prod)

style.css                               Module-adjacent CSS (lightbox, accordion)
esbuild.config.mjs                      Build config (watch/build/serve)
package.json                            Dependencies and scripts
```

### Exposing to Webflow Designer

Use LocalTunnel for HTTPS tunnel (Webflow requires HTTPS):

```bash
npx localtunnel --port 3000
# → Use the printed https://<subdomain>.loca.lt/app.js URL in Webflow
```

---

## License

ISC

---

## Credits

**Built by**: MRM UK for McCann  
**Date**: November 2025  
**Tech Stack**: Vanilla JavaScript, Lenis, GSAP (via Webflow)

---

## Support

For setup questions, see detailed guides in `docs/`:
- `QUICK_REFERENCE.md` — Quick lookup for common tasks
- `GRAND_TOUR.md` — Architecture walkthrough
- Module-specific setup guides (accordion, lightbox, preloader)

For issues, check console logs (all modules prefix with `[MODULE-NAME]`) and refer to Troubleshooting section above.

---

**That's the foundation** → Clean integration, thoughtful defaults, graceful failures. Built for McCann, powered by MRM UK.
