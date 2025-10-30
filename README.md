### McCann Website — Webflow Single‑Bundle Integration

This project ships a single, self‑contained JavaScript bundle designed to drop into a running Webflow site. It wires a11y‑friendly UI behaviors (accordion, lightbox with Vimeo, optional GSAP slide snapping) with minimal surface area and careful fallbacks.

The bundle auto‑initializes on DOM ready and also exposes a tiny global `window.App.init(options)` for manual re‑init or customization.

---

### Why this architecture

- **Single IIFE bundle**: Webflow doesn’t provide ESM or a module loader; an IIFE (`format: 'iife'`) guarantees one script tag works everywhere without globals leakage.
- **Minimal global (`window.App`)**: Keeps the global namespace clean while still allowing Webflow Designer or page embeds to re‑init when needed.
- **Progressive enhancement**: Modules no‑op if their required DOM isn’t present. That keeps pages resilient across templates and CMS variations.
- **A11y and UX by default**: ARIA roles/keyboard support on accordion, focus trap + inert/aria fallbacks for modals, and `prefers-reduced-motion` respected for motion.
- **Privacy‑conscious media**: Vimeo is mounted with `dnt=1`; YouTube iframes are patched to include safe `allow` tokens.
- **Optional GSAP Snap**: Adds smooth section snapping without imposing scrubbing timelines; if GSAP/ScrollTrigger aren’t present, it safely does nothing.

---

### Repository layout

- `src/app.js`: App entry; wires modules and exposes `window.App.init`.
- `src/core/events.js`: Tiny `emit(name, target, detail)` helper for bubbling `CustomEvent`s.
- `src/core/scrolllock.js`: iOS‑safe fixed‑body scroll lock with precise restore and `modal-open` CSS hook.
- `src/modules/accordion.js`: Two‑level accordion with ARIA, keyboard support, smooth height transitions, and sibling closing.
- `src/modules/lightbox.js`: Accessible lightbox that traps focus, locks page scroll, closes on outside click/Escape, and mounts Vimeo videos.
- `src/modules/vimeo.js`: Parses Vimeo IDs/URLs and mounts a privacy‑respecting iframe.
- `src/modules/slides.js`: Optional GSAP ScrollTrigger snap‑to‑nearest `.slide` sections (no scrubbing timelines created).
- `src/modules/webflow-scrolltrigger.js`: GSAP ScrollTrigger → Webflow IX2 bridge for `.perspective-wrapper` + `.slide--scroll-driver`.
- `style.css`: Small hardening and module‑adjacent CSS (lightbox baseline, accordion transition).
- `esbuild.config.mjs`: Build/watch config that outputs a single IIFE to `dist/app.js` and serves it in dev.
- `dist/app.js`: Built bundle (minified in prod, inline sourcemap in dev).
- `docs/webflow-head.html`: HEAD snippet for Webflow (Vimeo preconnects).

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

2) **Load the bundle** (Project Settings → Footer code or page‑level Embed):
```html
<!-- Production: host dist/app.js on your CDN and reference it here -->
<script src="https://your.cdn.example.com/mccann/dist/app.js" defer></script>
```

3) **Optional GSAP snapping**: If you want `.slide` snapping, load GSAP + ScrollTrigger. If not loaded, the code safely no‑ops.
```html
<script src="https://unpkg.com/gsap@3/dist/gsap.min.js"></script>
<script src="https://unpkg.com/gsap@3/dist/ScrollTrigger.min.js"></script>
<script>window.ScrollTrigger = window.ScrollTrigger || ScrollTrigger; gsap.registerPlugin(ScrollTrigger);</script>
```

4) **Initialization**: The bundle auto‑runs on `DOMContentLoaded`. You can also initialize (or re‑initialize) manually:
```html
<script>
  // Optional: customize where the lightbox container lives
  window.App && window.App.init({ lightboxRoot: '#project-lightbox' });
  // If omitted, defaults are used and missing elements are safely ignored
  // initAccordion is called for '.accordeon'
  // initLightbox is called for '#project-lightbox'
  // initSlidesSnap is attempted for '.slide' if GSAP/ScrollTrigger are present
  // YouTube iframes have their allow-tokens patched automatically
  </script>
```

---

### UI modules and expected markup

#### Accordion (`src/modules/accordion.js`)

- **Behavior**: ARIA bootstrapping, keyboard support (Enter/Space), smooth height transitions with `ResizeObserver`. Only one open per group; opening a level‑1 item collapses all level‑2.
- **Selectors**: Root `.accordeon`; items `.accordeon-item--level1`, `.accordeon-item--level2`; trigger `.accordeon__trigger`; panel/list `.accordeon__list`.
- **States**: `aria-expanded` on triggers; panel `data-state` in `{collapsed, opening, open, closing}`.
- **Events**: `ACC_L1_OPEN`, `ACC_L1_CLOSE`, `ACC_L2_OPEN`, `ACC_L2_CLOSE` (bubbling `CustomEvent`s with `detail`).

