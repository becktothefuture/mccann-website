### McCann Website — Webflow Single‑Bundle Integration

This project ships a single, self‑contained JavaScript bundle designed to drop into a running Webflow site. It wires a11y‑friendly UI behaviors (accordion, lightbox with Vimeo), video preloading with TruthWellTold signet animation, and native scroll snapping (no JS slide snapping module) with minimal surface area and careful fallbacks.

The bundle auto‑initializes on DOM ready and also exposes a tiny global `window.App.init(options)` for manual re‑init or customization.

**New:** 🚀 **Video Preloader** — Prefetches all autoplay videos before showing page content, with subtle TruthWellTold signet animation (pulse or micro-jitter). See [`docs/PRELOADER_WEBFLOW_SETUP.md`](./docs/PRELOADER_WEBFLOW_SETUP.md) for full setup guide.

---

### Why this architecture

- **Single IIFE bundle**: Webflow doesn’t provide ESM or a module loader; an IIFE (`format: 'iife'`) guarantees one script tag works everywhere without globals leakage.
- **Minimal global (`window.App`)**: Keeps the global namespace clean while still allowing Webflow Designer or page embeds to re‑init when needed.
- **Progressive enhancement**: Modules no‑op if their required DOM isn’t present. That keeps pages resilient across templates and CMS variations.
- **A11y and UX by default**: ARIA roles/keyboard support on accordion, focus trap + inert/aria fallbacks for modals, and `prefers-reduced-motion` respected for motion.
- **Privacy‑conscious media**: Vimeo is mounted with `dnt=1`; YouTube iframes are patched to include safe `allow` tokens.
- **Native scroll**: Uses CSS scroll snapping; no JS slide snapping module.

---

### Repository layout

- `src/app.js`: App entry; wires modules and exposes `window.App.init`.
- `src/core/events.js`: Tiny `emit(name, target, detail)` helper for bubbling `CustomEvent`s.
- `src/core/scrolllock.js`: iOS‑safe fixed‑body scroll lock with precise restore and `modal-open` CSS hook.
- `src/modules/preloader.js`: **NEW** — Video prefetching with TruthWellTold signet animation (pulse/jitter modes). See [`PRELOADER_WEBFLOW_SETUP.md`](./docs/PRELOADER_WEBFLOW_SETUP.md).
- `src/modules/accordion.js`: Two‑level accordion with ARIA, keyboard support, smooth height transitions, and sibling closing.
- `src/modules/lightbox.js`: Accessible lightbox that traps focus, locks page scroll, closes on outside click/Escape, and mounts Vimeo videos.
- `src/modules/vimeo.js`: Parses Vimeo IDs/URLs and mounts a privacy‑respecting iframe.
- `src/modules/webflow-scrolltrigger.js`: GSAP ScrollTrigger → Webflow IX bridge for `.perspective-wrapper` + first `.slide` (Legacy).
- `src/modules/slide-transition-observer.js`: IntersectionObserver-based slide transition detection (New).
- `src/modules/smooth-scroll.js`: Lenis-powered weighted momentum scrolling with scroll-snap compatibility.
- `style.css`: Small hardening and module‑adjacent CSS (lightbox baseline, accordion transition).
- `webflow-custom-css.css`: Custom CSS for Webflow (text selection prevention, widows/orphans, accordion styles).
- `esbuild.config.mjs`: Build/watch config that outputs a single IIFE to `dist/app.js` and serves it in dev.
- `dist/app.js`: Built bundle (minified in prod, inline sourcemap in dev).
- `docs/webflow-head.html`: HEAD snippet for Webflow (Vimeo preconnects).
- `docs/webflow-custom-css-snippet.html`: Ready-to-paste HTML snippet with custom CSS wrapped in `<style>` tags.
- `docs/PRELOADER_WEBFLOW_SETUP.md`: **NEW** — Complete guide for setting up video preloader with TruthWellTold signet.

---

### Build and dev workflow

Prereqs: Node 18+ recommended.

- **Install**:
```bash
npm install
```

- **Dev (watch + local serve)**:
```bash
npm run dev
# → prints: Dev at http://127.0.0.1:3000/app.js (falls back to 3001..3019 if busy)
```

  - Optionally expose the local dev URL to Webflow using LocalTunnel:
