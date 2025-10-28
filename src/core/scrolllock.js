/**
 * ==================================================
 *  McCann Website — Scroll Lock (Hybrid, iOS-safe)
 *  Purpose: Reliable page scroll locking with exact restore
 *  Date: 2025-10-28
 * ==================================================
 */

let locks = 0;
let savedY = 0;
let prevScrollBehavior = '';

export function lockScroll(){
  if (locks++) return;
  const de = document.documentElement;
  prevScrollBehavior = de.style.scrollBehavior;
  de.style.scrollBehavior = 'auto';
  savedY = window.scrollY || de.scrollTop || 0;

  // Fixed-body + modal-open class for CSS hooks
  Object.assign(document.body.style, {
    position: 'fixed',
    top: `-${savedY}px`,
    left: '0',
    right: '0',
    width: '100%',
    overflow: 'hidden',
    overscrollBehavior: 'none'
  });
  try { document.body.classList.add('modal-open'); } catch {}
}

export function unlockScroll({ delayMs = 0 } = {}){
  const run = () => {
    if (--locks > 0) return;
    const de = document.documentElement;
    Object.assign(document.body.style, {
      position: '', top: '', left: '', right: '', width: '', overflow: '', overscrollBehavior: ''
    });
    try { document.body.classList.remove('modal-open'); } catch {}
    de.style.scrollBehavior = prevScrollBehavior || '';
    window.scrollTo(0, savedY);
  };
  delayMs ? setTimeout(run, delayMs) : run();
}