Minimal markup example:
```html
<div class="accordeon">
  <div class="accordeon-item--level1">
    <button class="accordeon__trigger">Section A</button>
    <div class="accordeon__list">
      <div class="accordeon-item--level2">
        <button class="accordeon__trigger">Sub A.1</button>
        <div class="accordeon__list">…</div>
      </div>
    </div>
  </div>
</div>
```

CSS requirement (already in `style.css`):
```css
.accordeon__list{ overflow:hidden; transition:max-height .28s cubic-bezier(.25,.8,.25,1); will-change:max-height; }
```

#### Lightbox (`src/modules/lightbox.js`)

- **Behavior**: Focus trap, inert/aria fallback, outside‑click and Escape to close, scroll lock, reduced‑motion support. Opens when a `.slide` is clicked and the slide carries dataset like `data-video`, `data-title`, `data-text`.
- **Config**: `initLightbox({ root: '#project-lightbox', closeDelayMs: 1000 })`.
- **Events**: `LIGHTBOX_OPEN`, `LIGHTBOX_CLOSE`, `LIGHTBOX_CLOSED_DONE`.

Suggested markup:
```html
<div id="project-lightbox" class="project-lightbox" aria-hidden="true" role="dialog" aria-modal="true">
  <div class="project-lightbox__inner" tabindex="-1">
    <div class="video-area"></div>
    <!-- optional: title/description elements bound by your own code using emitted detail -->
  </div>
</div>
```

Baseline CSS (in `style.css`):
```css
.project-lightbox { position:fixed; inset:0; z-index:9999; opacity:0; visibility:hidden; pointer-events:none; }
.project-lightbox.is-open { opacity:1; visibility:visible; pointer-events:auto; }
body.modal-open { overflow:hidden; }
```

#### Slides + GSAP snap (`src/modules/slides.js`)

- **Behavior**: Adds a single page‑wide `ScrollTrigger` with `snapTo` that moves to the nearest `.slide` center; does not create scrubbing timelines. Respects `prefers-reduced-motion`.
- **Requirements**: GSAP and ScrollTrigger loaded globally (see snippet above). No registration needed for `ScrollTrigger.create`, but `gsap.registerPlugin(ScrollTrigger)` is recommended.
- **Options**: `{ selector = '.slide', duration = 0.35, ease = 'power2.out' }`.

Example markup:
```html
<section class="slide" data-video="123456789" data-title="Project" data-text="Description">
  …
</section>
```

#### Webflow ScrollTrigger → IX2 bridge (`src/modules/webflow-scrolltrigger.js`)

- **Behavior**: Creates a `ScrollTrigger` tied to the custom scroller `.perspective-wrapper` and emits a Webflow IX2 interaction when the driver slide `.slide--scroll-driver` leaves the top of the scroller, and again on enter‑back (for automatic reverse).
- **Defaults**: scroller `.perspective-wrapper`, driver `.slide--scroll-driver`, interaction `logo-shrink`, start `top top`, end `bottom top`, `markers: false`.
- **Safety**: No‑ops if Webflow/IX2 or ScrollTrigger are unavailable, or if elements are missing.

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
  lightboxRoot: '#project-lightbox' // optional; defaults to '#project-lightbox'
});
```

`init()` will:
- call `initAccordion('.accordeon')`
- call `initLightbox({ root: lightboxRoot, closeDelayMs: 1000 })`
- attempt `initSlidesSnap()` if GSAP/ScrollTrigger are present
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

Accordion events bubble from the specific item as well as emit on `window` (see module notes); names: `ACC_L1_OPEN`, `ACC_L1_CLOSE`, `ACC_L2_OPEN`, `ACC_L2_CLOSE`.

---

### Troubleshooting

- **Slide snapping doesn’t work**: Ensure GSAP and ScrollTrigger are loaded, and there are elements matching `.slide`. Verify `prefers-reduced-motion` isn’t set.
- **Lightbox doesn’t open**: Verify `#project-lightbox` exists and slides have `data-video` (Vimeo ID/URL). The `.video-area` container must be present inside the lightbox.
- **Accordion doesn’t animate**: Ensure the CSS transition from `style.css` is included. Triggers must be `.accordeon__trigger` and panels `.accordeon__list`.
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
- **Init**: auto on DOM ready; optional `window.App.init({ lightboxRoot: '#project-lightbox' })`.
- **Required markup**: `.accordeon` (accordion), `#project-lightbox` with `.project-lightbox__inner` and `.video-area`, `.slide` sections (for snapping and as lightbox triggers).

---

### License

ISC (see `package.json`).


