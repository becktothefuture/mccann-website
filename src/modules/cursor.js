/**
 * ==================================================
 *  McCann Website — Custom Cursor
 *  Purpose: Replace system cursor with dark-blue circle; snappy scale on clickable
 *  Date: 2025-11-04
 * ==================================================
 */

export function initCustomCursor(options = {}){
  // Enable only on fine pointers (mouse, trackpad). Skip touch-only devices.
  const hasFinePointer = typeof window.matchMedia === 'function' 
    ? window.matchMedia('(pointer: fine)').matches
    : true;
  if (!hasFinePointer) return;

  // Prevent duplicate initialization
  if (document.getElementById('mccann-custom-cursor')) return;

  // Only treat anchors as scale-up targets per spec
  const clickableSelector = options.clickableSelector || 'a[href]';

  // Inject minimal CSS
  const style = document.createElement('style');
  style.id = 'mccann-custom-cursor-style';
  style.textContent = `
    /* Hide native cursor everywhere, including pseudo elements */
    .has-custom-cursor,
    .has-custom-cursor * { cursor: none !important; }
    .has-custom-cursor *::before,
    .has-custom-cursor *::after { cursor: none !important; }

    .custom-cursor {
      position: fixed;
      left: 0;
      top: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0a3d91; /* dark blue */
      pointer-events: none;
      z-index: 2147483647;
      transform: translate3d(-9999px, -9999px, 0) translate(-50%, -50%) scale(0.3);
      opacity: 0;
      transition: transform 120ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 80ms linear;
      will-change: transform, opacity;
    }

    .custom-cursor.is-visible { opacity: 1; }

    @media (prefers-reduced-motion: reduce) {
      .custom-cursor { transition: none; }
    }
  `;
  document.head.appendChild(style);

  document.documentElement.classList.add('has-custom-cursor');

  const el = document.createElement('div');
  el.id = 'mccann-custom-cursor';
  el.className = 'custom-cursor';
  el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);

  let mouseX = 0;
  let mouseY = 0;
  let isActive = false;
  let rafId = 0;
  let needsRender = false;
  const prefersReduced = typeof window.matchMedia === 'function' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function render(){
    rafId = 0;
    if (!needsRender) return;
    needsRender = false;
    const scale = isActive ? 1 : 0.3;
    el.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${scale})`;
  }

  function schedule(){
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  function setVisible(v){
    if (v) el.classList.add('is-visible');
    else el.classList.remove('is-visible');
  }

  function updateActive(target){
    const match = target && target.closest ? target.closest(clickableSelector) : null;
    const next = !!match;
    if (next !== isActive) {
      if (!prefersReduced) {
        if (next) {
          // Grow: 45ms with a bounce/overshoot feel
          el.style.transition = 'transform 45ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 80ms linear';
        } else {
          // Shrink: snappy but slightly longer to feel natural
          el.style.transition = 'transform 120ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 80ms linear';
        }
      }
      isActive = next;
      needsRender = true;
      schedule();
    }
  }

  function onPointerMove(e){
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateActive(e.target);
    setVisible(true);
    needsRender = true;
    schedule();
  }

  function onMouseOut(e){
    if (e.relatedTarget == null) setVisible(false);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('mouseout', onMouseOut, { passive: true });
  window.addEventListener('blur', () => setVisible(false));
  window.addEventListener('focus', () => setVisible(true));

  // Return cleanup handle
  return function destroy(){
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('mouseout', onMouseOut);
    document.documentElement.classList.remove('has-custom-cursor');
    try { el.remove(); } catch(_) {}
    try { style.remove(); } catch(_) {}
  };
}


