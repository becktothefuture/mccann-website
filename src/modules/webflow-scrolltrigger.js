/**
 * ==================================================
 *  McCann Website — Webflow ScrollTrigger Bridge
 *  Purpose: Trigger Webflow IX interactions via GSAP ScrollTrigger
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
  // Events: init pauses/sets start on load; play fires on first scroll; reset pauses on scroll back
  const initEventName = options.initEventName || 'logo-start';
  const playEventName = options.playEventName || 'logo-shrink';
  const resetEventName = options.resetEventName || initEventName || 'logo-start';
  const start = options.start || 'top top';
  const end = options.end || 'bottom top';
  const markers = !!options.markers;
  const playThreshold = typeof options.playThreshold === 'number' ? options.playThreshold : 0.02; // fire as soon as scroll starts

  function onWindowLoad(cb){
    if (document.readyState === 'complete') { setTimeout(cb, 0); return; }
    window.addEventListener('load', cb, { once: true });
  }

  onWindowLoad(function(){
    const Webflow = window.Webflow || [];
    const getIx = () => {
      try { return window.Webflow && window.Webflow.require && (window.Webflow.require('ix3') || window.Webflow.require('ix2')); }
      catch(_) { try { return window.Webflow && window.Webflow.require && window.Webflow.require('ix2'); } catch(__) { return null; } }
    };

    const mount = () => {
      const wfIx = getIx();
      const ScrollTrigger = (typeof window !== 'undefined') ? window.ScrollTrigger : null;
      if (!wfIx || !ScrollTrigger) { return; }

      const scroller = document.querySelector(scrollerSelector);
      const driver = document.querySelector(driverSelector);
      if (!scroller || !driver) { return; }

      // Ensure the animation is at its start and paused on load
      try { initEventName && wfIx.emit(initEventName); } catch(_) {}

      let hasPlayed = false;
      let hasReset = false;

      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: start,
        end: end,
        markers: markers,
        onUpdate: (self) => {
          // Play as soon as user starts scrolling down from the top
          if (!hasPlayed && self.direction > 0 && self.progress > playThreshold) {
            try { playEventName && wfIx.emit(playEventName); } catch(_) {}
            hasPlayed = true;
            hasReset = false;
          }
        },
        onEnterBack: () => {
          // Scrolling back above the driver slide → reset to start/paused
          if (!hasReset) {
            try { resetEventName && wfIx.emit(resetEventName); } catch(_) {}
            hasReset = true;
            hasPlayed = false;
          }
        },
      });
    };

    try { Webflow.push(mount); }
    catch(_) { mount(); }
  });
}



