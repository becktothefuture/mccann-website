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
 *  1. On page load: emit logo-grow (small → big)
 *  2. Scroll down past #intro-slide: emit logo-shrink (big → small)
 *  3. Scroll back up to #intro-slide: emit logo-grow (small → big)
 *
 * Requirements in Webflow:
 *  - logo-shrink: Control → Play from start (big → small animation)
 *  - logo-grow: Control → Play from start (small → big animation)
 *
 * @param {Object} options
 * @param {string} [options.scrollerSelector='.perspective-wrapper']
 * @param {string} [options.shrinkEventName='logo-shrink']
 * @param {string} [options.growEventName='logo-grow']
 * @param {boolean} [options.markers=false]
 */
export function initWebflowScrollTriggers(options = {}){
  const scrollerSelector = options.scrollerSelector || '.perspective-wrapper';
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
        shrinkEvent: shrinkEventName,
        growEvent: growEventName
      });

      // Main ScrollTrigger: watches when #intro-slide leaves/enters top zone
      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'top top',
        end: 'top -10%',
        markers: markers,
        
        onLeave: () => {
          // Scrolled DOWN past #intro-slide → shrink
          try {
            console.log('[WEBFLOW] emit shrink (scrolled down):', shrinkEventName);
            wfIx.emit(shrinkEventName);
          } catch(err) {
            console.error('[WEBFLOW] Error emitting shrink:', err);
          }
        },
        
        onEnterBack: () => {
          // Scrolled back up to #intro-slide → grow
          try {
            console.log('[WEBFLOW] emit grow (scrolled back up):', growEventName);
            wfIx.emit(growEventName);
          } catch(err) {
            console.error('[WEBFLOW] Error emitting grow:', err);
          }
        }
      });
      
      console.log('[WEBFLOW] ScrollTrigger initialized');
      
      // On page load: trigger logo-grow to animate logo from small → big
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        
        setTimeout(() => {
          try {
            console.log('[WEBFLOW] emit grow (initial load):', growEventName);
            wfIx.emit(growEventName);
          } catch(err) {
            console.error('[WEBFLOW] Error emitting initial grow:', err);
          }
        }, 200);
      });
    });
  });
}
