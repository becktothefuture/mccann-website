# McCann Website — Coding Standards

**Purpose:** Maintain consistency, improve readability, optimize performance, and speed up onboarding for developers working on this project.

**Last Updated:** 2025-11-05

---

## Table of Contents

1. [File Structure](#file-structure)
2. [Naming Conventions](#naming-conventions)
3. [Console Logging](#console-logging)
4. [Performance Rules (THE FUNDAMENTALS)](#performance-rules-the-fundamentals)
5. [Accessibility Standards](#accessibility-standards)
6. [JavaScript Best Practices](#javascript-best-practices)
7. [Module Patterns](#module-patterns)
8. [Webflow Integration](#webflow-integration)
9. [Error Handling](#error-handling)
10. [Documentation](#documentation)
11. [Performance Testing](#performance-testing)

---

## File Structure

### Header Comment Format

Every module file must start with a Swiss-grid box header:

```javascript
/**
 * ==================================================
 *  McCann Website — Module Name
 *  Purpose: Brief description of what this module does
 *  Date: YYYY-MM-DD
 * ==================================================
 */
```

**Example:**
```javascript
/**
 * ==================================================
 *  McCann Website — Module Name
 *  Purpose: Brief description of module functionality
 *  Date: YYYY-MM-DD
 * ==================================================
 */
```

### Section Order

Files should follow this structure (in order):

1. **Header comment** (Swiss-grid box)
2. **Module-level log** (`console.log('[MODULE] Module loaded')`)
3. **Imports** (`import` statements)
4. **Exports** (`export function initModule()`)
5. **Section dividers** (`// ============================================================`)
6. **State variables** (`// STATE` section)
7. **Initialization** (`// INITIALIZATION` section)
8. **Helper functions** (`// HELPER FUNCTIONS` section)
9. **Core functions** (`// CORE FUNCTIONS` section)
10. **Event listeners** (`// EVENT LISTENERS` section)
11. **Cleanup/exports** (if needed)

### Section Dividers

Use consistent section dividers:

```javascript
// ============================================================
// SECTION NAME
// ============================================================
```

**Common sections:**
- `SETUP & DOM REFERENCES`
- `STATE`
- `INITIALIZATION`
- `HELPER FUNCTIONS`
- `CORE FUNCTIONS`
- `EVENT LISTENERS`
- `WEBFLOW SETUP VALIDATION`

---

## Naming Conventions

### Functions

**Verb-based, descriptive:**
- ✅ `initAccordion()` - Initialize accordion
- ✅ `lockScroll()` - Lock page scroll
- ✅ `emitIx()` - Emit Webflow interaction event
- ✅ `findLabelElement()` - Find element with label
- ❌ `accordion()` - Too vague
- ❌ `doStuff()` - Not descriptive

**Pattern:** `verb + noun` (e.g., `initModule`, `lockScroll`, `emitEvent`)

### Variables

**Abbreviated but clear:**
- ✅ `lb` - Lightbox (used frequently)
- ✅ `dbg` - Debug helper function
- ✅ `wfIx` - Webflow Interactions API
- ✅ `el` - Element (used frequently)
- ❌ `l` - Too short, unclear
- ❌ `lightboxContainerElement` - Too verbose

**Common abbreviations:**
- `lb` = lightbox
- `el` = element
- `wfIx` = Webflow Interactions
- `rafId` = requestAnimationFrame ID
- `dbg` = debug function

### CSS Classes

**BEM-style (Block Element Modifier):**
- ✅ `.accordeon` - Block
- ✅ `.acc-trigger` - Element (abbreviated block name)
- ✅ `.acc-trigger--active` - Modifier
- ✅ `.lightbox__inner` - Element

**Pattern:** `.block`, `.block__element`, `.block--modifier`

### Events

**kebab-case:**
- ✅ `acc-open` - Accordion opens
- ✅ `logo-appear` - Logo appears
- ✅ `lb:open` - Lightbox opens (with namespace)
- ❌ `accOpen` - Wrong format
- ❌ `logo_appear` - Wrong separator

### Exports

**Named exports preferred:**
```javascript
// ✅ Good
export function initLightbox() { }
export function lockScroll() { }

// ❌ Avoid
export default { initLightbox, lockScroll }
```

---

## Console Logging

### Format

**Always prefix with module name in brackets:**
```javascript
console.log('[MODULE_NAME] message');
console.warn('[MODULE_NAME] warning message');
console.error('[MODULE_NAME] error message');
```

**Examples:**
```javascript
console.log('[ACCORDION] Module loaded');
console.log('[LIGHTBOX] Video loaded');
console.warn('[LIGHTBOX] Element not found');
```

### Emoji Usage

**Use emojis strategically for visual scanning:**

- ✓ **Success** - Initialization complete, element found
- ❌ **Error** - Critical error, missing required element
- ⚠️ **Warning** - Non-critical issue, fallback used
- 🔍 **Validation** - Setup validation, checking elements
- 🎯 **Action** - Event emission, user interaction
- 📢 **Event** - Custom event dispatched

**Examples:**
```javascript
console.log('✓ Found: .lightbox__inner exists');
console.warn('⚠️  NOT FOUND: .video-area');
console.log('🎯 [LIGHTBOX] Triggered animation: "lb:open"');
console.log('📢 EMITTING via window.dispatchEvent: "acc-open"');
```

### Validation Blocks

**For setup validation, use box-drawing characters:**

```javascript
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 LIGHTBOX WEBFLOW SETUP VALIDATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('1️⃣  Main Container (#lightbox)');
console.log('   ✓ Found: #lightbox element exists');
```

### Debug Helpers

**Create optional debug wrappers:**

```javascript
const dbg = (...args) => { 
  try { 
    console.log('[MODULE]', ...args); 
  } catch(_) {} 
};

// Usage:
dbg('Item opened:', item);
```

---

## Performance Rules (THE FUNDAMENTALS)

### Event Optimization Patterns

```javascript
// THROTTLE: Limit execution rate (good for scroll, mousemove)
let rafId = null;
function handleMove(e) {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    updatePosition(e.clientX, e.clientY);
  });
}

// DEBOUNCE: Delay until pause (good for search, resize)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const handleSearch = debounce((query) => {
  performSearch(query);
}, 300);

// PASSIVE LISTENERS: Better scroll performance
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('touchmove', handleTouch, { passive: true });
```

### DOM Performance Optimization

```javascript
// CACHE SELECTORS - Query once, use many
const statusEl = document.querySelector('.status');
function update() {
  statusEl.textContent = 'Loading';
  // ... later  
  statusEl.textContent = 'Done';
}

// BATCH DOM OPERATIONS - Minimize reflows
// BAD: Causes multiple reflows
element.style.left = '10px';
element.style.top = '10px';
element.style.width = '20px';

// GOOD: Single reflow
element.style.cssText = 'left: 10px; top: 10px; width: 20px;';
// OR use CSS class
element.classList.add('positioned');

// CRITICAL: NEVER USE INLINE STYLES FOR ANIMATIONS/TRANSFORMS
// Inline transform styles cause conflicts with Webflow and break separation of concerns
// BAD: Mixing position and scale in inline transforms
element.style.transform = 'scale(0.5)';  // ❌ Conflicts with Webflow
element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; // ❌ Breaks when scale changes

// GOOD: CSS classes for state changes
element.classList.add('is-scaled');  // ✓ CSS handles the transform
// CSS: .is-scaled { transform: scale(0.5); }

// GOOD: CSS custom properties for dynamic values
element.style.setProperty('--x', `${x}px`);  // ✓ Position via CSS variables
element.style.setProperty('--y', `${y}px`);
// CSS: transform: translate(var(--x), var(--y)) scale(0.2);

// DOCUMENT FRAGMENTS - For bulk inserts
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const li = document.createElement('li');
  li.textContent = item;
  fragment.appendChild(li);
});
list.appendChild(fragment); // Single DOM update

// READ-WRITE SEPARATION - Avoid layout thrashing
// BAD: Interleaved reads and writes
elements.forEach(el => {
  el.style.height = el.offsetHeight + 10 + 'px'; // Read then write
});

// GOOD: Batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

### Animation Performance Guidelines

```javascript
// USE REQUESTANIMATIONFRAME - Not setTimeout
function animate() {
  updateAnimation();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// PREFER TRANSFORMS - GPU accelerated
// BAD: Triggers layout
element.style.left = x + 'px';
element.style.top = y + 'px';

// GOOD: GPU accelerated, no layout
element.style.transform = `translate(${x}px, ${y}px)`;

// WILL-CHANGE - Use sparingly, remove after animation
element.style.willChange = 'transform';
// ... perform animation
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});

// GSAP BEST PRACTICES
// Use timelines for sequences
const tl = gsap.timeline({ 
  defaults: { duration: 0.5, ease: 'power2.inOut' } 
});
tl.to('.box', { x: 100 })
  .to('.box', { y: 50 }, '<0.2'); // Overlap

// ScrollTrigger optimization
ScrollTrigger.create({
  trigger: '.section',
  start: () => `top ${window.innerHeight * 0.75}px`, // Dynamic
  invalidateOnRefresh: true, // Recalculate on resize
  fastScrollEnd: true, // Better mobile performance
  preventOverlaps: true // Avoid conflicts
});

// Batch ScrollTriggers for lists
ScrollTrigger.batch('.item', {
  onEnter: batch => gsap.to(batch, { 
    opacity: 1, 
    stagger: 0.15,
    overwrite: 'auto' // Prevent conflicts
  }),
  start: 'top bottom-=100px'
});
```

### Memory Management

```javascript
// CLEANUP ANIMATIONS & LISTENERS
function cleanup() {
  // Kill GSAP animations
  gsap.killTweensOf('.element');
  ScrollTrigger.getAll().forEach(st => st.kill());
  
  // Remove event listeners
  element.removeEventListener('click', handler);
  window.removeEventListener('resize', resizeHandler);
  
  // Cancel RAF
  if (rafId) cancelAnimationFrame(rafId);
  
  // Clear timeouts/intervals
  clearTimeout(timeoutId);
  clearInterval(intervalId);
  
  // Disconnect observers
  observer.disconnect();
}

// AVOID MEMORY LEAKS
// Use WeakMap for DOM references
const cache = new WeakMap();
cache.set(element, data);

// Clear references when done
element = null;
array.length = 0;
```

### Lazy Loading & Code Splitting

```javascript
// INTERSECTION OBSERVER - Modern lazy loading
const imageObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  },
  { 
    rootMargin: '50px', // Load before visible
    threshold: 0.01 
  }
);

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});

// DYNAMIC IMPORTS - Code splitting
button.addEventListener('click', async () => {
  const module = await import('./heavy-module.js');
  module.init();
});
```

### Web Performance Metrics

```javascript
// MEASURE PERFORMANCE
performance.mark('process-start');
// ... expensive operation
performance.mark('process-end');
performance.measure('process', 'process-start', 'process-end');

const measure = performance.getEntriesByName('process')[0];
console.log(`Process took: ${measure.duration.toFixed(2)}ms`);

// MONITOR CORE WEB VITALS
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Log metrics to analytics
    console.log(`${entry.name}: ${entry.value}`);
  }
}).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
```

---

## Accessibility Standards

### ARIA Attributes

**Always set ARIA for interactive elements:**

```javascript
// Modal/lightbox
lb.setAttribute('role', 'dialog');
lb.setAttribute('aria-modal', 'true');
lb.setAttribute('aria-hidden', 'true');

// Accordion trigger
trigger.setAttribute('aria-expanded', 'false');
trigger.setAttribute('aria-controls', panelId);
```

### Focus Management

**Trap focus in modals:**

```javascript
function trapFocus(e) {
  if (e.key !== 'Tab') return;
  
  const focusables = lb.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
```

### Keyboard Support

**Support standard keyboard interactions:**

- `Enter` / `Space` - Activate button/trigger
- `Escape` - Close modal/overlay
- `Tab` - Navigate focusable elements
- `Shift+Tab` - Navigate backwards

```javascript
trigger.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openAccordion();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isOpen) {
    closeModal();
  }
});
```

### Reduced Motion

**Always respect `prefers-reduced-motion`:**

```javascript
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  console.log('[MODULE] Skipped - user prefers reduced motion');
  return;
}

