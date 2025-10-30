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
 *                          IMPORTANT: "Jump to 0s" may not work until the timeline has been initialized
 *                          (i.e., after shrink/grow has been played at least once). Therefore:
 *                          - Set your logo CSS to display in the "big" state initially (initial state should
 *                            match frame 0 of the shrink timeline).
 *                          - logo-start is primarily used when returning to top (onEnterBack); it should work
 *                            there because the timeline will have been initialized by user scrolling.
 *                          - If logo-start doesn't work on initial page load, that's OK - CSS handles initial state.
 *                          - If omitted, logo-start event is still emitted but safely ignored if not configured.
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
      
      // Wait for ScrollTrigger to refresh, then emit logo-start
      // Note: "Jump to 0s" may not work until timeline has been initialized by playing shrink/grow at least once.
      // Since we can't safely initialize without a visible flash, we'll only emit on initial load.
      // The logo should start in the "big" state via CSS initially.
      // logo-start is primarily used when returning to top (onEnterBack handles that).
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        
        // Emit logo-start on initial load (may not work if timeline isn't initialized yet, but no harm)
        // Best practice: Ensure your logo element has CSS that sets it to the "big" state initially
        setTimeout(() => verifyAndEmit(initEventName, 'Initial load'), 100);
        setTimeout(() => verifyAndEmit(initEventName, 'Initial load (delayed)'), 800);
      });
    });
  });
}
