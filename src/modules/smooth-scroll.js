/**
 * ==================================================
 *  McCann Website — Smooth Scroll (Lenis)
 *  Purpose: Weighted momentum scrolling with snap support
 *  Date: 2025-11-05
 * ==================================================
 */

import Lenis from 'lenis';

console.log('[SMOOTH-SCROLL] Module loaded');

let lenisInstance = null;

/**
 * Initialize Lenis smooth scroll
 * @param {Object} options - Configuration options
 * @param {number} [options.lerp=0.1] - Lerp factor for momentum (lower = heavier, 0.05-0.2)
 * @param {number} [options.snapLerp=0.15] - Lerp for pages with scroll-snap (lighter for crisp snapping)
 * @param {boolean} [options.infinite=false] - Enable infinite scroll
 * @returns {Lenis|null} - Lenis instance or null if initialization fails
 */
export function initSmoothScroll(options = {}) {
  if (lenisInstance) {
    console.log('[SMOOTH-SCROLL] Already initialized');
    return lenisInstance;
  }

  // Detect if we're on a page with scroll-snap (homepage)
  const hasSnapContainer = document.querySelector('.perspective-wrapper') !== null;
  
  // Skip initialization on pages with scroll-snap containers
  // Those pages have their own scroll container and native snap works better
  if (hasSnapContainer && !options.forceEnableOnSnap) {
    console.log('[SMOOTH-SCROLL] ⚠️ Skipped - page has scroll-snap container');
    console.log('[SMOOTH-SCROLL] Using native scrolling for optimal snap behavior');
    return null;
  }
  
  // Use standard lerp for pages without snap
  const defaultLerp = options.lerp ?? 0.08;
  
  const config = {
    lerp: defaultLerp,
    duration: 1.2,              // Scroll duration factor
    orientation: 'vertical',    // 'vertical' | 'horizontal'
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,         // Keep native touch for mobile (better with snap)
    wheelMultiplier: 1.0,       // Adjust scroll speed (higher = faster)
    touchMultiplier: 2.0,
    infinite: options.infinite ?? false,
    ...options
  };

  try {
    lenisInstance = new Lenis(config);

    // RAF loop for smooth scroll
    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate with GSAP ScrollTrigger if available
    if (window.gsap && window.ScrollTrigger) {
      lenisInstance.on('scroll', ScrollTrigger.update);
      
      // Tell GSAP to use Lenis's scroll values
      window.gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      
      // Disable lag smoothing in GSAP ticker
      window.gsap.ticker.lagSmoothing(0);
    }

    // Expose stop/start methods for lightbox/modal integration
    window.App = window.App || {};
    window.App.smoothScroll = {
      stop: () => lenisInstance.stop(),
      start: () => lenisInstance.start(),
      instance: lenisInstance
    };

    console.log(`[SMOOTH-SCROLL] ✓ Initialized with momentum scrolling (lerp: ${defaultLerp})`);
    return lenisInstance;

  } catch (err) {
    console.error('[SMOOTH-SCROLL] ❌ Init error:', err);
    return null;
  }
}

/**
 * Stop smooth scroll (useful for modals/lightboxes)
 */
export function stopSmoothScroll() {
  if (lenisInstance) {
    lenisInstance.stop();
  }
}

/**
 * Start smooth scroll
 */
export function startSmoothScroll() {
  if (lenisInstance) {
    lenisInstance.start();
  }
}

/**
 * Destroy smooth scroll instance
 */
export function destroySmoothScroll() {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    console.log('[SMOOTH-SCROLL] Destroyed');
  }
}

/**
 * Initialize Lenis for a specific container element (e.g., lightbox overlay)
 * Uses the same settings as main smooth scroll for consistency
 * @param {HTMLElement|string} container - Container element or selector
 * @param {Object} options - Configuration options (same as main smooth scroll)
 * @returns {Lenis|null} - Lenis instance or null if initialization fails
 */
export function initContainerScroll(container, options = {}) {
  const element = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!element) {
    console.warn(`[SMOOTH-SCROLL] Container not found: ${container}`);
    return null;
  }

  // Use same default config as main smooth scroll
  const defaultLerp = options.lerp ?? 0.08;
  
  // For container scrolling, Lenis needs wrapper (scroll container) and content (scrollable element)
  // If no explicit content is provided, use the container's first child or the container itself
  const contentElement = options.content 
    ? (typeof options.content === 'string' ? element.querySelector(options.content) : options.content)
    : (element.children.length > 0 ? element.children[0] : element);
  
  const config = {
    wrapper: element,  // Scroll container
    content: contentElement,  // Scrollable content inside wrapper
    lerp: defaultLerp,
    duration: 1.2,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    smoothTouch: false,  // Keep native touch for mobile
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0,
    infinite: false,
    ...options
  };

  // Remove wrapper/content from options to avoid duplication
  delete config.wrapper;
  delete config.content;

  try {
    const instance = new Lenis({
      wrapper: element,
      content: contentElement,
      ...config
    });

    // RAF loop for smooth scroll
    function raf(time) {
      instance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate with GSAP ScrollTrigger if available
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

/**
 * Scroll to a target element or position
 * @param {string|number|HTMLElement} target - Selector, position, or element
 * @param {Object} options - Scroll options (offset, duration, etc.)
 */
export function scrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, options);
  }
}

