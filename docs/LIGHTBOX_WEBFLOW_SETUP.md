# Lightbox Webflow Setup Guide

## Quick Start (TL;DR)

1. **In Webflow Style Panel:** Set `#lightbox` to `display: none` initially
2. **Create Custom Event `lb:open`:**
   - Step 1 (instant): Display none → flex
   - Step 2 (1s): Opacity 0→100%, Scale 0.95→1.0
3. **Create Custom Event `lb:close`:**
   - Step 1 (1s): Opacity 100→0%, Scale 1.0→0.95
   - Step 2 (instant at end): Display flex → none
4. **Add data attributes:** `data-field="lightbox-client"`, `data-field="lightbox-title"`, etc. to content elements
5. **Add data attributes:** `data-project="project-id"` to each `.slide`
6. **Sync durations:** Update `openDuration`/`closeDuration` in `/src/app.js`

---

## What Changed

The lightbox system has been refactored to:
- **Load project data dynamically from JSON** (`/src/data/project-data.json`)
- **Use a state machine** to prevent race conditions (IDLE → OPENING → OPEN → CLOSING)
- **Let GSAP animations handle ALL visibility** (display, opacity, transform)
- **Block interactions during transitions** to prevent rage clicking
- **Preload images** before opening to prevent layout shift

---

## Webflow Configuration Required

### 1. **Lightbox Structure** ✅

Ensure your `#lightbox` element has this structure:

```
#lightbox (ID: lightbox, Class: lightbox)
├── .lightbox__inner
│   ├── .letterbox-bar
│   │   └── .btn--close (Close button)
│   ├── .video-area (Vimeo videos mount here)
│   └── .letterbox-bar
│       └── .btn--details (For future use)
└── .lightbox__overlay
    └── section
        └── container (Content scrolls here)
```

### 2. **Content Injection Target Attributes** ⚠️ CRITICAL

Add these `data-field` attributes to elements inside the lightbox:

| Content Field | Data Attribute | Example Location |
|---------------|----------------|------------------|
| Client Name | `data-field="lightbox-client"` | Inside `.lightbox__inner` or overlay |
| Title | `data-field="lightbox-title"` | Inside `.lightbox__inner` or overlay |
| Truth | `data-field="lightbox-truth"` | Inside overlay content |
| Truth Well Told | `data-field="lightbox-truthwelltold"` | Inside overlay content |
| Description | `data-field="lightbox-description"` | Inside overlay content |
| Impact | `data-field="lightbox-impact"` | Inside overlay content |
| Awards Container | `data-field="lightbox-awards"` | Inside overlay content (container for awards) |
| Video Area | `.video-area` | Already exists ✓ (class, not data attribute) |

**Example:**
```html
<div class="lightbox__overlay">
  <section>
    <div class="container">
      <h2 data-field="lightbox-client">Client name goes here</h2>
      <h1 data-field="lightbox-title">Project title goes here</h1>
      <p data-field="lightbox-truth">Truth goes here</p>
      <p data-field="lightbox-truthwelltold">Truth well told goes here</p>
      <p data-field="lightbox-description">Description goes here</p>
      <p data-field="lightbox-impact">Impact goes here</p>
      <div data-field="lightbox-awards">
        <!-- Award elements will be shown/hidden here -->
      </div>
    </div>
  </section>
</div>
```

**Important:** These are `data-field` attributes, not IDs or classes!

### 2a. **Awards Structure** 🏆

For awards to display correctly, create award elements with these attributes:

```html
<div data-field="lightbox-awards">
  <!-- Award elements (hidden by default, shown based on project data) -->
  <div data-award-type="gold" style="display: none;">
    <img src="/award-gold-icon.svg" alt="Award">
    <span data-field="award-label">Award name here</span>
  </div>
  <div data-award-type="silver" style="display: none;">
    <img src="/award-silver-icon.svg" alt="Award">
    <span data-field="award-label">Award name here</span>
  </div>
  <!-- Add more award types as needed -->
</div>
```

**Award attributes:**
- `data-award-type="gold"` - Identifies the award type (must match JSON data)
- `data-field="award-label"` - Where the award text will be injected

### 2b. **Slide Content Attributes** 🎬

Each slide template should have these data attributes for content population:

```html
<div class="slide" data-project="project-id">
  <div class="slide__content">
    <h3 data-field="slide-client">Client name</h3>
    <h2 data-field="slide-title">Project title</h2>
    <div data-field="slide-preview">
      <!-- Vimeo preview video will mount here -->
    </div>
  </div>
</div>
```

