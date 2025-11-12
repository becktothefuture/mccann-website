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
let detailsOpen = false; // Track details overlay state
let overlayHideTimeout = null; // Fallback timer to hide overlay if Webflow animation misses
let isDebugEnabled = false;

const debugLog = (...args) => {
  if (!isDebugEnabled) {
    return;
  }
  console.log(...args);
};

export function initLightbox({ 
  root = '#lightbox',
  openDuration = 1500,
  closeDuration = 1500,
  debug = false
} = {}) {
  // ============================================================
  // SETUP & DOM REFERENCES
  // ============================================================
  
  isDebugEnabled = Boolean(debug);
  
  const lb = document.querySelector(root);
  if (!lb) { 
    console.error('[LIGHTBOX] ❌ Element not found');
    return;
  }

  const inner = lb.querySelector('.lightbox__inner');
  const videoArea = lb.querySelector('.video-area');
  const overlay = lb.querySelector('.lightbox__overlay');
  const closeBtn = document.querySelector('#close-btn');
  const detailsBtn = document.querySelector('#details-btn');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inertTargets = new Set();
  
  // Get slides dynamically (they're built before lightbox initializes)
  const getSlides = () => document.querySelectorAll('.slide');
  const slides = getSlides();

  // Content elements with fallback to ID selectors for backward compatibility
  const clientEl = lb.querySelector('[data-field="lightbox-client"]') || document.querySelector('#lightbox-client');
  const titleEl = lb.querySelector('[data-field="lightbox-title"]') || document.querySelector('#lightbox-title');
  const truthEl = lb.querySelector('[data-field="lightbox-truth"]') || document.querySelector('#lightbox-truth');
  const truthWellToldEl = lb.querySelector('[data-field="lightbox-truthwelltold"]') || document.querySelector('#lightbox-truthwelltold');
  const descriptionEl = lb.querySelector('[data-field="lightbox-description"]') || document.querySelector('#lightbox-description');
  const impactEl = lb.querySelector('[data-field="lightbox-impact"]') || document.querySelector('#lightbox-impact');
  const impactWrapper = impactEl?.closest?.('#lightbox-impact')
    || (impactEl?.id === 'lightbox-impact' ? impactEl : null)
    || lb.querySelector('#lightbox-impact');

  if (impactWrapper) {
    // Hide impact block by default → revealed only when JSON provides content
    impactWrapper.style.display = 'none';
    impactWrapper.setAttribute('aria-hidden', 'true');
  }
  const awardsContainer = lb.querySelector('[data-field="lightbox-awards"]') || document.querySelector('#lightbox-awards');

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
  debugLog(`[LIGHTBOX] ✓ Loaded ${projectCount} project${projectCount !== 1 ? 's' : ''} from ${dataSource}`);

  // ============================================================
  // VALIDATION
  // ============================================================
  
  debugLog('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  debugLog('🔍 LIGHTBOX SETUP VALIDATION');
  debugLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Track validation status
  let validationErrors = [];
  let validationWarnings = [];

  debugLog('1️⃣  Main Container & Structure');
  debugLog(`   ✓ Found: ${root}`);
  debugLog(`   ✓ State machine initialized: ${currentState}`);
  debugLog(`   ⏱️  Open duration: ${openDuration}ms (must match Webflow 'lb:show' animation)`);
  debugLog(`   ⏱️  Close duration: ${closeDuration}ms (must match Webflow 'lb:hide' animation)`);
  
  // Check critical structure elements
  if (inner) {
    debugLog(`   ✓ .lightbox__inner found`);
  } else {
    debugLog(`   ❌ .lightbox__inner NOT found`);
    validationErrors.push('.lightbox__inner missing');
  }
  
  if (overlay) {
    debugLog(`   ✓ .lightbox__overlay found (details overlay container)`);
  } else {
    debugLog(`   ⚠️  .lightbox__overlay NOT found (details overlay disabled)`);
    validationWarnings.push('.lightbox__overlay missing');
  }
  
  if (videoArea) {
    debugLog(`   ✓ .video-area found`);
  } else {
    debugLog(`   ❌ .video-area NOT found`);
    validationErrors.push('.video-area missing');
  }
  
  debugLog('\n2️⃣  Content Injection Targets');
  const contentTargets = [
    { el: clientEl, id: '[data-field="lightbox-client"]', required: true },
    { el: titleEl, id: '[data-field="lightbox-title"]', required: true },
    { el: truthEl, id: '[data-field="lightbox-truth"]', required: false },
    { el: truthWellToldEl, id: '[data-field="lightbox-truthwelltold"]', required: false },
    { el: descriptionEl, id: '[data-field="lightbox-description"]', required: true },
    { el: impactEl, id: '[data-field="lightbox-impact"]', required: false },
    { el: awardsContainer, id: '[data-field="lightbox-awards"]', required: true }
  ];
  
  contentTargets.forEach(({ el, id, required }) => {
    if (el) {
      debugLog(`   ✓ ${id}`);
    } else if (required) {
      debugLog(`   ❌ ${id} NOT found (REQUIRED)`);
      validationErrors.push(`${id} missing`);
    } else {
      debugLog(`   ⚠️  ${id} NOT found (optional)`);
      validationWarnings.push(`${id} missing`);
    }
  });
  
  debugLog('\n3️⃣  Interactive Elements');
  if (closeBtn) {
    debugLog(`   ✓ #close-btn found`);
  } else {
    debugLog(`   ❌ #close-btn NOT found`);
    validationErrors.push('#close-btn missing');
  }
  
  debugLog(`\n4️⃣  Slide Triggers`);
  const currentSlides = getSlides();
  debugLog(`   ${currentSlides.length > 0 ? '✓' : '❌'} Found: ${currentSlides.length} .slide element${currentSlides.length !== 1 ? 's' : ''}`);
  
  if (currentSlides.length === 0) {
    validationErrors.push('No .slide elements found');
  } else {
    // Validate each slide has data-project attribute (required for lightbox)
    let slidesWithData = 0;
    let slidesWithoutData = [];
    
    currentSlides.forEach((slide, index) => {
      if (slide.dataset.project) {
        slidesWithData++;
      } else {
        slidesWithoutData.push(index);
      }
    });
    
    debugLog(`   ${slidesWithData === currentSlides.length ? '✓' : '⚠️'} ${slidesWithData}/${currentSlides.length} slides have data-project attribute`);
    
    if (slidesWithoutData.length > 0) {
      debugLog(`   ⚠️  Missing data-project in slide indices: ${slidesWithoutData.join(', ')}`);
      validationWarnings.push(`${slidesWithoutData.length} slides missing data-project attribute`);
    }
    
    debugLog(`   ℹ️  Entire .slide element is clickable (not just .slide__link)`);
  }
  
  // Validate slide data immediately (data is already loaded)
  validateSlideData();
  
  debugLog('\n5️⃣  Webflow IX Setup');
  const wfIx = (window.Webflow && window.Webflow.require)
    ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
    : null;
  
  if (wfIx) {
    const version = window.Webflow.require('ix3') ? 'IX3' : 'IX2';
    debugLog(`   ✓ Webflow ${version} detected`);
  } else {
    debugLog('   ⚠️  Webflow IX NOT detected');
    validationWarnings.push('Webflow IX not detected');
  }
  
  debugLog('\n   📋 Required Custom Events in Webflow:');
  debugLog('      • "lb:show" → triggers open animation');
  debugLog('      • "lb:hide" → triggers close animation');
  debugLog(`      • Durations MUST match: open=${openDuration}ms, close=${closeDuration}ms`);
  
  debugLog('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Summary
  if (validationErrors.length > 0) {
    debugLog('❌ VALIDATION FAILED');
    debugLog(`   ${validationErrors.length} critical error${validationErrors.length !== 1 ? 's' : ''}:`);
    validationErrors.forEach(err => debugLog(`   • ${err}`));
  } else {
    debugLog('✅ VALIDATION COMPLETE - All critical elements found');
  }
  
  if (validationWarnings.length > 0) {
    debugLog(`\n⚠️  ${validationWarnings.length} warning${validationWarnings.length !== 1 ? 's' : ''}:`);
    validationWarnings.forEach(warn => debugLog(`   • ${warn}`));
  }
  
  debugLog('');

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  function validateSlideData() {
    if (!projectData) return;
    
    const currentSlides = getSlides();
    let validSlides = 0;
    let missingData = [];
    
    currentSlides.forEach((slide, index) => {
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
    
    debugLog(`[LIGHTBOX] ✓ Valid slides: ${validSlides}/${currentSlides.length}`);
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
          debugLog(`🎬 [LIGHTBOX] Triggered animation: "${name}"`);
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
    // Block background page interaction when lightbox is open
    // Must use removeAttribute() not setAttribute('inert', false) → still blocks interaction
    if (on) {
      inertTargets.clear();
      const siblings = Array.from(document.body.children).filter(node => node !== lb);
      siblings.forEach(node => {
        try {
          node.setAttribute('inert', '');
          node.setAttribute('aria-hidden', 'true');
          inertTargets.add(node);
        } catch (err) {
          console.warn('[LIGHTBOX] Error setting inert:', err);
        }
      });
      debugLog(`[LIGHTBOX] 🚫 Inert applied to ${inertTargets.size} element${inertTargets.size === 1 ? '' : 's'}`);
      return;
    }

    let removedFromTracked = 0;
    inertTargets.forEach(node => {
      try {
        if (!node.parentNode) {
          return;
        }
        if (node.hasAttribute('inert')) {
          node.removeAttribute('inert');
          node.removeAttribute('aria-hidden');
          removedFromTracked++;
        }
      } catch (err) {
        console.warn('[LIGHTBOX] Error removing inert from tracked element:', err);
      }
    });

    // Defensive sweep in case DOM mutated while lightbox was open
    const siblings = Array.from(document.body.children).filter(node => node !== lb);
    let sweepCount = 0;
    siblings.forEach(node => {
      try {
        if (node.hasAttribute('inert')) {
          node.removeAttribute('inert');
          node.removeAttribute('aria-hidden');
          sweepCount++;
        }
      } catch (err) {
        console.warn('[LIGHTBOX] Error removing inert during sweep:', err);
      }
    });

    inertTargets.clear();
    debugLog(`[LIGHTBOX] ✓ Inert removed (${removedFromTracked} tracked, ${sweepCount} swept)`);

    // Final verification on next frame → catches late mutations from Webflow/GSAP
    requestAnimationFrame(() => {
      const lingering = Array.from(document.body.children).filter(node => node !== lb && node.hasAttribute('inert'));
      if (lingering.length > 0) {
        console.error(`[LIGHTBOX] ❌ Found ${lingering.length} lingering inert element${lingering.length === 1 ? '' : 's'}:`, lingering);
        lingering.forEach(node => {
          try {
            node.removeAttribute('inert');
            node.removeAttribute('aria-hidden');
          } catch (err) {
            console.warn('[LIGHTBOX] Error removing lingering inert element:', err);
          }
        });
      } else {
        debugLog('[LIGHTBOX] ✓ Verified no lingering inert attributes');
      }
    });
  }

  function debugPointerSnapshot(label) {
    const overlayPointer = overlay ? (overlay.style.pointerEvents || '(unset)') : 'n/a';
    const overlayOverflow = overlay ? (overlay.style.overflowY || '(unset)') : 'n/a';
    const overlayDisplay = overlay ? (overlay.style.display || '(unset)') : 'n/a';
    const lbPointer = lb ? (lb.style.pointerEvents || '(unset)') : 'n/a';
    debugLog(`[LIGHTBOX] 🧪 ${label} → state=${currentState} detailsOpen=${detailsOpen} overlay.display=${overlayDisplay} overlay.pointerEvents=${overlayPointer} overlay.overflowY=${overlayOverflow} lb.pointerEvents=${lbPointer}`);
  }

  function clearOverlayHideTimeout() {
    if (!overlayHideTimeout) return;
    clearTimeout(overlayHideTimeout);
    overlayHideTimeout = null;
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

  function renderAwards(awardsData) {
    debugLog(`[LIGHTBOX] 🏆 Rendering awards: ${awardsData?.length || 0} awards`);
    
    // First hide all award elements (check both new data attributes and old ID pattern)
    const allAwards = [...lb.querySelectorAll('[data-award-type]'), ...document.querySelectorAll('[id^="award-"]')];
    allAwards.forEach(el => {
      el.style.display = 'none';
    });
    
    // If no awards data, we're done
    if (!awardsData || awardsData.length === 0) {
      debugLog('[LIGHTBOX] No awards to display');
      return;
    }
    
    // Show and populate each award
    awardsData.forEach((award, index) => {
      // Try new data attribute first, then fallback to old ID pattern
      const awardEl = lb.querySelector(`[data-award-type="${award.type}"]`) || document.getElementById(`award-${award.type}`);
      
      if (!awardEl) {
        console.warn(`[LIGHTBOX] ⚠️  Award element [data-award-type="${award.type}"] or #award-${award.type} not found in DOM`);
        return;
      }
      
      // Show the award element
      awardEl.style.display = 'flex';
      
      // Find and populate the label (try new data attribute first, then old class)
      const labelEl = awardEl.querySelector('[data-field="award-label"]') || awardEl.querySelector('.award__label');
      if (labelEl) {
        labelEl.textContent = award.label || '';
      } else {
        console.warn(`[LIGHTBOX] ⚠️  Label element not found for [data-award-type="${award.type}"] or #award-${award.type}`);
      }
      
        debugLog(`[LIGHTBOX] ✓ Award ${index + 1}: ${award.type} displayed`);
    });
  }

  async function waitForImages(imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return;
    
    debugLog(`[LIGHTBOX] ⏳ Loading ${imageUrls.length} images...`);
    
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
    debugLog(`[LIGHTBOX] ✓ All images loaded`);
  }

  async function injectContent(project) {
    debugLog(`[LIGHTBOX] 📝 Injecting content for: ${project.title}`);
    
    // Inject text content
    if (clientEl) clientEl.textContent = project.client || '';
    if (titleEl) titleEl.textContent = project.title || '';
    if (truthEl) truthEl.textContent = project.truth || '';
    if (truthWellToldEl) truthWellToldEl.textContent = project.truthWellTold || '';
    if (descriptionEl) descriptionEl.textContent = project.description || '';

    const impactRaw = typeof project.impact === 'string' ? project.impact : '';
    if (impactEl) impactEl.textContent = impactRaw;
    if (impactWrapper) {
      const hasImpact = impactRaw.trim().length > 0;
      impactWrapper.style.display = hasImpact ? '' : 'none';
      impactWrapper.setAttribute('aria-hidden', hasImpact ? 'false' : 'true');
    }
    
    // Render awards
    renderAwards(project.awards || []);
    
    // Mount Vimeo video
    if (videoArea) {
      if (!project.vimeoId || project.vimeoId === '000000000') {
        console.error(`[LIGHTBOX] ❌ Missing or invalid vimeoId for project "${project?.title || 'unknown'}"`);
      } else {
        mountVimeo(videoArea, project.vimeoId, {
          query: {
            autoplay: 1,
            muted: 0,
            controls: 1,
            autopause: 1,
            playsinline: 1,
            dnt: 1
          },
          startAt: 1,
          playOnReady: true,
          unmuteOnStart: true
        });
      }
    }
    
    // No need to wait for award images - they're already in the DOM from Webflow
    // The renderAwards function just shows/hides existing elements
    
    debugLog(`[LIGHTBOX] ✓ Content injected`);
  }

  function setState(newState) {
    currentState = newState;
    lb.setAttribute('data-state', newState);
    debugLog(`[LIGHTBOX] State: ${newState}`);
  }

  function disableSlideInteractions() {
    // Prevent double-clicks during opening transition
    getSlides().forEach(slide => {
      slide.style.pointerEvents = 'none';
      slide.setAttribute('aria-disabled', 'true');
    });
    debugLog('[LIGHTBOX] 🚫 Slide interactions disabled');
  }

  function enableSlideInteractions() {
    getSlides().forEach(slide => {
      slide.style.pointerEvents = '';
      slide.removeAttribute('aria-disabled');
    });
    debugLog('[LIGHTBOX] ✓ Slide interactions re-enabled');
  }

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================
  
  async function openFromSlide(slide) {
    // Guard: only open from IDLE state
    if (currentState !== STATE.IDLE) {
      debugLog('[LIGHTBOX] ⚠️  Cannot open - already opening/open/closing');
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
      
      // Update ARIA
      lb.setAttribute('aria-hidden', 'false');
      
      // Enable pointer events on lightbox (was disabled on init)
      lb.style.pointerEvents = 'auto';
      
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
    debugLog('[LIGHTBOX] ✓ Open animation complete');
    
    // Change state to OPEN → allow closing
    setState(STATE.OPEN);
    
    // Enable native scrolling for overlay if it exists
    // CRITICAL: Ensure overlay is scrollable independently of locked body
    if (overlay) {
      overlay.style.overflow = 'auto';
      overlay.style.overflowY = 'auto';
      overlay.style.height = '100%';
      overlay.style.maxHeight = '100vh';
      overlay.style.pointerEvents = 'auto';
      debugLog('[LIGHTBOX] ✓ Overlay native scrolling enabled');
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
      debugLog('[LIGHTBOX] ⚠️  Cannot close - not open');
      return;
    }
    
    // Change state to CLOSING
    setState(STATE.CLOSING);

    if (detailsOpen) {
      debugLog('[LIGHTBOX] ⚠️  Details open during close request → forcing hide');
      closeDetails({ resetOverlay: true });
    } else {
      emitWebflowEvent('details:hide');
      if (overlay) {
        overlay.style.pointerEvents = 'none';
        overlay.style.overflow = '';
        overlay.style.overflowY = '';
        overlay.style.height = '';
        overlay.style.maxHeight = '';
        overlay.style.display = 'none';
        debugPointerSnapshot('requestClose → overlay hidden (no details open)');
      }
    }
    debugPointerSnapshot('requestClose → after details cleanup');
    
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
    debugLog('[LIGHTBOX] ✓ Close animation complete');
    
    lb.setAttribute('aria-hidden', 'true');
    
    // Reset details state first → prevents event handlers from firing during cleanup
    detailsOpen = false;
    clearOverlayHideTimeout();
    
    // Restore page interactivity → remove inert, unlock scroll, re-enable slides
    setPageInert(false);
    unlockScroll({ delayMs: 0 });
    enableSlideInteractions();
    
    // Clear injected content
    if (videoArea) videoArea.innerHTML = '';
    renderAwards([]);
    if (clientEl) clientEl.textContent = '';
    if (titleEl) titleEl.textContent = '';
    if (truthEl) truthEl.textContent = '';
    if (truthWellToldEl) truthWellToldEl.textContent = '';
    if (descriptionEl) descriptionEl.textContent = '';
    if (impactEl) impactEl.textContent = '';
    if (impactWrapper) {
      impactWrapper.style.display = 'none';
      impactWrapper.setAttribute('aria-hidden', 'true');
    }
    
    // Reset overlay to initial state
    if (overlay) {
      overlay.style.pointerEvents = 'none';
      overlay.style.overflow = '';
      overlay.style.overflowY = '';
      overlay.style.height = '';
      overlay.style.maxHeight = '';
      overlay.style.display = 'none';
    }
    debugPointerSnapshot('finishClose → after overlay reset');
    
    // Hide lightbox completely
    lb.style.display = 'none';
    lb.style.pointerEvents = 'none';
    
    // Restore focus
    if (lastFocus && document.body.contains(lastFocus)) {
      lastFocus.focus();
    }
    
    // Ready for next open → state change LAST
    setState(STATE.IDLE);
    
    emit('LIGHTBOX_CLOSED', lb);
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  
  // Use event delegation for slide clicks (entire slide is clickable)
  // Find container dynamically - slides might be in .perspective-wrapper or elsewhere
  const getSlidesContainer = () => {
    const firstSlide = getSlides()[0];
    return firstSlide?.parentElement || document.querySelector('.perspective-wrapper') || document.body;
  };
  const slidesContainer = getSlidesContainer();
  
  function handleSlideClick(e) {
    const slide = e.target.closest('.slide');
    if (!slide) return;
    
    // Prevent any link navigation → entire slide opens lightbox
    e.preventDefault();
    e.stopPropagation();
    
    debugLog('[LIGHTBOX] 🎯 Slide clicked:', slide.dataset.project);
    
    // Guard against interactions during transitions
    if (currentState !== STATE.IDLE) {
      debugLog('[LIGHTBOX] ⚠️  Click ignored - lightbox not idle');
      return;
    }
    
    if (!slide.dataset.project) {
      console.warn('[LIGHTBOX] ⚠️  .slide found but missing data-project attribute');
      return;
    }
    
    openFromSlide(slide);
  }
  
  function handleCloseBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (currentState === STATE.OPEN) {
      debugLog('[LIGHTBOX] 🎯 Close button clicked');
      requestClose();
    }
  }
  
  function handleKeydown(e) {
    if (currentState === STATE.OPEN) {
      if (e.key === 'Escape') {
        if (detailsOpen) {
          debugLog('[LIGHTBOX] 🎯 Escape key pressed - closing details overlay');
          closeDetails();
        } else {
          debugLog('[LIGHTBOX] 🎯 Escape key pressed - closing lightbox');
          requestClose();
        }
      }
      if (e.key === 'Tab') {
        trapFocus(e);
      }
    }
  }
  
  function openDetails() {
    if (detailsOpen || currentState !== STATE.OPEN) return;

    detailsOpen = true;
    debugLog('[LIGHTBOX] 🎯 Details overlay opening');
    emitWebflowEvent('details:show');
    clearOverlayHideTimeout();
    if (overlay) {
      overlay.style.display = 'block';
      debugPointerSnapshot('openDetails → display set to block');
    }

    // Enable overlay scrolling with native behaviour
    requestAnimationFrame(() => {
      if (overlay) {
        overlay.style.pointerEvents = 'auto';
        overlay.style.overflow = 'auto';
        overlay.style.overflowY = 'auto';
        overlay.style.height = '100%';
        overlay.style.maxHeight = '100vh';
      }
      if (lb) {
        lb.style.pointerEvents = 'auto';
      }
      debugPointerSnapshot('openDetails → raf');
    });
  }

  const detailsHideFallbackMs = Math.max(400, Math.min(2000, closeDuration || 1500)); // Safety net for overlay hide timing

  function closeDetails({ silent = false, resetOverlay = false } = {}) {
    const hideOverlayNow = () => {
      if (!overlay) return;
      overlayHideTimeout = null;
      overlay.style.pointerEvents = 'none';
      overlay.style.overflow = '';
      overlay.style.overflowY = '';
      overlay.style.height = '';
      overlay.style.maxHeight = '';
      overlay.style.display = 'none';
      debugPointerSnapshot(`closeDetails → forced overlay hide resetOverlay=${resetOverlay}`);
    };

    if (!detailsOpen) {
      if (!silent) {
        emitWebflowEvent('details:hide');
      }
      clearOverlayHideTimeout();
      if (resetOverlay) {
        hideOverlayNow();
      } else if (overlay) {
        overlay.style.display = 'none';
        debugPointerSnapshot('closeDetails → already closed fallback hide');
      }
      return;
    }

    detailsOpen = false;
    debugLog('[LIGHTBOX] 🎯 Details overlay closing');

    if (!silent) {
      emitWebflowEvent('details:hide');
    }

    clearOverlayHideTimeout();
    if (overlay) {
      if (resetOverlay) {
        hideOverlayNow();
      } else {
        overlayHideTimeout = setTimeout(() => {
          if (!detailsOpen && overlay) {
            overlay.style.display = 'none';
            debugPointerSnapshot('closeDetails → fallback hide (timeout)');
          }
          overlayHideTimeout = null;
        }, detailsHideFallbackMs);
      }
    }

    requestAnimationFrame(() => {
      if (overlay) {
        if (resetOverlay) {
          overlay.style.pointerEvents = 'none';
          overlay.style.overflow = '';
          overlay.style.overflowY = '';
          overlay.style.display = 'none';
        } else {
          overlay.style.pointerEvents = 'auto';
          overlay.style.overflow = 'auto';
          overlay.style.overflowY = 'auto';
        }
      }
      if (lb && !resetOverlay) {
        lb.style.pointerEvents = 'auto';
      }
      debugPointerSnapshot(`closeDetails → raf resetOverlay=${resetOverlay}`);
    });
  }

  function handleDetailsClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (currentState !== STATE.OPEN) {
      debugLog('[LIGHTBOX] ⚠️  Details button clicked but lightbox not open');
      return;
    }

    if (detailsOpen) {
      debugLog('[LIGHTBOX] 🧪 handleDetailsClick → toggling OFF');
      closeDetails();
    } else {
      debugLog('[LIGHTBOX] 🧪 handleDetailsClick → toggling ON');
      openDetails();
    }
  }

  function handleDetailsOverlayClick(e) {
    if (!detailsOpen || currentState !== STATE.OPEN) return;
    
    // Allow clicks on interactive elements to propagate normally
    if (e.target.closest('a, button, [role="button"], input, select, textarea')) return;

    e.preventDefault();
    e.stopPropagation();
    debugLog('[LIGHTBOX] 🧪 handleDetailsOverlayClick → closing details');
    closeDetails();
  }
  
  // Attach delegated listener to slides container
  const slideCount = getSlides().length;
  debugLog(`[LIGHTBOX] 🔍 Found ${slideCount} slide${slideCount !== 1 ? 's' : ''}, container:`, slidesContainer?.tagName || 'null');
  
  if (slidesContainer) {
    slidesContainer.addEventListener('click', handleSlideClick, { passive: false });
    debugLog(`[LIGHTBOX] ✓ Delegated click handler attached to ${slidesContainer.tagName} (${slideCount} slide${slideCount !== 1 ? 's' : ''})`);
  } else {
    console.error('[LIGHTBOX] ❌ Could not find slides container for event delegation');
  }

  function handleLightboxClick(e) {
    const closeTarget = e.target.closest('#close-btn');
    if (closeTarget) {
      debugLog('[LIGHTBOX] 🧪 Delegated click → close-btn');
      handleCloseBtnClick(e);
      return;
    }

    const detailsTarget = e.target.closest('#details-btn');
    if (detailsTarget) {
      debugLog('[LIGHTBOX] 🧪 Delegated click → details-btn');
      handleDetailsClick(e);
    }
  }

  lb.addEventListener('click', handleLightboxClick, { passive: false });
  debugLog('[LIGHTBOX] ✓ Delegated handlers attached for close/details buttons');

  if (!closeBtn) {
    console.warn('[LIGHTBOX] ⚠️  #close-btn not found - only Escape key will close');
  }

  if (!detailsBtn) {
    console.warn('[LIGHTBOX] ⚠️  Details button (#details-btn) not found');
  } else {
    debugLog('[LIGHTBOX] ✓ Details button detected in DOM');
  }
  
  if (overlay) {
    overlay.style.pointerEvents = 'none';
    overlay.addEventListener('click', handleDetailsOverlayClick, { passive: false });
    debugLog('[LIGHTBOX] ✓ Overlay click handler attached (click background to close details)');
  } else {
    console.warn('[LIGHTBOX] ⚠️  Overlay not found - details close-on-click disabled');
  }

  document.addEventListener('keydown', handleKeydown);
  
  debugLog('[LIGHTBOX] ✓ Initialized and ready\n');
  
  // ============================================================
  // CLEANUP & API EXPOSURE
  // ============================================================
  
  function cleanup() {
    // Remove event listeners
    if (slidesContainer) {
      slidesContainer.removeEventListener('click', handleSlideClick);
    }
    lb.removeEventListener('click', handleLightboxClick);
    if (overlay) {
      overlay.removeEventListener('click', handleDetailsOverlayClick);
      overlay.style.pointerEvents = 'none';
    }
    clearOverlayHideTimeout();
    document.removeEventListener('keydown', handleKeydown);
    
    // Reset state
    detailsOpen = false;
    
    // Unlock scroll and reset state
    unlockScroll({ delayMs: 0 });
    setPageInert(false);
    enableSlideInteractions();
    currentState = STATE.IDLE;
    
    debugLog('[LIGHTBOX] ✓ Cleanup complete');
  }
  
  function openProjectById(projectId) {
    const slide = Array.from(getSlides()).find(s => s.dataset.project === projectId);
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
