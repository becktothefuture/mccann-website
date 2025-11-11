/**
 * ==================================================
 *  McCann Website — Smooth Scroll (Lenis)
 *  Purpose: Weighted momentum scrolling
 *  Date: 2025-11-06
 * ==================================================
 */

import Lenis from 'lenis';

console.log('[SMOOTH-SCROLL] Module loaded');

let lenisInstance = null;

// ============================================================
// INITIALIZATION
// ============================================================

export function initSmoothScroll(options = {}) {
  if (lenisInstance) {
    console.log('[SMOOTH-SCROLL] Already initialized');
    return lenisInstance;
  }

  const hasSnapContainer = document.querySelector('.perspective-wrapper') !== null;
  
  if (hasSnapContainer && !options.forceEnableOnSnap) {
    console.log('[SMOOTH-SCROLL] ⚠️ Skipped - page has scroll-snap container');
    console.log('[SMOOTH-SCROLL] Using native scrolling for optimal snap behavior');
    return null;
  }
  
  const defaultLerp = options.lerp ?? 0.08;
  
  const config = {
    lerp: defaultLerp,
    duration: 1.2,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0,
    infinite: options.infinite ?? false,
    ...options
  };

  try {
    lenisInstance = new Lenis(config);

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      lenisInstance.on('scroll', ScrollTrigger.update);
      
      window.gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      
      window.gsap.ticker.lagSmoothing(0);
    }

    window.App = window.App || {};
    window.App.smoothScroll = {
      stop: () => lenisInstance.stop(),
      start: () => lenisInstance.start(),
      resize: () => lenisInstance.resize(),
      instance: lenisInstance
    };

    window.addEventListener('acc-open', () => {
      requestAnimationFrame(() => lenisInstance.resize());
    });

    window.addEventListener('acc-close', () => {
      requestAnimationFrame(() => lenisInstance.resize());
    });

    console.log(`[SMOOTH-SCROLL] ✓ Initialized with momentum scrolling (lerp: ${defaultLerp})`);
    return lenisInstance;

  } catch (err) {
    console.error('[SMOOTH-SCROLL] ❌ Init error:', err);
    return null;
  }
}

// ============================================================
// CONTROL FUNCTIONS
// ============================================================

export function stopSmoothScroll() {
  if (lenisInstance) {
    lenisInstance.stop();
  }
}

export function startSmoothScroll() {
  if (lenisInstance) {
    lenisInstance.start();
  }
}

export function destroySmoothScroll() {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    console.log('[SMOOTH-SCROLL] Destroyed');
  }
}

export function scrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, options);
  }
}

// ============================================================
// CONTAINER SCROLL
// ============================================================

export function initContainerScroll(container, options = {}) {
  const element = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!element) {
    console.warn(`[SMOOTH-SCROLL] Container not found: ${container}`);
    return null;
  }

  const defaultLerp = options.lerp ?? 0.08;
  
  const contentElement = options.content 
    ? (typeof options.content === 'string' ? element.querySelector(options.content) : options.content)
    : (element.children.length > 0 ? element.children[0] : element);
  
  const config = {
    wrapper: element,
    content: contentElement,
    lerp: defaultLerp,
    duration: 1.2,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0,
    infinite: false,
    ...options
  };

  delete config.wrapper;
  delete config.content;

  try {
    const instance = new Lenis({
      wrapper: element,
      content: contentElement,
      ...config
    });

    function raf(time) {
      instance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      instance.on('scroll', ScrollTrigger.update);
    }

    console.log(`[SMOOTH-SCROLL] ✓ Container scroll initialized for ${typeof container === 'string' ? container : element.className || 'element'}`);
    return instance;

  } catch (err) {
    console.error('[SMOOTH-SCROLL] ❌ Container scroll init error:', err);
    return null;
  }
}
