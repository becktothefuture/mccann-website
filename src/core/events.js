/**
 * ==================================================
 *  McCann Website — Events Utility
 *  Purpose: Emit bubbling CustomEvents
 *  Date: 2025-11-06
 * ==================================================
 */

export function emit(name, target = window, detail = {}){
  try { target.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true, detail })); } catch {}
  try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
}
