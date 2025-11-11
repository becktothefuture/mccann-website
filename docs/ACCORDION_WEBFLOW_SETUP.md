# Accordion Runtime Setup

## Overview

The accordion now animates entirely inside the module using GSAP. Panel height tweens, item staggers, and state updates stay in sync even when multiple sections are toggled quickly. A single 5 px translate that lasts 50 ms gives each item a crisp “lift” as it appears. No Webflow IX timelines are needed.

## DOM Structure (unchanged)

```html
<div class="accordeon">
  <div class="acc-section">
    <a href="#" class="acc-trigger">Section Title</a>
    <div class="acc-list">
      <div class="acc-item">Item 1</div>
      <div class="acc-item">Item 2</div>
      <div class="acc-item">Item 3</div>
    </div>
  </div>

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

## Animation Model

1. `data-accordion-state` shows whether a panel is `collapsed`, `opening`, `open`, or `closing`.
2. Height is animated with `gsap.to(panel, { height })`. When the tween finishes, height resets to `auto`.
3. Direct child `.acc-item` nodes translate from `-6px` to `0` and fade in/out over **50 ms**, with a default **20 ms** stagger so the motion stays tight even for large lists.
4. `acc-open` and `acc-close` events (plus `accordeon-*` aliases) still dispatch on `window` for other modules.
5. Nested accordions auto-collapse when parents close, and siblings are closed before a new section opens.
6. `prefers-reduced-motion` bypasses the tweens and snaps instantly.

GSAP must be available globally (`window.gsap`). If it isn’t, the accordion degrades to instant show/hide.

## Configuration

```javascript
import { initAccordion } from './modules/accordion.js';

initAccordion({
  selector: '.accordeon',
  panelOpenDuration: 200,  // ms
  panelCloseDuration: 150, // ms
  itemDuration: 50,        // ms (opacity + movement)
  itemStagger: 20,         // ms overlap between items
  itemDistance: 6          // px translate distance (items start at -6px)
});
```

Legacy keys (`openDuration`, `closeDuration`) still work. Set any duration to `0` if you want that portion to snap.

## Styling Checklist

The bundled CSS handles the basics; match these assumptions if you override anything:

1. `.acc-list` stays rendered—JS controls height and `overflow`.
2. `.acc-list[data-accordion-state="open"]` can safely allow `overflow: visible`.
3. `.acc-trigger.is-active` is your open-state hook.
4. Leave enough vertical room so the 5 px translate (or your custom value) doesn’t clip.

Optional debug helper:

```css
.debug-mode .accordeon .acc-list[data-accordion-state="opening"] {
  outline: 1px dashed rgba(255, 165, 0, 0.6);
}
```

## Testing Checklist

1. Publish/preview the page (Designer preview may skip JS).
2. Confirm console logs:
   - `[ACCORDION] Module loaded`
   - `[ACCORDION] ✓ Root element found: .accordeon`
3. Toggle sections: watch height tween and 5 px stagger.
4. Toggle rapidly between sections: animations should adjust without snapping.
5. Test nested accordions to ensure children collapse with parents.
6. Emulate reduced motion to confirm instant toggles.

## Debug Utilities

`window._accordionTest` exposes helpers:

- `open(panelId)` – open a panel with animation.
- `close(panelId)` – close a panel with animation.
- `forceCloseAll()` – instantly collapse every panel and reset triggers.
- `state()` – inspect each panel’s ID, state, and inline height.

```javascript
window._accordionTest.state();
// → [{ id: 'acc-panel-0', state: 'open', height: 'auto' }, …]
```

## Integration Notes

- Avoid mutating `style.height`, transforms, or opacity on `.acc-item` manually; the module manages those properties.
- When panel content changes height dynamically, close then reopen the section (or call the debug helpers) so the next animation re-measures.
- Hook onto `acc-open` / `acc-close` events if another module needs to react.

## Summary

Include the markup, call `initAccordion`, and GSAP takes care of smooth height tweens plus the 5 px / 50 ms stagger for any number of items. Tweaking the feel is as simple as adjusting the configuration values above.
