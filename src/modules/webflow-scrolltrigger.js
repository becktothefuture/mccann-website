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
 *  1. On load: emit logo-start to set logo to big static state
 *  2. Scroll down past first slide: emit logo-shrink (big → small)
 *  3. Start scrolling up: emit logo-grow immediately (small → big)
 *  4. Return to top: emit logo-start again (back to big static state)
 *
 * Requirements in Webflow:
 *  - logo-start (optional): Uses the same timeline as logo-shrink. Control → Jump to 0s, then Stop.
 *                          Only needed if logo doesn't naturally start in big state via CSS.
 *                          If omitted, logo-start event is still emitted but ignored if not configured.
 *  - logo-shrink: Control → Play from start (big → small animation)
 *  - logo-grow: Control → Play from start (small → big animation)
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

      // Find first .slide inside the scroller
      const driver = scroller.querySelector('.slide') || document.querySelector('.slide');
      if (!driver) { 
        console.error('[WEBFLOW] Driver slide not found');
        return; 
      }

      console.log('[WEBFLOW] Setup complete:', { 
        scroller: !!scroller, 
        driver: !!driver, 
        wfIx: !!wfIx, 
        ScrollTrigger: !!ScrollTrigger,
        initEvent: initEventName,
        shrinkEvent: shrinkEventName,
        growEvent: growEventName
      });

      // Track scroll state: are we below the top zone? did we shrink already?
      let isBelowTop = false;
      let hasShrunk = false;

      // Main ScrollTrigger: watches when first slide leaves/enters top zone
      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'top top',
        end: 'top -10%', // Short range for immediate trigger
        markers: markers,
        
        onLeave: () => {
          // Scrolled down past top → shrink once
          isBelowTop = true;
          if (!hasShrunk) {
            try {
              console.log('[WEBFLOW] emit shrink:', shrinkEventName);
              wfIx.emit(shrinkEventName);
              hasShrunk = true;
            } catch(_) {}
          }
        },
        
        onEnterBack: () => {
          // Scrolled back up to top → jump shrink timeline to 0s (big state) and stop
          isBelowTop = false;
          hasShrunk = false;
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

      // Simple scroll direction watcher for immediate grow on upward scroll
      // Only needed because onEnterBack only fires at top; user wants grow mid-scroll
      let lastScrollTop = scroller.scrollTop;
      let lastDirection = 0; // -1 = up, 1 = down, 0 = unknown
      
      ScrollTrigger.create({
        scroller: scroller,
        start: 0,
        end: () => ScrollTrigger.maxScroll(scroller),
        onUpdate: (self) => {
          const currentScrollTop = scroller.scrollTop;
          const direction = currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : lastDirection;
          
          // First upward tick after shrinking → grow immediately
          if (isBelowTop && hasShrunk && direction === -1 && lastDirection !== -1) {
            try {
              console.log('[WEBFLOW] emit grow (scroll up):', growEventName);
              wfIx.emit(growEventName);
              hasShrunk = false; // Reset so we can shrink again on next down scroll
            } catch(_) {}
          }
          
          lastScrollTop = currentScrollTop;
          lastDirection = direction;
        }
      });
      
      console.log('[WEBFLOW] ScrollTrigger initialized');
      
      // Emit logo-start AFTER ScrollTrigger is set up to avoid initialization conflicts
      // Try multiple times with delays to ensure Webflow interactions are ready
      const emitStart = () => {
        try {
          console.log('[WEBFLOW] Attempting to emit init:', initEventName);
          if (wfIx && typeof wfIx.emit === 'function') {
            wfIx.emit(initEventName);
            console.log('[WEBFLOW] ✓ init event emitted:', initEventName);
          } else {
            console.error('[WEBFLOW] ✗ wfIx.emit is not a function');
          }
        } catch(err) {
          console.error('[WEBFLOW] ✗ Error emitting init event:', err);
        }
      };
      
      // Emit logo-start after ScrollTrigger setup, with multiple delayed attempts
      // Some Webflow interactions need extra time after ScrollTrigger initialization
      const emitStartFinal = () => {
        emitStart();
      };
      
      // Wait for ScrollTrigger to refresh, then emit
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        
        // Multiple attempts with increasing delays to catch Webflow initialization
        emitStartFinal();
        setTimeout(emitStartFinal, 150);
        setTimeout(emitStartFinal, 400);
        setTimeout(emitStartFinal, 700);
        setTimeout(emitStartFinal, 1200);
      });
    });
  });
}
