/**
 * ==================================================
 *  McCann Website — Events Utility
 *  Purpose: Emit bubbling CustomEvents compatible with GSAP-UI (window scope)
 *  Date: 2025-10-28
 * ==================================================
 */

export function emit(name, target = window, detail = {}){
  try { target.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true, detail })); } catch {}
  try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
}


