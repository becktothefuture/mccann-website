# McCann Website — Quick Reference

**Purpose:** Developer cheat sheet for common patterns, troubleshooting, and quick lookups.

**Last Updated:** 2025-11-05

---

## Module Overview

| Module | Purpose | Key Selector | Dependencies |
|--------|---------|--------------|--------------|
| `accordion.js` | Two-level accordion with ARIA | `.accordeon` | GSAP (Webflow IX) |
| `lightbox.js` | Modal lightbox with Vimeo | `#lightbox` | Scroll lock, Vimeo helper |
| `smooth-scroll.js` | Lenis momentum scrolling | Auto-detects | Lenis library |
| `slide-transition-observer.js` | Logo animation (new) | `#intro-slide` | Webflow IX |
| `webflow-scrolltrigger.js` | Logo animation (legacy) | `.perspective-wrapper` | GSAP ScrollTrigger |

---

## Common Patterns Cheat Sheet

### Module Structure Template

```javascript
/**
 * ==================================================
 *  McCann Website — Module Name
 *  Purpose: Brief description
 *  Date: YYYY-MM-DD
 * ==================================================
 */

import { dependency } from './dependency.js';

export function initModule(options = {}) {
  const { selector = '.default' } = options;
  
  // Early return for missing elements
  const el = document.querySelector(selector);
  if (!el) {
    console.log('[MODULE] Element not found');
    return;
  }
  
  // ============================================================
  // STATE
  // ============================================================
  
  let state = false;
  
  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  function doSomething() {
    // Implementation
  }
  
  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  
  el.addEventListener('click', doSomething);
}
```

### Console Logging Patterns

```javascript
// Standard log
console.log('[MODULE] message');

// Success
console.log('✓ Element found');

// Warning
console.warn('[MODULE] ⚠️  Warning message');

// Error
console.error('[MODULE] ❌ Error message');

// Validation block
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 VALIDATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
```

### Options with Defaults

```javascript
export function initModule(options = {}) {
  const {
    selector = '.default',
    delay = 1000,
    enabled = true
  } = options;
  
  // Use options...
}
```

### Early Returns

```javascript
function doSomething(element) {
  if (!element) return;           // Guard clause
  if (!element.dataset.value) return; // Guard clause
  
  // Main logic here
}
```

### Throttle High-Frequency Events

```javascript
let rafId = null;

function handleMouseMove(e) {
  // Update immediately
  targetX = e.clientX;
  
  // Throttle expensive operations
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    expensiveOperation();
  });
}
```

### Webflow IX Event Emission

```javascript
const wfIx = (window.Webflow && window.Webflow.require)
  ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
  : null;

function emitWebflowEvent(name) {
  try {
    if (wfIx && typeof wfIx.emit === 'function') {
      wfIx.emit(name);
    }
  } catch(err) {
    console.warn(`[MODULE] Cannot emit "${name}"`, err);
  }
  
  // Also emit window event for JS listeners
  try {
    window.dispatchEvent(new CustomEvent(name));
  } catch(err) {
    console.error(`[MODULE] Cannot emit window event "${name}"`, err);
  }
}
```

---

## Troubleshooting Checklist

### Module Not Initializing

- [ ] Check console for `[MODULE] Element not found`
- [ ] Verify selector matches Webflow element
- [ ] Check if element exists in DOM (use DevTools)
- [ ] Ensure module is imported in `app.js`
- [ ] Verify `initModule()` is called in `app.js`

### GSAP Animation Not Playing

- [ ] Check Webflow IX is available: `console.log(!!window.Webflow?.require('ix3'))`
- [ ] Verify event name matches exactly (case-sensitive)
- [ ] Check Webflow Interactions panel for custom event
- [ ] Ensure event target is correct element
- [ ] Try emitting window event as fallback

### Performance Issues

- [ ] Check for unthrottled `mousemove`/`scroll` listeners
- [ ] Look for excessive DOM queries (cache selectors)
- [ ] Verify `requestAnimationFrame` is used for animations
- [ ] Check for memory leaks (event listeners not removed)
- [ ] Profile with Chrome DevTools Performance tab

### Accessibility Issues

- [ ] Verify ARIA attributes are set
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Check focus management in modals
- [ ] Verify `prefers-reduced-motion` is respected
- [ ] Test with screen reader

### Scroll Lock Not Working

- [ ] Check iOS Safari specifically (different behavior)
- [ ] Verify `lockScroll()` is called before modal opens
- [ ] Ensure `unlockScroll()` is called after modal closes
- [ ] Check if Lenis smooth scroll is interfering
- [ ] Verify no CSS `overflow: hidden` conflicts

---

## Performance Tips

### DO ✅

- Cache DOM selectors
- Use `requestAnimationFrame` for animations
- Throttle `mousemove`, `scroll`, `resize` events
- Use CSS transitions when possible
- Early returns for missing elements
- Debounce resize handlers

### DON'T ❌

- Query DOM in loops
- Use `setTimeout` for animations (use RAF)
- Attach listeners without cleanup
- Run expensive operations on every frame
- Use `display: none` for GSAP animations (use `visibility`)
- Skip `prefers-reduced-motion` checks

---

## Webflow Gotchas

### Common Issues

