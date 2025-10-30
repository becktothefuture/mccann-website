/**
 * ==================================================
 *  McCann Website — App Entry
 *  Purpose: Wire modules and expose minimal facade
 *  Date: 2025-10-28
 * ==================================================
 */

import { initAccordion } from './modules/accordion.js';
import { initLightbox } from './modules/lightbox.js';
import { initWebflowScrollTriggers } from './modules/webflow-scrolltrigger.js';

function patchYouTubeAllowTokens(){
  // Minimal set to reduce permission policy warnings inside Designer
  const tokens = ['autoplay','encrypted-media','picture-in-picture'];
  const sel = [
    'iframe[src*="youtube.com"]',
    'iframe[src*="youtu.be"]',
    'iframe[src*="youtube-nocookie.com"]',
  ].join(',');
  document.querySelectorAll(sel).forEach((ifr) => {
    const existing = (ifr.getAttribute('allow') || '').split(';').map(s => s.trim()).filter(Boolean);
    const merged = Array.from(new Set([...existing, ...tokens])).join('; ');
    ifr.setAttribute('allow', merged);
  });
}

function init(options = {}){
  const lightboxRoot = options.lightboxRoot || '#project-lightbox';
  initAccordion('.accordeon');
  initLightbox({ root: lightboxRoot, closeDelayMs: 1000 });
  // Rely on CSS scroll-snap in `.perspective-wrapper`; do not attach JS paging

  // Bridge GSAP ScrollTrigger → Webflow IX using the provided structure
  try {
    initWebflowScrollTriggers({
      scrollerSelector: '.perspective-wrapper',
      // driverSelector defaults to first .slide; override not needed
      initEventName: 'logo-start',     // pause at start on load
      playEventName: 'logo-shrink',    // play as soon as user starts scrolling down
      resetEventName: 'logo-start',    // reset/pause when scrolling back above the driver
      // threshold not used in minimal version
    });
  } catch(_) {}

  // Note: no JS slide snapping; rely on CSS scroll-snap in `.perspective-wrapper`
}

// Expose a tiny global for Webflow/Designer hooks
// (Internals remain private inside the IIFE bundle)
if (!window.App) window.App = {};
window.App.init = init;

// Auto-init on DOM ready (safe if elements are missing)
document.addEventListener('DOMContentLoaded', () => {
  try { patchYouTubeAllowTokens(); init(); } catch (err) { console.error('[App] init error', err); }
});


