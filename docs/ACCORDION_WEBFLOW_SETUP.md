# Accordion Runtime Setup

## Overview

The accordion module now owns its animation lifecycle—no Webflow IX timelines required. Height expansion, staggered item reveals, and overlap timing are baked into the script so every panel opens/closes smoothly straight from custom code.

Use this guide to wire the HTML correctly, tune the animation timings, and understand the runtime behaviour.

## DOM Structure (unchanged)

```html
<div class="accordeon">
  <!-- Level 1 Section -->
  <div class="acc-section">
    <a href="#" class="acc-trigger">Section Title</a>
    <div class="acc-list">
      <!-- Items that animate -->
      <div class="acc-item">Item 1</div>
      <div class="acc-item">Item 2</div>
      <div class="acc-item">Item 3</div>
    </div>
  </div>

  <!-- Nested accordion example -->
  <div class="acc-section">
    <a href="#" class="acc-trigger">Another Section</a>
    <div class="acc-list">
      <div class="acc-item">
        <a href="#" class="acc-trigger">Nested Trigger</a>
        <div class="acc-list">
          <div class="acc-item">Nested Item 1</div>
          <div class="acc-item">Nested Item 2</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Runtime Behaviour

1. `data-accordion-state` on each `.acc-list` tracks the lifecycle (`collapsed → opening → open → closing`).
2. Height is animated directly via `style.height`, easing with `cubic` curves for smooth expansion/collapse.
3. `.acc-item` elements receive a `--acc-progress` custom property driven by `requestAnimationFrame`; CSS translates/fades them into place.
4. Items stagger with 0.1 s overlap by default (configurable).
5. `CustomEvent` notifications (`acc-open`, `acc-close`, `accordeon-open`, `accordeon-close`) still fire on `window` for anyone listening.
6. Nested panels auto-collapse when their parent closes, preserving the original one-at-a-time behaviour.

## Configuration Options

All timing is customisable. Call `initAccordion` with overrides:

```javascript
import { initAccordion } from './modules/accordion.js';

initAccordion({
  selector: '.accordeon',  // Root element
  openDuration: 380,       // ms
  closeDuration: 260,      // ms
  itemDuration: 320,       // ms per item
  itemOverlap: 100,        // ms overlap between items
  itemDistance: 18         // px vertical travel for each item
});
```

`prefers-reduced-motion` is respected automatically—when enabled, transitions snap to their final state.

## Styling Checklist

The bundle ships minimal functional CSS (see `style.css`). If you customise in Webflow Designer, stay consistent with these expectations:

1. `.acc-list` stays rendered (display `block`/`flex` etc.); the module handles height + overflow.
2. `.acc-list[data-accordion-state="open"]` should allow `overflow: visible`.
3. `.acc-trigger.is-active` still marks the active trigger—style as needed in Webflow.
4. Provide enough vertical space so translating items (default `16px`) do not clip; adjust with the `itemDistance` option if needed.

_Optional_: add debug styling to inspect panel states quickly.

```css
.debug-mode .accordeon .acc-list[data-accordion-state="opening"] {
  outline: 1px dashed rgba(255, 165, 0, 0.6);
}
```

## Testing Checklist

1. Load the published page (Designer preview may skip JS).
2. Open DevTools console and ensure the module logs appear:
   - `[ACCORDION] Module loaded`
   - `[ACCORDION] ✓ Root element found: .accordeon`
3. Toggle a section: expect smooth height expansion plus staggered item fade/slide.
4. Toggle quickly between panels: animations should adjust mid-flight without jumps.
5. Test nested items to confirm parent closing collapses descendants instantly.
6. Emulate reduced motion (`CMD+SHIFT+P → Show Rendering → Emulate CSS prefers-reduced-motion`) to ensure instant toggles.

## Debug Utilities

Available via `window._accordionTest` in the console:

- `open(panelId)` – force-open a panel by ID.
- `close(panelId)` – force-close a panel by ID.
- `forceCloseAll()` – collapse every panel and reset triggers.
- `state()` – inspect panel IDs, state, and inline height.

Example:

```javascript
window._accordionTest.state();
// → [{ id: 'acc-panel-0', state: 'open', height: 'auto' }, …]
```

## Advanced Notes

- Animations rely on rAF; avoid manually mutating `style.height`/`--acc-progress` unless you pause the module first.
- If your content height changes while a panel is open, trigger a close/open cycle or set `panel.style.height = 'auto'` so the next close reads the correct start height.
- Listening for `acc-open` / `acc-close` on `window` is now the recommended integration point for cross-module coordination.

## Summary

This accordion is self-contained: drop it into Webflow, wire the HTML classes, and tune durations from the init call. No IX timelines, no GSAP dependency, and no reliance on `.acc-animate-target`. The result is a predictable, performant accordion that still honours accessibility and nested behaviour requirements.
