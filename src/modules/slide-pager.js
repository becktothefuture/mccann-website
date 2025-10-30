/**
 * ==================================================
 *  McCann Website — Slide Pager Module
 *  Purpose: Enforce page-by-page navigation between `.slide` sections
 *  Strategy: Intercept wheel/touch/keys and animate window scroll to the
 *            next/previous slide top. Keeps ScrollTrigger timelines intact.
 *  Date: 2025-10-29
 * ==================================================
 */

/**
 * Initialize discrete slide paging.
 *
 * @param {Object} options
 * @param {string} [options.selector='.slide'] - Slide selector
 * @param {number} [options.duration=0.5] - Scroll animation duration (s)
 * @param {string} [options.ease='expo.out'] - Easing name for GSAP
 * @param {number} [options.anchorRatio=0.5] - Viewport anchor 0..1 for index
 * @param {number} [options.cooldownMs=420] - Min time between pages
 */
export function initSlidePager(options = {}){
  const {
    selector = '.slide',
    duration = 0.5,
    ease = 'expo.out',
    anchorRatio = 0.5,
    cooldownMs = 420,
  } = options;

  // Respect reduced motion: do not override natural scrolling
  const prefersReduced = typeof window !== 'undefined' &&
    'matchMedia' in window &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const gsapGlobal = (typeof window !== 'undefined' && (window.gsap || window.GSAP)) || (typeof gsap !== 'undefined' ? gsap : null);
  if (!gsapGlobal) return;

  let slides = [];
  let positions = [];
  let tween = null;
  let lastJumpTs = 0;

  function collect(){
    slides = Array.from(document.querySelectorAll(selector));
    positions = slides.map(s => Math.round(s.offsetTop));
  }

  function getCurrentIndex(){
    const anchor = window.scrollY + window.innerHeight * (isFinite(anchorRatio) ? anchorRatio : 0.5);
    let nearest = 0;
    let best = Math.abs((positions[0] ?? 0) - anchor);
    for (let i = 1; i < positions.length; i++){
      const d = Math.abs(positions[i] - anchor);
      if (d < best){ best = d; nearest = i; }
    }
    return nearest;
  }

  function jumpToIndex(index){
    if (index < 0 || index >= positions.length) return;
    const now = performance.now();
    if (now - lastJumpTs < cooldownMs) return;
    lastJumpTs = now;

    const target = positions[index];
    if (tween && tween.kill) tween.kill();

    // Prefer GSAP ScrollToPlugin when available (most performant), else native smooth
    const hasScrollToPlugin = !!(window.ScrollToPlugin);
    if (hasScrollToPlugin && gsapGlobal.registerPlugin){
      try { gsapGlobal.registerPlugin(window.ScrollToPlugin); } catch(_) {}
    }
    try {
      if (hasScrollToPlugin) {
        tween = gsapGlobal.to(window, {
          scrollTo: { y: target, autoKill: true },
          duration,
          ease,
          overwrite: 'auto',
          onComplete: () => { tween = null; },
        });
        return;
      }
    } catch(_) { /* fall through to native */ }

    // Fallback: native smooth scroll (browser-optimized)
    try {
      window.scrollTo({ top: target, behavior: 'smooth' });
      // emulate an animation lock window during native smooth
      tween = { kill(){ tween = null; } };
      setTimeout(() => { tween = null; }, Math.max(250, duration * 1000));
    } catch(_) {
      // Last resort: jump instantly
      window.scrollTo(0, target);
      tween = null;
    }
  }

  function onWheel(e){
    if (!slides.length) return;
    if (tween) { e.preventDefault(); return; }
    const dy = e.deltaY || 0;
    if (Math.abs(dy) < 2) return; // ignore micro noise
    e.preventDefault();
    const idx = getCurrentIndex();
    jumpToIndex(dy > 0 ? idx + 1 : idx - 1);
  }

  // Basic touch handling
  let touchStartY = 0;
  function onTouchStart(e){
    const t = e.touches && e.touches[0];
    touchStartY = t ? t.clientY : 0;
  }
  // Removed heavy touchmove preventDefault to avoid main-thread jank
  function onTouchEnd(e){
    if (!slides.length) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const dy = touchStartY - t.clientY;
    if (Math.abs(dy) < 20) return; // require an intentional swipe
    const idx = getCurrentIndex();
    jumpToIndex(dy > 0 ? idx + 1 : idx - 1);
  }

  function shouldIgnoreKey(){
    const el = document.activeElement;
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }

  function onKeyDown(e){
    if (shouldIgnoreKey()) return;
    let dir = 0;
    switch (e.code){
      case 'ArrowDown':
      case 'PageDown':
      case 'Space':
        dir = 1; break;
      case 'ArrowUp':
      case 'PageUp':
        dir = -1; break;
      case 'Home':
        jumpToIndex(0); e.preventDefault(); return;
      case 'End':
        jumpToIndex(slides.length - 1); e.preventDefault(); return;
      default:
        return;
    }
    e.preventDefault();
    const idx = getCurrentIndex();
    jumpToIndex(idx + dir);
  }

  function attach(){
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    // No touchmove listener to keep scrolling pipeline fast
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  function detach(){
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    // no touchmove listener to remove
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  }

  function handleResize(){
    collect();
  }

  // init
  collect();
  if (slides.length === 0) return;
  attach();

  // Expose tiny disposer
  return function destroySlidePager(){
    if (tween && tween.kill) tween.kill();
    detach();
  };
}