```bash
npx localtunnel --port 3000
# use the printed https://<subdomain>.loca.lt/app.js in Webflow script include
```

- **Production build**:
```bash
npm run build
# output: dist/app.js (single minified IIFE)
```

---

### Webflow integration

1) **Project Settings → Custom Code → Head**: paste the preconnects from `docs/webflow-head.html` to optimize Vimeo startup.
```html
<link rel="preconnect" href="https://player.vimeo.com">
<link rel="preconnect" href="https://i.vimeocdn.com">
```

2) **Add Custom CSS** (Project Settings → Custom Code → Head): wrap the contents of `webflow-custom-css.css` in `<style>` tags:
```html
<style>
/* Copy entire contents of webflow-custom-css.css here */
</style>
```
   - Alternatively, host `webflow-custom-css.css` on your CDN and reference it:
```html
<link rel="stylesheet" href="https://your.cdn.example.com/mccann/webflow-custom-css.css">
```
   - This CSS includes: text selection prevention, widows/orphans control, and accordion styles.

3) **Load the bundle** (Project Settings → Footer code or page‑level Embed):
```html
<!-- Production: host dist/app.js on your CDN and reference it here -->
<script src="https://your.cdn.example.com/mccann/dist/app.js" defer></script>
```

  - In Designer, do not load `http://127.0.0.1:3000/app.js` directly (cross‑origin). For live dev inside Designer, expose your local server via:
```bash
npx localtunnel --port 3000
# Use the printed HTTPS URL, e.g. https://<subdomain>.loca.lt/app.js
```

4) **Initialization**: The bundle auto‑runs on `DOMContentLoaded`. You can also initialize (or re‑initialize) manually:
```html
<script>
  // Optional: customize initialization
  window.App && window.App.init({ 
    lightboxRoot: '#lightbox',
    lerp: 0.08,                    // Smooth scroll weight for non-snap pages (0.05-0.2; lower = heavier)
    useIntersectionObserver: true, // Use new IntersectionObserver-based logo animation (default: false)
    preloader: {                   // NEW: Video preloader configuration
      selector: '#preloader',
      videoSelector: 'video[autoplay], video[data-autoplay]',
      useJitter: false,            // Use micro-jitter instead of pulse (default: false)
      minLoadTime: 1000            // Minimum display time in ms (default: 1000)
    }
  });
  // If omitted, defaults are used and missing elements are safely ignored
  // initPreloader is called FIRST (prefetches videos before showing content)
  // initSmoothScroll is called automatically (disabled on pages with .perspective-wrapper)
  // initAccordion is called for '.accordeon'
  // initLightbox is called for '#lightbox'
  // Logo animation: Legacy ScrollTrigger (default) or new IntersectionObserver (if flag enabled)
  // YouTube iframes have their allow-tokens patched automatically
  </script>
```

4) **Create the custom Interactions in Webflow** (Interactions → New → Custom):

   **Option A: New System (IntersectionObserver)** — Recommended:
   
   To use the new system, enable it via the feature flag:
   ```js
   window.App && window.App.init({ useIntersectionObserver: true });
   ```
   
   Then create these interactions:
   
   - **`logo-appear`**:
     1. Event name: `logo-appear` (case-sensitive)
     2. Trigger: Custom Event (`logo-appear`)
     3. Target: Select your logo element (the one that should animate)
     4. Animation: Timeline from hidden/small → visible/big (forward animation)
     5. Control: **Play from start**
     6. **When it fires**: When the first slide (`#intro-slide`) scrolls out of view
   
   - **`logo-disappear`**:
     1. Event name: `logo-disappear` (case-sensitive)
     2. Trigger: Custom Event (`logo-disappear`)
     3. Target: Same logo element
     4. Animation: Same timeline as `logo-appear` (reverse animation)
     5. Control: **Reverse**
     6. **When it fires**: When the first slide (`#intro-slide`) scrolls back into view
   
   **Option B: Legacy System (ScrollTrigger)** — Default:
   
   If you don't enable the feature flag, the legacy system uses these events:
   
   - **`logo-start`**:
     1. Event name must be exactly: `logo-start` (case-sensitive)
     2. Trigger: Custom Event (`logo-start`)
     3. Target: Select your logo element (the one that should animate)
     4. Animation: Use the SAME timeline as `logo-shrink`
     5. Control: **Jump to 0s, then Stop** (NOT "No Action", NOT "Play")
     6. Verify: Timeline at 0s shows logo in "big" state
     7. **Usage**: Only triggered when returning to top after scrolling (works because timeline is initialized by then)
   
   - **`logo-shrink`**:
     1. Event name: `logo-shrink` (case-sensitive)
     2. Trigger: Custom Event (`logo-shrink`)
     3. Target: Same logo element
     4. Animation: Timeline from big → small
     5. Control: **Play from start**
   
   - **`logo-grow`** (Important for initial load):
     1. Event name: `logo-grow` (case-sensitive)
     2. Trigger: Custom Event (`logo-grow`)
     3. Target: Same logo element
     4. Animation: Timeline from small → big
     5. Control: **Play from start**
     6. **Critical**: This is triggered on initial page load to animate the logo from small → big
     7. **CSS requirement**: Ensure your logo CSS shows it in the "small" state initially (matching the start state of the grow animation), so the grow animation has somewhere to animate from.

