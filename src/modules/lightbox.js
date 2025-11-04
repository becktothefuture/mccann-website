/**
 * ==================================================
 *  McCann Website — Lightbox Module
 *  Purpose: Modal lightbox with Vimeo video support and GSAP animations
 *  Date: 2025-11-04
 * ==================================================
 */

import { emit } from '../core/events.js';
import { lockScroll, unlockScroll } from '../core/scrolllock.js';
import { mountVimeo } from './vimeo.js';

export function initLightbox({ root = '#lightbox', closeDelayMs = 1000 } = {}){
  // ============================================================
  // SETUP & DOM REFERENCES
  // ============================================================
  
  const lb = document.querySelector(root);
  if (!lb){ 
    console.log('[LIGHTBOX] Element not found');
    return;
  }

  const inner = lb.querySelector('.lightbox__inner');
  const videoArea = lb.querySelector('.video-area');
  const closeBtn = lb.querySelector('#close-btn');
  const slides = document.querySelectorAll('.slide');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================================
  // STATE
  // ============================================================
  
  let openGuard = false;  // Prevent re-opening while open
  let lastFocus = null;   // Store focus for restoration on close

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  // Set accessibility attributes
  lb.setAttribute('role', lb.getAttribute('role') || 'dialog');
  lb.setAttribute('aria-modal', lb.getAttribute('aria-modal') || 'true');
  lb.setAttribute('aria-hidden', 'true');
  lb.classList.remove('is-open');
  
  // Force hidden state (override Webflow inline styles)
  // Use visibility/opacity instead of display:none (GSAP needs element in DOM)
  lb.style.setProperty('visibility', 'hidden', 'important');
  lb.style.setProperty('opacity', '0', 'important');
  lb.style.setProperty('pointer-events', 'none', 'important');
  
  // Ensure scroll is unlocked on page load
  unlockScroll({ delayMs: 0 });

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  /**
   * Emit custom event via Webflow IX for GSAP animations
   */
  function emitWebflowEvent(name){
    try {
      if (window.Webflow && window.Webflow.require) {
        const wfIx = window.Webflow.require('ix3') || window.Webflow.require('ix2');
        if (wfIx && typeof wfIx.emit === 'function') {
          wfIx.emit(name);
        }
      }
    } catch(err) {
      console.log('[LIGHTBOX] Webflow emit failed:', err);
    }
  }

  /**
   * Make all page content except lightbox inert (inaccessible)
   */
  function setPageInert(on){
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
  function trapFocus(e){
    if (e.key !== 'Tab') return;
    
    const focusables = lb.querySelectorAll([
      'a[href]','button','input','select','textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','));
    
    const list = Array.from(focusables).filter(
      el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
    
    if (list.length === 0){ 
      e.preventDefault(); 
      (inner || lb).focus(); 
      return; 
    }
    
    const first = list[0];
    const last = list[list.length - 1];
    
    if (e.shiftKey && document.activeElement === first){ 
      e.preventDefault(); 
      last.focus(); 
    } else if (!e.shiftKey && document.activeElement === last){ 
      e.preventDefault(); 
      first.focus(); 
    }
  }

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================
  
  /**
   * Open lightbox with content from clicked slide
   */
  function openFromSlide(slide){
    if (openGuard) return; // Already open
    
    openGuard = true;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Extract data from slide
    const video = slide?.dataset?.video || '';
    const title = slide?.dataset?.title || '';
    const text  = slide?.dataset?.text  || '';

    // Mount Vimeo video (disable autoplay in Webflow Designer to avoid warnings)
    const isDesigner = /\.webflow\.com$/.test(location.hostname) || /canvas\.webflow\.com$/.test(location.hostname);
    const autoplay = isDesigner ? 0 : 1;
    
    if (videoArea && video) {
      mountVimeo(videoArea, video, { 
        autoplay, 
        muted: 1, 
        controls: 0, 
        background: 1, 
        playsinline: 1, 
        dnt: 1 
      });
    }
    
    // Make lightbox visible
    lb.style.removeProperty('visibility');
    lb.style.removeProperty('opacity');
    lb.style.removeProperty('pointer-events');
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    
    // Lock page scroll and make background inert
    setPageInert(true);
    lockScroll();
    
    // Trigger GSAP animation via Webflow IX
    emitWebflowEvent('lb:open');

    // Set focus to lightbox for keyboard navigation
    lb.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => {
      (inner || lb).focus();
    });

    // Emit event for external listeners
    emit('LIGHTBOX_OPEN', lb, { video, title, text });
  }

  /**
   * Close lightbox with animation
   */
  function requestClose(){
    if (!openGuard) return; // Already closed
    
    // Emit event for external listeners
    emit('LIGHTBOX_CLOSE', lb);
    
    // Trigger GSAP close animation via Webflow IX
    emitWebflowEvent('lb:close');
    
    // Calculate delay based on user's motion preference
    const hideDelay = prefersReduced ? 0 : closeDelayMs;
    
    // Clean up after animation completes
    setTimeout(() => {
      lb.setAttribute('aria-hidden', 'true');
      lb.classList.remove('is-open');
      setPageInert(false);
      
      // Clear video
      if (videoArea) videoArea.innerHTML = '';
      
      // Restore focus to element that opened lightbox
      if (lastFocus && document.body.contains(lastFocus)) {
        lastFocus.focus();
      }
      
      openGuard = false;
      emit('LIGHTBOX_CLOSED_DONE', lb);
    }, hideDelay);
    
    // Unlock scroll
    unlockScroll({ 
      delayMs: prefersReduced ? 0 : closeDelayMs 
    });
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  
  // Open lightbox when slide is clicked
  slides.forEach((slide, index) => {
    slide.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFromSlide(slide);
    }, { passive: false });
  });

  // Close lightbox when clicking outside inner content
  lb.addEventListener('click', e => {
    if (inner && !e.target.closest('.lightbox__inner')) {
      requestClose();
    } else if (!inner && e.target === lb) {
      requestClose();
    }
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestClose();
    });
  }

  // Keyboard controls: Escape to close, Tab to trap focus
  document.addEventListener('keydown', e => {
    if (lb.classList.contains('is-open')){
      if (e.key === 'Escape') requestClose();
      if (e.key === 'Tab') trapFocus(e);
    }
  });
}


