/**
 * ==================================================
 *  McCann Website — App Entry
 *  Purpose: Wire modules and expose minimal facade
 *  Date: 2025-10-28
 * ==================================================
 */

import { initAccordion } from './modules/accordion.js';
import { initLightbox } from './modules/lightbox.js';
import { initSlidesSnap } from './modules/slides.js';
import { initSlidePager } from './modules/slide-pager.js';
import { initWebflowScrollTriggers } from './modules/webflow-scrolltrigger.js';

function patchYouTubeAllowTokens(){
  const tokens = ['accelerometer','autoplay','clipboard-write','encrypted-media','gyroscope','picture-in-picture','web-share'];
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
  // Enforce page-by-page navigation for all `.slide` elements
  try { initSlidePager({ selector: '.slide', duration: 0.5, ease: 'expo.out', anchorRatio: 0.5, cooldownMs: 420 }); } catch(_) {}

  // Bridge GSAP ScrollTrigger → Webflow IX2 using the provided structure
  try { initWebflowScrollTriggers({ scrollerSelector: '.perspective-wrapper', driverSelector: '.slide--scroll-driver' }); } catch(_) {}

  // Optional: retain a subtle snap as a safety net if paging is disabled
  // Disabled here to avoid double movement
  // try { initSlidesSnap({ selector: '.slide', duration: 0.22, ease: 'power4.out', anchorRatio: 0.55, delay: 0, directional: true }); } catch(_) {}
}

// Expose a tiny global for Webflow/Designer hooks
// (Internals remain private inside the IIFE bundle)
if (!window.App) window.App = {};
window.App.init = init;

// Auto-init on DOM ready (safe if elements are missing)
document.addEventListener('DOMContentLoaded', () => {
  try { patchYouTubeAllowTokens(); init(); } catch (err) { console.error('[App] init error', err); }
});


