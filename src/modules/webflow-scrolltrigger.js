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
 *  - logo-start: Control → Stop at 0s, include 0s Set steps for big state
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
      if (!driver) { return; }

      // Emit logo-start on load to set initial big state
      try {
        console.log('[WEBFLOW] emit init:', initEventName);
        wfIx.emit(initEventName);
      } catch(_) {}

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
          // Scrolled back up to top → reset to big static state
          isBelowTop = false;
          hasShrunk = false;
          try {
            console.log('[WEBFLOW] emit start (return to top):', initEventName);
            wfIx.emit(initEventName);
          } catch(_) {}
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
    });
  });
}
