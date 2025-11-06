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
  openDuration = 1000,  // IMPORTANT: Must match Webflow IX3 'lb:open' animation duration
  closeDuration = 1000  // IMPORTANT: Must match Webflow IX3 'lb:close' animation duration
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
  const slides = document.querySelectorAll('.slide');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Content injection targets (IDs, not classes)
  const clientEl = document.querySelector('#lightbox-client');
  const titleEl = document.querySelector('#lightbox-title');
  const truthEl = document.querySelector('#lightbox-truth');
  const truthWellToldEl = document.querySelector('#lightbox-truthwelltold');
  const descriptionEl = document.querySelector('#lightbox-description');
  const awardsContainer = document.querySelector('#lightbox-awards');

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  // Set accessibility attributes
  lb.setAttribute('role', lb.getAttribute('role') || 'dialog');
  lb.setAttribute('aria-modal', lb.getAttribute('aria-modal') || 'true');
  lb.setAttribute('aria-hidden', 'true');
  lb.setAttribute('data-state', STATE.IDLE);
  
  // Ensure scroll is unlocked on page load
  unlockScroll({ delayMs: 0 });
  
  // Load project data from bundled JSON
  projectData = projectDataJson;
  const projectCount = Object.keys(projectData).length;
  console.log(`[LIGHTBOX] ✓ Loaded ${projectCount} project${projectCount !== 1 ? 's' : ''} from bundled data`);

  // ============================================================
  // VALIDATION
  // ============================================================
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 LIGHTBOX SETUP VALIDATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('1️⃣  Main Container');
  console.log(`   ✓ Found: ${root}`);
  console.log(`   ✓ State machine initialized: ${currentState}`);
  console.log(`   ⏱️  Open duration: ${openDuration}ms (must match Webflow 'lb:open' animation)`);
  console.log(`   ⏱️  Close duration: ${closeDuration}ms (must match Webflow 'lb:close' animation)`);
  
  console.log('\n2️⃣  Content Injection Targets');
  console.log(`   ${clientEl ? '✓' : '❌'} #lightbox-client`);
  console.log(`   ${titleEl ? '✓' : '❌'} #lightbox-title`);
  console.log(`   ${truthEl ? '✓' : '❌'} #lightbox-truth`);
  console.log(`   ${truthWellToldEl ? '✓' : '❌'} #lightbox-truthwelltold`);
  console.log(`   ${descriptionEl ? '✓' : '❌'} #lightbox-description`);
  console.log(`   ${awardsContainer ? '✓' : '❌'} #lightbox-awards`);
  console.log(`   ${videoArea ? '✓' : '❌'} .video-area`);
  
  console.log('\n3️⃣  Slide Triggers');
  console.log(`   ✓ Found: ${slides.length} .slide elements`);
  
  // Validate slide data immediately (data is already loaded)
  validateSlideData();
  
  console.log('\n4️⃣  Webflow IX Setup');
  const wfIx = (window.Webflow && window.Webflow.require)
    ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
    : null;
  
  if (wfIx) {
    const version = window.Webflow.require('ix3') ? 'IX3' : 'IX2';
    console.log(`   ✓ Webflow ${version} detected`);
  } else {
    console.warn('   ⚠️  Webflow IX NOT detected');
  }
  
  console.log('\n   📋 Required Custom Events in Webflow:');
  console.log('      • "lb:open" → triggers open animation');
  console.log('      • "lb:close" → triggers close animation');
  console.log(`      • Durations MUST match: open=${openDuration}ms, close=${closeDuration}ms`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ VALIDATION COMPLETE\n');

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  /**
   * Validate slide data attributes against loaded JSON
   */
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
        validSlides++;
      }
    });
    
    console.log(`[LIGHTBOX] ✓ Valid slides: ${validSlides}/${slides.length}`);
    if (missingData.length > 0) {
      console.warn('[LIGHTBOX] ⚠️  Issues found:');
      missingData.forEach(msg => console.warn(`   - ${msg}`));
    }
  }
  
  /**
   * Emit custom event via Webflow IX for GSAP animations
   */
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

  /**
   * Make all page content except lightbox inert
   */
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

  /**
   * Trap focus within lightbox when Tab is pressed
   */
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

  /**
   * Get project data by ID
   */
  function getProjectById(id) {
    if (!projectData[id]) {
      console.error(`[LIGHTBOX] ❌ Project "${id}" not found in JSON`);
      return null;
    }
    return projectData[id];
  }

  /**
   * Wait for all images to load and decode
   */
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

  /**
   * Inject project content into lightbox DOM
   */
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
    if (videoArea && project.vimeoId) {
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
    
    // Wait for award images to load before opening
    if (project.awards && project.awards.length > 0) {
      await waitForImages(project.awards);
    }
    
    console.log(`[LIGHTBOX] ✓ Content injected`);
  }

  /**
   * Set state and update data-state attribute
   */
  function setState(newState) {
    currentState = newState;
    lb.setAttribute('data-state', newState);
    console.log(`[LIGHTBOX] State: ${newState}`);
  }

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================
  
  /**
   * Open lightbox with content from clicked slide
   */
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
    
    // Change state to OPENING
    setState(STATE.OPENING);
    
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
      emitWebflowEvent('lb:open');
      
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
    }
  }

  /**
   * Called when GSAP open animation completes
   */
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

  /**
   * Close lightbox with animation
   */
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
    emitWebflowEvent('lb:close');
    
    // Calculate delay based on user's motion preference
    const hideDelay = prefersReduced ? 0 : closeDuration;
    
    // Wait for GSAP animation to complete, then call finishClose
    // IMPORTANT: This duration MUST match Webflow IX3 animation duration
    setTimeout(() => {
      finishClose();
    }, hideDelay);
    
    // Unlock scroll (with delay to coordinate with animation)
    unlockScroll({ 
      delayMs: prefersReduced ? 0 : closeDuration 
    });
    
    // Restart smooth scroll if active
    if (window.App?.smoothScroll?.start) {
      setTimeout(() => {
        window.App.smoothScroll.start();
      }, hideDelay);
    }
  }

  /**
   * Called when GSAP close animation completes
   */
  function finishClose() {
    console.log('[LIGHTBOX] ✓ Close animation complete');
    
    // Update ARIA
    lb.setAttribute('aria-hidden', 'true');
    
    // Make page accessible again
    setPageInert(false);
    
    // Clear content
    if (videoArea) videoArea.innerHTML = '';
    if (awardsContainer) awardsContainer.innerHTML = '';
    if (clientEl) clientEl.textContent = '';
    if (titleEl) titleEl.textContent = '';
    if (truthEl) truthEl.textContent = '';
    if (truthWellToldEl) truthWellToldEl.textContent = '';
    if (descriptionEl) descriptionEl.textContent = '';
    
    // Destroy overlay smooth scroll instance
    if (overlayLenis) {
      try {
        overlayLenis.destroy();
        overlayLenis = null;
        console.log('[LIGHTBOX] ✓ Overlay smooth scroll destroyed');
      } catch (err) {
        console.warn('[LIGHTBOX] Error destroying overlay scroll:', err);
      }
    }
    
    // Restore focus to element that opened lightbox
    if (lastFocus && document.body.contains(lastFocus)) {
      lastFocus.focus();
    }
    
    // Change state to IDLE → ready to open again
    setState(STATE.IDLE);
    
    emit('LIGHTBOX_CLOSED', lb);
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  
  /**
   * OPEN TRIGGER: Click on .slide elements
   * 
   * Each .slide must have data-project attribute matching a key in project-data.json
   * Clicking triggers: content load → image preload → GSAP animation → open
   */
  slides.forEach((slide, index) => {
    slide.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFromSlide(slide);
    }, { passive: false });
  });

  /**
   * CLOSE TRIGGER 1: Close button (#close-btn)
   * 
   * When #close-btn is clicked:
   * 1. Check state is OPEN (prevents closing during transitions)
   * 2. Call requestClose() → emits 'lb:close' event to Webflow IX
   * 3. Webflow GSAP animation plays: opacity 1→0, scale 1.0→0.95, display flex→none
   * 4. After animation duration (1000ms), finishClose() runs cleanup
   */
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentState === STATE.OPEN) {
        console.log('[LIGHTBOX] 🎯 Close button clicked');
        requestClose();
      }
    });
  } else {
    console.warn('[LIGHTBOX] ⚠️  #close-btn not found - only Escape key will close');
  }

  /**
   * CLOSE TRIGGER 2: Escape key
   * 
   * When Escape is pressed:
   * 1. Check state is OPEN (prevents closing during transitions)
   * 2. Call requestClose() → emits 'lb:close' event to Webflow IX
   * 3. Webflow GSAP animation plays: opacity 1→0, scale 1.0→0.95, display flex→none
   * 4. After animation duration (1000ms), finishClose() runs cleanup
   * 
   * Tab key is handled separately for focus trapping (keeps focus inside lightbox)
   */
  document.addEventListener('keydown', e => {
    if (currentState === STATE.OPEN) {
      if (e.key === 'Escape') {
        console.log('[LIGHTBOX] 🎯 Escape key pressed');
        requestClose();
      }
      if (e.key === 'Tab') {
        trapFocus(e);
      }
    }
  });
  
  console.log('[LIGHTBOX] ✓ Initialized and ready\n');
}
