/**
 * ==================================================
 *  McCann Website — App Entry
 *  Purpose: Wire modules and expose minimal facade
 *  Date: 2025-10-28
 * ==================================================
 */

import { initAccordion } from './modules/accordion.js';
import { initLightbox } from './modules/lightbox.js';

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
}

// Expose a tiny global for Webflow/Designer hooks
// (Internals remain private inside the IIFE bundle)
if (!window.App) window.App = {};
window.App.init = init;

// Auto-init on DOM ready (safe if elements are missing)
document.addEventListener('DOMContentLoaded', () => {
  try { patchYouTubeAllowTokens(); init(); } catch (err) { console.error('[App] init error', err); }
});