**1. Element Not Found**
- Webflow adds classes dynamically
- Use class selectors, not IDs (IDs can change)
- Wait for `DOMContentLoaded` or `window.load`

**2. GSAP Animations Not Triggering**
- Event names are case-sensitive
- Must use exact event name from Webflow Interactions
- Check Webflow IX version (ix3 preferred, fallback ix2)

**3. Inline Styles Override CSS**
- Webflow sets inline styles on elements
- Use `!important` or `setProperty()` with `important` flag
- Or remove inline styles: `element.style.removeProperty('property')`

**4. Scroll Snap Conflicts**
- Smooth scroll disabled on pages with `.perspective-wrapper`
- Use native CSS scroll-snap instead of JS
- Don't mix Lenis with scroll-snap containers

**5. Designer vs Published Behavior**
- Designer runs in iframe (different origin)
- Some features disabled in Designer (autoplay, etc.)
- Always test on published site

### Required Webflow Setup

**Accordion:**
- Root: `.accordeon`
- Items: `.acc-item`
- Triggers: `.acc-trigger`
- Panels: `.acc-list`
- Custom events: `acc-open`, `acc-close`

**Lightbox:**
- Container: `#lightbox`
- Inner: `.lightbox__inner`
- Video area: `.video-area`
- Close button: `#close-btn`
- Triggers: `.slide` with `data-video`
- Custom events: `lb:open`, `lb:close`

**Lightbox:**
- Container: `#lightbox`
- Inner: `.lightbox__inner`
- Video area: `.video-area`
- Data attribute: `data-video` (Vimeo ID)

---

## Quick Debugging

### Enable Debug Logging

```javascript
// In console
window._accordionDebug = true;
window._moduleDebug = true;
```

### Check Module Status

```javascript
// Lightbox
console.log(window.App?.lightbox);

// Smooth scroll
console.log(window.App?.smoothScroll?.instance);
```

### Test Webflow IX

```javascript
const wfIx = window.Webflow?.require('ix3') || window.Webflow?.require('ix2');
console.log('Webflow IX:', !!wfIx);
console.log('Version:', window.Webflow?.require('ix3') ? 'IX3' : 'IX2');
```

### Check Element Existence

```javascript
// In console
document.querySelector('#lightbox');
document.querySelectorAll('.slide').length;
```

---

## Common Selectors Reference

```javascript
// Accordion
'.accordeon'           // Root
'.acc-item'            // Items
'.acc-trigger'         // Triggers
'.acc-list'            // Panels

// Lightbox
'#lightbox'            // Container
'.lightbox__inner'     // Inner wrapper
'.video-area'          // Video container
'#close-btn'           // Close button
'.slide'               // Triggers

// Logo animation
'.perspective-wrapper' // Scroll container
'#intro-slide'         // Target slide
```

---

## Event Names Reference

**Accordion:**
- `acc-open` (primary)
- `acc-close` (primary)
- `accordeon-open` (legacy alias)
- `accordeon-close` (legacy alias)

**Lightbox:**
- `LIGHTBOX_OPEN` (window event)
- `LIGHTBOX_CLOSE` (window event)
- `LIGHTBOX_CLOSED_DONE` (window event)
- `lb:open` (Webflow IX)
- `lb:close` (Webflow IX)

**Logo Animation:**
- `logo-appear` (IntersectionObserver)
- `logo-disappear` (IntersectionObserver)
- `logo-shrink` (ScrollTrigger legacy)
- `logo-grow` (ScrollTrigger legacy)
- `logo-start` (ScrollTrigger legacy)

---

## File Structure Quick Reference

```
src/
├── app.js                      # Entry point, wires modules
├── core/
│   ├── events.js              # Event emitter utility
│   └── scrolllock.js          # Scroll lock utility
└── modules/
    ├── accordion.js           # Accordion component
    ├── lightbox.js            # Lightbox/modal
    ├── smooth-scroll.js       # Lenis smooth scroll
    ├── slide-transition-observer.js  # Logo animation (new)
    └── webflow-scrolltrigger.js      # Logo animation (legacy)

docs/
├── CODING_RULES.md           # Complete coding standards
├── QUICK_REFERENCE.md        # This file
├── ACCORDION_WEBFLOW_SETUP.md
└── CURSOR_WEBFLOW_SETUP.md
```

---

## Key Decisions Explained

**Why `visibility` not `display:none`?**
- GSAP needs element in DOM flow to animate
- `display:none` removes element from layout
- `visibility:hidden` keeps it in layout but hidden

**Why `position:fixed` for scroll lock?**
- `overflow:hidden` doesn't work on iOS Safari
- Fixed positioning prevents rubber-band scrolling
- Only reliable cross-platform solution

**Why throttle with `requestAnimationFrame`?**
- Synced to browser repaint (~60fps)
- Automatically pauses when tab hidden
- Higher priority than `setTimeout`

**Why traverse DOM for labels?**
- Hovering child elements need parent's data attribute
- Without traversal, only exact element works
- Creates better UX for nested structures

**Why dual event system (Webflow + window)?**
- Webflow IX for GSAP timelines
- Window events for JS listeners
- Fallback ensures compatibility

---

**Remember:** When in doubt, check `CODING_RULES.md` for detailed explanations.

