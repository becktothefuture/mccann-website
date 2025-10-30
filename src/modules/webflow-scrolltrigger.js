/**
 * ==================================================
 *  McCann Website — Webflow ScrollTrigger Bridge
 *  Purpose: Trigger Webflow IX interactions via GSAP ScrollTrigger
 *  Date: 2025-10-30
 * ==================================================
 */

console.log('[WEBFLOW] module loaded');

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
  // Use the first `.slide` in the document (prefer within `.slides`)
  const driverSelector = options.driverSelector || '.slides .slide, .slide';
  // Events: init pauses/sets start on load; play fires on first scroll; reset pauses on scroll back
  const initEventName = options.initEventName || 'logo-start';
  const playEventName = options.playEventName || 'logo-shrink';
  const resetEventName = options.resetEventName || initEventName || 'logo-start';
  const reverseEventName = options.reverseEventName || 'logo-grow';
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
      let driver = document.querySelector(driverSelector) || document.querySelector('.slide') || document.querySelector('.parallax-group:first-child');
      if (!scroller || !driver) { return; }

      // Ensure the animation is at its start and paused on load
      try {
        if (initEventName) {
          console.log('[WEBFLOW] emit init:', initEventName);
          wfIx.emit(initEventName);
        }
      } catch(_) {}

      let fired = false; // forward emitted
      let reversed = false; // reverse emitted since last forward

      const st = ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'top top',
        end: 'top -10%',
        markers: markers,
        onLeave: () => {
          if (!fired) {
            try {
              if (playEventName) {
                console.log('[WEBFLOW] emit play/onLeave:', playEventName);
                wfIx.emit(playEventName);
              }
            } catch(_) {}
            fired = true;
            reversed = false;
          }
        },
        onEnterBack: () => {
          // Crossing back near the top band → just reset gating
          fired = false;
        },
      });
      try { console.log('[WEBFLOW] ScrollTrigger created', { trigger: driver, driverSelector, scroller, start: 'top top', end: 'top -10%' }); } catch(_) {}

      // Immediate reverse when user starts scrolling up anywhere below the top band
      let lastY = (scroller === window ? window.scrollY : scroller.scrollTop) || 0;
      const onScroll = () => {
        const y = (scroller === window ? window.scrollY : scroller.scrollTop) || 0;
        const delta = lastY - y; // positive when moving up
        if (delta > 1 && fired && !reversed) {
          try {
            if (reverseEventName) {
              console.log('[WEBFLOW] emit reverse/scroll-start:', reverseEventName);
              wfIx.emit(reverseEventName);
            }
          } catch(_) {}
          reversed = true;
        }
        lastY = y;
      };
      try { scroller.addEventListener('scroll', onScroll, { passive: true }); } catch(_) {}
    };

    try { Webflow.push(mount); }
    catch(_) { mount(); }
  });
}



