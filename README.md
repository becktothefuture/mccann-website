### McCann Website — Webflow Single‑Bundle Integration

This project ships a single, self‑contained JavaScript bundle designed to drop into a running Webflow site. It wires a11y‑friendly UI behaviors (accordion, lightbox with Vimeo) and native scroll snapping (no JS slide snapping module) with minimal surface area and careful fallbacks.

The bundle auto‑initializes on DOM ready and also exposes a tiny global `window.App.init(options)` for manual re‑init or customization.

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
- `src/modules/accordion.js`: Two‑level accordion with ARIA, keyboard support, smooth height transitions, and sibling closing.
- `src/modules/lightbox.js`: Accessible lightbox that traps focus, locks page scroll, closes on outside click/Escape, and mounts Vimeo videos.
- `src/modules/vimeo.js`: Parses Vimeo IDs/URLs and mounts a privacy‑respecting iframe.
- `src/modules/webflow-scrolltrigger.js`: GSAP ScrollTrigger → Webflow IX bridge for `.perspective-wrapper` + first `.slide`.
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

  - In Designer, do not load `http://127.0.0.1:3000/app.js` directly (cross‑origin). For live dev inside Designer, expose your local server via:
```bash
npx localtunnel --port 3000
# Use the printed HTTPS URL, e.g. https://<subdomain>.loca.lt/app.js
```

3) **Initialization**: The bundle auto‑runs on `DOMContentLoaded`. You can also initialize (or re‑initialize) manually:
```html
<script>
  // Optional: customize where the lightbox container lives
  window.App && window.App.init({ lightboxRoot: '#project-lightbox' });
  // If omitted, defaults are used and missing elements are safely ignored
  // initAccordion is called for '.accordeon'
  // initLightbox is called for '#project-lightbox'
  // YouTube iframes have their allow-tokens patched automatically
  </script>
```

4) **Create the custom Interactions in Webflow** (Interactions → New → Custom):
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
- **Events**: Simple custom events emitted on the panel element:
  - `acc-open` — fired when panel opens (trigger GSAP animation to play)
  - `acc-close` — fired when panel closes (trigger GSAP animation to reverse)
  Events bubble to `window` for global listening.

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
3. **Action**:
   - Target: **Custom selector** `.acc-item`
   - Scope: **Children** (the event fires on the `.acc-list`; animate only its direct child rows)
   - From→To: `opacity 0%`, `y 16px` → `opacity 100%`, `y 0`
   - Duration: `~0.20s`; Stagger: `0.06–0.08s`; Ease: `Power2/BackOut`
   - **Do NOT animate height/display** (JS handles panel height)
4. The same timeline works for all levels because events are dispatched on the specific panel element; GSAP targets only children of that panel.

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


#### Webflow ScrollTrigger → IX bridge (`src/modules/webflow-scrolltrigger.js`)

- **Behavior**: Ties `ScrollTrigger` to `.perspective-wrapper`. Emits an init event on load to set the animation to its start/paused state. As soon as the user begins scrolling down from the top of the first slide, emits a play event. When scrolling back above the driver, emits the reset event again so it’s paused at the top.
- **Defaults**:
  - scroller: `.perspective-wrapper`
  - driver: first `.slide` inside `.perspective-wrapper`
  - init/reset event: `logo-start`
  - play event: `logo-shrink`
  - grow event (scroll up): `logo-grow`
  - start `top top`, end `top -10%`, `markers: false`
- **Safety**: No‑ops if Webflow IX (ix2/ix3) or ScrollTrigger are unavailable, or if elements are missing.

Note: JS slide paging is disabled; rely on CSS `scroll-snap` in `.perspective-wrapper`.

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

- **Lightbox doesn’t open**: Verify `#project-lightbox` exists and slides have `data-video` (Vimeo ID/URL). The `.video-area` container must be present inside the lightbox.
- **Accordion doesn't animate**: Ensure the CSS transition from `style.css` is included. Use universal classes: `.acc-trigger` (Webflow Link), `.acc-list` (panel), `.acc-item` (rows). Verify GSAP timeline is bound to `acc-open`/`acc-close` events with Scope: Children.
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
- **Required markup**: `.accordeon` (accordion), `#project-lightbox` with `.project-lightbox__inner` and `.video-area`, `.slide` sections (as lightbox triggers).

---

### License

ISC (see `package.json`).


