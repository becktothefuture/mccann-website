# Preloader Customization Panel

## ✨ Overview

A beautiful, transparent floating sidebar with real-time controls for the preloader animation. Built with shadcn/ui-inspired design using vanilla JavaScript.

---

## 🎨 Features

### **Visual Design**
- **Transparent glass-morphism** design with backdrop blur
- **Positioned right side** with 5vh margin from edges
- **Collapsible** via toggle button or `/` keyboard shortcut
- **Responsive** mobile-friendly layout
- **Smooth animations** respecting `prefers-reduced-motion`

### **Controls**

**Animation Type:**
- Radio buttons to switch between Pulse and Jitter modes
- Instant visual feedback

**Jitter Parameters** (when Jitter mode active):
- **Speed**: 1x to 60x multiplier (default: 20x for testing)
- **Distance**: 0.1px to 5px movement range (default: 0.5px)

**Pulse Parameters** (when Pulse mode active):
- **Duration**: 500ms to 5000ms cycle time (default: 2000ms)
- **Scale**: ±0.01 to ±0.1 range (default: ±0.02)

**Toggles:**
- **Keep Loader Open**: Prevents auto-hide for customization
- **Show Debug Log**: Toggle real-time log visibility

**Actions:**
- **Apply Changes**: Restart animation with new parameters
- **Hide Preloader**: Manually dismiss preloader

---

## 🚀 Usage

### Enable Customization Mode

```javascript
window.App.init({
  preloader: {
    stayOpen: true,        // Keep preloader open
    useJitter: true,       // Start with jitter
    showDebugLog: true,    // Show debug log
    jitterSpeed: 20,       // 20x speed (wiggle testing)
    jitterDistance: 0.5,   // 0.5px movement
    pulseDuration: 2000,   // 2s pulse cycle
    pulseScale: 0.02       // ±0.02 scale range
  }
});
```

### Keyboard Shortcut

Press `/` to toggle the panel (collapsed/expanded)

---

## 🎛️ Parameter Details

### Jitter Speed (1x - 60x)

Controls how fast the jitter animation updates:

- **1x**: Standard 60fps (subtle, almost invisible)
- **20x**: 20x faster (default for testing - clearly visible wiggle)
- **60x**: Maximum speed (intense vibration effect)

**Technical:** Uses frame skipping to achieve higher frequencies without performance issues.

### Jitter Distance (0.1px - 5px)

Controls the movement range:

- **0.1px - 0.5px**: Subtle micro-movement (production use)
- **0.5px - 1px**: Noticeable jitter
- **1px - 5px**: Strong vibration effect (testing only)

### Pulse Duration (500ms - 5000ms)

Controls the breathing cycle time:

- **500ms - 1000ms**: Fast breathing
- **2000ms**: Default (slow, calm breathing)
- **3000ms - 5000ms**: Very slow, meditative

### Pulse Scale (±0.01 - ±0.1)

Controls scale variation:

- **±0.01 - ±0.02**: Subtle (production use)
- **±0.03 - ±0.05**: Noticeable
- **±0.06 - ±0.1**: Strong pulsing

---

## 🎨 Design System

### Colors

```css
Background:     rgba(255, 255, 255, 0.85) with backdrop blur
Text Primary:   rgba(0, 0, 0, 0.9)
Text Secondary: rgba(0, 0, 0, 0.7)
Text Tertiary:  rgba(0, 0, 0, 0.5)
Borders:        rgba(0, 0, 0, 0.08)
Hover:          rgba(0, 0, 0, 0.04)
```

### Typography

```
Font: San Francisco (system font stack)
Title: 0.875rem, weight 600
Label: 0.8125rem, weight 500
Value: 0.75rem, weight 600 (tabular-nums)
Info:  0.75rem, weight 400
```

### Spacing

```
Panel padding:   1rem - 1.25rem
Group margins:   1.25rem
Element gaps:    0.5rem
Border radius:   8px (controls), 16px (panel)
```

### Components

**Radio Buttons:**
- Segmented control style
- Subtle hover states
- Clear selected state

**Sliders:**
- Custom styled range inputs
- 16px circular thumbs
- Hover scale animation

**Toggle Switches:**
- iOS-style switches
- Smooth slide animation
- 36px × 20px size

**Buttons:**
- Primary: Black background, white text
- Secondary: Light background, dark text
- Success: Green confirmation state

---

## 📱 Responsive Behavior

### Desktop (> 640px)
- Width: 320px
- Position: 5vh from edges
- Full feature set

### Mobile (≤ 640px)
- Width: calc(100vw - 2rem)
- Position: 1rem from edges
- Scrollable content
- Touch-optimized controls