// Or disable animations conditionally:
const duration = prefersReduced ? 0 : 1000;
```

**CSS:**
```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    display: none !important;
  }
}
```

### Focus Indicators

**Never hide focus indicators:**

```css
/* ✅ Good - Preserve focus indicators */
[role="button"]:focus,
a:focus,
button:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* ❌ Bad - Never do this */
*:focus { outline: none; }
```

---

## JavaScript Best Practices

### Modern JavaScript Patterns

```javascript
// PREFER CONST/LET over var
const immutable = 'value';
let mutable = 'can change';

// DESTRUCTURING for cleaner code
const { name, age, ...rest } = user;
const [first, second] = array;

// DEFAULT PARAMETERS
function init(options = {}) {
  const {
    delay = 1000,
    autoplay = true
  } = options;
}

// OPTIONAL CHAINING & NULLISH COALESCING
const value = data?.deeply?.nested?.value ?? 'default';

// TEMPLATE LITERALS for complex strings
const message = `[${MODULE}] Found ${count} items at ${time}`;

// ARRAY METHODS over loops
const doubled = numbers.map(n => n * 2);
const filtered = items.filter(Boolean);
const sum = values.reduce((a, b) => a + b, 0);
const hasItem = items.some(item => item.id === targetId);
const allValid = items.every(item => item.isValid);

