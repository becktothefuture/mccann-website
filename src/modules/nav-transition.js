/**
 * ==================================================
 *  McCann Website — Navigation Transition
 *  Purpose: Show preloader overlay during navigation
 *  Date: 2025-11-10
 * ==================================================
 */

console.log('[NAV-TRANSITION] Module loaded');

import { showNavigationCover, abortNavigationCover } from './preloader.js';

// ============================================================
// STATE
// ============================================================

let navContainer = null;
let isNavigating = false;
let currentNavigationUrl = null;

// Webflow IX helper (ix3 or ix2)
const wfIx = (window.Webflow && window.Webflow.require)
  ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
  : null;

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize navigation transition module
 * Intercepts nav link clicks to show preloader overlay during page transitions
 * 
 * @param {Object} options
 * @param {string} options.containerSelector - Navigation container selector
 * @param {string} options.linkSelector - Navigation link selector
 * @param {number} options.transitionDelay - Delay before navigation (ms)
 */
export function initNavTransition({
  containerSelector = '.nav',
  linkSelector = 'a.nav__link',
  transitionDelay = 300
} = {}) {
  
  console.log('[NAV-TRANSITION] Initializing...');
  
  // Find navigation container
  navContainer = document.querySelector(containerSelector);
  if (!navContainer) {
    console.log('[NAV-TRANSITION] ❌ Navigation container not found');
    return;
  }
  
  // Check for nav links
  const navLinks = navContainer.querySelectorAll(linkSelector);
  if (navLinks.length === 0) {
    console.log('[NAV-TRANSITION] ❌ No navigation links found');
    return;
  }
  
  console.log(`[NAV-TRANSITION] ✓ Found ${navLinks.length} navigation links`);
  
  // Attach delegated click handler
  navContainer.addEventListener('click', (e) => handleNavClick(e, linkSelector, transitionDelay));
  
  console.log('[NAV-TRANSITION] ✓ Initialized');
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if link should trigger navigation overlay
 * Excludes: anchors, mailto, tel, download, external, current page
 * 
 * @param {HTMLAnchorElement} link - Link element
 * @returns {boolean} Whether to use overlay
 */
function shouldUseOverlay(link) {
  if (!link || !link.href) return false;
  
  const href = link.getAttribute('href') || '';
  const url = link.href; // Full resolved URL
  
  // Skip if not a nav link
  if (!link.matches('a.nav__link')) return false;
  
  // Skip anchors (in-page navigation)
  if (href.startsWith('#')) return false;
  
  // Skip special protocols
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  
  // Skip downloads
  if (link.hasAttribute('download')) return false;
  
  // Skip external links (different origin or target="_blank")
  if (link.target === '_blank' || link.target === '_external') return false;
  
  // Skip if different origin
  try {
    const linkUrl = new URL(url);
    const currentUrl = new URL(window.location.href);
    if (linkUrl.origin !== currentUrl.origin) return false;
  } catch (e) {
    // Invalid URL, skip
    return false;
  }
  
  // Skip if same page (including hash changes)
  const currentPath = window.location.pathname + window.location.search;
  const linkPath = new URL(url).pathname + new URL(url).search;
  if (currentPath === linkPath) return false;
  
  // Skip if has data-no-transition attribute
  if (link.hasAttribute('data-no-transition')) return false;
  
  return true;
}

/**
 * Emit navigation event via Webflow IX and window
 * 
 * @param {string} eventName - Event name to emit
 * @param {Object} detail - Event detail data
 */
function emitNavigationEvent(eventName, detail = {}) {
  // Try Webflow IX
  try {
    if (wfIx && typeof wfIx.emit === 'function') {
      wfIx.emit(eventName);
    }
  } catch(err) {
    console.warn(`[NAV-TRANSITION] Cannot emit "${eventName}" to Webflow IX`, err);
  }
  
  // Always emit window event
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
  
  console.log(`[NAV-TRANSITION] 🎯 Emitted "${eventName}" event`, detail);
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Handle navigation link clicks
 * 
 * @param {Event} e - Click event
 * @param {string} linkSelector - Selector for nav links
 * @param {number} transitionDelay - Delay before navigation
 */
async function handleNavClick(e, linkSelector, transitionDelay) {
  // Find clicked link
  const link = e.target.closest(linkSelector);
  if (!link) return;
  
  // Check if we should intercept
  if (!shouldUseOverlay(link)) return;
  
  // Prevent default navigation
  e.preventDefault();
  
  // Guard against multiple navigations
  if (isNavigating) {
    console.log('[NAV-TRANSITION] ⚠️ Navigation already in progress');
    return;
  }
  
  const targetUrl = link.href;
  isNavigating = true;
  currentNavigationUrl = targetUrl;
  
  console.log(`[NAV-TRANSITION] 🎯 Navigating to: ${targetUrl}`);
  
  // Emit navigation start event
  emitNavigationEvent('navigation:start', { url: targetUrl });
  
  try {
    // Show navigation cover and wait for it
    await showNavigationCover({ delay: transitionDelay });
    
    // Double-check we haven't been aborted
    if (!isNavigating || currentNavigationUrl !== targetUrl) {
      console.log('[NAV-TRANSITION] ⚠️ Navigation was aborted');
      return;
    }
    
    // Navigate to target
    window.location.href = targetUrl;
    
  } catch (err) {
    console.error('[NAV-TRANSITION] ❌ Error during navigation:', err);
    
    // Abort cover and reset state
    abortNavigation();
    
    // Fallback: navigate anyway
    window.location.href = targetUrl;
  }
}

/**
 * Abort current navigation
 */
function abortNavigation() {
  if (!isNavigating) return;
  
  console.log('[NAV-TRANSITION] ❌ Aborting navigation');
  
  isNavigating = false;
  currentNavigationUrl = null;
  
  // Abort preloader cover
  abortNavigationCover();
  
  // Emit abort event
  emitNavigationEvent('navigation:abort');
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Listen for popstate (back/forward navigation)
// Abort any in-progress navigation when user navigates via browser buttons
window.addEventListener('popstate', () => {
  if (isNavigating) {
    console.log('[NAV-TRANSITION] ⚠️ Browser navigation detected, aborting overlay');
    abortNavigation();
  }
});

// ============================================================
// CLEANUP & API
// ============================================================

/**
 * Cleanup function for unmounting
 */
export function cleanupNavTransition() {
  if (navContainer) {
    // Remove click handler (would need to store reference for proper removal)
    navContainer = null;
  }
  
  isNavigating = false;
  currentNavigationUrl = null;
  
  console.log('[NAV-TRANSITION] Cleaned up');
}

// Expose minimal API
if (typeof window !== 'undefined') {
  window.App = window.App || {};
  window.App.navTransition = {
    cleanup: cleanupNavTransition,
    abort: abortNavigation
  };
}
