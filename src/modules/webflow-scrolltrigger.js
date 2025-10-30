/**
 * ==================================================
 *  McCann Website — Webflow ScrollTrigger Bridge
 *  Purpose: Trigger Webflow IX2 interactions via GSAP ScrollTrigger
 *  Date: 2025-10-30
 * ==================================================
 */

console.log('[WF-IX] module loaded');

/**
 * Initialize GSAP ScrollTrigger → Webflow IX2 bridge.
 *
 * Defaults are aligned to the provided Webflow structure:
 *  - scroller: `.perspective-wrapper`
 *  - driver slide: `.slide--scroll-driver` (inside `.slides`)
 *  - interaction: `logo-shrink` on leave and enter-back
 *
 * This safely no-ops when Webflow/GSAP/ScrollTrigger or target elements
 * are unavailable. Runs after window 'load' and inside Webflow.push.
 *
 * @param {Object} options
 * @param {string} [options.scrollerSelector='.perspective-wrapper']
 * @param {string} [options.driverSelector='.slide--scroll-driver']
 * @param {string} [options.interactionOnLeave='logo-shrink']
 * @param {string} [options.interactionOnEnterBack='logo-shrink']
 * @param {string} [options.start='top top']
 * @param {string} [options.end='bottom top']
 * @param {boolean} [options.markers=false]
 */
export function initWebflowScrollTriggers(options = {}){
  const scrollerSelector = options.scrollerSelector || '.perspective-wrapper';
  const driverSelector = options.driverSelector || '.slide--scroll-driver';
  const interactionOnLeave = options.interactionOnLeave || 'logo-shrink';
  const interactionOnEnterBack = options.interactionOnEnterBack || interactionOnLeave || 'logo-shrink';
  const start = options.start || 'top top';
  const end = options.end || 'bottom top';
  const markers = !!options.markers;

  function onWindowLoad(cb){
    if (document.readyState === 'complete') { setTimeout(cb, 0); return; }
    window.addEventListener('load', cb, { once: true });
  }

  onWindowLoad(function(){
    const Webflow = window.Webflow || [];
    try {
      Webflow.push(function(){
        const wfIx = (window.Webflow && window.Webflow.require) ? window.Webflow.require('ix2') : null;
        const ScrollTrigger = (typeof window !== 'undefined') ? window.ScrollTrigger : null;
        if (!wfIx || !ScrollTrigger) { return; }

        const scroller = document.querySelector(scrollerSelector);
        const driver = document.querySelector(driverSelector);
        if (!scroller || !driver) { return; }

        ScrollTrigger.create({
          trigger: driver,
          scroller: scroller,
          start: start,
          end: end,
          markers: markers,
          onLeave: () => { try { interactionOnLeave && wfIx.emit(interactionOnLeave); } catch(_) {} },
          onEnterBack: () => { try { interactionOnEnterBack && wfIx.emit(interactionOnEnterBack); } catch(_) {} },
        });
      });
    } catch(_) {
      // Fallback path in case Webflow.push is unavailable
      try {
        const wfIx = (window.Webflow && window.Webflow.require) ? window.Webflow.require('ix2') : null;
        const ScrollTrigger = (typeof window !== 'undefined') ? window.ScrollTrigger : null;
        if (!wfIx || !ScrollTrigger) { return; }
        const scroller = document.querySelector(scrollerSelector);
        const driver = document.querySelector(driverSelector);
        if (!scroller || !driver) { return; }
        ScrollTrigger.create({
          trigger: driver,
          scroller: scroller,
          start: start,
          end: end,
          markers: markers,
          onLeave: () => { try { interactionOnLeave && wfIx.emit(interactionOnLeave); } catch(_) {} },
          onEnterBack: () => { try { interactionOnEnterBack && wfIx.emit(interactionOnEnterBack); } catch(_) {} },
        });
      } catch(__) { /* no-op */ }
    }
  });
}



