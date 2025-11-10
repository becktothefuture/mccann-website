/**
 * ==================================================
 *  McCann Website — Lightbox Module
 *  Purpose: Dynamic project lightbox with JSON data and state machine
 *  Date: 2025-11-06
 * ==================================================
 */

import { emit } from '../core/events.js';
import { lockScroll, unlockScroll } from '../core/scrolllock.js';
import { mountVimeo } from './vimeo.js';
import { initContainerScroll } from './smooth-scroll.js';
import projectDataJson from '../data/project-data.json';

console.log('[LIGHTBOX] Module loaded');

// ============================================================
// STATE MACHINE
// ============================================================

const STATE = {
  IDLE: 'idle',
  OPENING: 'opening',
  OPEN: 'open',
  CLOSING: 'closing'
};

// ============================================================
// MODULE STATE
// ============================================================

let currentState = STATE.IDLE;
let projectData = null;
let lastFocus = null;
let overlayLenis = null;

export function initLightbox({ 
  root = '#lightbox',
  openDuration = 1500,
  closeDuration = 1500
} = {}) {
  // ============================================================
  // SETUP & DOM REFERENCES
  // ============================================================
  
  const lb = document.querySelector(root);
  if (!lb) { 
    console.log('[LIGHTBOX] ❌ Element not found');
    return;
  }

  const inner = lb.querySelector('.lightbox__inner');
  const videoArea = lb.querySelector('.video-area');
  const overlay = lb.querySelector('.lightbox__overlay');
  const closeBtn = document.querySelector('#close-btn');
  const detailsBtn = document.querySelector('#details-btn');
  const slides = document.querySelectorAll('.slide');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clientEl = document.querySelector('#lightbox-client');
  const titleEl = document.querySelector('#lightbox-title');
  const truthEl = document.querySelector('#lightbox-truth');
  const truthWellToldEl = document.querySelector('#lightbox-truthwelltold');
  const descriptionEl = document.querySelector('#lightbox-description');
  const awardsContainer = document.querySelector('#lightbox-awards');

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  // Ensure lightbox is hidden initially (fail-safe)
  lb.style.display = 'none';
  lb.style.pointerEvents = 'none';
  
  lb.setAttribute('role', lb.getAttribute('role') || 'dialog');
  lb.setAttribute('aria-modal', lb.getAttribute('aria-modal') || 'true');
  lb.setAttribute('aria-hidden', 'true');
  lb.setAttribute('data-state', STATE.IDLE);
  
  // Ensure scroll is unlocked on init (fail-safe)
  unlockScroll({ delayMs: 0 });
  
  // Extra fail-safe: ensure body and wrapper are not locked
  document.body.classList.remove('modal-open', 'preloader-active');
  document.body.style.overflow = '';
  const perspectiveWrapper = document.querySelector('.perspective-wrapper');
  if (perspectiveWrapper) {
    perspectiveWrapper.classList.remove('modal-open');
    perspectiveWrapper.style.overflow = '';
  }
  
  // Use project data from slides module (single source of truth)
  // Falls back to direct import if slides module hasn't initialized yet
  projectData = (window.App?.slides?.getProjectData?.()) || projectDataJson;
  const projectCount = Object.keys(projectData).length;
  const dataSource = window.App?.slides?.getProjectData ? 'slides module' : 'bundled JSON';
  console.log(`[LIGHTBOX] ✓ Loaded ${projectCount} project${projectCount !== 1 ? 's' : ''} from ${dataSource}`);

  // ============================================================
  // VALIDATION
  // ============================================================
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 LIGHTBOX SETUP VALIDATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Track validation status
  let validationErrors = [];
  let validationWarnings = [];

  console.log('1️⃣  Main Container & Structure');
  console.log(`   ✓ Found: ${root}`);
  console.log(`   ✓ State machine initialized: ${currentState}`);
  console.log(`   ⏱️  Open duration: ${openDuration}ms (must match Webflow 'lb:show' animation)`);
  console.log(`   ⏱️  Close duration: ${closeDuration}ms (must match Webflow 'lb:hide' animation)`);
  
  // Check critical structure elements
  if (inner) {
    console.log(`   ✓ .lightbox__inner found`);
  } else {
    console.log(`   ❌ .lightbox__inner NOT found`);
    validationErrors.push('.lightbox__inner missing');
  }
  
  if (overlay) {
    console.log(`   ✓ .lightbox__overlay found (smooth scroll container)`);
  } else {
    console.log(`   ⚠️  .lightbox__overlay NOT found (smooth scroll will be skipped)`);
    validationWarnings.push('.lightbox__overlay missing');
  }
  
  if (videoArea) {
    console.log(`   ✓ .video-area found`);
  } else {
    console.log(`   ❌ .video-area NOT found`);
    validationErrors.push('.video-area missing');
  }
  
  console.log('\n2️⃣  Content Injection Targets');
  const contentTargets = [
    { el: clientEl, id: '#lightbox-client', required: true },
    { el: titleEl, id: '#lightbox-title', required: true },
    { el: truthEl, id: '#lightbox-truth', required: false },
    { el: truthWellToldEl, id: '#lightbox-truthwelltold', required: false },
    { el: descriptionEl, id: '#lightbox-description', required: true },
    { el: awardsContainer, id: '#lightbox-awards', required: true }
  ];
  
  contentTargets.forEach(({ el, id, required }) => {
    if (el) {
      console.log(`   ✓ ${id}`);
    } else if (required) {
      console.log(`   ❌ ${id} NOT found (REQUIRED)`);
      validationErrors.push(`${id} missing`);
    } else {
      console.log(`   ⚠️  ${id} NOT found (optional)`);
      validationWarnings.push(`${id} missing`);
    }
  });
  
  console.log('\n3️⃣  Interactive Elements');
  if (closeBtn) {
    console.log(`   ✓ #close-btn found`);
  } else {
    console.log(`   ❌ #close-btn NOT found`);
    validationErrors.push('#close-btn missing');
  }
  
  console.log(`\n4️⃣  Slide Triggers & Links`);
  console.log(`   ${slides.length > 0 ? '✓' : '❌'} Found: ${slides.length} .slide element${slides.length !== 1 ? 's' : ''}`);
  
  if (slides.length === 0) {
    validationErrors.push('No .slide elements found');
  } else {
    // Validate each slide has a .slide__link
    let slidesWithLinks = 0;
    let slidesWithoutLinks = [];
    
    slides.forEach((slide, index) => {
      const link = slide.querySelector('.slide__link');
      if (link) {
        slidesWithLinks++;
      } else {
        slidesWithoutLinks.push(index);
      }
    });
    
    console.log(`   ${slidesWithLinks === slides.length ? '✓' : '⚠️'} ${slidesWithLinks}/${slides.length} slides have .slide__link`);
    
    if (slidesWithoutLinks.length > 0) {
      console.log(`   ⚠️  Missing .slide__link in slide indices: ${slidesWithoutLinks.join(', ')}`);
      validationWarnings.push(`${slidesWithoutLinks.length} slides missing .slide__link`);
    }
  }
  
  // Validate slide data immediately (data is already loaded)
  validateSlideData();
  
  console.log('\n5️⃣  Webflow IX Setup');
  const wfIx = (window.Webflow && window.Webflow.require)
    ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
    : null;
  
  if (wfIx) {
    const version = window.Webflow.require('ix3') ? 'IX3' : 'IX2';
    console.log(`   ✓ Webflow ${version} detected`);
  } else {
    console.log('   ⚠️  Webflow IX NOT detected');
    validationWarnings.push('Webflow IX not detected');
  }
  
  console.log('\n   📋 Required Custom Events in Webflow:');
  console.log('      • "lb:show" → triggers open animation');
  console.log('      • "lb:hide" → triggers close animation');
  console.log(`      • Durations MUST match: open=${openDuration}ms, close=${closeDuration}ms`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Summary
  if (validationErrors.length > 0) {
    console.log('❌ VALIDATION FAILED');
    console.log(`   ${validationErrors.length} critical error${validationErrors.length !== 1 ? 's' : ''}:`);
    validationErrors.forEach(err => console.log(`   • ${err}`));
  } else {
    console.log('✅ VALIDATION COMPLETE - All critical elements found');
  }
  
  if (validationWarnings.length > 0) {
    console.log(`\n⚠️  ${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''}:`);
    validationWarnings.forEach(warn => console.log(`   • ${warn}`));
  }
  
  console.log('');

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  function validateSlideData() {
    if (!projectData) return;
    
    let validSlides = 0;
    let missingData = [];
    
    slides.forEach((slide, index) => {
      const projectId = slide.dataset.project;
      if (!projectId) {
        missingData.push(`Slide ${index}: missing data-project attribute`);
      } else if (!projectData[projectId]) {
        missingData.push(`Slide ${index}: project ID "${projectId}" not found in JSON`);
      } else {
        const project = projectData[projectId];
        // Validate required video IDs
        if (!project.vimeoId || project.vimeoId === '000000000') {
          missingData.push(`Slide ${index} (${projectId}): missing or invalid vimeoId`);
        }
        if (!project.vimeoPreviewId || project.vimeoPreviewId === '000000000') {
          missingData.push(`Slide ${index} (${projectId}): missing or invalid vimeoPreviewId`);
        }
        validSlides++;
      }
    });
    
    console.log(`[LIGHTBOX] ✓ Valid slides: ${validSlides}/${slides.length}`);
    if (missingData.length > 0) {
      console.warn('[LIGHTBOX] ⚠️  Issues found:');
      missingData.forEach(msg => console.warn(`   - ${msg}`));
    }
  }
  
  function emitWebflowEvent(name) {
    try {
      if (window.Webflow && window.Webflow.require) {
        const wfIx = window.Webflow.require('ix3') || window.Webflow.require('ix2');
        if (wfIx && typeof wfIx.emit === 'function') {
          wfIx.emit(name);
          console.log(`🎬 [LIGHTBOX] Triggered animation: "${name}"`);
        } else {
          console.warn(`⚠️  [LIGHTBOX] Cannot emit "${name}" - wfIx.emit not available`);
        }
      } else {
        console.warn(`⚠️  [LIGHTBOX] Cannot emit "${name}" - Webflow IX not available`);
      }
    } catch(err) {
      console.error(`❌ [LIGHTBOX] Error emitting "${name}":`, err);
    }
    
    // Always emit window event for external listeners
    window.dispatchEvent(new CustomEvent(name));
  }

  function setPageInert(on) {
    const siblings = Array.from(document.body.children).filter(n => n !== lb);
    siblings.forEach(n => {
      try {
        if ('inert' in n) n.inert = !!on;
      } catch {}
      if (on) n.setAttribute('aria-hidden', 'true');
      else n.removeAttribute('aria-hidden');
    });
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    
    const focusables = lb.querySelectorAll([
      'a[href]','button','input','select','textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','));
    
    const list = Array.from(focusables).filter(
      el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
    
    if (list.length === 0) { 
      e.preventDefault(); 
      (inner || lb).focus(); 
      return; 
    }
    
    const first = list[0];
    const last = list[list.length - 1];
    
    if (e.shiftKey && document.activeElement === first) { 
      e.preventDefault(); 
      last.focus(); 
    } else if (!e.shiftKey && document.activeElement === last) { 
      e.preventDefault(); 
      first.focus(); 
    }
  }

  function getProjectById(id) {
    if (!projectData[id]) {
      console.error(`[LIGHTBOX] ❌ Project "${id}" not found in JSON`);
      return null;
    }
    return projectData[id];
  }

  async function waitForImages(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return;
    
    console.log(`[LIGHTBOX] ⏳ Loading ${imageUrls.length} images...`);
    
    const promises = imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          img.decode()
            .then(() => resolve())
            .catch(() => resolve()); // Decode failed, but continue
        };
        img.onerror = () => {
          console.warn(`[LIGHTBOX] ⚠️  Failed to load image: ${url}`);
          resolve(); // Don't block on failed images
        };
        img.src = url;
      });
    });
    
    await Promise.all(promises);
    console.log(`[LIGHTBOX] ✓ All images loaded`);
  }

  async function injectContent(project) {
    console.log(`[LIGHTBOX] 📝 Injecting content for: ${project.title}`);
    
    // Inject text content
    if (clientEl) clientEl.textContent = project.client || '';
    if (titleEl) titleEl.textContent = project.title || '';
    if (truthEl) truthEl.textContent = project.truth || '';
    if (truthWellToldEl) truthWellToldEl.textContent = project.truthWellTold || '';
    if (descriptionEl) descriptionEl.textContent = project.description || '';
    
    // Inject award images
    if (awardsContainer && project.awards) {
      awardsContainer.innerHTML = '';
      project.awards.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Award';
        img.loading = 'eager'; // Load immediately, not lazy
        awardsContainer.appendChild(img);
      });
    }
    
    // Mount Vimeo video
    if (videoArea) {
      if (!project.vimeoId || project.vimeoId === '000000000') {
        console.error(`[LIGHTBOX] ❌ Missing or invalid vimeoId for project "${projectId}"`);
      } else {
        mountVimeo(videoArea, project.vimeoId, { 
          autoplay: 1, 
          muted: 1,
          autopause: 0,
          controls: 0, 
          background: 1,
          playsinline: 1, 
          loop: 1,
          dnt: 1 
        });
      }
    }
    
    // Wait for award images to load before opening
    if (project.awards && project.awards.length > 0) {
      await waitForImages(project.awards);
    }
    
    console.log(`[LIGHTBOX] ✓ Content injected`);
  }

  function setState(newState) {
    currentState = newState;
    lb.setAttribute('data-state', newState);
    console.log(`[LIGHTBOX] State: ${newState}`);
  }

  function disableSlideInteractions() {
    slides.forEach(slide => {
      const link = slide.querySelector('.slide__link');
      if (link) {
        link.classList.add('is-disabled');
        link.setAttribute('aria-disabled', 'true');
        link.style.pointerEvents = 'none'; // Extra safety against race conditions
      }
    });
    console.log('[LIGHTBOX] 🚫 Slide links disabled');
  }

  function enableSlideInteractions() {
    slides.forEach(slide => {
      const link = slide.querySelector('.slide__link');
      if (link) {
        link.classList.remove('is-disabled');
        link.removeAttribute('aria-disabled');
        link.style.pointerEvents = ''; // Restore pointer events
      }
    });
    console.log('[LIGHTBOX] ✓ Slide links re-enabled');
  }

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================
  
  async function openFromSlide(slide) {
    // Guard: only open from IDLE state
    if (currentState !== STATE.IDLE) {
      console.log('[LIGHTBOX] ⚠️  Cannot open - already opening/open/closing');
      return;
    }
    
    // Validate data-project attribute
    const projectId = slide?.dataset?.project;
    if (!projectId) {
      console.error('[LIGHTBOX] ❌ Slide missing data-project attribute');
      return;
    }
    
    // Get project data
    const project = getProjectById(projectId);
    if (!project) {
      console.error(`[LIGHTBOX] ❌ Project "${projectId}" not found in JSON`);
      return;
    }
    
    // Change state to OPENING immediately (synchronously) to prevent double-trigger
    setState(STATE.OPENING);
    
    // Disable pointer events on all slides immediately
    disableSlideInteractions();
    
    // Save focus for restoration
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    
    try {
      // Inject content and wait for images to load
      await injectContent(project);
      
      // Lock scroll and make background inert
      setPageInert(true);
      lockScroll();
      
      // Stop smooth scroll if active
      if (window.App?.smoothScroll?.stop) {
        window.App.smoothScroll.stop();
      }
      
      // Update ARIA
      lb.setAttribute('aria-hidden', 'false');
      
      // Trigger GSAP open animation via Webflow IX
      // GSAP will handle visibility (opacity, display, etc.)
      emitWebflowEvent('lb:show');
      
      // Wait for GSAP animation to complete, then call finishOpen
      // IMPORTANT: This duration MUST match Webflow IX3 animation duration
      setTimeout(() => {
        finishOpen();
      }, openDuration);
      
      // Emit event for external listeners
      emit('LIGHTBOX_OPEN', lb, project);
      
    } catch(err) {
      console.error('[LIGHTBOX] ❌ Error opening:', err);
      // Revert to IDLE on error
      setState(STATE.IDLE);
      enableSlideInteractions(); // Re-enable on error
    }
  }

  function finishOpen() {
    console.log('[LIGHTBOX] ✓ Open animation complete');
    
    // Change state to OPEN → allow closing
    setState(STATE.OPEN);
    
    // Initialize smooth scroll for overlay if it exists
    if (overlay) {
      requestAnimationFrame(() => {
        overlayLenis = initContainerScroll(overlay, {
          lerp: 0.08,
          smoothWheel: true,
          smoothTouch: false
        });
      });
    }
    
    // Set focus to lightbox for keyboard navigation
    lb.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => {
      (inner || lb).focus();
    });
    
    emit('LIGHTBOX_OPENED', lb);
  }

  function requestClose() {
    // Guard: only close from OPEN state
    if (currentState !== STATE.OPEN) {
      console.log('[LIGHTBOX] ⚠️  Cannot close - not open');
      return;
    }
    
    // Change state to CLOSING
    setState(STATE.CLOSING);
    
    // Emit event for external listeners
    emit('LIGHTBOX_CLOSE', lb);
    
    // Trigger GSAP close animation via Webflow IX
    // GSAP will handle visibility (fade out, etc.)
    emitWebflowEvent('lb:hide');
    
    // Calculate delay based on user's motion preference
    const hideDelay = prefersReduced ? 0 : closeDuration;
    
    // Wait for GSAP animation to complete, then call finishClose
    // IMPORTANT: This duration MUST match Webflow IX3 animation duration
    // All cleanup happens inside finishClose() for guaranteed sequencing
    setTimeout(() => {
      finishClose();
    }, hideDelay);
  }

  function finishClose() {
    console.log('[LIGHTBOX] ✓ Close animation complete');
    
    // Update ARIA
    lb.setAttribute('aria-hidden', 'true');
    
    // Make page accessible again
    setPageInert(false);
    
    // Destroy overlay smooth scroll instance FIRST (before unlocking scroll)
    if (overlayLenis) {
      try {
        overlayLenis.destroy();
        overlayLenis = null;
        console.log('[LIGHTBOX] ✓ Overlay smooth scroll destroyed');
      } catch (err) {
        console.warn('[LIGHTBOX] Error destroying overlay scroll:', err);
      }
    }
    
    // Unlock scroll (must happen after overlay scroll is destroyed)
    unlockScroll({ delayMs: 0 });
    console.log('[LIGHTBOX] ✓ Scroll unlocked');
    
    // Restart main smooth scroll if it exists
    if (window.App?.smoothScroll?.start) {
      requestAnimationFrame(() => {
        window.App.smoothScroll.start();
        console.log('[LIGHTBOX] ✓ Main smooth scroll restarted');
      });
    }
    
    // Re-enable slide interactions (after scroll is unlocked)
    enableSlideInteractions();
    
    // Clear content
    if (videoArea) videoArea.innerHTML = '';
    if (awardsContainer) awardsContainer.innerHTML = '';
    if (clientEl) clientEl.textContent = '';
    if (titleEl) titleEl.textContent = '';
    if (truthEl) truthEl.textContent = '';
    if (truthWellToldEl) truthWellToldEl.textContent = '';
    if (descriptionEl) descriptionEl.textContent = '';
    
    // Restore focus to element that opened lightbox
    if (lastFocus && document.body.contains(lastFocus)) {
      lastFocus.focus();
    }
    
    // Change state to IDLE → ready to open again (LAST STEP)
    setState(STATE.IDLE);
    
    emit('LIGHTBOX_CLOSED', lb);
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  
  // Use event delegation for slide link clicks (more scalable)
  const slidesContainer = slides[0]?.parentElement;
  
  function handleSlideClick(e) {
    // Find clicked .slide__link
    const link = e.target.closest('.slide__link');
    if (!link) return;
    
    // Early state check - prevent any interaction if not IDLE
    if (currentState !== STATE.IDLE) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Find parent .slide
    const slide = link.closest('.slide');
    if (!slide) {
      console.warn('[LIGHTBOX] ⚠️  .slide__link found but parent .slide missing');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Open lightbox with parent slide data
    openFromSlide(slide);
  }
  
  function handleCloseBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (currentState === STATE.OPEN) {
      console.log('[LIGHTBOX] 🎯 Close button clicked');
      requestClose();
    }
  }
  
  function handleKeydown(e) {
    if (currentState === STATE.OPEN) {
      if (e.key === 'Escape') {
        console.log('[LIGHTBOX] 🎯 Escape key pressed');
        requestClose();
      }
      if (e.key === 'Tab') {
        trapFocus(e);
      }
    }
  }
  
  function handleDetailsClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[LIGHTBOX] 🚫 Details button disabled for testing');
    // TODO: Will emit 'details:show' event here later
  }
  
  // Attach delegated listener to slides container
  if (slidesContainer) {
    slidesContainer.addEventListener('click', handleSlideClick, { passive: false });
    console.log(`[LIGHTBOX] ✓ Delegated click handler attached to container (${slides.length} slides)`);
  } else {
    console.warn('[LIGHTBOX] ⚠️  Could not find slides container for event delegation');
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', handleCloseBtnClick);
  } else {
    console.warn('[LIGHTBOX] ⚠️  #close-btn not found - only Escape key will close');
  }
  
  // Details button - DISABLED FOR TESTING
  // Prevents accidental triggering of lb events
  if (detailsBtn) {
    detailsBtn.addEventListener('click', handleDetailsClick, { passive: false });
    detailsBtn.style.opacity = '0.5';  // Visual feedback (dimmed)
    detailsBtn.style.cursor = 'not-allowed';
    console.log('[LIGHTBOX] ⚠️  Details button temporarily disabled for testing');
  }

  document.addEventListener('keydown', handleKeydown);
  
  console.log('[LIGHTBOX] ✓ Initialized and ready\n');
  
  // ============================================================
  // CLEANUP & API EXPOSURE
  // ============================================================
  
  function cleanup() {
    // Remove event listeners
    if (slidesContainer) {
      slidesContainer.removeEventListener('click', handleSlideClick);
    }
    if (closeBtn) {
      closeBtn.removeEventListener('click', handleCloseBtnClick);
    }
    if (detailsBtn) {
      detailsBtn.removeEventListener('click', handleDetailsClick);
    }
    document.removeEventListener('keydown', handleKeydown);
    
    // Destroy overlay scroll if exists
    if (overlayLenis) {
      try {
        overlayLenis.destroy();
        overlayLenis = null;
      } catch (err) {
        console.warn('[LIGHTBOX] Error destroying overlay scroll on cleanup:', err);
      }
    }
    
    // Unlock scroll and reset state
    unlockScroll({ delayMs: 0 });
    setPageInert(false);
    enableSlideInteractions();
    currentState = STATE.IDLE;
    
    console.log('[LIGHTBOX] ✓ Cleanup complete');
  }
  
  function openProjectById(projectId) {
    const slide = Array.from(slides).find(s => s.dataset.project === projectId);
    if (!slide) {
      console.error(`[LIGHTBOX] ❌ No slide found for project: "${projectId}"`);
      return false;
    }
    openFromSlide(slide);
    return true;
  }
  
  function getState() {
    return {
      current: currentState,
      isIdle: currentState === STATE.IDLE,
      isOpen: currentState === STATE.OPEN,
      isTransitioning: currentState === STATE.OPENING || currentState === STATE.CLOSING
    };
  }
  
  // Expose API for debugging and programmatic control
  window.App = window.App || {};
  window.App.lightbox = {
    open: openProjectById,
    close: requestClose,
    getState,
    cleanup
  };
}