---

### UI modules and expected markup

#### Accordion (`src/modules/accordion.js`)

- **Behavior**: ARIA bootstrapping, keyboard support (Enter/Space), smooth height transitions with `ResizeObserver`. Only one item open per group (siblings auto-close).
- **Selectors**: Universal classes — root `.accordeon`; items `.acc-item`; trigger `.acc-trigger` (Webflow Link); panel/list `.acc-list`.
- **States**: `aria-expanded` on triggers; panel `data-state` in `{collapsed, opening, open, closing}`; panel gets `.is-active` while opening/open/closing (removed after collapse).
- **Animation Targeting**: The module adds `data-acc-animate="true"` to items that should animate. Configure GSAP to target `.acc-item[data-acc-animate]`.
- **Events**: Simple custom events emitted on the panel element:
  - `acc-open` — fired when panel opens (trigger GSAP animation to play)
  - `acc-close` — fired when panel closes (trigger GSAP animation to reverse)
  Events bubble to `window` for global listening.
  - Legacy aliases are also emitted for compatibility: `accordeon-open`, `accordeon-close`.

Minimal markup example:
```html
<div class="accordeon">
  <div class="acc-item">
    <a class="acc-trigger" href="#" role="button">Section A</a>
    <div class="acc-list">
      <div class="acc-item">
        <a class="acc-trigger" href="#" role="button">Sub A.1</a>
        <div class="acc-list">…</div>
      </div>
    </div>
  </div>
</div>
```

CSS requirement (already in `style.css`):
```css
.acc-list{ overflow:hidden; transition:max-height .28s cubic-bezier(.25,.8,.25,1); will-change:max-height; }
```

GSAP with Webflow (single reusable timeline):
1. Create one animation timeline in the Webflow GSAP panel (name it "acc-items").
2. **Triggers** (Custom event):
   - `acc-open` → Control: **Play from beginning**
   - `acc-close` → Control: **Reverse**
   - If you previously wired `accordeon-toggle`, switch to `acc-open`/`acc-close` (or `accordeon-open`/`accordeon-close`).