// SPREAD OPERATOR
const combined = [...array1, ...array2];
const cloned = { ...original };

// ARROW FUNCTIONS for callbacks
[1, 2, 3].map(x => x * 2);

// ASYNC/AWAIT over promise chains
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[MODULE] Fetch failed:', error);
    return null;
  }
}
```

### Error Handling Patterns

```javascript
// GRACEFUL DEGRADATION
try {
  riskyOperation();
} catch (error) {
  console.error('[MODULE] Operation failed:', error);
  // Fallback behavior
  useDefaultBehavior();
}

// GUARD CLAUSES - Early returns
function process(data) {
  if (!data) {
    console.warn('[MODULE] No data provided');
    return;
  }
  
  if (!data.isValid) {
    console.warn('[MODULE] Invalid data');
    return;
  }
  
  // Main logic here
  performProcessing(data);
}

// OPTIONAL EXECUTION
const result = callback?.() ?? defaultValue;
```

### Code Style

**Indentation:** 2 spaces (no tabs)

**Quotes:** Single quotes for strings

**Trailing Commas:** Always use trailing commas

**Comments:** Explain WHY, not WHAT

```javascript
// ❌ Bad - explains what (obvious)
// Set element position
el.style.setProperty('--x', `${currentX}px`);

// ✅ Good - explains why
// Use CSS custom properties so Webflow can override if needed
el.style.setProperty('--x', `${currentX}px`);

