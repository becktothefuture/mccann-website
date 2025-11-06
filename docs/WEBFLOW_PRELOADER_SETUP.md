# Webflow Preloader Setup Guide

## 📋 Overview

The preloader **works automatically** on every page once you add the HTML structure. It:
1. ✅ Detects all autoplay videos (HTML5 + Vimeo)
2. ✅ Preloads them before showing content
3. ✅ Displays the TruthWellTold signet with subtle animation
4. ✅ Hides automatically when loading is complete
5. ✅ Requires **zero JavaScript configuration** - it's already set up!

---

## 🎯 How It Works Automatically

### Initialization Flow

```
1. Page loads → app.js loads
2. DOMContentLoaded fires
3. app.js calls initPreloader() automatically
4. Preloader finds #preloader element
5. Scans for videos with selectors:
   - video[data-wf-ignore]
   - video[autoplay]
   - video[data-autoplay]
6. Preloads HTML5 videos
7. Preloads Vimeo videos from project-data.json
8. Shows progress (0% → 100%)
9. Hides preloader with lift-off animation
10. Unlocks scroll
```

### Key Points

- **No manual JavaScript calls needed** - `app.js` initializes automatically
- **Works on every page** - just add the HTML structure
- **Graceful degradation** - if preloader element missing, site still works
- **Respects prefers-reduced-motion** - animations disabled for accessibility

---

## 📝 Step-by-Step: Setup on Every Page

### Step 1: Add Preloader HTML to Page Settings

**In Webflow Designer:**

1. Open **Page Settings** (cog icon) for any page
2. Go to **Custom Code** tab
3. Add to **Before </body> tag**:

```html
<!-- PRELOADER (Must be before closing </body> tag) -->
<div id="preloader">
  <div class="preloader__content">
    <!-- TruthWellTold Signet -->
    <div class="preloader__signet" role="img" aria-label="TruthWellTold logo">
      <svg viewBox="0 0 343 344" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_122_39680)">
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
    
    <!-- Progress Indicator -->
    <div class="preloader__progress" role="status" aria-live="polite" aria-atomic="true">
      Loading...
    </div>
  </div>
</div>
```

**⚠️ Important:**
- Add this to **EVERY page** that needs the preloader
- Or add to **Site Settings → Custom Code → Before </body> tag** to apply site-wide
- The `#preloader` ID is **critical** - JavaScript finds it by this ID
- Keep the exact class names: `.preloader__content`, `.preloader__signet`, `.preloader__progress`

---

### Step 2: Tag Videos for Detection

The preloader automatically finds videos using these selectors:
- `video[data-wf-ignore]`
- `video[autoplay]`
- `video[data-autoplay]`

#### For Webflow Background Videos:

1. Select your video element in Webflow
2. In **Settings** panel, add **Custom Attribute**:
   - **Name:** `data-wf-ignore`
   - **Value:** `true` (or leave empty)

**OR** add `autoplay` attribute:
- **Name:** `autoplay`
- **Value:** (leave empty, just presence matters)

#### For Vimeo Videos:

Vimeo videos are loaded from `project-data.json`. No additional tagging needed - they're detected automatically if they exist in your project data.

---

### Step 3: Link Compiled JavaScript & CSS

**In Webflow Site Settings:**

1. Go to **Site Settings → Custom Code**
2. Add to **Footer Code** (before `</body>`):

```html
<!-- Load compiled CSS -->
<link rel="stylesheet" href="https://your-domain.com/dist/style.css">

<!-- Load compiled JavaScript -->
<script src="https://your-domain.com/dist/app.js"></script>
```

**Replace `your-domain.com`** with your actual domain.

**Alternative:** If you're hosting on Webflow, upload files to:
- `https://your-site.webflow.io/dist/style.css`
- `https://your-site.webflow.io/dist/app.js`

Then reference them in Custom Code.

---

### Step 4: Verify Setup

**Check in Browser Console:**

1. Open any page with preloader
2. Open DevTools (F12)
3. Check console for:

```
╔══════════════════════════════════════════════════════╗
║     McCann Website - Initialization Starting        ║
╚══════════════════════════════════════════════════════╝

[PRELOADER] Module loaded
[PRELOADER] ✓ Elements found
[PRELOADER] Animation: Jitter mode
[PRELOADER] 🎬 Found X video(s)
[PRELOADER] ✓ All media loaded in XXXms

╔══════════════════════════════════════════════════════╗
║     ✅ All Systems Initialized Successfully         ║
╚══════════════════════════════════════════════════════╝
```

**If you see errors:**
- `[PRELOADER] ❌ Preloader element not found` → HTML not added correctly
- `[PRELOADER] ❌ Signet element not found` → SVG structure missing
- No console output → `app.js` not loading

---

## 🎨 Customization (Optional)

### Change Animation Mode

By default, preloader uses **jitter animation** (60Hz micro-movement). To change:

**In Webflow Custom Code, after `app.js` loads:**

