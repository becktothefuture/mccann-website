/**
 * ==================================================
 *  McCann Website — Webflow ScrollTrigger Bridge
 *  Purpose: Trigger Webflow IX via GSAP ScrollTrigger
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[WEBFLOW] module loaded');

// ============================================================
// EXPORTS
// ============================================================

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
      const wfIx = (window.Webflow && window.Webflow.require) 
        ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
        : null;
      const ScrollTrigger = window.ScrollTrigger;
      
      if (!wfIx || !ScrollTrigger) { return; }

      const scroller = document.querySelector(scrollerSelector);
      if (!scroller) { return; }

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

      let logoVisible = false;

      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'bottom 20%',
        markers: markers,
        
        onEnter: () => {
          if (!logoVisible) {
            try {
              console.log('[WEBFLOW] ✓ emit appear:', appearEventName);
              wfIx.emit(appearEventName);
              logoVisible = true;
            } catch(err) {
              console.error('[WEBFLOW] Error emitting appear:', err);
            }
          }
        }
      });

      ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'bottom 20%',
        markers: markers,
        
        onLeaveBack: () => {
          if (logoVisible) {
            try {
              console.log('[WEBFLOW] ✓ emit hide:', hideEventName);
              wfIx.emit(hideEventName);
              logoVisible = false;
            } catch(err) {
              console.error('[WEBFLOW] Error emitting hide:', err);
            }
          }
        }
      });
      
      console.log('[WEBFLOW] ScrollTrigger initialized');
      
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });
  });
}