// ✅ Good - explains decision/trade-off
// Traverse up DOM tree to find parent's data attribute
// This ensures labels work even when hovering child elements
while (current && depth < maxDepth) {
  // ...
}
```

---

## Module Patterns

### Single Responsibility

**Each module does one thing:**

- ✅ `accordion.js` - Accordion functionality only
- ✅ `lightbox.js` - Lightbox functionality only
- ✅ `smooth-scroll.js` - Smooth scroll functionality only
- ❌ `ui-components.js` - Too broad

### Options Object with Defaults

**Always use destructuring with defaults:**

```javascript
export function initModule(options = {}) {
  const {
    selector = '.default-selector',
    delay = 1000,
    enabled = true
  } = options;
  
  // ...
}
```

### No-op on Missing Elements

**Modules should gracefully degrade:**

```javascript
export function initModule(selector) {
  const el = document.querySelector(selector);
  if (!el) {
    console.log('[MODULE] Element not found');
    return; // No-op, don't throw
  }
  
  // Module functionality
}
```

### Minimal API

**Expose only what's needed:**

```javascript
// ✅ Good - single init function
export function initLightbox(options) { }

// ❌ Avoid - exposing internals
export function updateLabel() { }
export function handleMouseMove() { }
```

### Event-Driven Communication

**Modules communicate via events, not direct calls:**

```javascript
// Module A emits event
emit('LIGHTBOX_OPEN', lb, { video, title });

