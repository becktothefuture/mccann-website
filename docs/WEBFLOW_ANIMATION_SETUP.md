# Webflow GSAP Animation Setup - Step by Step

## Visual Guide for `lb:open` and `lb:close` Custom Events

---

## Event 1: `lb:open` (Opening Animation)

### **Step-by-Step in Webflow:**

1. **Open Interactions Panel**
   - Click the lightning bolt icon (⚡) in the top toolbar
   - Or press `H` on keyboard

2. **Create New Custom Event Interaction**
   - Click **"+"** button
   - Select **"Custom Event"**
   - Name: `lb:open` (exact, case-sensitive!)

3. **Add Action 1 - Make Visible (Instant)**
   - Click **"+"** on the timeline (should be at 0%)
   - Select element: `#lightbox`
   - Change property: **Display**
   - Set to: **Flex** (or Block, depending on your layout)
   - This action should have **no duration** (instant)

4. **Add Action 2 - Animate In (1 second)**
   - While still at **0%** on timeline, click **"+"** again
   - Select element: `#lightbox`
   - Add property: **Opacity**
     - Initial value: `0%`
     - Final value: `100%`
   - Add property: **Transform → Scale**
     - Initial value: `0.95`
     - Final value: `1.0`
   - Set **Duration:** `1s` (1000ms)
   - Set **Easing:** Ease Out Quad (or your preference)

5. **Verify Settings**
   - Control: "Play from beginning"
   - Total duration: 1000ms
   - No delay

---

## Event 2: `lb:close` (Closing Animation)

### **Step-by-Step in Webflow:**

1. **Create New Custom Event Interaction**
   - Click **"+"** button in Interactions panel
   - Select **"Custom Event"**
   - Name: `lb:close` (exact, case-sensitive!)

2. **Add Action 1 - Animate Out (1 second)**
   - Click **"+"** on timeline at **0%**
   - Select element: `#lightbox`
   - Add property: **Opacity**
     - Initial value: `100%`
     - Final value: `0%`
   - Add property: **Transform → Scale**
     - Initial value: `1.0`
     - Final value: `0.95`
   - Set **Duration:** `1s` (1000ms)
   - Set **Easing:** Ease In Quad (or your preference)

3. **Add Action 2 - Hide (Instant)**
   - Drag timeline scrubber to **100%** (end of animation)
   - Click **"+"** at this position
   - Select element: `#lightbox`
   - Change property: **Display**
   - Set to: **None**
   - This action should have **no duration** (instant)
   - This happens AFTER the 1s animation completes

4. **Verify Settings**
   - Control: "Play from beginning"
   - Total duration: 1000ms
   - No delay
   - Display:none happens at the END

---

## Common Webflow Interaction Panel Tips

### **Timeline Position:**
- **0%** = Start of animation
- **50%** = Middle of animation
- **100%** = End of animation

### **Action Types:**
- **Instant actions** (Display changes) = no duration, happens immediately
- **Animated actions** (Opacity, Transform) = have duration and easing

### **How to Add Multiple Properties:**
- Select the element
- Click the property dropdown
- Add Opacity first
- Click **"+ Add property"** to add Transform → Scale
- Both will animate together if at the same timeline position

### **Verify Your Setup:**
After creating both events, you should see:
- Two custom events in your Interactions panel: `lb:open` and `lb:close`
- `lb:open` has 2 actions (1 instant, 1 animated)
- `lb:close` has 2 actions (1 animated, 1 instant at end)
- Both target `#lightbox`

---

## Animation Properties Reference

### **`lb:open` Timeline:**
```
0% (instant):  Display: None → Flex
0% (1s ease):  Opacity: 0% → 100%
               Scale: 0.95 → 1.0
```

### **`lb:close` Timeline:**
```
0% (1s ease):   Opacity: 100% → 0%
                Scale: 1.0 → 0.95
100% (instant): Display: Flex → None
```

---

## Troubleshooting

### **Animation doesn't play:**
- Check event names are exactly `lb:open` and `lb:close` (case-sensitive)
- Check you've published or are in preview mode (interactions don't work in edit mode)
- Check browser console for errors

### **Lightbox flickers:**
- Make sure initial `display: none` is set in Style Panel
- Make sure `lb:open` starts by changing display to flex FIRST

### **Animation is too fast/slow:**
- Adjust duration in both Webflow AND `/src/app.js`
- They must match!

### **Display:none doesn't happen at end:**
- Make sure Action 2 in `lb:close` is positioned at **100%** timeline
- Not at 0% with the opacity/scale animation

---

## Next Steps

After setting up animations:
1. Test in Webflow Preview mode
2. Check timing matches your preference
3. Update durations in `/src/app.js` if you changed them:
   ```javascript
   initLightbox({ 
     openDuration: 1000,   // Match lb:open duration
     closeDuration: 1000   // Match lb:close duration
   });
   ```
4. Publish and test on live site

Perfect! Your GSAP animations are now controlling all visibility. 🎬

