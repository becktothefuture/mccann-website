/**
 * ==================================================
 *  McCann Website — Slide Transition Observer
 *  Purpose: Detect slide transitions using IntersectionObserver
 *  Date: 2025-01-XX
 * ==================================================
 */

console.log('[SLIDE-OBSERVER] module loaded');

/**
 * Initialize slide transition observer using IntersectionObserver.
 *
 * Behavior:
 *  1. Watch #intro-slide element for intersection changes
 *  2. When slide finishes scrolling out (intersectionRatio goes from >0 to 0): emit logo-appear
 *  3. When slide starts scrolling back in (intersectionRatio goes from 0 to >0): emit logo-hide
 *
 * Uses intersectionRatio to detect precise timing:
 *  - logo-appear: Fires when slide becomes completely non-intersecting (finished scrolling out)
 *  - logo-hide: Fires when slide starts intersecting (just begins to appear)
 *
 * Requirements in Webflow:
 *  - logo-appear: Control → Play from start (forward animation)
 *  - logo-hide: Control → Reverse (reverse animation)
 *
 * @param {Object} options
 * @param {string} [options.scrollerSelector='.perspective-wrapper']
 * @param {string} [options.targetSlideSelector='#intro-slide']
 * @param {string} [options.appearEventName='logo-appear']
 * @param {string} [options.hideEventName='logo-hide']
 * @param {number} [options.threshold=0] - Intersection threshold (0 = any intersection)
 */
export function initSlideTransitionObserver(options = {}){
  const scrollerSelector = options.scrollerSelector || '.perspective-wrapper';
  const targetSlideSelector = options.targetSlideSelector || '#intro-slide';
  const appearEventName = options.appearEventName || 'logo-appear';
  const hideEventName = options.hideEventName || options.disappearEventName || 'logo-hide';
  const threshold = options.threshold !== undefined ? options.threshold : 0;

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
      
      if (!wfIx) { 
        console.warn('[SLIDE-OBSERVER] Webflow IX API not found');
        return; 
      }

      const scroller = document.querySelector(scrollerSelector);
      if (!scroller) { 
        console.warn('[SLIDE-OBSERVER] Scroller not found:', scrollerSelector);
        return; 
      }

      const targetSlide = document.querySelector(targetSlideSelector);
      if (!targetSlide) { 
        console.error('[SLIDE-OBSERVER] Target slide not found:', targetSlideSelector);
        return; 
      }

      console.log('[SLIDE-OBSERVER] Setup complete:', { 
        scroller: !!scroller, 
        targetSlide: !!targetSlide,
        wfIx: !!wfIx,
        appearEvent: appearEventName,
        hideEvent: hideEventName,
        threshold: threshold
      });

      // Track previous intersection state to detect transitions
      // Initialize by checking actual state first
      let wasIntersecting = null; // null = not initialized yet
      let lastRatio = null; // Track previous ratio to detect direction
      let logoVisible = false; // Track logo state to prevent duplicate events
      let observer = null;

      // Single observer that tracks intersection ratio changes
      observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            const isIntersecting = entry.isIntersecting;
            const intersectionRatio = entry.intersectionRatio;
            
            // Initialize state on first callback - don't emit events
            if (wasIntersecting === null) {
              wasIntersecting = isIntersecting;
              lastRatio = intersectionRatio;
              // Set initial logo state based on ratio
              logoVisible = intersectionRatio > 0.2;
              console.log('[SLIDE-OBSERVER] Initial state:', { isIntersecting, intersectionRatio, logoVisible });
              return; // Don't emit events on first callback
            }
            
            // Logo appear: when slide is scrolled out by 80% (20% or less visible)
            // Trigger when ratio crosses from above 0.2 to at or below 0.2
            if (!logoVisible && lastRatio !== null && lastRatio > 0.2 && intersectionRatio <= 0.2) {
              // Slide has scrolled out by 80% → logo-appear
              try {
                console.log('[SLIDE-OBSERVER] ✓ emit appear (80% scrolled out, 20% visible):', appearEventName, { lastRatio, intersectionRatio });
                wfIx.emit(appearEventName);
                logoVisible = true;
                wasIntersecting = false; // Update state immediately
              } catch(err) {
                console.error('[SLIDE-OBSERVER] Error emitting appear:', err);
              }
              lastRatio = intersectionRatio;
              return; // Don't update state again below
            }
            
            // Logo hide: when slide is scrolled in by 20% (20% or more visible)
            // Trigger when ratio crosses from below 0.2 to at or above 0.2
            if (logoVisible && lastRatio !== null && lastRatio < 0.2 && intersectionRatio >= 0.2) {
              // Slide has scrolled in by 20% → logo-hide
              try {
                console.log('[SLIDE-OBSERVER] ✓ emit hide (20% scrolled in, 20% visible):', hideEventName, { lastRatio, intersectionRatio, wasIntersecting });
                wfIx.emit(hideEventName);
                logoVisible = false;
                wasIntersecting = true; // Update state immediately
              } catch(err) {
                console.error('[SLIDE-OBSERVER] Error emitting hide:', err);
              }
              lastRatio = intersectionRatio;
              return; // Don't update state again below
            }
            
            // Update state for next check (only if no event was emitted)
            wasIntersecting = isIntersecting;
            lastRatio = intersectionRatio;
          });
        },
        {
          root: scroller,
          rootMargin: '0px',
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] // Multiple thresholds to detect crossing 0.2
        }
      );

      // Start observing the target slide
      observer.observe(targetSlide);
      
      console.log('[SLIDE-OBSERVER] Observer initialized and watching:', targetSlideSelector);
      
      // Return cleanup function
      return function cleanup() {
        if (observer) {
          observer.disconnect();
          observer = null;
          console.log('[SLIDE-OBSERVER] Observer disconnected');
        }
      };
    });
  });
}


