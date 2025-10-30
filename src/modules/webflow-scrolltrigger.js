/**
 * ==================================================
 *  McCann Website — Webflow ScrollTrigger Bridge
 *  Purpose: Trigger Webflow IX interactions via GSAP ScrollTrigger
 *  Date: 2025-10-30
 * ==================================================
 */

console.log('[WEBFLOW] module loaded');

/**
 * Initialize GSAP ScrollTrigger → Webflow IX bridge.
 *
 * Behavior:
 *  1. On load: emit logo-grow to animate logo from small → big (ensures logo starts in big state)
 *  2. Scroll down past first slide: emit logo-shrink (big → small)
 *  3. Start scrolling up (middle section): emit logo-grow immediately (small → big)
 *  4. Reach last slide: emit logo-grow (small → big, logo grows at bottom)
 *  5. Scroll up from last slide: emit logo-shrink (big → small)
 *  6. Return to top: emit logo-start (jump to 0s, back to big static state)
 *
 * Requirements in Webflow:
 *  - logo-start: Uses the same timeline as logo-shrink. Control → Jump to 0s, then Stop.
 *               Used when returning to top (onEnterBack); works because timeline is initialized by then.
 *               If omitted, event is still emitted but safely ignored if not configured.
 *  - logo-shrink: Control → Play from start (big → small animation)
 *  - logo-grow: Control → Play from start (small → big animation)
 *               This is triggered on initial page load to animate logo from small → big.
 *               Ensure your logo CSS shows it in the "small" state initially (matching the end state
 *               of shrink or start state of grow), so the grow animation has somewhere to animate from.
 *
 * @param {Object} options
 * @param {string} [options.scrollerSelector='.perspective-wrapper']
 * @param {string} [options.driverSelector] - Defaults to first .slide in scroller
 * @param {string} [options.initEventName='logo-start']
 * @param {string} [options.shrinkEventName='logo-shrink']
 * @param {string} [options.growEventName='logo-grow']
 * @param {boolean} [options.markers=false]
 */