// Module B listens
window.addEventListener('LIGHTBOX_OPEN', (e) => {
  const { video, title } = e.detail;
  // Handle event
});
```

---

## Webflow Integration

### Never Assume Elements Exist

**Always check for Webflow elements:**

```javascript
const lb = document.querySelector('#lightbox');
if (!lb) {
  console.log('[LIGHTBOX] Element not found');
  return;
}
```

### Detect IX2/IX3 Availability

**Check for Webflow Interactions API:**

```javascript
const wfIx = (window.Webflow && window.Webflow.require)
  ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
  : null;

if (!wfIx) {
  console.warn('[MODULE] Webflow IX API not found');
  return;
}
```

### Dual Event System

**Emit both Webflow events and window CustomEvents:**

```javascript
function emitWebflowEvent(name) {
  // 1. Try Webflow IX (for GSAP timelines)
  try {
    if (wfIx && typeof wfIx.emit === 'function') {
      wfIx.emit(name);
    }
  } catch(err) {
    console.warn(`[MODULE] Cannot emit "${name}" - wfIx.emit failed`);
  }
  
  // 2. Always emit window event (for JS listeners)
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch(err) {
    console.error(`[MODULE] Cannot emit "${name}" - window.dispatchEvent failed`);
  }
}
```

### Functional CSS Only

**Keep CSS functional, design in Webflow:**

```css
/* ✅ Good - Functional styles only */
.animated-element {
  pointer-events: none;
  will-change: transform, scale;
  transition: scale 70ms cubic-bezier(...);
}

/* ❌ Avoid - Visual design in CSS */
.animated-element {
  background: #0066ff; /* Design should be in Webflow */
  border-radius: 50%; /* Design should be in Webflow */
}
```

---

## Error Handling

### Console Log, Don't Throw

**Log errors, don't crash:**

```javascript
// ✅ Good
try {
  wfIx.emit('event-name');
} catch(err) {
  console.error('[MODULE] Error emitting event:', err);
  // Continue execution
}

// ❌ Avoid
try {
  wfIx.emit('event-name');
} catch(err) {
  throw err; // Don't crash the app
}
```

### Graceful Degradation

**Provide fallbacks:**

```javascript
// Try Webflow IX first, fallback to window events
const wfIx = window.Webflow?.require('ix3') || window.Webflow?.require('ix2');

if (wfIx) {
  wfIx.emit('event-name');
} else {
  // Fallback: emit window event
  window.dispatchEvent(new CustomEvent('event-name'));
}
```

### Try-Catch Around External APIs

**Always wrap Webflow API calls:**

```javascript
function emitWebflowEvent(name) {
  try {
    if (wfIx && typeof wfIx.emit === 'function') {
      wfIx.emit(name);
    }
  } catch(err) {
    console.error(`[MODULE] Error emitting "${name}":`, err);
  }
}
```

---

## Documentation

### JSDoc for Public Functions

**Document public functions:**

```javascript
/**
 * Initialize lightbox system
 * @param {Object} options - Configuration options
 * @param {string} [options.root='#lightbox'] - CSS selector for lightbox element
 * @param {number} [options.closeDelayMs=1000] - Delay before closing animation
 * @returns {Object} - Cleanup function and control methods
 */