```html
<script>
  // Override preloader settings
  window.App.init({
    preloader: {
      useJitter: false,        // Use pulse instead of jitter
      jitterSpeed: 60,         // Animation speed (Hz)
      jitterDistance: 1.5,     // Movement distance (px)
      jitterPattern: 'circular', // 'circular', 'figure8', 'orbital', etc.
      minLoadTime: 1000,       // Minimum display time (ms)
      showDebugLog: false,     // Hide debug log (default: true)
      vimeoPreload: 'prefetch' // 'none', 'prefetch', 'prebuffer'
    }
  });
</script>
```

**Note:** If you override, you need to call `window.App.init()` manually. Otherwise, defaults are used automatically.

---

## 🔧 How It Detects Videos

### HTML5 Videos

The preloader scans for:
```javascript
'video[data-wf-ignore], video[autoplay], video[data-autoplay]'
```

**Add one of these attributes to your video:**
- `data-wf-ignore="true"` (recommended for Webflow)
- `autoplay` (standard HTML5)
- `data-autoplay` (custom)

### Vimeo Videos

Vimeo videos are loaded from `src/data/project-data.json`:

```json
{
  "project1": {
    "vimeoId": "123456789"
  },
  "project2": {
    "vimeoId": "987654321"
  }
}
```

The preloader:
1. Reads `project-data.json`
2. Extracts all `vimeoId` values
3. Preloads them using prefetch hints (lightweight) or prebuffers (aggressive)

**No manual tagging needed** - it's automatic based on project data!

---

## 📊 Preloader Behavior

### What Gets Preloaded

1. **HTML5 Videos:**
   - All `<video>` elements with `data-wf-ignore`, `autoplay`, or `data-autoplay`
   - Uses `video.load()` and `canplaythrough` event
   - Shows progress (0% → 100%)

2. **Vimeo Videos:**
   - All videos from `project-data.json`
   - Strategy: `prefetch` (lightweight) or `prebuffer` (aggressive)
   - Shows in progress but doesn't block completion

### Timing

- **Minimum display time:** 1000ms (1 second)
- **Maximum time:** Until all videos are ready
- **Graceful degradation:** If videos fail, preloader hides after minimum time

### Animation

- **Default:** Jitter animation (60Hz micro-movement, 1.5px distance)
- **Alternative:** Pulse animation (opacity 0.8 → 1.0)
- **Exit:** Lift-off animation (scale + blur + fade)

---

## 🚀 Site-Wide Setup (Recommended)

**Instead of adding HTML to each page individually:**

1. Go to **Site Settings → Custom Code**
2. Add preloader HTML to **Before </body> tag**
3. Add CSS/JS links to **Footer Code**

**Result:** Preloader appears on **every page automatically**!

---

## ✅ Checklist

- [ ] Preloader HTML added to page/site settings
- [ ] `#preloader` ID present
- [ ] `.preloader__signet` class present with SVG
- [ ] `.preloader__progress` class present
- [ ] Videos tagged with `data-wf-ignore` or `autoplay`
- [ ] `dist/style.css` linked in Footer Code
- [ ] `dist/app.js` linked in Footer Code
- [ ] Console shows initialization messages
- [ ] Preloader appears on page load
- [ ] Preloader hides after videos load

---

## 🐛 Troubleshooting

### Preloader Doesn't Appear

**Check:**
1. HTML added to page/site settings?
2. `#preloader` ID correct?
3. CSS file loading? (check Network tab)
4. JavaScript file loading? (check Network tab)
5. Console errors?

### Videos Not Detected

**Check:**
1. Video has `data-wf-ignore`, `autoplay`, or `data-autoplay` attribute?
2. Attribute value correct? (empty or `true`)
3. Console shows `[PRELOADER] 🎬 Found X video(s)`?

### Preloader Never Hides

**Check:**
1. Videos actually loading? (check Network tab)
2. `canplaythrough` events firing? (check console)
3. Minimum time (1000ms) elapsed?
4. Try increasing `minLoadTime` in config

### Animation Not Working

**Check:**
1. CSS file loading?
2. Console shows `[PRELOADER] Animation: Jitter mode`?
3. No JavaScript errors?
4. `prefers-reduced-motion` disabled? (check in DevTools)

---

## 📚 Related Documentation

- `docs/VIMEO_PRELOADING_GUIDE.md` - Vimeo preloading strategies
- `docs/JITTER_PRESETS.md` - Jitter animation presets
- `docs/OSCILLATION_PRESETS.md` - Advanced oscillation patterns
- `docs/SVG_RENDERING_OPTIMIZATION.md` - SVG rendering optimizations

---

## 🎯 Summary

**To enable preloader on every page:**

1. ✅ Add HTML structure to Site Settings → Custom Code (Before </body>)
2. ✅ Tag videos with `data-wf-ignore` attribute
3. ✅ Link `dist/style.css` and `dist/app.js` in Footer Code
4. ✅ That's it! Preloader works automatically

**No JavaScript configuration needed** - it's all handled by `app.js` automatically!

