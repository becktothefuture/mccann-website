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
      
      if (!wfIx || !ScrollTrigger) { 
        console.warn('[WEBFLOW] ❌ Required dependencies not found:', { wfIx: !!wfIx, ScrollTrigger: !!ScrollTrigger });
        return; 
      }

      const scroller = document.querySelector(scrollerSelector);
      if (!scroller) { 
        console.warn('[WEBFLOW] ❌ Scroller element not found:', scrollerSelector);
        return; 
      }

      const driver = document.querySelector('#intro-slide');
      if (!driver) { 
        console.error('[WEBFLOW] ❌ Driver slide (#intro-slide) not found');
        return; 
      }

      console.log('[WEBFLOW] ✓ Setup complete:', { 
        scroller: !!scroller, 
        driver: !!driver,
        wfIx: !!wfIx, 
        ScrollTrigger: !!ScrollTrigger,
        hideEvent: hideEventName,
        appearEvent: appearEventName
      });

      // Critical: Add scroll event listener to custom scroller
      let scrollRAF = null;
      const handleScroll = () => {
        if (scrollRAF) cancelAnimationFrame(scrollRAF);
        scrollRAF = requestAnimationFrame(() => {
          ScrollTrigger.update();
        });
      };
      
      scroller.addEventListener('scroll', handleScroll, { passive: true });
      console.log('[WEBFLOW] ✓ Scroll listener attached to:', scrollerSelector);

      let logoVisible = false;

      // Create first ScrollTrigger for onEnter (logo appear)
      const st1 = ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'bottom 20%',
        markers: markers,
        invalidateOnRefresh: true,
        
        onEnter: () => {
          if (!logoVisible) {
            try {
              console.log('[WEBFLOW] 🎯 Triggering logo appear event:', appearEventName);
              wfIx.emit(appearEventName);
              logoVisible = true;
            } catch(err) {
              console.error('[WEBFLOW] ❌ Error emitting appear:', err);
            }
          }
        },
        
        onUpdate: (self) => {
          if (markers) {
            console.log('[WEBFLOW] ScrollTrigger update:', { progress: self.progress, direction: self.direction });
          }
        }
      });

      // Create second ScrollTrigger for onLeaveBack (logo hide)
      const st2 = ScrollTrigger.create({
        trigger: driver,
        scroller: scroller,
        start: 'bottom 20%',
        markers: markers,
        invalidateOnRefresh: true,
        
        onLeaveBack: () => {
          if (logoVisible) {
            try {
              console.log('[WEBFLOW] 🎯 Triggering logo hide event:', hideEventName);
              wfIx.emit(hideEventName);
              logoVisible = false;
            } catch(err) {
              console.error('[WEBFLOW] ❌ Error emitting hide:', err);
            }
          }
        }
      });
      
      console.log('[WEBFLOW] ✓ ScrollTriggers created successfully');
      
      // Multiple refresh attempts to ensure layout is stable
      const refreshTimings = [0, 100, 500, 1000];
      refreshTimings.forEach(delay => {
        setTimeout(() => {
          ScrollTrigger.refresh();
          console.log(`[WEBFLOW] 🔄 ScrollTrigger refreshed (${delay}ms delay)`);
        }, delay);
      });
      
      // Add resize listener to refresh on layout changes
      const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeObserver._timeout);
        resizeObserver._timeout = setTimeout(() => {
          ScrollTrigger.refresh();
          console.log('[WEBFLOW] 🔄 ScrollTrigger refreshed (resize)');
        }, 250);
      });
      
      resizeObserver.observe(scroller);
      resizeObserver.observe(driver);
      
      // Cleanup function for potential future use
      window.App = window.App || {};
      window.App.webflowScrollTrigger = {
        refresh: () => ScrollTrigger.refresh(),
        cleanup: () => {
          scroller.removeEventListener('scroll', handleScroll);
          resizeObserver.disconnect();
          st1.kill();
          st2.kill();
          console.log('[WEBFLOW] ScrollTrigger cleaned up');
        }
      };
    });
  });
}
