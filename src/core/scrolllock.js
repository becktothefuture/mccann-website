/**
 * ==================================================
 *  McCann Website — Scroll Lock (Simplified)
 *  Purpose: Lock page scroll when modal is open
 *  Date: 2025-10-28
 * ==================================================
 */

let isLocked = false;
let savedY = 0;

export function lockScroll(){
  if (isLocked) return;
  isLocked = true;
  savedY = window.scrollY || document.documentElement.scrollTop || 0;
  
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
}

export function unlockScroll({ delayMs = 0 } = {}){
  if (!isLocked) return;
  
  const unlock = () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    window.scrollTo(0, savedY);
    isLocked = false;
  };
  
  delayMs > 0 ? setTimeout(unlock, delayMs) : unlock();
}


