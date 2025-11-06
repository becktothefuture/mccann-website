/**
 * ==================================================
 *  McCann Website — Scroll Lock (Simplified)
 *  Purpose: Lock scroll on .perspective-wrapper when modal is open
 *  Date: 2025-11-06
 * ==================================================
 */

let isLocked = false;
let savedY = 0;
let wrapper = null;

/**
 * Lock scroll on .perspective-wrapper
 * 
 * This approach locks the scroll-snap container instead of body
 * Here's why → the homepage uses .perspective-wrapper as the scroll container
 * 
 * How it works:
 * 1. Find .perspective-wrapper (scroll-snap container)
 * 2. Save current scroll position
 * 3. Set overflow:hidden to prevent scrolling
 * 4. Add .modal-open class for CSS hooks
 * 
 * Falls back to body if wrapper not found (other pages)
 */
export function lockScroll(){
  if (isLocked) return;
  isLocked = true;
  
  // Find wrapper (or fall back to body)
  wrapper = document.querySelector('.perspective-wrapper') || document.body;
  
  // Save current scroll position → we'll restore this when unlocking
  if (wrapper === document.body) {
    savedY = window.scrollY || document.documentElement.scrollTop || 0;
  } else {
    savedY = wrapper.scrollTop || 0;
  }
  
  // Lock scroll
  // For wrapper: simply hide overflow
  // For body: use position:fixed approach (iOS Safari compatibility)
  if (wrapper === document.body) {
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }
  
  wrapper.style.overflow = 'hidden';
  wrapper.classList.add('modal-open');
}

/**
 * Unlock scroll and restore position
 * 
 * @param {Object} options
 * @param {number} [options.delayMs=0] - Delay before unlocking (for animation coordination)
 */
export function unlockScroll({ delayMs = 0 } = {}){
  if (!isLocked) return;
  
  const unlock = () => {
    if (!wrapper) return;
    
    // Remove overflow lock
    wrapper.style.overflow = '';
    wrapper.classList.remove('modal-open');
    
    // Restore scroll position
    if (wrapper === document.body) {
      // Body: remove fixed positioning and restore scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, savedY);
    } else {
      // Wrapper: restore scrollTop
      wrapper.scrollTop = savedY;
    }
    
    isLocked = false;
    wrapper = null;
  };
  
  // Optional delay → coordinate with closing animations
  // If lightbox closes with animation, wait for it to finish before unlocking scroll
  delayMs > 0 ? setTimeout(unlock, delayMs) : unlock();
}


