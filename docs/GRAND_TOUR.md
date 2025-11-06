# McCann Website — Grand Tour 🚀

**How JavaScript, Webflow, and GSAP Work Together**

---

## The Big Picture

This project is a **hybrid architecture** where:
- **Webflow** handles all visual design, layout, and GSAP animations
- **JavaScript** provides functionality, behavior, and state management
- **GSAP** (via Webflow Interactions) creates smooth, timeline-based animations

Think of it as:
```
Webflow (Design) + JavaScript (Behavior) + GSAP (Motion) = Complete Experience
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         WEBFLOW                              │
│  • Visual Design (colors, typography, spacing)               │
│  • Layout & Responsive Design                                │
│  • GSAP Animations (Interactions panel)                      │
│  • CMS Content                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Custom Events
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                     JAVASCRIPT (Our Code)                    │
│  • Module Initialization                                     │
│  • Event Handling & State Management                         │
│  • Accessibility (ARIA, Focus, Keyboard)                    │
│  • Performance Optimizations                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Starts: Initialization Flow

### 1. Page Load Sequence

```javascript
Browser loads page
  ↓
Webflow initializes (layout, styles, interactions)
  ↓
DOMContentLoaded fires
  ↓
app.js runs initialization:
  1. Patch YouTube iframes (add missing permissions)
  2. Initialize Smooth Scroll (if not on snap page)
  3. Initialize Accordion
  4. Initialize Lightbox
  5. Initialize Logo Animation
```

### 2. Console Output (What You See)

```
╔══════════════════════════════════════════════════════╗
║     McCann Website - Initialization Starting        ║
╚══════════════════════════════════════════════════════╝

[SMOOTH-SCROLL] Module loaded
[ACCORDION] Module loaded
[LIGHTBOX] Module loaded
[VIMEO] Module loaded
[SLIDE-OBSERVER] Module loaded

[SMOOTH-SCROLL] ⚠️ Skipped - page has scroll-snap container
[ACCORDION] ✓ Root element found: .accordeon
[LIGHTBOX] ✓ Element found: #lightbox
[SLIDE-OBSERVER] ✓ Observer initialized

╔══════════════════════════════════════════════════════╗
║     ✅ All Systems Initialized Successfully         ║
╚══════════════════════════════════════════════════════╝
```

---

## Module Deep Dive

### 🎬 Lightbox Module

**What it does:**
- Modal overlay for Vimeo videos
- Focus trapping for accessibility
- Scroll lock (iOS-safe)
- Keyboard navigation (Escape to close)

**How it works with Webflow:**

1. **Webflow provides:**
   - `#lightbox` container with backdrop
   - `.lightbox__inner` for content
   - GSAP animations via custom events:
     - `lb:open` → Fade in animation
     - `lb:close` → Fade out animation

2. **JavaScript provides:**
   - Click handlers on `.slide` triggers
   - Vimeo iframe mounting
   - Focus management (trap, restore)
   - Scroll locking
   - Event coordination

**Animation timing coordination:**
```
User clicks slide
       ↓
JS makes lightbox visible (removes inline styles)
       ↓
JS emits 'lb:open' event
       ↓
Webflow IX triggers GSAP animation (1000ms)
       ↓
Lightbox fully open

Close button clicked
       ↓
JS emits 'lb:close' event
       ↓
Webflow IX triggers GSAP animation
       ↓
JS waits 1000ms (animation duration)
       ↓
JS hides lightbox & cleans up
```

**Critical timing:** JS must wait for GSAP animation to complete before hiding element.

---

### 🎨 Accordion Module

**What it does:**
- Two-level expandable content
- ARIA-compliant keyboard navigation
- Smooth height transitions
- Sibling auto-close

**How it works with Webflow:**

1. **Webflow provides:**
   - `.accordeon` structure
   - `.acc-item` styling
   - GSAP stagger animations:
     - `acc-open` → Items fade in with stagger
     - `acc-close` → Items fade out

2. **JavaScript provides:**
   - Click/keyboard handlers
   - Height calculations (ResizeObserver)
   - ARIA attributes management
   - State tracking
   - Class marking for animation targets

**Animation targeting system:**
```javascript
Panel opens
    ↓
JS adds .acc-animate-target to child items
    ↓
JS emits 'acc-open' event
    ↓
Webflow IX animates ONLY elements with .acc-animate-target
    ↓
Staggered fade-in animation plays
```

This selective targeting prevents all accordions from animating when one opens.

---

### 🌊 Smooth Scroll Module (Lenis)

**What it does:**
- Momentum scrolling with "weight"
- Configurable lerp (linear interpolation)
- GSAP ScrollTrigger integration
- Auto-disabled on scroll-snap pages

**Smart detection:**
```javascript
if (document.querySelector('.perspective-wrapper')) {
  // This is a scroll-snap page
  // Disable Lenis, use native scrolling
} else {
  // Regular page
  // Enable Lenis for smooth scrolling
}
```

**Why disable on snap pages?**
- Scroll-snap containers have their own scroll physics
- Mixing Lenis with snap creates conflicts
- Native snap is smoother and more reliable

---

### 🎭 Logo Animation System

**Two implementations available:**

#### Option 1: IntersectionObserver (New, Recommended)
```javascript
Observer watches #intro-slide
    ↓
Slide leaves viewport (scrolled past)
    ↓
Emit 'logo-appear' event
    ↓
Webflow IX animates logo to visible state
```