export function initLightbox(options = {}) {
  // ...
}
```

### Inline Comments for Non-Obvious Logic

**Explain complex algorithms:**

```javascript
// Calculate ease factor based on distance from viewport edges
// Returns higher multiplier near edges, lower in center
// This creates the "speeds up at edges, slows in center" effect
function getEdgeEaseFactor(x, y) {
  // Normalize position (0-1)
  const nx = x / w;
  
  // Distance from edges (0 at edge, 0.5 at center)
  const distX = Math.min(nx, 1 - nx);
  
  // Apply multiplier based on threshold
  if (minDist < edgeThreshold) {
    const easeFactor = 1 + (edgeMultiplier - 1) * (1 - normalizedDist);
    return easeFactor;
  }
  
  return 1 / edgeMultiplier; // Slow down in center
}
```

### README for Module Overview

**Each complex module should have setup docs:**

- `docs/ACCORDION_WEBFLOW_SETUP.md`
- `docs/CURSOR_WEBFLOW_SETUP.md`

---

## Performance Testing

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s

### Performance Audit Steps

1. **Chrome DevTools Performance**
   - Record page load
   - Check for long tasks (> 50ms)
   - Identify layout thrashing
   - Monitor memory usage

2. **Lighthouse Audit**
   ```bash
   # Run Lighthouse CLI
   lighthouse https://site.com --view
   ```

3. **Bundle Analysis**
   ```bash
   # Check bundle size
   npm run build
   # Look for large dependencies
   ```

4. **Network Waterfall**
   - Check request count
   - Identify blocking resources
   - Verify resource priorities
   - Check for proper caching headers

### Common Performance Issues

- Layout shifts from dynamic content
- Unoptimized images (use WebP, lazy load)
- Render-blocking scripts (defer/async)
- Large DOM size (> 1500 nodes)
- Excessive DOM depth (> 32 levels)
- Too many event listeners (delegate instead)
- Memory leaks (detached DOM nodes)
- Forced synchronous layouts

---

## Summary Checklist

When creating a new module, ensure:

- [ ] Swiss-grid header comment
- [ ] Module loaded log at top
- [ ] Section dividers (`// ============`)
- [ ] Early returns for missing elements
- [ ] Console logging with `[MODULE]` prefix
- [ ] Options object with defaults
- [ ] ARIA attributes for interactive elements
- [ ] Keyboard support (Enter, Space, Escape, Tab)
- [ ] `prefers-reduced-motion` check
- [ ] Throttle high-frequency events with RAF
- [ ] Debounce input events appropriately
- [ ] Use passive listeners for scroll/touch
- [ ] Cache DOM selectors
- [ ] Batch DOM operations
- [ ] Prefer CSS transforms for animations
- [ ] Use `will-change` sparingly
- [ ] Clean up animations and listeners
- [ ] Try-catch around Webflow API calls
- [ ] Use modern JS patterns (const/let, destructuring, optional chaining)
- [ ] JSDoc for public functions
- [ ] Inline comments explain WHY
- [ ] No-op on missing elements (graceful degradation)
- [ ] Test Core Web Vitals

---

## Core Principles Summary

### The Performance Mindset
- **Measure, don't guess** - Use DevTools, not assumptions
- **User experience is performance** - Every ms counts
- **Progressive enhancement** - Start fast, enhance gradually
- **Graceful degradation** - Features should fail silently

### The Code Quality Mindset  
- **Clarity over cleverness** - Readable code is maintainable code
- **Consistency over personal preference** - Follow the patterns
- **Explicit over implicit** - Make intentions clear
- **Composition over inheritance** - Small, focused modules

### The Accessibility Mindset
- **Inclusive by default** - Not an afterthought
- **Keyboard first** - If it clicks, it should key
- **Semantic HTML** - Right element for the job
- **ARIA as enhancement** - Not a replacement for good HTML

> "Write code like the next person to maintain it is a violent psychopath who knows where you live." 😄

> "But also write it like they're your friend and you want them to succeed." 🤝

---

**Remember:** These rules exist to make the codebase maintainable, readable, consistent, and performant. When in doubt, follow existing patterns in the codebase and prioritize user experience.