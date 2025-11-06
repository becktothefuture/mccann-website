/**
 * ==================================================
 *  McCann Website — App Entry
 *  Purpose: Wire modules and expose minimal facade
 *  Date: 2025-10-28
 * ==================================================
 */

import { initPreloader } from './modules/preloader.js';
import { initAccordion } from './modules/accordion.js';
import { initLightbox } from './modules/lightbox.js';
import { initWebflowScrollTriggers } from './modules/webflow-scrolltrigger.js';
import { initSlideTransitionObserver } from './modules/slide-transition-observer.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';

/**
 * Expands iframe 'allow' attributes to reduce Designer permission warnings
 * Updated for Vimeo video support
 */
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

/**
 * App entrypoint: wires up modules and features
 * 
 * Initialization order matters:
 * 1. Preloader runs FIRST → prefetch videos before showing content
 * 2. After preloader → smooth scroll and UI modules
 * 3. Logo animation → separate system (optional)
 * 
 * @param {Object} options
 */
function init(options = {}) {
  const {
    lightboxRoot = '#lightbox',
    useIntersectionObserver = false,
    lerp = 0.1,
    snapLerp = 0.15,
    smoothScroll = {},
    preloader = {}
  } = options;

  // 0. Preloader (runs first, blocks until videos ready)
  // Add body class to lock scroll during preload
  document.body.classList.add('preloader-active');
  
  const preloaderConfig = {
    selector: '#preloader',
    videoSelector: 'video[data-wf-ignore], video[autoplay], video[data-autoplay]',
    vimeoPreload: 'prefetch', // 'none', 'prefetch' (recommended), 'prebuffer' (aggressive)
    vimeoBufferLimit: 5,      // Max Vimeo videos to prebuffer if using 'prebuffer'
    minLoadTime: 1000,
    pulseDuration: 3000,
    pulseOpacity: 0.2,
    ...preloader
  };
  
  initPreloader(preloaderConfig);

  // 1. Smooth scroll (should run early, before triggers)
  // This needs to initialize first because GSAP ScrollTrigger syncs with it
  // If other modules try to use scroll position before this is ready, timing issues occur
  initSmoothScroll({
    lerp,
    snapLerp,
    ...smoothScroll
  });

  // 2. UI Modules
  // These are independent → order doesn't matter much
  initAccordion({ selector: '.accordeon' });
  
  // IMPORTANT: openDuration and closeDuration MUST match Webflow IX3 animation durations
  // Update these values if you change animation speeds in Webflow
  // 
  // Project data is now bundled into app.js - no external JSON file needed!
  initLightbox({ 
    root: lightboxRoot, 
    openDuration: 1000,   // Must match 'lb:open' animation duration in Webflow
    closeDuration: 1000   // Must match 'lb:close' animation duration in Webflow
  });

  // 3. Logo animation (IntersectionObserver-based preferred)
  // This is wrapped in try-catch because it's non-critical
  // If it fails, site still works fine
  try {
    if (useIntersectionObserver) {
      // New system → more reliable with scroll-snap and Lenis
      // Uses IntersectionObserver instead of scroll position calculations
      initSlideTransitionObserver({
        scrollerSelector: '.perspective-wrapper',
        targetSlideSelector: '#intro-slide',
        appearEventName: 'logo-appear',
        hideEventName: 'logo-hide',
        threshold: 0.1
      });
    } else {
      // Legacy system → GSAP ScrollTrigger-based
      // Still works but less compatible with scroll-snap containers
      initWebflowScrollTriggers({
        scrollerSelector: '.perspective-wrapper',
        hideEventName: 'logo-hide',
        appearEventName: 'logo-appear'
      });
    }
  } catch (err) {
    // Fail silently; logo animation is non-critical
    // Don't log error → avoid console noise in production
  }

  // Note: slide snapping is CSS-only in `.perspective-wrapper`
  // We don't use JS for snapping → native CSS scroll-snap is smoother
}

// Expose App.init for Webflow/Designer hooks
window.App = window.App || {};
window.App.init = init;

// DOM ready auto-init
document.addEventListener('DOMContentLoaded', () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║     McCann Website - Initialization Starting        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  
  try {
    patchVimeoAllowTokens(); // Patch Vimeo iframe permissions
    init();
    
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║     ✅ All Systems Initialized Successfully         ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('[APP] ❌ Initialization error:', err);
  }
});
