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
 *  1. Logo appears when #intro-slide is scrolled out by 80% (20% visible)
 *  2. Logo disappears when #intro-slide is scrolled in by 20% (20% visible)
 *
 * Uses percentage-based triggers:
 *  - appearTrigger: Triggers when slide top reaches 80% down the viewport (80% scrolled out)
 *  - hideTrigger: Triggers when slide top reaches 20% down the viewport (20% scrolled in)
 *
 * Requirements in Webflow:
 *  - logo-hide: Control → Reverse (reverse animation)
 *  - logo-appear: Control → Play from start (forward animation)
 *
 * @param {Object} options
 * @param {string} [options.scrollerSelector='.perspective-wrapper']
 * @param {string} [options.hideEventName='logo-hide']
 * @param {string} [options.appearEventName='logo-appear']
 * @param {boolean} [options.markers=false]
 */
export function initWebflowScrollTriggers(options = {}){
  const scrollerSelector = options.scrollerSelector || '.perspective-wrapper';
  const hideEventName = options.hideEventName || options.shrinkEventName || 'logo-hide';
  const appearEventName = options.appearEventName || options.growEventName || 'logo-appear';
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

      // Find #intro-slide element (trigger for logo animation)
      const driver = document.querySelector('#intro-slide');
      if (!driver) { 
        console.error('[WEBFLOW] Driver slide (#intro-slide) not found');
        return; 
      }

      console.log('[WEBFLOW] Setup complete:', { 
        scroller: !!scroller, 
        driver: !!driver,
        wfIx: !!wfIx, 
        ScrollTrigger: !!ScrollTrigger,
        hideEvent: hideEventName,
        appearEvent: appearEventName
      });

      // Track state to prevent duplicate events
      let logoVisible = false; // Track if logo is currently visible
      let lastScrollDirection = null;

      // Trigger 1: logo-appear when slide is scrolled out by 80% (20% visible)
      // When 80% is scrolled out, slide bottom should be at 20% of viewport
      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'bottom 20%', // When slide bottom reaches 20% down viewport (80% scrolled out)
        markers: markers,
        
        onEnter: () => {
          // Scrolling DOWN: slide bottom has reached 20% → 80% scrolled out → appear
          if (!logoVisible) {
            try {
              console.log('[WEBFLOW] ✓ emit appear (80% scrolled out):', appearEventName);
              wfIx.emit(appearEventName);
              logoVisible = true;
            } catch(err) {
              console.error('[WEBFLOW] Error emitting appear:', err);
            }
          }
        }
      });

      // Trigger 2: logo-hide when slide is scrolled in by 20% (20% visible)
      // Use onLeaveBack which fires when scrolling UP past the start point
      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'bottom 20%', // Same trigger point as appear - when slide bottom reaches 20%
        markers: markers,
        
        onLeaveBack: () => {
          // Scrolling UP past the 20% point → logo should hide
          if (logoVisible) {
            try {
              console.log('[WEBFLOW] ✓ emit hide (scrolled back up past 20%):', hideEventName);
              wfIx.emit(hideEventName);
              logoVisible = false;
            } catch(err) {
              console.error('[WEBFLOW] Error emitting hide:', err);
            }
          }
        }
      });
      
      console.log('[WEBFLOW] ScrollTrigger initialized');
      
      // Refresh ScrollTrigger to ensure triggers are properly initialized
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  });
}