#### Option 2: GSAP ScrollTrigger (Legacy)
```javascript
ScrollTrigger monitors scroll position
    ↓
Calculates percentage scrolled
    ↓
Emits events at thresholds:
- 'logo-start' (initialize)
- 'logo-shrink' (scroll down)
- 'logo-grow' (scroll up)
```

---

## Event Communication

### The Bridge Pattern

JavaScript and Webflow communicate via **Custom Events**:

```javascript
// JavaScript emits event
wfIx.emit('accordion-open');

// Webflow Interactions listens
Trigger: Custom Event → "accordion-open"
Animation: Your GSAP timeline
```

### Dual Event System

We emit events in two ways for maximum compatibility:

```javascript
// 1. Webflow IX (for GSAP animations)
wfIx.emit('event-name');

// 2. Window events (for JS listeners)
window.dispatchEvent(new CustomEvent('event-name'));
```

This ensures:
- Webflow animations always trigger
- JavaScript modules can listen to each other
- Fallback if Webflow IX unavailable

---

## Performance Optimizations

### 1. Throttled Updates
```javascript
// Bad: Updates on every mousemove (60+ times/sec)
document.addEventListener('mousemove', updateLabel);

// Good: Throttled with RAF (max once per frame)
let rafId;
document.addEventListener('mousemove', (e) => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => updateLabel(e));
});
```

### 2. CSS-Driven Animations
```css
/* JavaScript sets state */
.acc-item.is-open { }

/* CSS handles animation */
.acc-item {
  transition: max-height 280ms cubic-bezier(...);
}
```

### 3. Early Returns
```javascript
// Check requirements upfront
if (!element) return;
if (!element.dataset.value) return;

// Expensive operations only if needed
performExpensiveOperation();
```

---

## Accessibility Features

### Built into every module:

1. **ARIA Attributes**
   - `role="dialog"` on lightbox
   - `aria-expanded` on accordion triggers
   - `aria-hidden` on hidden content

2. **Keyboard Support**
   - Tab: Navigate focusable elements
   - Enter/Space: Activate buttons
   - Escape: Close modals
   - Focus trapping in lightbox

3. **Screen Reader Support**
   - Proper focus management
   - Focus restoration after modal close
   - Inert background content

4. **Reduced Motion**
   ```javascript
   const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
   if (prefersReduced) {
     // Disable or reduce animations
   }
   ```

---

## Webflow Integration Points

### 1. Custom Events in Interactions Panel

Create these in Webflow → Interactions → Custom:

**Accordion:**
- `acc-open` → Play timeline
- `acc-close` → Reverse timeline

**Lightbox:**
- `lb:open` → Fade in animation
- `lb:close` → Fade out animation

**Logo:**
- `logo-appear` → Show logo
- `logo-disappear` → Hide logo

### 2. Data Attributes

Add these in Webflow Designer:

**For lightbox triggers:**
```html
data-video="123456789"  <!-- Vimeo ID -->
data-title="Video Title"
```

### 3. CSS Variables

Webflow can override these:
```css
--lightbox-opacity: 0;
--lightbox-scale: 0.95;
```

---

## Debugging & Testing

### Check Module Status

```javascript
// In browser console

// Check if modules loaded
window.App.smoothScroll    // Smooth scroll instance
window._accordionRoot       // Accordion root element

// Test Webflow IX
const wfIx = window.Webflow?.require('ix3');
wfIx.emit('test-event');   // Should trigger animation

// Check for elements
document.querySelector('#lightbox');      // ✓ Lightbox exists
document.querySelector('.accordeon');     // ✓ Accordion exists
```

### Performance Profiling

1. Open Chrome DevTools → Performance
2. Start recording
3. Interact with page
4. Stop recording
5. Look for:
   - Long tasks (> 50ms)
   - Dropped frames
   - Excessive repaints

---

## Common Issues & Solutions

### GSAP animation not playing
**Solution:** Check event name matches exactly (case-sensitive)

### Accordion not animating correct items
**Solution:** Verify `.acc-animate-target` class is being added

### Lightbox video not loading
**Solution:** Check `data-video` has valid Vimeo ID

### Smooth scroll conflicting with snap
**Solution:** It auto-disables on snap pages (check console)

---

## The Development Workflow

### 1. Local Development
```bash
npm run dev
# Serves at http://127.0.0.1:3000/app.js
```

### 2. Webflow Integration
- Add script tag in Webflow footer
- Create Interactions in Webflow
- Add data attributes in Designer
- Style elements in Designer

### 3. Testing
- Check console for initialization logs
- Verify all ✓ checks pass
- Test keyboard navigation
- Check mobile/touch behavior
- Verify animations trigger

### 4. Production Build
```bash
npm run build
# Outputs minified dist/app.js
```

---

## Summary

This architecture separates concerns perfectly:

- **Webflow** = Visual Layer (what users see)
- **JavaScript** = Behavior Layer (what users do)
- **GSAP** = Motion Layer (how things move)

Each layer communicates via:
- Custom Events (JS → Webflow)
- Data Attributes (Webflow → JS)
- CSS Classes (JS → CSS)
- CSS Variables (JS → CSS)

The result: A maintainable, performant, accessible website where designers can work in Webflow without touching code, and developers can add functionality without breaking designs.

---

**Remember:** The code provides the skeleton and muscles, Webflow provides the skin and clothes, GSAP provides the graceful movement. Together, they create a living, breathing website. 🎨✨🚀
