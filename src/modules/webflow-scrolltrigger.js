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
  // Forward grow animation when scrolling up; keep backwards-compatible alias
  const growEventName = options.growEventName || options.reverseEventName || 'logo-grow';
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

      // Ensure the animation is at its start and paused on load.
      // IMPORTANT: In Webflow, `logo-start` should contain 0s Set steps that apply
      // the "big" static state of the logo (not an animation). Using Control: Stop at 0s
      // alone doesn't apply styles unless you set them explicitly at 0s.
      try {
        if (initEventName) {
          console.log('[WEBFLOW] emit init:', initEventName);
          wfIx.emit(initEventName);
        }
      } catch(_) {}

      // Simple state machine to avoid duplicate/erratic emits
      // atTop: we are in the top zone of the first slide
      // hasShrunk: we already emitted the shrink event for this down-scroll pass
      // hasGrown: we already emitted the grow event for this up-scroll pass
      let atTop = true;
      let hasShrunk = false;
      let hasGrown = false;

      const st = ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'top top',
        end: 'top -10%',
        markers: markers,
        onLeave: () => {
          // Leaving the top zone downward → first time we should shrink
          atTop = false;
          if (!hasShrunk) {
            try {
              if (playEventName) {
                console.log('[WEBFLOW] emit play/onLeave:', playEventName);
                wfIx.emit(playEventName);
              }
            } catch(_) {}
            hasShrunk = true;
            hasGrown = false; // arm grow for the next upward direction change
          }
        },
        onEnterBack: () => {
          // Re-entering the top zone upward → ensure static start state is applied
          atTop = true;
          hasShrunk = false;
          hasGrown = false;
          try {
            if (initEventName) {
              console.log('[WEBFLOW] emit start/onEnterBack:', initEventName);
              wfIx.emit(initEventName);
            }
          } catch(_) {}
        },
      });
      try { console.log('[WEBFLOW] ScrollTrigger created', { trigger: driver, driverSelector, scroller, start: 'top top', end: 'top -10%' }); } catch(_) {}

      // Direction watcher over the whole page: first upward tick after shrink → grow immediately
      ScrollTrigger.create({
        scroller: scroller,
        start: 0,
        end: () => ScrollTrigger.maxScroll(scroller),
        onUpdate: (s) => {
          if (!atTop && hasShrunk && !hasGrown && s.direction < 0) {
            try {
              if (growEventName) {
                console.log('[WEBFLOW] emit grow/onUpdate:', growEventName);
                wfIx.emit(growEventName);
              }
            } catch(_) {}
            hasGrown = true; // prevent repeats until we shrink again
          }
        }
      });
    };

    try { Webflow.push(mount); }
    catch(_) { mount(); }
  });
}



