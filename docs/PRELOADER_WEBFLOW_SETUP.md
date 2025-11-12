# Preloader Webflow Setup Guide

## Overview

The preloader prefetches all autoplay videos before the site content is displayed, showing the TruthWellTold signet with a subtle animation during loading. This ensures smooth video playback from the moment users see the page. **Additionally, the preloader includes a resize cover feature** that automatically appears during browser window resizing to prevent visual jank and maintain a polished user experience.

> **New:** `initPreloader` now accepts an optional `pageLoaders` map so you can define per-path loading strategies (e.g. skip Vimeo on lightweight subpages). See [Custom Page Loaders](#custom-page-loaders) below.

---

## Quick Start (TL;DR)

1. **Add HTML Embed** to beginning of `<body>` with preloader markup
2. **Add background videos** to your sections with `autoplay` attribute
3. **Done** - JavaScript handles everything else automatically

---

## Webflow Configuration

### 1. Add Preloader HTML Embed ⚠️ CRITICAL

Add this HTML Embed element **at the very beginning of your `<body>`** (before any other content):

**Location:** Project Settings → Custom Code → **Body Code (Beginning of `<body>`)**

```html
<!-- Preloader -->
<div id="preloader">
  <div class="preloader__content">
    <!-- TruthWellTold Signet (optimized SVG with currentColor) -->
    <div class="preloader__signet" role="img" aria-label="TruthWellTold logo">
      <svg viewBox="0 0 343 344" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_122_39680)">
          <path d="M171.91 8.22577e-05C78.07 -0.459918 -0.589998 77.1101 1.73482e-06 172.31H0.0800017C0.0900017 175.65 0.200002 178.96 0.400002 182.25H18.04C17.82 178.96 17.7 175.65 17.69 172.31H17.71C17 137.82 31.55 92.9501 63.74 61.9101V182.25H82.54V46.1201C126.03 14.6301 186.1 8.76008 234.93 31.0301V128.85H251.91V39.9601C262.38 46.3201 272.1 53.9401 280.76 62.5801V38.8701C251.11 14.5601 213.2 8.22577e-05 171.91 8.22577e-05Z" fill="currentColor"/>
          <path d="M265.54 217.87H214.86V307.09C214.86 307.09 288.05 282.3 288.05 238.64C288.05 224.08 278.01 217.87 265.54 217.87ZM269.21 244.52C264.29 261.18 249.8 273.86 233.12 280.79V234.25H261.5C268.4 234.25 271.12 238.09 269.21 244.52Z" fill="currentColor"/>
          <path d="M239.04 192.37H203.41V180.62H231.21V165.37H203.41V154.37H237.82V139.12H187.36V207.62H239.04V192.37Z" fill="currentColor"/>
          <path d="M248.07 139.26V207.76H290.9V192.51H264.68V139.26H248.07Z" fill="currentColor"/>
          <path d="M167.78 30.0405V98.6805C167.78 119.14 178.06 130.54 196.51 130.54C214.96 130.54 225.24 119.14 225.24 98.6805V40.3205C225.24 40.3205 216.73 37.1105 208.26 34.7205V104.59C208.26 111.46 204.05 115.29 196.51 115.29C188.97 115.29 184.74 111.45 184.74 104.59V30.5305C178.35 29.9205 172.19 29.9105 167.78 30.0405Z" fill="currentColor"/>
          <path d="M82.54 192.37H1.21997C1.85997 198.36 2.55997 202.9 3.56997 207.62H38.66V280.53C44.39 287.57 50.68 294.14 57.46 300.18V207.62H82.54V192.37Z" fill="currentColor"/>
          <path d="M160.33 179.9L142.93 152.73H132.93L115.42 179.91V139.12H98.37V207.62H115.42L137.5 174.11L160.33 207.62H177.39V139.12H160.33V179.9Z" fill="currentColor"/>
          <path d="M318.41 81.9497C314.02 75.6097 307.43 65.7897 301.43 58.9297V94.8897H280.75V80.7897C275.71 74.7497 270.33 69.1397 263.77 63.6397V127.73H280.75V110.42H301.43V127.73H318.41V81.9597V81.9497Z" fill="currentColor"/>
          <path d="M319.27 217.87C302.26 272.49 255.71 314.09 198.3 323.98V217.87H179.48V343.49C255.08 340.21 318.02 288.08 337.5 217.87H319.27Z" fill="currentColor"/>
          <path d="M324.75 192.51H314.66V139.26H298.03V207.76H339.96C341.03 202.75 341.88 197.67 342.5 192.51H324.75Z" fill="currentColor"/>
          <path d="M144.69 93.94C152.72 87.64 159.15 79.02 159.15 67.32C159.15 47.31 148.78 37.5 131.2 37.5C119.74 37.5 106.19 44.68 98.36 49.45V129.04H115.42V108.36C118.17 107.37 123.49 105.66 129.49 102.93L141.66 129.04H161.06L144.68 93.94H144.69ZM115.42 92.71V57C131.95 49.11 143.97 50.92 143.97 63.92C143.97 83.27 120.73 90.46 115.42 92.7" fill="currentColor"/>
          <path d="M121.41 217.13H121.28C90.84 217.2 73.76 238.39 73.76 276.11C73.76 313.83 90.86 335.02 121.28 335.09H121.41C151.85 335.02 168.93 313.83 168.93 276.11C168.93 238.39 151.83 217.2 121.41 217.13ZM121.41 317.25H121.28C103.2 317.18 93.13 302.45 93.13 276.11C93.13 249.77 103.21 235.04 121.28 234.97H121.41C139.49 235.04 149.56 249.77 149.56 276.11C149.56 302.45 139.48 317.18 121.41 317.25Z" fill="currentColor"/>
        </g>
        <defs>
          <clipPath id="clip0_122_39680">
            <rect width="342.5" height="343.49" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    </div>
    
    <!-- Progress indicator (optional, will show percentage) -->
    <div class="preloader__progress" role="status" aria-live="polite" aria-atomic="true">
      Loading...
    </div>
  </div>
</div>
```

**Important Notes:**
- The `#preloader` ID is CRITICAL - JavaScript finds the element by this ID
- The `.preloader__signet` class is where animation is applied
- The `.preloader__progress` class shows loading percentage (hidden by default, can be enabled via CSS)
- SVG uses `fill="currentColor"` to inherit text color for easy theming
- **Resize Cover**: The same preloader element is automatically used as a resize cover (no additional setup needed)

---

### 2. Add Background Videos

For any section where you want an autoplay background video:

1. **Add a Video element** to your section
2. **Set video source** (Webflow-hosted or external URL)
3. **Enable autoplay** in video settings
4. **Add attribute** `data-autoplay="true"` (or just rely on `autoplay` attribute)

**The preloader will automatically detect and prefetch ALL videos with:**
- `autoplay` attribute
- `data-autoplay` attribute  
- `data-wf-ignore` attribute (Webflow background videos)

**Example video element:**
```html
<video autoplay muted loop playsinline>
  <source src="your-video.mp4" type="video/mp4">
</video>
```

---

### 3. Customize Signet Color (Optional)

The signet inherits the text color (`currentColor`). To change its color, set the `color` CSS property on the preloader or signet:

**Option A: Via Webflow Style Panel**
1. Select `#preloader` element
2. Set **Typography → Color** to your desired color

**Option B: Via Custom CSS**
```css
#preloader {
  color: #000000; /* Black signet */
}

/* Or target the signet directly */
.preloader__signet {
  color: #333333; /* Dark gray signet */
}
```

---

## How It Works

### Loading Flow

```
[Page Load]
     ↓
Body gets class: .preloader-active (scroll locked)
     ↓
Preloader appears (full screen, off-white, centered signet)
     ↓
JavaScript finds all autoplay videos
     ↓
Videos prefetch in background (with progress indicator)
     ↓
Signet animates (subtle pulse or micro-jitter)
     ↓
All videos ready (or 10s timeout per video)
     ↓
Minimum display time: 1000ms (smooth UX, not jarring)
     ↓
Preloader fades out (600ms transition)
     ↓
Body class removed: .preloader-active (scroll unlocked)
     ↓
[Site Content Visible → Videos Play Smoothly]
```

### Animation Options

**Pulse Animation (Default)**
- Subtle opacity oscillation (0.8 to 1.0)
- Configurable cycle duration (default: 3 seconds)
- Smooth, organic feel using sine wave

**Resize Cover Feature**
- Automatically shows preloader during browser window resize
- Instant fade-in when resizing starts (no delay)
- Smooth fade-out when resizing stops (150ms default)
- Configurable delay before showing again (800ms default) to prevent flickering
- Logo stays centered during resize
- Respects `prefers-reduced-motion` (instant show/hide if enabled)

### Accessibility Features

✅ **Respects `prefers-reduced-motion`**
- Animations disabled for users who request reduced motion
- Preloader appears/disappears instantly

✅ **ARIA Attributes**
- Signet has `role="img"` with descriptive `aria-label`
- Progress indicator has `role="status"` with live updates

✅ **Keyboard Navigation**
- Preloader doesn't trap focus (no interactive elements)
- Site content accessible immediately after load

---

## Video Selectors Explained

The preloader looks for these video selectors by default:

```javascript
'video[data-wf-ignore], video[autoplay], video[data-autoplay]'
```

**What this matches:**
1. `video[data-wf-ignore]` → Webflow background videos (Designer adds this)
2. `video[autoplay]` → Any video with `autoplay` attribute
3. `video[data-autoplay]` → Custom attribute for manual control

**To customize video selector:**
```javascript
window.App.init({ 
  preloader: { 
    videoSelector: 'video.my-custom-class' 
  } 
});
```

---

## Customization Options

### JavaScript Configuration

All preloader options can be configured via `window.App.init()`:

```javascript
window.App.init({
  preloader: {
    // Element selectors
    selector: '#preloader',                                      // Preloader container
    videoSelector: 'video[autoplay], video[data-autoplay]',     // Videos to prefetch
    
    // Animation
    pulseDuration: 2400,                                         // Pulse cycle duration (ms) — sine wave loop
    pulseOpacity: 0.42,                                          // Legacy amplitude (0-1) — still supported for backwards compatibility
    pulseMinOpacity: 0.4,                                        // Minimum opacity for CSS pulse (0-1)
    
    // Timing
    minLoadTime: 1000,                                          // Minimum display time (ms)
    eventLeadMs: 100,                                           // Time before hide to emit load-completed (ms)
    
    // Resize Cover
    enableResizeCover: true,                                    // Enable resize cover (default: true)
    resizeFadeDuration: 150,                                    // Fade-out duration (ms, default: 150)
    resizeShowDelay: 800                                         // Delay before showing again (ms, default: 800)
  }
});
```

> Pulse animation is handled entirely in CSS. The options above simply update custom properties (`--pulse-duration`, `--pulse-min-opacity`) so the animation remains GPU-friendly and independent from JavaScript loops. Passing a `pulseDuration` value ≤ 10 interprets it as seconds (e.g. `pulseDuration: 1` → `1s`).

### CSS Customization

**Background Color:**
```css
#preloader {
  background-color: #ffffff; /* Pure white instead of off-white */
}
```

**Signet Size:**
```css
.preloader__signet {
  height: 15vh; /* Larger signet */
}
```

**Progress Text Style:**
```css
.preloader__progress {
  display: block; /* Show progress (hidden by default) */
  font-size: 1rem;
  color: #333333;
  font-weight: 400;
}
```

**Animation Speed (Pulse):**
```css
.preloader__signet {
  transition: transform 0.1s ease-out; /* Faster response */
}
```

---

## Troubleshooting

### Preloader Not Showing

**Check:**
1. Is `#preloader` element in the HTML? (Check Custom Code)
2. Is CSS file loaded? (Check browser DevTools → Network)
3. Any JavaScript errors? (Check browser Console)

### Videos Not Prefetching

**Check:**
1. Do videos have `autoplay` or `data-autoplay` attribute?
2. Are video URLs accessible? (Check Network tab for 404s)
3. Check console for `[PRELOADER] 🎬 Found X video(s)` message

### Preloader Showing Too Long

**Adjust timing:**
```javascript
window.App.init({ 
  preloader: { 
    minLoadTime: 500  // Reduce minimum display time
  } 
});
```

### Animation Not Working

**Check:**
1. Browser console for errors
2. CSS `will-change` support (check caniuse.com)
3. User has `prefers-reduced-motion` enabled? (animations disabled)

### Progress Not Updating

**Check:**
1. Is `.preloader__progress` element present?
2. Progress is hidden by default - enable via CSS: `.preloader__progress { display: block; }`
3. Check console for `[PRELOADER] ✓ Video X can play` messages
4. Videos might be loading too fast to see updates (good problem!)

---

## Performance Notes

### Video Timeout Safety

Each video has a **10-second timeout**. If a video takes longer than 10s to load, the preloader continues anyway (graceful degradation).

### Minimum Load Time

The preloader shows for **at least 1 second** (configurable) even if videos load instantly. This prevents jarring flashes and provides smooth UX.

### Failed Video Handling

If some videos fail to load, the preloader still completes successfully. Failed videos are logged to console but don't block the site.

**Console output example:**
```
[PRELOADER] ⚠️ Video 2 failed to load: NetworkError
[PRELOADER] ⚠️ 1 video(s) failed to load
[PRELOADER] ✓ 4/5 video(s) ready
```

### RAF Animation Performance

Both pulse and jitter animations use `requestAnimationFrame()` for 60fps smoothness. No setTimeout/setInterval used (per project performance rules).

---

## Browser Compatibility

✅ **Modern Browsers (2020+)**
- Chrome/Edge 80+
- Safari 13+
- Firefox 75+

✅ **Mobile Browsers**
- iOS Safari 13+
- Chrome Android 80+

⚠️ **Older Browsers**
- Preloader still works but may not animate
- Graceful degradation ensures site loads successfully

## Resize Cover Feature

The preloader includes an automatic resize cover that prevents visual jank during browser window resizing. This feature uses the same preloader element and requires no additional setup.

### How It Works

When the browser window is resized:
1. **Resize starts** → Preloader cover appears instantly (no fade-in delay)
2. **During resize** → Cover stays visible, logo remains centered
3. **Resize stops** → Cover fades out smoothly (150ms default)
4. **Quick re-resize** → If resizing starts again within 800ms, waits before showing again to prevent flickering

### Configuration

The resize cover is enabled by default. To customize:

```javascript
window.App.init({
  preloader: {
    enableResizeCover: true,      // Enable/disable resize cover (default: true)
    resizeFadeDuration: 150,      // Fade-out duration in ms (default: 150)
    resizeShowDelay: 800          // Delay before showing again in ms (default: 800)
  }
});
```

### Behavior Details

- **Instant appearance**: Cover appears immediately when resizing starts (no transition delay)
- **Smooth fade-out**: Fades out smoothly when resizing stops (configurable duration)
- **Smart delay**: Prevents flickering by delaying re-appearance if resize restarts quickly
- **Logo centering**: Logo stays perfectly centered during resize
- **Accessibility**: Respects `prefers-reduced-motion` (instant show/hide if enabled)
- **Performance**: Uses passive event listeners and requestAnimationFrame for smooth operation

### Disabling Resize Cover

To disable the resize cover feature:

```javascript
window.App.init({
  preloader: {
    enableResizeCover: false
  }
});
```

---

## Event API

The preloader emits two events during its lifecycle:

### 1. `load-completed` Event (100ms before hide)

This event fires **100ms before** the preloader disappears, perfect for triggering entrance animations:

**Via JavaScript:**
```javascript
window.addEventListener('load-completed', () => {
  console.log('Preloader about to hide! Start animations.');
  // Trigger your GSAP animations here
});
```

**Via Webflow IX3 Custom Event:**
1. In Webflow Designer, create a new Interaction
2. Set trigger to **Custom Event**
3. Event name: `load-completed`
4. Set action to **Play from beginning**
5. Add your animation timeline

### 2. `preloader:complete` Event (after removal)

This event fires **after** the preloader is fully removed from the DOM:

```javascript
window.addEventListener('preloader:complete', () => {
  console.log('Preloader finished! Videos ready.');
  // Initialize modules that depend on preloader being gone
});
```

**Event Timing:**
- `load-completed` → fires 100ms before hide (configurable via `eventLeadMs`)
- Preloader hide animation → 250ms (or instant if reduced motion)
- `preloader:complete` → fires after preloader is removed

**Use cases:**
- `load-completed`: Trigger entrance animations, start GSAP timelines
- `preloader:complete`: Initialize modules, analytics, post-load tasks

---

## Best Practices

### Video Optimization

1. **Compress videos** before upload (HandBrake, FFmpeg)
2. **Use web-optimized formats** (H.264 MP4, WebM)
3. **Keep videos short** (under 10-15s for loops)
4. **Use appropriate resolution** (1080p max for backgrounds)

### Hosting

1. **Webflow-hosted videos** are automatically optimized
2. **External CDN** (Cloudflare, AWS) for better performance
3. **Avoid large file sizes** (aim for under 5MB per video)

### UX Considerations

1. **Minimum load time** prevents jarring flashes (set to 1s+)
2. **Progress indicator** provides feedback for slow connections
3. **Animation** shows system is working (not frozen)
4. **Graceful failure** ensures site loads even if videos fail

---

## Migration from Existing Sites

If you already have a site with videos:

1. **Add preloader HTML** to beginning of `<body>`
2. **CSS is already included** in `style.css` (no changes needed)
3. **JavaScript auto-detects** existing videos (no markup changes)
4. **Test** on staging environment first

**That's it!** The preloader automatically finds and prefetches all autoplay videos.

---

## Advanced: Custom Video Detection

If you have custom video implementations (e.g., Vimeo backgrounds), extend the video selector:

```javascript
window.App.init({ 
  preloader: { 
    videoSelector: 'video[autoplay], iframe[src*="vimeo.com"]'
  } 
});
```

**Note:** iframes (Vimeo/YouTube) have different prefetch behavior. For best results, use native HTML5 `<video>` elements.

---

## Custom Page Loaders

The default homepage flow preloads HTML5 videos, primes Vimeo embeds, waits for slides, then hides the overlay. You can override that behaviour on a per-path basis without touching the module internals.

```js
initPreloader({
  pageLoaders: {
    '/case-study': async ({ helpers }) => {
      await helpers.prefetchVideos('video[data-case-study]');
      // No Vimeo preload on this lightweight page
    },
    default: async ({ helpers }) => {
      await helpers.prefetchVideos();
      await helpers.preloadVimeoVideos();
      await helpers.waitForSlidesBuilt();
      await helpers.waitForPreviewVideosPlaying();
    }
  }
});
```

How it works:

1. `initPreloader` normalises `window.location.pathname` (trims query/hash, collapses `/index` → `/`).
2. It builds a loader map by merging your `pageLoaders` with the built-in defaults.
3. The matching loader receives a context object (`videoSelector`, `projectData`, `helpers`, etc.) and returns a promise. The preloader waits for the promise before running its hide logic.

If you provide a non-function value, the preloader logs a warning and falls back to the built-in loader. Always include a `default` loader to catch any unmatched paths.

---

## Summary Checklist

- [ ] Add `#preloader` HTML embed to beginning of `<body>`
- [ ] Verify videos have `autoplay` attribute
- [ ] Test on localhost before deploying to Webflow
- [ ] Check browser console for loading messages
- [ ] Test with slow network throttling (DevTools)
- [ ] Verify animations work (or disable if `prefers-reduced-motion`)
- [ ] Confirm videos play smoothly after preloader hides
- [ ] (Optional) Customize colors, timing, animation style

---

## Support

**Console Logging**

The preloader logs detailed information to the browser console:

```
[PRELOADER] Module loaded
[PRELOADER] Initializing...
[PRELOADER] ✓ Elements found
[PRELOADER] 🎬 Found 3 video(s) to prefetch
[PRELOADER] ✓ Video 1 can play
[PRELOADER] ✓ Video 2 can play
[PRELOADER] ✓ Video 3 can play
[PRELOADER] ✓ 3/3 video(s) ready
[PRELOADER] ✓ Videos loaded in 2341ms
[PRELOADER] 🎯 Hiding preloader
[PRELOADER] ✓ Complete
```

Use these logs to debug issues and verify loading behavior.

---

**Questions or Issues?**

Check the browser console first - most issues are logged with clear error messages. For Webflow-specific questions, refer to Webflow's documentation on background videos and custom code embeds.