**Slide attributes:**
- `data-field="slide-client"` - Client name text
- `data-field="slide-title"` - Project title text
- `data-field="slide-preview"` - Container for preview video

### 3. **Slide Triggers** ⚠️ CRITICAL

Each `.slide` element that should open the lightbox MUST have:

**Data Attribute:** `data-project="project-id"`

Example:
```html
<div class="slide" data-project="loreal-1">
  <!-- Slide content -->
</div>
```

The `data-project` value must match a key in `/src/data/project-data.json`.

❌ **Remove any Webflow click interactions from `.slide` elements** → JavaScript handles all click behavior

### 4. **Custom Events: `lb:open` and `lb:close`** ⚠️ CRITICAL

You need **TWO custom event interactions** in Webflow. GSAP will handle ALL visibility properties.

**📖 For detailed step-by-step Webflow instructions with screenshots, see:** [`WEBFLOW_ANIMATION_SETUP.md`](./WEBFLOW_ANIMATION_SETUP.md)

---

#### **Event 1: `lb:open` (Open Animation)**

**Setup in Webflow Interactions:**

1. Go to **Interactions** panel
2. Click **"+"** → **Custom Event**
3. **Name:** `lb:open` (case-sensitive!)

**Animation Timeline:**

```
Step 1 (Start, 0% progress - INSTANT):
  Target: #lightbox
  Action: Display → Flex (or Block)
  
Step 2 (Start, 0% progress - ANIMATED over 1s):
  Target: #lightbox
  Properties:
    - Opacity: 0% → 100%
    - Transform: Scale 0.95 → Scale 1.0
  Easing: Ease Out Quad (or your preference)
  Duration: 1s (1000ms)
```

**Detailed Steps:**

1. **Add Step 1 (instant):**
   - Click **"+"** on timeline at **0%**
   - Select `#lightbox` as target
   - Set **Display** → `Flex` (or `Block`)
   - This makes lightbox exist in DOM layout

2. **Add Step 2 (animated):**
   - Still at **0%** timeline position, add another action
   - Select `#lightbox` as target
   - Set **Opacity** → initial value: `0%`, final value: `100%`
   - Set **Transform → Scale** → initial: `0.95`, final: `1.0`
   - Set **Duration** to `1s` (or your preference)
   - Set **Easing** to your preference (Ease Out Quad recommended)

3. **Settings:**
   - **Control:** "Play from beginning"
   - **Start delay:** None
   - **Duration:** 1000ms (note this for JavaScript config!)

---

#### **Event 2: `lb:close` (Close Animation)**

**Setup in Webflow Interactions:**

1. Go to **Interactions** panel
2. Click **"+"** → **Custom Event**
3. **Name:** `lb:close` (case-sensitive!)

**Animation Timeline:**

```
Step 1 (Start, 0% progress - ANIMATED over 1s):
  Target: #lightbox
  Properties:
    - Opacity: 100% → 0%
    - Transform: Scale 1.0 → Scale 0.95
  Easing: Ease In Quad (or your preference)
  Duration: 1s (1000ms)

Step 2 (End, 100% progress - INSTANT):
  Target: #lightbox
  Action: Display → None
```

**Detailed Steps:**

1. **Add Step 1 (animated):**
   - Click **"+"** on timeline at **0%**
   - Select `#lightbox` as target
   - Set **Opacity** → initial value: `100%`, final value: `0%`
   - Set **Transform → Scale** → initial: `1.0`, final: `0.95`
   - Set **Duration** to `1s` (or your preference)
   - Set **Easing** to your preference (Ease In Quad recommended)

2. **Add Step 2 (instant):**
   - Click **"+"** on timeline at **100%** (END of animation)
   - Select `#lightbox` as target
   - Set **Display** → `None`
   - This removes lightbox from render tree when closed

3. **Settings:**
   - **Control:** "Play from beginning"
   - **Start delay:** None
   - **Duration:** 1000ms (note this for JavaScript config!)

#### **SYNC ANIMATION DURATIONS** ⏱️

In `/src/app.js`, update these values to match your Webflow animation durations:

```javascript
initLightbox({ 
  root: '#lightbox', 
  openDuration: 1000,   // ← Match 'lb:open' animation duration
  closeDuration: 1000   // ← Match 'lb:close' animation duration
});
```

**Example:** If your Webflow animations are 1.5 seconds, set both to `1500`.

### 5. **Initial State of `#lightbox`** ⚠️ IMPORTANT

