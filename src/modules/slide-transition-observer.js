/**
 * ==================================================
 *  McCann Website — Slide Transition Observer
 *  Purpose: Detect slide transitions via IntersectionObserver
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[SLIDE-OBSERVER] module loaded');

// ============================================================
// EXPORTS
// ============================================================

export function initSlideTransitionObserver(options = {}){
  const scrollerSelector = options.scrollerSelector || '.perspective-wrapper';
  const targetSlideSelector = options.targetSlideSelector || '#intro-slide';
  const appearEventName = options.appearEventName || 'logo-appear';
  const hideEventName = options.hideEventName || options.disappearEventName || 'logo-hide';
  const threshold = options.threshold !== undefined ? options.threshold : 0;

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
      
      if (!wfIx) { 
        console.warn('[SLIDE-OBSERVER] Webflow IX API not found');
        return; 
      }

      const scroller = document.querySelector(scrollerSelector);
      if (!scroller) { 
        console.warn('[SLIDE-OBSERVER] Scroller not found:', scrollerSelector);
        return; 
      }

      const targetSlide = document.querySelector(targetSlideSelector);
      if (!targetSlide) { 
        console.error('[SLIDE-OBSERVER] Target slide not found:', targetSlideSelector);
        return; 
      }

      console.log('[SLIDE-OBSERVER] Setup complete:', { 
        scroller: !!scroller, 
        targetSlide: !!targetSlide,
        wfIx: !!wfIx,
        appearEvent: appearEventName,
        hideEvent: hideEventName,
        threshold: threshold
      });

      let wasIntersecting = null;
      let lastRatio = null;
      let logoVisible = false;
      let observer = null;

      observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            const isIntersecting = entry.isIntersecting;
            const intersectionRatio = entry.intersectionRatio;
            
            if (wasIntersecting === null) {
              wasIntersecting = isIntersecting;
              lastRatio = intersectionRatio;
              logoVisible = intersectionRatio > 0.2;
              console.log('[SLIDE-OBSERVER] Initial state:', { isIntersecting, intersectionRatio, logoVisible });
              return;
            }
            
            if (!logoVisible && lastRatio !== null && lastRatio > 0.2 && intersectionRatio <= 0.2) {
              try {
                console.log('[SLIDE-OBSERVER] ✓ emit appear:', appearEventName, { lastRatio, intersectionRatio });
                wfIx.emit(appearEventName);
                logoVisible = true;
                wasIntersecting = false;
              } catch(err) {
                console.error('[SLIDE-OBSERVER] Error emitting appear:', err);
              }
              lastRatio = intersectionRatio;
              return;
            }
            
            if (logoVisible && lastRatio !== null && lastRatio < 0.2 && intersectionRatio >= 0.2) {
              try {
                console.log('[SLIDE-OBSERVER] ✓ emit hide:', hideEventName, { lastRatio, intersectionRatio, wasIntersecting });
                wfIx.emit(hideEventName);
                logoVisible = false;
                wasIntersecting = true;
              } catch(err) {
                console.error('[SLIDE-OBSERVER] Error emitting hide:', err);
              }
              lastRatio = intersectionRatio;
              return;
            }
            
            wasIntersecting = isIntersecting;
            lastRatio = intersectionRatio;
          });
        },
        {
          root: scroller,
          rootMargin: '0px',
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        }
      );

      observer.observe(targetSlide);
      
      console.log('[SLIDE-OBSERVER] Observer initialized and watching:', targetSlideSelector);
      
      return function cleanup() {
        if (observer) {
          observer.disconnect();
          observer = null;
          console.log('[SLIDE-OBSERVER] Observer disconnected');
        }
      };
    });
  });
}
