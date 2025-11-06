# Preloader Quick Start Guide

## 🚀 **3 Steps to Enable Preloader on All Pages**

### Step 1: Add HTML to Webflow

**Go to:** Site Settings → Custom Code → **Before </body> tag**

**Copy & paste:** Open `webflow-preloader-snippet.html` and copy the entire HTML block into Webflow.

**Result:** Preloader HTML is now on every page!

---

### Step 2: Tag Your Videos

**For each video element in Webflow:**

1. Select the video
2. Open **Settings** panel
3. Add **Custom Attribute**:
   - **Name:** `data-wf-ignore`
   - **Value:** `true` (or leave empty)

**That's it!** The preloader will automatically detect and preload all tagged videos.

---

### Step 3: Link CSS & JavaScript

**Go to:** Site Settings → Custom Code → **Footer Code**

**Add these lines** (replace `your-domain.com` with your actual domain):

```html
<!-- Load compiled CSS -->
<link rel="stylesheet" href="https://your-domain.com/dist/style.css">

<!-- Load compiled JavaScript -->
<script src="https://your-domain.com/dist/app.js"></script>
```

---

## ✅ **Done!**

The preloader now:
- ✅ Appears on every page automatically
- ✅ Detects and preloads all tagged videos
- ✅ Shows progress (0% → 100%)
- ✅ Hides when loading is complete
- ✅ Works with HTML5 videos and Vimeo videos
- ✅ Requires **zero JavaScript configuration**

---

## 🎯 **How It Works**

1. **Page loads** → `app.js` initializes automatically
2. **Preloader appears** → Shows TruthWellTold signet
3. **Videos detected** → Scans for `video[data-wf-ignore]`
4. **Videos preloaded** → Progress updates (0% → 100%)
5. **Preloader hides** → Beautiful lift-off animation
6. **Page unlocked** → Scroll enabled, content visible

**All automatic - no code needed!**

---

## 🐛 **Troubleshooting**

### Preloader doesn't appear?
- ✅ Check HTML is in Site Settings → Before </body> tag
- ✅ Check `#preloader` ID is present
- ✅ Check CSS/JS files are loading (Network tab in DevTools)

### Videos not detected?
- ✅ Check videos have `data-wf-ignore` attribute
- ✅ Check console for `[PRELOADER] 🎬 Found X video(s)`

### Preloader never hides?
- ✅ Check videos are actually loading (Network tab)
- ✅ Check console for errors
- ✅ Minimum display time is 1000ms (1 second)

---

## 📚 **Full Documentation**

See `docs/WEBFLOW_PRELOADER_SETUP.md` for complete setup guide with:
- Detailed explanations
- Customization options
- Advanced configuration
- Troubleshooting guide

---

## 🎨 **Optional: Customize Animation**

By default, preloader uses **jitter animation** (60Hz micro-movement).

To customize, add after `app.js` in Footer Code:

```html
<script>
  window.App.init({
    preloader: {
      useJitter: false,        // Use pulse instead
      jitterSpeed: 60,         // Animation speed
      jitterDistance: 1.5,     // Movement distance
      showDebugLog: false,     // Hide debug log
      minLoadTime: 2000        // Minimum display time (ms)
    }
  });
</script>
```

**Note:** If you override, you need to call `window.App.init()` manually. Otherwise, defaults work automatically!

---

## 📝 **Quick Checklist**

- [ ] HTML added to Site Settings → Before </body> tag
- [ ] Videos tagged with `data-wf-ignore` attribute
- [ ] CSS file linked in Footer Code
- [ ] JavaScript file linked in Footer Code
- [ ] Console shows initialization messages
- [ ] Preloader appears on page load
- [ ] Preloader hides after videos load

---

**That's it! The preloader works automatically on every page.** 🎉

