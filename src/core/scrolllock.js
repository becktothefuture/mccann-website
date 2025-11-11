/**
 * ==================================================
 *  McCann Website — Scroll Lock
 *  Purpose: Lock/unlock scroll on .perspective-wrapper
 *  Date: 2025-11-06
 * ==================================================
 */

let isLocked = false;
let wrapper = null;

// ============================================================
// EXPORTS
// ============================================================

export function lockScroll(){
  if (isLocked) return;
  isLocked = true;
  
  wrapper = document.querySelector('.perspective-wrapper') || document.body;
  
  if (wrapper === document.body) {
    // iOS-compatible scroll lock using position: fixed
    document.body.style.position = 'fixed';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  
  wrapper.style.overflow = 'hidden';
  wrapper.classList.add('modal-open');
}

export function unlockScroll({ delayMs = 0 } = {}){
  if (!isLocked) return;
  
  const unlock = () => {
    if (!wrapper) return;
    
    wrapper.style.overflow = '';
    wrapper.classList.remove('modal-open');
    
    if (wrapper === document.body) {
      document.body.style.position = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
    }
    
    isLocked = false;
    wrapper = null;
  };
  
  delayMs > 0 ? setTimeout(unlock, delayMs) : unlock();
}