Set these on `#lightbox` in Webflow's **Style Panel** (not in animations):

**Required Initial Styles:**
- ✅ **Display:** `None` (lightbox hidden on page load)
- ✅ **Position:** `Fixed` (already set)
- ✅ **Z-index:** `9999` (or higher than other elements)

**DO NOT set these (GSAP will control them):**
- ❌ Opacity (GSAP animates from 0 → 1)
- ❌ Transform/Scale (GSAP animates this)
- ❌ Visibility property (not needed)

**DO NOT add these interactions:**
- ❌ Click interactions on `#lightbox` itself
- ❌ Page load interactions on `#lightbox`
- ❌ Any other triggers besides the custom events

**Why this setup?** 
- Initial `display: none` hides it on load
- GSAP `lb:open` changes it to `display: flex` and animates in
- GSAP `lb:close` animates out and returns to `display: none`
- JavaScript manages state and triggers the animations

### 6. **Close Button**

The close button MUST have:
- ✅ **ID:** `close-btn` (set in Webflow Settings → ID field)
- ❌ **No Webflow click interactions** → JavaScript handles closing

**Close triggers:**
- `#close-btn` click
- `Escape` key press
- (Backdrop clicks are disabled for better UX)

### 7. **CSS** (Already Done ✅)

The CSS is minimal - only sets baseline positioning:

```css
.lightbox {
  position: fixed !important;
  inset: 0; 
  z-index: 9999;
  /* GSAP animations handle ALL visibility */
}
```

**All visibility, interactions, and pointer-events are controlled by your Webflow GSAP animations!**

---

## Visibility Architecture

**GSAP handles ALL visibility** (display, opacity, transform, pointer-events) - consistent with your existing animations  
**CSS is minimal** - only sets baseline positioning  
**JavaScript manages state machine** and triggers animations

### **Why This Approach:**

1. ✅ **Consistency** - Matches your existing Webflow GSAP animation patterns
2. ✅ **Single source of truth** - GSAP controls all visual aspects and interactions
3. ✅ **Clean separation** - CSS minimal, GSAP handles everything visual
4. ✅ **Performance** - GSAP sets `display: none` when closed (removes from render tree)
5. ✅ **Webflow-friendly** - Everything visual is in Webflow interactions

### **Timeline Flow:**

```
[Initial State: display: none (set in Webflow style)]
         ↓
    User clicks slide
         ↓
JS: setState("opening") → blocks pointer-events
         ↓
JS: injectContent() → populates text, images, video
         ↓
JS: waitForImages() → ensures images decoded
         ↓
JS: emitWebflowEvent('lb:open')
         ↓
GSAP Step 1 (instant): display: none → flex
GSAP Step 2 (1s): opacity: 0→1, scale: 0.95→1.0
         ↓
1000ms later (animation complete)
         ↓
JS: finishOpen() → setState("open") → enables pointer-events
         ↓
[Lightbox fully open and interactive]
         ↓
    User clicks close / Escape / outside
         ↓
JS: setState("closing") → blocks pointer-events
         ↓
JS: emitWebflowEvent('lb:close')
         ↓
GSAP Step 1 (1s): opacity: 1→0, scale: 1.0→0.95
GSAP Step 2 (instant at end): display: flex → none
         ↓
1000ms later (animation complete)
         ↓
JS: finishClose() → setState("idle") → ready to open again
         ↓
[Back to initial state: display: none]
```

**Key Benefits:**
- GSAP has full control over ALL visual aspects - easy to adjust entirely in Webflow
- State machine prevents race conditions during transitions
- Content loads and images decode before animation starts
- CSS is minimal and focused - only baseline positioning

---

## Project Data JSON Structure

**Project data is bundled directly into `app.js`** - no external JSON file needed!

Edit projects in `/src/data/project-data.json` and rebuild:

```json
{
  "project-id": {
    "client": "Client Name",
    "title": "Project Title",
    "truth": "A sentence about truth",
    "truthWellTold": "A sentence about truth well told",
    "description": "Long form description text...",
    "impact": "Achieved 50% increase in brand awareness",
    "vimeoId": "123456789",
    "vimeoPreviewId": "987654321",
    "awards": [
      { "type": "gold", "label": "Gold Lion - Cannes" },
      { "type": "silver", "label": "Silver Pencil - D&AD" }
    ]
  }
}
```

