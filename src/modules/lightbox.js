/**
 * ==================================================
 *  McCann Website — Lightbox Module
 *  Purpose: Focus trap, outside-click, inert/aria fallback, re-entrancy
 *  Date: 2025-10-28
 * ==================================================
 */

import { emit } from '../core/events.js';
import { lockScroll, unlockScroll } from '../core/scrolllock.js';
import { mountVimeo } from './vimeo.js';

export function initLightbox({ root = '#project-lightbox', closeDelayMs = 1000 } = {}){
  const lb = document.querySelector(root);
  if (!lb){ console.log('[LIGHTBOX] not found'); return; }

  // Ensure baseline dialog a11y attributes
  lb.setAttribute('role', lb.getAttribute('role') || 'dialog');
  lb.setAttribute('aria-modal', lb.getAttribute('aria-modal') || 'true');
  lb.setAttribute('aria-hidden', lb.getAttribute('aria-hidden') || 'true');

  const inner = lb.querySelector('.project-lightbox__inner');
  const videoArea = lb.querySelector('.video-area');
  const slides = document.querySelectorAll('.slide');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let openGuard = false;
  let lastFocus = null;

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

  function trapFocus(e){
    if (e.key !== 'Tab') return;
    const focusables = lb.querySelectorAll([
      'a[href]','button','input','select','textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','));
    const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    if (list.length === 0){ e.preventDefault(); (inner || lb).focus(); return; }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  function openFromSlide(slide){
    if (openGuard) return;
    openGuard = true;
    lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const video = slide?.dataset?.video || '';
    const title = slide?.dataset?.title || '';
    const text  = slide?.dataset?.text  || '';

    if (videoArea) mountVimeo(videoArea, video, { autoplay: 1, muted: 1, controls: 0, background: 1, playsinline: 1, dnt: 1 });
    lb.setAttribute('aria-hidden', 'false');
    lb.setAttribute('data-open', 'true');
    setPageInert(true);
    lockScroll();

    lb.setAttribute('tabindex', '-1');
    (inner || lb).focus();

    emit('LIGHTBOX_OPEN', lb, { video, title, text });
  }

  function requestClose(){
    if (!openGuard) return;
    emit('LIGHTBOX_CLOSE', lb);
    if (prefersReduced){
      unlockScroll({ delayMs: 0 });
      emit('LIGHTBOX_CLOSED_DONE', lb);
    } else {
      unlockScroll({ delayMs: closeDelayMs });
    }
    lb.setAttribute('aria-hidden', 'true');
    lb.removeAttribute('data-open');
    setPageInert(false);
    if (videoArea) videoArea.innerHTML = '';
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
    openGuard = false;
  }

  slides.forEach(slide => slide.addEventListener('click', () => openFromSlide(slide)));

  lb.addEventListener('click', e => {
    if (inner && !e.target.closest('.project-lightbox__inner')) requestClose();
    else if (!inner && e.target === lb) requestClose();
  });

  document.addEventListener('keydown', e => {
    if (lb.getAttribute('data-open') === 'true'){
      if (e.key === 'Escape') requestClose();
      if (e.key === 'Tab') trapFocus(e);
    }
  });

  lb.addEventListener('LIGHTBOX_CLOSED_DONE', () => unlockScroll());
}


