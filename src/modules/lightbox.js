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
let detailsOpen = false; // Track details overlay state

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

  // Content elements with fallback to ID selectors for backward compatibility
  const clientEl = lb.querySelector('[data-field="lightbox-client"]') || document.querySelector('#lightbox-client');
  const titleEl = lb.querySelector('[data-field="lightbox-title"]') || document.querySelector('#lightbox-title');
  const truthEl = lb.querySelector('[data-field="lightbox-truth"]') || document.querySelector('#lightbox-truth');
  const truthWellToldEl = lb.querySelector('[data-field="lightbox-truthwelltold"]') || document.querySelector('#lightbox-truthwelltold');
  const descriptionEl = lb.querySelector('[data-field="lightbox-description"]') || document.querySelector('#lightbox-description');
  const impactEl = lb.querySelector('[data-field="lightbox-impact"]') || document.querySelector('#lightbox-impact');
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
  
  console.log(`\n4️⃣  Slide Triggers`);
  console.log(`   ${slides.length > 0 ? '✓' : '❌'} Found: ${slides.length} .slide element${slides.length !== 1 ? 's' : ''}`);
  
  if (slides.length === 0) {
    validationErrors.push('No .slide elements found');
  } else {
    // Validate each slide has data-project attribute (required for lightbox)
    let slidesWithData = 0;
    let slidesWithoutData = [];
    
    slides.forEach((slide, index) => {
      if (slide.dataset.project) {
        slidesWithData++;
      } else {
        slidesWithoutData.push(index);
      }
    });
    
    console.log(`   ${slidesWithData === slides.length ? '✓' : '⚠️'} ${slidesWithData}/${slides.length} slides have data-project attribute`);
    
    if (slidesWithoutData.length > 0) {
      console.log(`   ⚠️  Missing data-project in slide indices: ${slidesWithoutData.join(', ')}`);
      validationWarnings.push(`${slidesWithoutData.length} slides missing data-project attribute`);
    }
    
    console.log(`   ℹ️  Entire .slide element is clickable (not just .slide__link)`);
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
    // Block background page interaction when lightbox is open
    // Must use removeAttribute() not setAttribute('inert', false) → still blocks interaction
    const siblings = Array.from(document.body.children).filter(n => n !== lb);
    siblings.forEach(n => {
      try {
        if (on) {
          n.setAttribute('inert', '');
          n.setAttribute('aria-hidden', 'true');
        } else {
          n.removeAttribute('inert');
          n.removeAttribute('aria-hidden');
        }
      } catch (err) {
        console.warn('[LIGHTBOX] Error setting inert:', err);
      }
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

  function renderAwards(awardsData) {
    console.log(`[LIGHTBOX] 🏆 Rendering awards: ${awardsData?.length || 0} awards`);
    
    // First hide all award elements (check both new data attributes and old ID pattern)
    const allAwards = [...lb.querySelectorAll('[data-award-type]'), ...document.querySelectorAll('[id^="award-"]')];
    allAwards.forEach(el => {
      el.style.display = 'none';
    });
    
    // If no awards data, we're done
    if (!awardsData || awardsData.length === 0) {
      console.log('[LIGHTBOX] No awards to display');
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
      
      console.log(`[LIGHTBOX] ✓ Award ${index + 1}: ${award.type} displayed`);
    });
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
    if (impactEl) impactEl.textContent = project.impact || '';
    
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
    
    console.log(`[LIGHTBOX] ✓ Content injected`);
  }

  function setState(newState) {
    currentState = newState;
    lb.setAttribute('data-state', newState);
    console.log(`[LIGHTBOX] State: ${newState}`);
  }

  function disableSlideInteractions() {
    // Prevent double-clicks during opening transition
    slides.forEach(slide => {
      slide.style.pointerEvents = 'none';
      slide.setAttribute('aria-disabled', 'true');
    });
    console.log('[LIGHTBOX] 🚫 Slide interactions disabled');
  }

  function enableSlideInteractions() {
    slides.forEach(slide => {
      slide.style.pointerEvents = '';
      slide.removeAttribute('aria-disabled');
    });
    console.log('[LIGHTBOX] ✓ Slide interactions re-enabled');
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
      
      // DISABLED: Smooth scroll stop disabled (Lenis is disabled globally)
      
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
    console.log('[LIGHTBOX] ✓ Open animation complete');
    
    // Change state to OPEN → allow closing
    setState(STATE.OPEN);
    
    // Enable native scrolling for overlay if it exists
    // CRITICAL: Ensure overlay is scrollable independently of locked body
    if (overlay) {
      // Enable native scrolling on overlay - it should scroll independently of locked body
      // The overlay needs explicit overflow and height to enable scrolling
      overlay.style.overflow = 'auto';
      overlay.style.overflowY = 'auto';
      overlay.style.height = '100%';
      overlay.style.maxHeight = '100vh';
      
      // Pointer events: always enable when overlay exists and lightbox is open
      // This allows scrolling to work. Click handlers manage interaction behavior.
      overlay.style.pointerEvents = 'auto';
      
      // DISABLED: Lenis container scroll disabled for debugging
      // Using native scrolling instead
      console.log('[LIGHTBOX] ✓ Overlay native scrolling enabled (Lenis disabled)');
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
    
    lb.setAttribute('aria-hidden', 'true');
    
    // Reset details state first → prevents event handlers from firing during cleanup
    detailsOpen = false;
    
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
    
    // Reset overlay to initial state
    if (overlay) {
      overlay.style.pointerEvents = 'none';
      overlay.style.overflow = '';
      overlay.style.overflowY = '';
      overlay.style.height = '';
      overlay.style.maxHeight = '';
    }
    
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
  const slidesContainer = slides[0]?.parentElement;
  
  function handleSlideClick(e) {
    const slide = e.target.closest('.slide');
    if (!slide) return;
    
    // Guard against interactions during transitions
    if (currentState !== STATE.IDLE) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (!slide.dataset.project) {
      console.warn('[LIGHTBOX] ⚠️  .slide found but missing data-project attribute');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
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
        if (detailsOpen) {
          console.log('[LIGHTBOX] 🎯 Escape key pressed - closing details overlay');
          closeDetails();
        } else {
          console.log('[LIGHTBOX] 🎯 Escape key pressed - closing lightbox');
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
    console.log('[LIGHTBOX] 🎯 Details overlay opening');
    emitWebflowEvent('details:show');

    // Enable overlay scrolling → native scrolling (Lenis disabled)
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
    });
  }

  function closeDetails({ silent = false } = {}) {
    if (!detailsOpen) return;

    detailsOpen = false;
    console.log('[LIGHTBOX] 🎯 Details overlay closing');

    if (!silent) {
      emitWebflowEvent('details:hide');
    }

    // Maintain interactivity → lightbox still open, overlay must remain scrollable
    requestAnimationFrame(() => {
      if (overlay) {
        overlay.style.pointerEvents = 'auto';
        overlay.style.overflow = 'auto';
        overlay.style.overflowY = 'auto';
      }
      if (lb) {
        lb.style.pointerEvents = 'auto';
      }
    });
  }

  function handleDetailsClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (currentState !== STATE.OPEN) {
      console.log('[LIGHTBOX] ⚠️  Details button clicked but lightbox not open');
      return;
    }

    if (detailsOpen) {
      closeDetails();
    } else {
      openDetails();
    }
  }

  function handleDetailsOverlayClick(e) {
    if (!detailsOpen || currentState !== STATE.OPEN) return;
    
    // Allow clicks on interactive elements to propagate normally
    if (e.target.closest('a, button, [role="button"], input, select, textarea')) return;

    e.preventDefault();
    e.stopPropagation();
    closeDetails();
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
  
  // Details button - triggers details overlay
  if (detailsBtn) {
    detailsBtn.addEventListener('click', handleDetailsClick, { passive: false });
    console.log('[LIGHTBOX] ✓ Details button handler attached');
  } else {
    console.warn('[LIGHTBOX] ⚠️  Details button (#details-btn) not found');
  }
  
  if (overlay) {
    overlay.style.pointerEvents = 'none';
    overlay.addEventListener('click', handleDetailsOverlayClick, { passive: false });
    console.log('[LIGHTBOX] ✓ Overlay click handler attached (click background to close details)');
  } else {
    console.warn('[LIGHTBOX] ⚠️  Overlay not found - details close-on-click disabled');
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
    if (overlay) {
      overlay.removeEventListener('click', handleDetailsOverlayClick);
      overlay.style.pointerEvents = 'none';
    }
    document.removeEventListener('keydown', handleKeydown);
    
    // Reset state
    detailsOpen = false;
    
    // DISABLED: Overlay scroll cleanup disabled (Lenis is disabled globally)
    
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
