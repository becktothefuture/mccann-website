# Lightbox Validation Reference

## Overview

The lightbox module now includes comprehensive element validation with detailed console logging. This document explains what elements are checked and what the console output means.

## Expected Console Output on Page Load

```
[LIGHTBOX] ✓ Loaded 12 projects from slides module

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 LIGHTBOX SETUP VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Main Container & Structure
   ✓ Found: #lightbox
   ✓ State machine initialized: idle
   ⏱️  Open duration: 1000ms (must match Webflow 'lb:open' animation)
   ⏱️  Close duration: 1000ms (must match Webflow 'lb:close' animation)
   ✓ .lightbox__inner found
   ✓ .lightbox__overlay found (details overlay container)
   ✓ .video-area found

2️⃣  Content Injection Targets
   ✓ #lightbox-client
   ✓ #lightbox-title
   ⚠️  #lightbox-truth NOT found (optional)
   ⚠️  #lightbox-truthwelltold NOT found (optional)
   ✓ #lightbox-description
   ✓ #lightbox-awards

3️⃣  Interactive Elements
   ✓ #close-btn found

4️⃣  Slide Triggers & Links
   ✓ Found: 12 .slide elements
   ✓ 12/12 slides have .slide__link

[LIGHTBOX] ✓ Valid slides: 12/12

5️⃣  Webflow IX Setup
   ✓ Webflow IX3 detected

   📋 Required Custom Events in Webflow:
      • "lb:open" → triggers open animation
      • "lb:close" → triggers close animation
      • Durations MUST match: open=1000ms, close=1000ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VALIDATION COMPLETE - All critical elements found

⚠️  2 warnings:
   • #lightbox-truth missing
   • #lightbox-truthwelltold missing

[LIGHTBOX] ✓ Attached click handlers to 12 .slide__link elements
[LIGHTBOX] ✓ Initialized and ready
```

## Validation Categories

### 1️⃣ Main Container & Structure

**Critical Elements:**
- `#lightbox` - Main lightbox container
- `.lightbox__inner` - Inner wrapper for focus management
- `.lightbox__overlay` - Scrollable content area
- `.video-area` - Vimeo video container

### 2️⃣ Content Injection Targets

**Required:**
- `#lightbox-client` - Client name
- `#lightbox-title` - Project title
- `#lightbox-description` - Project description
- `#lightbox-awards` - Awards container

**Optional:**
- `#lightbox-truth` - Truth statement (McCann-specific)
- `#lightbox-truthwelltold` - Truth well told tagline (McCann-specific)

### 3️⃣ Interactive Elements

**Required:**
- `#close-btn` - Close button

### 4️⃣ Slide Triggers & Links

**Required Structure:**
```html
<div class="slide" data-project="project-id">
  <a class="slide__link">
    <div class="slide__preview"></div>
    <!-- Other content -->
  </a>
</div>
```

The validation will:
- Count total `.slide` elements
- Check each slide has a `.slide__link` child
- Report any slides missing the link element
- Log which slide indices are missing links

### 5️⃣ Webflow IX Setup

**Required Custom Events:**
- `lb:open` - Triggers open animation (1000ms duration)
- `lb:close` - Triggers close animation (1000ms duration)

## Error Types

### ❌ Critical Errors (Will Log as Failed)

These will cause the lightbox to malfunction:
- Missing `#lightbox` container
- Missing `.lightbox__inner`
- Missing `.video-area`
- Missing required content targets
- Missing `#close-btn`
- No `.slide` elements found

### ⚠️ Warnings (Non-Critical)

These are logged but won't break functionality:
- Missing `.lightbox__overlay` (details overlay will not scroll independently)
- Missing optional content targets (`#lightbox-truth`, `#lightbox-truthwelltold`)
- Slides missing `.slide__link` (those slides won't be clickable)
- Webflow IX not detected (animations won't work)

## Expected Open/Close Logs

### Opening Lightbox

```
[LIGHTBOX] State: opening
[LIGHTBOX] 🚫 Slide links disabled
[LIGHTBOX] 📝 Injecting content for: Project Title
[LIGHTBOX] ⏳ Loading 3 images...
[LIGHTBOX] ✓ All images loaded
[LIGHTBOX] ✓ Content injected
🎬 [LIGHTBOX] Triggered animation: "lb:open"
[LIGHTBOX] ✓ Open animation complete
[LIGHTBOX] State: open
[LIGHTBOX] ✓ Overlay native scrolling enabled
```

### Closing Lightbox

```
[LIGHTBOX] 🎯 Close button clicked
[LIGHTBOX] State: closing
🎬 [LIGHTBOX] Triggered animation: "lb:close"
[LIGHTBOX] ✓ Close animation complete
[LIGHTBOX] ✓ Scroll unlocked
[LIGHTBOX] ✓ Slide links re-enabled
[LIGHTBOX] State: idle
```

## Troubleshooting

### Missing Element Errors

If you see `❌ VALIDATION FAILED`, check:
1. Element IDs match exactly (case-sensitive)
2. Elements exist in the DOM before `initLightbox()` is called
3. Elements are not hidden by Webflow IX initial states (they can be invisible but must exist in DOM)

### Missing .slide__link

If you see `⚠️ Missing .slide__link in slide indices: 0, 3, 5`:
1. Add `<a class="slide__link">` wrapper inside each `.slide`
2. The link should wrap the entire clickable area
3. The parent `.slide` must have `data-project="project-id"`

### Animation Timing Mismatches

If the lightbox feels broken after opening/closing:
1. Check Webflow IX animation durations match code (1000ms)
2. Verify custom event names are exactly `lb:open` and `lb:close`
3. Ensure animations complete before next interaction

## CSS Classes Applied by Code

### State Management

```css
.slide__link.is-disabled {
  pointer-events: none;
  cursor: default;
  opacity: 0.6;
}
```

Applied during lightbox open/close transitions to prevent double-clicks.

### Scroll Lock

```css
.perspective-wrapper.modal-open {
  overflow: hidden;
}
```

Applied when lightbox is open to prevent background scrolling.

## Updated Click Behavior

**Previous:** Clicking anywhere on `.slide` opened the lightbox
**Now:** Only clicking `.slide__link` opens the lightbox

This provides better control over clickable areas and allows for nested interactive elements within slides (like separate buttons, etc).