**Fields:**
- `client` (string): Client name
- `title` (string): Project title
- `truth` (string): Truth statement
- `truthWellTold` (string): Truth well told statement
- `description` (string): Long description
- `impact` (string): Impact statement or metric
- `vimeoId` (string): Vimeo video ID for lightbox (numbers only)
- `vimeoPreviewId` (string): Vimeo video ID for slide preview (numbers only)
- `awards` (array): Array of award objects with `type` and `label`:
  ```json
  "awards": [
    { "type": "gold", "label": "Gold Award Name" },
    { "type": "silver", "label": "Silver Award Name" }
  ]
  ```

**Important:** After editing `src/data/project-data.json`, run `npm run build` to bundle the changes into `app.js`

---

## Testing Checklist

After configuring in Webflow:

1. ✅ Click a `.slide` → lightbox opens with correct content
2. ✅ Animation plays smoothly (check duration matches JS config)
3. ✅ Images load before lightbox opens
4. ✅ Vimeo video plays automatically
5. ✅ Click `#close-btn` → animation plays → lightbox closes
6. ✅ Press Escape key → closes
7. ✅ Backdrop clicks do NOT close (intentional for better UX)
8. ✅ Cannot spam-click during opening/closing transitions
9. ✅ Scroll is locked on `.perspective-wrapper` when open
10. ✅ Focus returns to trigger slide when closed
11. ✅ Console shows validation messages (open DevTools)

---

## Console Validation Messages

When you load the page, check the console for:

```
[LIGHTBOX] Module loaded
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 LIGHTBOX SETUP VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Main Container
   ✓ Found: #lightbox
   ✓ State machine initialized: idle
   ⏱️  Open duration: 1000ms
   ⏱️  Close duration: 1000ms

2️⃣  Content Injection Targets
   ✓ [data-field="lightbox-client"]
   ✓ [data-field="lightbox-title"]
   ✓ [data-field="lightbox-truth"]
   ✓ [data-field="lightbox-truthwelltold"]
   ✓ [data-field="lightbox-description"]
   ✓ [data-field="lightbox-impact"]
   ✓ [data-field="lightbox-awards"]
   ...

3️⃣  Slide Triggers
   ✓ Found: X .slide elements
   ℹ️  Validation will run after JSON data loads

4️⃣  Webflow IX Setup
   ✓ Webflow IX3 detected
   📋 Required Custom Events:
      • "lb:open" → triggers open animation
      • "lb:close" → triggers close animation

✅ VALIDATION COMPLETE

[LIGHTBOX] ✓ Loaded X projects from JSON
[LIGHTBOX] ✓ Valid slides: X/X
```

**If you see warnings:**
- ⚠️ Check that all content target elements have correct `data-field` attributes
- ⚠️ Check that slides have `data-project` attributes
- ⚠️ Check that project IDs match JSON keys

---

## Common Issues

### **Lightbox doesn't open**
- Check console for errors
- Verify `.slide` has `data-project` attribute
- Verify project ID exists in JSON
- Check that custom event `lb:open` is configured in Webflow

### **Animation doesn't play**
- Check that Webflow IX3/IX2 is available (publish site)
- Verify custom events are named exactly `lb:open` and `lb:close` (case-sensitive)
- Check that target is `#lightbox` element

### **Content doesn't show**
- Check that content target elements have `data-field` attributes
- Verify JSON data structure matches expected format
- Check console for "Content injected" message

### **Images don't load**
- Check image URLs in JSON are absolute paths or correct relative paths
- Check console for "All images loaded" message
- Verify network requests in DevTools

### **Scroll doesn't lock**
- Check that `.perspective-wrapper` exists on page
- Falls back to body scroll lock if wrapper not found

---

## State Machine Flow

```
IDLE (closed, ready to open)
  ↓ [click slide]
OPENING (loading content, playing open animation)
  ↓ [animation completes → finishOpen()]
OPEN (fully visible, interactive)
  ↓ [close button / Escape / click outside]
CLOSING (playing close animation)
  ↓ [animation completes → finishClose()]
IDLE (back to start)
```

**Interactions are blocked during OPENING and CLOSING states** to prevent race conditions.

---

## Next Steps

After you've configured everything in Webflow:

1. Add your actual project data to `/src/data/project-data.json`
2. Add `data-project` attributes to all your `.slide` elements
3. Test each slide to ensure correct content loads
4. Adjust animation durations in Webflow and sync to `src/app.js`
5. Style the content injection targets using their classes or the `[data-field]` attribute selectors

Need help? Check the console for validation messages and warnings! 🎯

