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

1. **JavaScript adds `.acc-animate-target` class** to `.acc-item` elements that should animate
2. **JavaScript emits `acc-open` and `acc-close` events** via Webflow IX3
3. **Webflow GSAP targets `.acc-animate-target`** for animations
4. **JavaScript removes `.acc-animate-target` class** after animation completes

### Webflow GSAP Configuration

#### Opening Animation
1. **Add GSAP Timeline**
2. **Trigger**: Custom Event → `acc-open`
3. **Target**: Use selector `.acc-animate-target`
4. **Animation**:
   - Set initial state: Opacity 0, Y transform 20px
   - Animate to: Opacity 1, Y transform 0px
   - Stagger: 0.05s or 0.1s
   - Duration: 0.3s

#### Closing Animation  
1. **Add GSAP Timeline**
2. **Trigger**: Custom Event → `acc-close`
3. **Target**: Use selector `.acc-animate-target`
4. **Animation**:
   - Animate to: Opacity 0, Y transform -10px
   - Stagger: 0.05s
   - Duration: 0.2s

### Why This Works

- **Class-based targeting**: `.acc-animate-target` is a simple class selector that Webflow handles well
- **Dynamic class addition**: JavaScript adds the class only to items that should animate
- **Clean separation**: Animation targets are marked explicitly, not inferred from structure
- **Webflow-friendly**: Class selectors are the most reliable way to target elements in Webflow GSAP

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

**Nothing animates**: Check that events are firing in console and `.acc-animate-target` class is being added
**All items animate**: Make sure you're using `.acc-animate-target` selector, not `.acc-item`
**Items stay hidden**: Remove any global GSAP initial states on `.acc-item`
**Debug functions not available**: The accordion must initialize first - wait for page load

### The Key Insight

Webflow's GSAP works best with simple class selectors. By using `.acc-animate-target`, we're explicitly marking which items should animate at any given moment. The JavaScript manages adding/removing this class to the right items, and Webflow handles the animation. 

This approach avoids complex selectors and dynamic attributes that Webflow struggles with, resulting in reliable, predictable animations.