---

## ♿ Accessibility

### ARIA Attributes
- `role="complementary"` on panel
- `aria-label` on controls
- Live regions for dynamic content

### Keyboard Support
- `/` to toggle panel
- Tab navigation through controls
- Enter/Space for toggles and buttons
- No focus traps

### Reduced Motion
- All transitions disabled
- Instant state changes
- Still fully functional

---

## 🔧 Technical Details

### Performance

**Optimizations:**
- RAF-based jitter with frame skipping
- No layout thrashing (CSS custom properties)
- Efficient event delegation
- Minimal DOM updates

**Frame Skipping Logic:**
```javascript
const updateInterval = Math.max(1, Math.floor(60 / speedMultiplier));
if (frameCount % updateInterval === 0) {
  // Update position
}
```

This allows speeds > 60fps without actually updating every frame.

### State Management

Global `window.preloaderOptions` object stores current settings:
```javascript
{
  useJitter: true,
  stayOpen: true,
  jitterSpeed: 20,
  jitterDistance: 0.5,
  pulseDuration: 2000,
  pulseScale: 0.02,
  showDebugLog: true
}
```

### Real-time Updates

**Slider Changes:**
- Update state immediately
- Update value display
- Apply on "Apply Changes" button

**Radio Changes:**
- Update state immediately
- Show/hide relevant controls
- Apply on "Apply Changes" button

**Toggle Changes:**
- Update state immediately
- Apply immediately (no button needed)

---

## 📦 Files

**JavaScript:**
- `src/modules/preloader-controls.js` (new, 393 lines)
- `src/modules/preloader.js` (enhanced with new parameters)
- `src/app.js` (integrated initialization)

**CSS:**
- `style.css` (added 370+ lines of panel styling)

**Test:**
- `test-preloader.html` (updated with stayOpen mode)

---

## 🎯 Testing the Wiggle Animation

The jitter animation is now set to **20x speed** by default for easy testing:

1. **Open** `test-preloader.html`
2. **Observe** the wiggle effect on the signet
3. **Adjust speed** with the "Jitter Speed" slider
4. **Adjust distance** with the "Jitter Distance" slider
5. **Apply changes** to restart animation
6. **Try values:**
   - Speed 1x + Distance 0.5px = Production subtle
   - Speed 20x + Distance 0.5px = Testing visible (default)
   - Speed 60x + Distance 2px = Maximum intensity

---

## 💡 Production Recommendations

### For Final Implementation

**Jitter (Recommended):**
```javascript
{
  useJitter: true,
  jitterSpeed: 1,        // Standard 60fps
  jitterDistance: 0.3,   // Very subtle
  stayOpen: false,       // Auto-hide when loaded
  showDebugLog: false    // Hide in production
}
```

**Pulse (Alternative):**
```javascript
{
  useJitter: false,
  pulseDuration: 2500,   // 2.5s cycle
  pulseScale: 0.015,     // Very subtle
  stayOpen: false,
  showDebugLog: false
}
```

---

## 🐛 Debugging

**Panel Not Showing:**
- Check `stayOpen: true` is set
- Verify `initPreloaderControls()` is called
- Check CSS loaded (`preloader-controls` class exists)

**Animation Not Updating:**
- Click "Apply Changes" button after adjusting sliders
- Check console for errors
- Verify `restartAnimation()` is exported

**Keyboard Shortcut Not Working:**
- Check if an input is focused (shortcut disabled during input)
- Try clicking outside inputs first
- Check browser console for errors

---

## 🎨 Customization Tips

### Change Panel Background

```css
.preloader-controls {
  background: rgba(0, 0, 0, 0.85);  /* Dark mode */
  color: white;
}
```

### Change Position

```css
.preloader-controls {
  left: 5vh;   /* Left side */
  right: auto;
}
```

### Add More Parameters

1. Add slider to HTML in `createPanel()`
2. Add `data-param` attribute
3. Add handler in `handleSliderChange()`
4. Pass to `restartAnimation()`

---

## ✅ Summary

The customization panel provides:
- ✅ Real-time parameter adjustments
- ✅ Beautiful shadcn-inspired design
- ✅ 20x speed wiggle animation for testing
- ✅ Collapsible with `/` keyboard shortcut
- ✅ Mobile-responsive layout
- ✅ Full accessibility support
- ✅ Production-ready with easy toggle

**Perfect for:**
- Testing different animation parameters
- Finding the ideal wiggle effect
- Client presentations
- Fine-tuning timing and scale
- Development/debugging

🎉 **The wiggle animation is now 20x faster and fully customizable!**