export function initWebflowScrollTriggers(options = {}){
  const scrollerSelector = options.scrollerSelector || '.perspective-wrapper';
  const initEventName = options.initEventName || 'logo-start';
  const shrinkEventName = options.shrinkEventName || options.playEventName || 'logo-shrink';
  const growEventName = options.growEventName || 'logo-grow';
  const markers = !!options.markers;

  function onWindowLoad(cb){
    if (document.readyState === 'complete') { setTimeout(cb, 0); return; }
    window.addEventListener('load', cb, { once: true });
  }

  onWindowLoad(function(){
    const Webflow = window.Webflow || [];
    
    Webflow.push(function(){
      // Get Webflow IX API (try ix3 first, fallback to ix2)
      const wfIx = (window.Webflow && window.Webflow.require) 
        ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
        : null;
      const ScrollTrigger = window.ScrollTrigger;
      
      if (!wfIx || !ScrollTrigger) { return; }

      const scroller = document.querySelector(scrollerSelector);
      if (!scroller) { return; }

      // Find first .slide inside the scroller (for top detection)
      const driver = scroller.querySelector('.slide') || document.querySelector('.slide');
      if (!driver) { 
        console.error('[WEBFLOW] Driver slide not found');
        return; 
      }

      // Find last .slide inside the scroller (for bottom detection)
      const slides = Array.from(scroller.querySelectorAll('.slide'));
      const lastSlide = slides.length > 0 ? slides[slides.length - 1] : null;
      if (!lastSlide) {
        console.warn('[WEBFLOW] No slides found, last slide detection disabled');
      }

      console.log('[WEBFLOW] Setup complete:', { 
        scroller: !!scroller, 
        driver: !!driver,
        lastSlide: !!lastSlide,
        totalSlides: slides.length,
        wfIx: !!wfIx, 
        ScrollTrigger: !!ScrollTrigger,
        initEvent: initEventName,
        shrinkEvent: shrinkEventName,
        growEvent: growEventName
      });

      // Track scroll state: are we below the top zone? did we shrink already? did we grow already?
      // Also track last slide state
      let isBelowTop = false;
      let hasShrunk = false;
      let hasGrown = false;
      let isAtLastSlide = false;
      let hasGrownAtLast = false;

      // Main ScrollTrigger: watches when first slide leaves/enters top zone
      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'top top',
        end: 'top -10%', // Short range for immediate trigger
        markers: markers,
        
        onLeave: () => {
          // Scrolled DOWN past top → shrink once (only when leaving, not when already below)
          // This should only fire when crossing from "at top" to "below top"
          if (!isBelowTop && !hasShrunk) {
            isBelowTop = true;
            try {
              console.log('[WEBFLOW] emit shrink (scrolled down past first slide):', shrinkEventName);
              wfIx.emit(shrinkEventName);
              hasShrunk = true;
              hasGrown = false; // Reset grow flag when we shrink
            } catch(_) {}
          }
        },
        
        onEnterBack: () => {
          // Scrolled back up to top → jump shrink timeline to 0s (big state) and stop
          isBelowTop = false;
          hasShrunk = false;
          hasGrown = false;
          isAtLastSlide = false;
          hasGrownAtLast = false;
          try {
            console.log('[WEBFLOW] emit start (return to top):', initEventName);
            console.log('[WEBFLOW] wfIx available:', !!wfIx, 'emit available:', typeof wfIx?.emit);
            if (wfIx && typeof wfIx.emit === 'function') {
              wfIx.emit(initEventName);
              console.log('[WEBFLOW] return-to-top event emitted successfully');
            } else {
              console.error('[WEBFLOW] Cannot emit return-to-top: wfIx.emit not available');
            }
          } catch(err) {
            console.error('[WEBFLOW] Error emitting return-to-top:', err);
          }
        }
      });

      // Last slide ScrollTrigger: watches when last slide enters/leaves viewport
      if (lastSlide) {
        ScrollTrigger.create({
          trigger: lastSlide,
          scroller: scroller,
          start: 'top bottom', // Last slide enters from bottom of viewport
          end: 'bottom top', // Last slide leaves top of viewport
          markers: markers,
          
          onEnter: () => {
            // Scrolled DOWN to last slide → grow once (only when entering, not when already there)
            if (!isAtLastSlide && !hasGrownAtLast) {
              isAtLastSlide = true;
              try {
                console.log('[WEBFLOW] emit grow (reached last slide):', growEventName);
                wfIx.emit(growEventName);
                hasGrownAtLast = true;
                // Reset middle section flags since we're at the last slide
                hasShrunk = false;
                hasGrown = false;
              } catch(_) {}
            }
          },
          
          onLeaveBack: () => {
            // Scrolled UP from last slide (leaving backward) → shrink once
            if (isAtLastSlide && hasGrownAtLast) {
              isAtLastSlide = false;
              try {
                console.log('[WEBFLOW] emit shrink (scrolling up from last slide):', shrinkEventName);
                wfIx.emit(shrinkEventName);
                hasGrownAtLast = false;
                hasShrunk = true; // We're now in the middle section with logo small
                hasGrown = false;
              } catch(_) {}
            }
          }
        });
      }

      // Simple scroll direction watcher for immediate grow on upward scroll
      // Only triggers grow when:
      // - We're below the top zone (isBelowTop)
      // - We've shrunk (hasShrunk)
      // - We're scrolling up (direction === -1)
      // - We just started scrolling up (lastDirection !== -1, meaning we weren't already scrolling up)
      // - We haven't already grown (hasGrown)
      let lastScrollTop = scroller.scrollTop;
      let lastDirection = 0; // -1 = up, 1 = down, 0 = unknown
      
      ScrollTrigger.create({
        scroller: scroller,
        start: 0,
        end: () => ScrollTrigger.maxScroll(scroller),
        onUpdate: (self) => {
          const currentScrollTop = scroller.scrollTop;
          const direction = currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : lastDirection;
          
          // Grow only when scrolling up from below top (middle section), and we've shrunk, and we haven't grown yet
          // Don't trigger if we're at the last slide (that's handled separately)
          if (isBelowTop && !isAtLastSlide && hasShrunk && !hasGrown && direction === -1 && lastDirection !== -1) {
            try {
              console.log('[WEBFLOW] emit grow (scroll up in middle section):', growEventName);
              wfIx.emit(growEventName);
              hasGrown = true; // Set flag so we don't grow again until we shrink
              hasShrunk = false; // Reset shrink flag after growing
            } catch(_) {}
          }
          
          // Reset grow flag if we start scrolling down again (but only if we're still below top and not at last slide)
          if (isBelowTop && !isAtLastSlide && hasGrown && direction === 1 && lastDirection !== 1) {
            // User started scrolling down again - reset so we can shrink again
            hasShrunk = false;
            hasGrown = false;
            console.log('[WEBFLOW] Reset flags - ready to shrink again');
          }
          
          lastScrollTop = currentScrollTop;
          lastDirection = direction;
        }
      });
      
      console.log('[WEBFLOW] ScrollTrigger initialized');
      
      // Verify that all events exist in Webflow by checking if emit succeeds
      // Note: Webflow emit doesn't throw errors for missing events, but we can log attempts
      const verifyAndEmit = (eventName, description) => {
        try {
          console.log(`[WEBFLOW] ${description}:`, eventName);
          if (wfIx && typeof wfIx.emit === 'function') {
            wfIx.emit(eventName);
            console.log(`[WEBFLOW] ✓ Emitted ${eventName} - If nothing happens, check Webflow config:`);
            console.log(`[WEBFLOW]   1. Event name must be exactly: "${eventName}"`);
            console.log(`[WEBFLOW]   2. Control must NOT be "No Action"`);
            console.log(`[WEBFLOW]   3. Must target the logo element`);
            console.log(`[WEBFLOW]   4. Timeline must be set correctly`);
            return true;
          } else {
            console.error(`[WEBFLOW] ✗ wfIx.emit not available`);
            return false;
          }
        } catch(err) {
          console.error(`[WEBFLOW] ✗ Error emitting ${eventName}:`, err);
          return false;
        }
      };
      
      // Wait for ScrollTrigger to refresh, then trigger logo-grow on initial load
      // This animates the logo from small → big on page load, ensuring it starts in the big state
      // We only emit once - use a flag to prevent multiple initial emits
      let initialGrowEmitted = false;
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        
        // Emit logo-grow on initial load (animates logo to big state)
        // Only emit once, with a single delayed attempt to catch Webflow initialization
        setTimeout(() => {
          if (!initialGrowEmitted) {
            verifyAndEmit(growEventName, 'Initial load - grow');
            initialGrowEmitted = true;
          }
        }, 200);
      });
    });
  });
}
