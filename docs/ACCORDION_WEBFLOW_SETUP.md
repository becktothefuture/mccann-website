# Accordion Webflow GSAP Setup

## The Simplest Approach That Actually Works

After extensive testing, here's the most reliable way to set up accordion animations in Webflow:

### DOM Structure Required

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
  
  <!-- Can have nested accordions -->
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

### How It Works

1. **JavaScript adds `.is-active` class** to `.acc-list` panels when they open
2. **JavaScript removes `.is-active` class** when panels close
3. **JavaScript emits `acc-open` and `acc-close` events**
4. **Webflow GSAP targets `.is-active > .acc-item`** for animations

### Webflow GSAP Configuration

#### Opening Animation
1. **Add GSAP Timeline**
2. **Trigger**: Custom Event → `acc-open`
3. **Target**: Use selector `.is-active > .acc-item`
4. **Animation**:
   - Set initial state: Opacity 0, Y transform 20px
   - Animate to: Opacity 1, Y transform 0px
   - Stagger: 0.05s or 0.1s
   - Duration: 0.3s

#### Closing Animation  
1. **Add GSAP Timeline**
2. **Trigger**: Custom Event → `acc-close`
3. **Target**: Use selector `.is-active > .acc-item`
4. **Animation**:
   - Animate to: Opacity 0, Y transform -10px
   - Stagger: 0.05s
   - Duration: 0.2s

### Why This Works

- **Static selectors**: `.is-active > .acc-item` is evaluated when the event fires
- **No dynamic attributes**: Uses simple class presence
- **Clear hierarchy**: Child combinator `>` ensures only direct children animate
- **Webflow-friendly**: Works with how Webflow caches and evaluates selectors

### CSS Required

Add this to your Webflow custom CSS:

```css
.acc-list {
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.acc-list.is-active {
  overflow: visible;
}

.acc-trigger.is-active {
  /* Style for active trigger */
  font-weight: 600;
}

/* Initial state for items (GSAP will override) */
.acc-item {
  opacity: 1;
}
```

### Testing

1. **Publish to staging** (Designer has limitations)
2. **Open browser console**
3. **Click accordion triggers**
4. **Look for**: `[ACCORDION] Emitted via Webflow: acc-open`
5. **Check**: Only items in the opened panel should animate

### Common Issues

**Nothing animates**: Check that events are firing in console
**All items animate**: Your selector isn't specific enough - use `.is-active > .acc-item`
**Items stay hidden**: Remove any global GSAP initial states on `.acc-item`

### The Key Insight

Webflow's GSAP evaluates selectors at the moment the event fires. By using `.is-active > .acc-item`, we're targeting only the items that are children of the currently active panel. The JavaScript manages the `.is-active` class, and Webflow handles the animation.

This is simpler, more reliable, and works with Webflow's architecture rather than against it.