3. **CRITICAL - Target Configuration** (try both approaches):
   **Option A (Recommended)**:
   - Target: **Class** → `.acc-item`
   - Scope: **Children** 
   - **Attach the interaction to**: The `.accordeon` root element
   - **Add a condition**: In the GSAP timeline, add "Affect: Class" → `.acc-anim` → "Children with this class"
   
   **Option B (If A doesn't work)**:
   - Target: **Custom selector**
   - Enter: `.acc-anim .acc-item` (note: space, not >)
   - Scope: **Select element**
4. **Animation Properties**:
   - From→To: `opacity 0%`, `y 16px` → `opacity 100%`, `y 0`
   - Duration: `~0.20s`; Stagger: `0.06–0.08s`; Ease: `Power2/BackOut`
   - **Do NOT animate height/display** (JS handles panel height)
5. **Why this works**: The JS adds `.acc-anim` class to the specific panel being opened/closed BEFORE emitting the event, so GSAP only animates items in that specific panel, not all items across the entire accordion.

#### Lightbox (`src/modules/lightbox.js`)

- **Behavior**: Focus trap, inert/aria fallback, outside‑click and Escape to close, scroll lock, reduced‑motion support. Opens when a `.slide` is clicked and the slide carries dataset like `data-video`, `data-title`, `data-text`.
- **Config**: `initLightbox({ root: '#lightbox', closeDelayMs: 1000 })`.
- **Events**: `LIGHTBOX_OPEN`, `LIGHTBOX_CLOSE`, `LIGHTBOX_CLOSED_DONE`.

Suggested markup:
```html
<div id="lightbox" class="lightbox" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="lightbox__inner" tabindex="-1">
    <div class="video-area"></div>
    <!-- optional: title/description elements bound by your own code using emitted detail -->
  </div>
</div>
```

Baseline CSS (in `style.css`):
```css
.lightbox { position:fixed; inset:0; z-index:9999; opacity:0; visibility:hidden; pointer-events:none; }
.lightbox.is-open { opacity:1; visibility:visible; pointer-events:auto; }
body.modal-open { overflow:hidden; }
```


#### Slide Transition Observer (`src/modules/slide-transition-observer.js`) — **New**

- **Behavior**: Uses IntersectionObserver to passively detect when `#intro-slide` leaves/enters the viewport. Emits `logo-appear` when slide scrolls out, `logo-disappear` when it scrolls back in. Fully compatible with scroll-snap and Lenis smooth scroll.
- **Defaults**:
  - scroller: `.perspective-wrapper`
  - target slide: `#intro-slide`
  - appear event: `logo-appear` (forward animation)
  - disappear event: `logo-disappear` (reverse animation)
  - threshold: `0.1` (fires when 90% of slide has scrolled out)
- **Advantages**:
  - Passive monitoring (no scroll interference)
  - Works seamlessly with scroll-snap and Lenis
  - More reliable than scroll position calculations
  - No dependency on GSAP ScrollTrigger
- **Safety**: No‑ops if Webflow IX (ix2/ix3) is unavailable, or if elements are missing.
- **Activation**: Enable via feature flag: `window.App.init({ useIntersectionObserver: true })`

#### Webflow ScrollTrigger → IX bridge (`src/modules/webflow-scrolltrigger.js`) — **Legacy**

- **Behavior**: Ties `ScrollTrigger` to `.perspective-wrapper`. Emits an init event on load to set the animation to its start/paused state. As soon as the user begins scrolling down from the top of the first slide, emits a play event. When scrolling back above the driver, emits the reset event again so it's paused at the top.
- **Defaults**:
  - scroller: `.perspective-wrapper`
  - driver: first `.slide` inside `.perspective-wrapper`
  - init/reset event: `logo-start`
  - play event: `logo-shrink`
  - grow event (scroll up): `logo-grow`
  - start `top top`, end `top -10%`, `markers: false`
- **Safety**: No‑ops if Webflow IX (ix2/ix3) or ScrollTrigger are unavailable, or if elements are missing.
- **Status**: Legacy system (default). Use new IntersectionObserver system for better compatibility with scroll-snap and Lenis.

Note: JS slide paging is disabled; rely on CSS `scroll-snap` in `.perspective-wrapper`.

#### Smooth Scroll (`src/modules/smooth-scroll.js`)

- **Behavior**: Weighted momentum scrolling powered by Lenis. Adds a "heavy" feel to scrolling with customizable physics.
- **Auto-detection**: Detects pages with `.perspective-wrapper` (scroll-snap container) and **disables itself** to preserve native snap behavior. Only activates on pages without scroll-snap.
- **Why disabled on snap pages?**: Pages with scroll-snap containers (like homepage) scroll inside a specific element (`.perspective-wrapper`), not the window. Applying window-level smooth scroll would conflict with the container's native snap behavior.
- **Configuration**:
  - `lerp` (0.05-0.2): Lower = heavier/slower, higher = lighter/faster. Default: 0.1
  - `wheelMultiplier`: Adjust scroll speed (higher = faster). Default: 1.0
  - `forceEnableOnSnap`: Set to `true` to force enable on snap pages (not recommended)
- **GSAP Integration**: Automatically syncs with GSAP ScrollTrigger when available.
- **Lightbox Integration**: Smooth scroll pauses when lightbox opens, resumes on close.
- **API**: Exposed via `window.App.smoothScroll` (only on non-snap pages):
  - `.stop()` — Pause smooth scroll
  - `.start()` — Resume smooth scroll
  - `.instance` — Direct access to Lenis instance

Example customization (for non-snap pages):
```js
window.App && window.App.init({ 
  lerp: 0.07,        // Heavier weight for weighted scrolling
});
```

#### Vimeo helper (`src/modules/vimeo.js`)

- **Input**: Accepts bare numeric IDs or common Vimeo URLs; extracts the ID robustly.
- **Privacy**: Adds `dnt=1` and lets you pass additional query params (e.g., `autoplay`, `muted`, `background`).

#### Events helper (`src/core/events.js`)

- **Purpose**: `emit(name, target, detail)` dispatches a bubbling event on `target` and also on `window`, for easy cross‑module listening.

#### Scroll lock (`src/core/scrolllock.js`)

- **Lock**: Fixed‑body approach captures scroll position and prevents iOS rubber‑banding; adds `body.modal-open` for styling.
- **Unlock**: Restores previous `scroll-behavior` and scroll position; optional `{ delayMs }` to defer when closing animated overlays.

---

### Public API

- **Auto‑init**: Runs on `DOMContentLoaded` via `patchYouTubeAllowTokens(); init();` inside the bundle.
- **Manual init**:
```js
window.App && window.App.init({
  lightboxRoot: '#lightbox' // optional; defaults to '#lightbox'
});
```

`init()` will:
- call `initSmoothScroll()` (auto-disabled on pages with `.perspective-wrapper`)
- call `initAccordion('.accordeon')`
- call `initLightbox({ root: lightboxRoot, closeDelayMs: 1000 })`
- call logo animation system (ScrollTrigger legacy or IntersectionObserver new, based on `useIntersectionObserver` flag)
- patch YouTube `iframe[allow]` capabilities to include common tokens

---

### Accessibility, privacy, and performance

- **A11y**: Accordion sets ARIA roles/relationships and keyboard behavior; the lightbox traps focus and provides Escape/outside‑click close.
- **Reduced motion**: Slide snapping is disabled when `prefers-reduced-motion: reduce` is active.
- **Privacy**: Vimeo embeds set `dnt=1`; YouTube `allow` tokens are normalized to avoid playback issues without enabling unnecessary capabilities.
- **Performance**: Minimal DOM writes; height transitions use `max-height` with a single forced reflow; `ResizeObserver` keeps open panels sized without layout thrash.

---

### Listening to events

You can listen globally on `window`:
```js
window.addEventListener('LIGHTBOX_OPEN', (e) => {
  const { video, title, text } = e.detail || {};
  // update UI, analytics, etc.
});
```

Accordion events bubble from the panel element and also emit on `window`; names: `acc-open`, `acc-close`.

---

### Troubleshooting

- **Lightbox doesn't open**: Verify `#lightbox` exists and slides have `data-video` (Vimeo ID/URL). The `.video-area` container must be present inside the lightbox.
- **Accordion doesn't animate**:
  - Verify your Interactions listen to `acc-open` and `acc-close` custom events.
  - **Webflow GSAP Configuration**: The module adds a `data-acc-animate="true"` attribute to items that should animate. Configure your GSAP animation in Webflow to:
    - **Trigger**: Custom event → `acc-open` (for opening) and `acc-close` (for closing)
    - **Target**: Use selector `.acc-item[data-acc-animate]` to only animate marked items
    - **Animation**: Create your staggered animation (opacity, transform, etc.)
  - In Designer, avoid loading `http://127.0.0.1:3000/app.js` directly (CORS). Use an HTTPS tunnel (see Build and dev workflow) or test on the published/staging site.
- **Page still scrolls when lightbox open**: Check that your page isn’t using a custom scroll container; the lock targets `body`.

---

### Development notes

- **Header comments**: Files use a standardized block header (date, purpose) for quick scanning.
- **Logging**: Modules log a small `[MODULE] module loaded` message once per page load for sanity checks.
- **No storage**: The code stores no user text and makes no remote calls by default.

---

### Quick reference

- **Dev**: `npm run dev` → open the printed URL, optionally tunnel to Webflow.
- **Build**: `npm run build` → deploy `dist/app.js` to your CDN.
- **Init**: auto on DOM ready; optional `window.App.init({ lightboxRoot: '#lightbox' })`.
- **Required markup**: `.accordeon` (accordion), `#lightbox` with `.lightbox__inner` and `.video-area`, `.slide` sections (as lightbox triggers).

---

### License

ISC (see `package.json`).


