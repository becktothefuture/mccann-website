/**
 * ==================================================
 *  McCann Website — App Entry
 *  Purpose: Wire modules and expose minimal facade
 *  Date: 2025-11-06
 * ==================================================
 */

import { initPreloader } from './modules/preloader.js';
import { initAccordion } from './modules/accordion.js';
import { initLightbox } from './modules/lightbox.js';
import { initWebflowScrollTriggers } from './modules/webflow-scrolltrigger.js';
import { initSlideTransitionObserver } from './modules/slide-transition-observer.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';

// ============================================================
// HELPERS
// ============================================================

function patchVimeoAllowTokens() {
  const tokens = ['autoplay', 'fullscreen', 'picture-in-picture', 'encrypted-media'];
  const selector = [
    'iframe[src*="vimeo.com"]',
    'iframe[src*="player.vimeo.com"]'
  ].join(',');

  document.querySelectorAll(selector).forEach(ifr => {
    const current = (ifr.getAttribute('allow') || '')
      .split(';')
      .map(token => token.trim())
      .filter(Boolean);
    const updated = Array.from(new Set([...current, ...tokens])).join('; ');
    ifr.setAttribute('allow', updated);
  });
}

// ============================================================
// INITIALIZATION
// ============================================================

function init(options = {}) {
  const {
    lightboxRoot = '#lightbox',
    useIntersectionObserver = false,
    lerp = 0.1,
    snapLerp = 0.15,
    smoothScroll = {},
    preloader = {}
  } = options;

  const preloaderConfig = {
    selector: '#preloader',
    videoSelector: 'video[data-wf-ignore], video[autoplay], video[data-autoplay]',
    vimeoPreload: 'prefetch',
    vimeoBufferLimit: 5,
    minLoadTime: 1000,
    pulseDuration: 3000,
    pulseOpacity: 0.2,
    ...preloader
  };
  
  initPreloader(preloaderConfig);

  initSmoothScroll({
    lerp,
    snapLerp,
    ...smoothScroll
  });

  initAccordion({ selector: '.accordeon' });
  
  initLightbox({ 
    root: lightboxRoot, 
    openDuration: 1000,
    closeDuration: 1000
  });

  try {
    if (useIntersectionObserver) {
      initSlideTransitionObserver({
        scrollerSelector: '.perspective-wrapper',
        targetSlideSelector: '#intro-slide',
        appearEventName: 'logo-appear',
        hideEventName: 'logo-hide',
        threshold: 0.1
      });
    } else {
      initWebflowScrollTriggers({
        scrollerSelector: '.perspective-wrapper',
        hideEventName: 'logo-hide',
        appearEventName: 'logo-appear'
      });
    }
  } catch (err) {
    // Silent fail
  }
}

window.App = window.App || {};
window.App.init = init;

// ============================================================
// AUTO-INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     McCann Website - Initialization Starting        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  
  try {
    patchVimeoAllowTokens();
    init();
    
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║     ✅ All Systems Initialized Successfully         ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('[APP] ❌ Initialization error:', err);
  }
});
