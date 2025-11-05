/**
 * ==================================================
 *  McCann Website — Custom Cursor Module
 *  Purpose: Interactive cursor that follows mouse/touch with dynamic labels
 *  Date: 2025-11-05
 * ==================================================
 */

console.log('[CUSTOM-CURSOR] Module loaded');

// Import cursor label mappings from JSON
import labelMappings from '../data/cursor-labels.json';

/**
 * Initialize custom cursor system
 * @param {Object} options - Configuration options
 * @param {string} [options.cursorSelector='.cursor'] - CSS selector for cursor element
 * @param {string} [options.labelSelector='.cursor__label'] - CSS selector for label element
 * @param {number} [options.lerp=0.15] - Lerp factor for smooth following (0.1-0.3)
 * @param {number} [options.edgeMultiplier=2] - Speed multiplier when near viewport edges
 * @param {number} [options.edgeThreshold=0.1] - Edge detection threshold (0-0.5)
 */
export function initCustomCursor(options = {}) {
  const {
    cursorSelector = '.cursor',
    labelSelector = '.cursor__label',
    lerp = 0.15,
    edgeMultiplier = 2,
    edgeThreshold = 0.1
  } = options;

  // Check for reduced motion preference
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    console.log('[CUSTOM-CURSOR] Skipped - user prefers reduced motion');
    return;
  }

  // Check if cursor element exists
  let cursorEl = document.querySelector(cursorSelector);
  if (!cursorEl) {
    console.warn(`[CUSTOM-CURSOR] ❌ Element not found: ${cursorSelector}`);
    return;
  }

  const labelEl = cursorEl.querySelector(labelSelector);
  if (!labelEl) {
    console.warn(`[CUSTOM-CURSOR] ❌ Label element not found: ${labelSelector}`);
    return;
  }

  // CRITICAL FIX: Move cursor to body level if it's inside a wrapper
  // This ensures cursor is always positioned relative to viewport, not a container
  // Here's why → if cursor-wrapper has position:relative or is inside a positioned container,
  // the fixed positioning can be constrained. Moving to body guarantees viewport-relative positioning.
  const wrapper = cursorEl.closest('.cursor-wrapper');
  if (wrapper && wrapper !== document.body) {
    console.log('[CUSTOM-CURSOR] 🔧 Moving cursor to body level (was inside wrapper)');
    // Move cursor element directly to body (preserves all children including label)
    document.body.appendChild(cursorEl);
    // Remove wrapper if it's now empty (cleanup)
    if (wrapper.children.length === 0) {
      wrapper.remove();
    }
  }

  // ============================================================
  // STATE
  // ============================================================
  
  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = currentX;
  let targetY = currentY;
  let rafId = null;
  let isVisible = false;
  
  // Improved mobile detection → prioritize pointer type over screen size
  // Here's why → many desktop browsers report touch support (for tablets/styluses)
  // but we want mouse-follow behavior on desktop, touch-drag on mobile
  // Strategy: check pointer type first (most reliable), then screen size as fallback
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
  
  // Check pointer type (coarse = finger/touch, fine = mouse/stylus)
  // This is the most reliable indicator of input method
  let isPointerCoarse = false;
  try {
    const pointerQuery = window.matchMedia('(pointer: coarse)');
    isPointerCoarse = pointerQuery.matches;
  } catch(e) {
    // Pointer media query not supported → use screen size + touch as fallback
    // If small screen AND touch-capable, likely mobile
    isPointerCoarse = isSmallScreen && hasTouchSupport;
  }
  
  // Desktop mode: fine pointer (mouse) OR large screen with fine pointer
  // Mobile mode: coarse pointer (finger/touch) AND small screen
  // This ensures desktop users with touch-capable screens still get mouse-follow behavior
  const isMobile = isPointerCoarse && isSmallScreen;
  
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let labelUpdateTimeout = null;
  let lastLabelElement = null;

  // ============================================================
  // SETUP & INITIALIZATION
  // ============================================================
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[CUSTOM-CURSOR] 🎯 INITIALIZATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`[CUSTOM-CURSOR] ✓ Cursor element: ${cursorSelector}`);
  console.log(`[CUSTOM-CURSOR] ✓ Label element: ${labelSelector}`);
  console.log(`[CUSTOM-CURSOR] ✓ Mode: ${isMobile ? 'Mobile (drag)' : 'Desktop (follow)'}`);
  console.log(`[CUSTOM-CURSOR] ℹ️  Detection: screen=${isSmallScreen ? 'small' : 'large'}, touch=${hasTouchSupport}, pointer=${isPointerCoarse ? 'coarse' : 'fine'}`);
  console.log(`[CUSTOM-CURSOR] ✓ Lerp: ${lerp}`);
  console.log(`[CUSTOM-CURSOR] ✓ Edge multiplier: ${edgeMultiplier}x`);
  console.log(`[CUSTOM-CURSOR] ✓ Edge threshold: ${edgeThreshold * 100}%`);
  console.log(`[CUSTOM-CURSOR] ✓ Label mappings loaded: ${Object.keys(labelMappings).length} entries`);

  // Set initial position using CSS custom properties
  // This is crucial → Webflow can override these if needed, and they're GPU-friendly
  cursorEl.style.setProperty('--cursor-x', `${currentX}px`);
  cursorEl.style.setProperty('--cursor-y', `${currentY}px`);
  
  // Hide cursor initially (we'll show it on first mouse move)
  cursorEl.style.opacity = '0';

  // Apply global cursor hiding → completely disable OS cursor
  // This is the foundation - without this, the custom cursor won't work
  document.documentElement.style.cursor = 'none';
  document.body.style.cursor = 'none';
  
  // Inject stylesheet to override cursor on ALL elements
  // Here's why → some elements (like links, buttons) have default cursor styles
  // that can override our global rule, so we need !important to catch everything
  const style = document.createElement('style');
  style.id = 'custom-cursor-override';
  style.textContent = `
    /* Hide default cursor globally */
    *, *::before, *::after {
      cursor: none !important;
    }
    
    /* Allow cursor for accessibility tools (screen readers focus indicators) */
    [role="button"]:focus,
    a:focus,
    button:focus,
    input:focus,
    textarea:focus,
    select:focus,
    [tabindex]:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    
    /* Keep cursor hidden even on hover */
    a:hover,
    button:hover,
    [role="button"]:hover {
      cursor: none !important;
    }
  `;
  document.head.appendChild(style);

  console.log('[CUSTOM-CURSOR] ✓ Default cursor hidden globally');
  console.log('[CUSTOM-CURSOR] ✓ Accessibility focus indicators preserved');

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  
  /**
   * Calculate ease factor based on distance from viewport edges
   * Returns higher multiplier near edges, lower in center
   * 
   * This is the magic → creates the "speeds up at edges, slows in center" effect
   * The math works like this:
   * - Normalize cursor position to 0-1 range (independent of screen size)
   * - Find minimum distance to any edge (corners are closest to TWO edges)
   * - If near edge (< threshold): apply speed multiplier (2x default)
   * - If in center: apply inverse (0.5x default) to slow down
   * 
   * Why this feels good: edges feel "pulled" toward them, center feels "sticky"
   */
  function getEdgeEaseFactor(x, y) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    // Normalize position (0-1) → makes this work on any screen size
    const nx = x / w;
    const ny = y / h;
    
    // Distance from edges (0 at edge, 0.5 at center)
    // Math.min(nx, 1-nx) gives us distance from left OR right edge (whichever is closer)
    const distX = Math.min(nx, 1 - nx);
    const distY = Math.min(ny, 1 - ny);
    const minDist = Math.min(distX, distY); // Closest edge wins
    
    // If within edge threshold, apply multiplier
    // This creates a smooth transition zone, not a hard cutoff
    if (minDist < edgeThreshold) {
      const normalizedDist = minDist / edgeThreshold; // 0 at edge, 1 at threshold
      // Linear interpolation: edge = max multiplier, threshold = 1x
      const easeFactor = 1 + (edgeMultiplier - 1) * (1 - normalizedDist);
      return easeFactor;
    }
    
    // In center, slow down (inverse of edge multiplier)
    // This makes the center feel "heavier" and more deliberate
    const centerFactor = 1 / edgeMultiplier;
    return centerFactor;
  }

  /**
   * Update cursor position with smooth easing
   * 
   * This runs every frame via requestAnimationFrame (~60fps)
   * Uses lerp (linear interpolation) for smooth following → feels natural, not robotic
   * CRITICAL: This loop must continue running even if mouse stops moving
   * (it will just converge on targetX/targetY smoothly)
   */
  function updateCursor() {
    // Safety check: ensure cursor element still exists
    if (!cursorEl || !document.body.contains(cursorEl)) {
      console.warn('[CUSTOM-CURSOR] ⚠️ Cursor element lost, stopping animation');
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      return;
    }
    
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    
    // If distance is very small, snap to target (prevents jitter)
    // This threshold is sub-pixel, so it's invisible but prevents unnecessary updates
    const threshold = 0.01;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      currentX = targetX;
      currentY = targetY;
    } else {
      // Get ease factor based on current position (not target!)
      // Here's why → we want the easing to feel based on where cursor IS, not where it's going
      // This creates smoother transitions as you move across the viewport
      const easeFactor = getEdgeEaseFactor(currentX, currentY);
      const adjustedLerp = lerp * easeFactor;
      
      // Apply lerp interpolation → smooth exponential decay to target
      // Lower lerp = heavier/slower, higher lerp = lighter/faster
      currentX += dx * adjustedLerp;
      currentY += dy * adjustedLerp;
    }
    
    // Ensure values stay within viewport (defensive)
    currentX = Math.max(0, Math.min(currentX, window.innerWidth));
    currentY = Math.max(0, Math.min(currentY, window.innerHeight));
    
    // Update CSS custom properties → GPU-friendly transform
    // These get consumed by the CSS transform property
    // CRITICAL: Always update even if values haven't changed much → keeps animation smooth
    cursorEl.style.setProperty('--cursor-x', `${currentX}px`);
    cursorEl.style.setProperty('--cursor-y', `${currentY}px`);
    
    // Continue animation loop → this creates the smooth 60fps motion
    // CRITICAL: Always continue loop, even when cursor has stopped moving
    // This ensures cursor responds immediately when mouse moves again
    rafId = requestAnimationFrame(updateCursor);
  }

  /**
   * Show cursor
   */
  function showCursor() {
    if (!isVisible) {
      isVisible = true;
      cursorEl.style.opacity = '1';
      cursorEl.style.transition = 'opacity 0.2s ease';
      console.log('[CUSTOM-CURSOR] Cursor shown');
    }
  }

  /**
   * Hide cursor
   */
  function hideCursor() {
    if (isVisible) {
      isVisible = false;
      cursorEl.style.opacity = '0';
      console.log('[CUSTOM-CURSOR] Cursor hidden');
    }
  }

  /**
   * Find closest ancestor with cursor label data attribute
   * Traverses up the DOM tree to find the most specific label
   * 
   * This is crucial → when hovering a child element (like a <span> inside a button),
   * we need to find the parent's data attribute. Without traversal, labels only work
   * if you hover the exact element with the attribute.
   */
  function findLabelElement(element) {
    if (!element || !document.body.contains(element)) return null;
    
    let current = element;
    const maxDepth = 10; // Prevent infinite loops → safety net for weird DOM structures
    let depth = 0;
    
    while (current && depth < maxDepth) {
      // Skip the cursor element itself and its wrapper
      // This is crucial → prevent cursor from detecting itself during traversal
      // Without this, hovering the cursor would trigger label detection on itself
      if (current === cursorEl || 
          current.classList.contains('cursor') || 
          current.classList.contains('cursor-wrapper')) {
        current = current.parentElement;
        depth++;
        continue;
      }
      
      // Check if this element or its closest ancestor has a cursor label
      // Only check for data-cursor attribute (data-cursor-label removed)
      if (current.dataset.cursor) {
        return current;
      }
      
      // Check for common interactive element types
      const tagName = current.tagName;
      if (tagName === 'VIDEO' || tagName === 'A' || tagName === 'BUTTON' || 
          current.getAttribute('role') === 'button' ||
          current.hasAttribute('href') ||
          current.hasAttribute('onclick')) {
        return current;
      }
      
      // Check if element contains a video
      if (current.querySelector('video')) {
        return current;
      }
      
      current = current.parentElement;
      depth++;
    }
    
    return null;
  }

  /**
   * Update label text from element's data-cursor attribute
   * Traverses up DOM tree to find the most relevant label
   * Uses label mappings from JSON file
   */
  function updateLabel(element) {
    if (!labelEl) return;
    
    let labelText = '';
    const labelElement = findLabelElement(element);
    
    if (labelElement) {
      // Priority 1: data-cursor attribute (maps to JSON)
      const cursorType = labelElement.dataset.cursor;
      if (cursorType) {
        labelText = labelMappings[cursorType] || '';
      }
      
      // Priority 2: Auto-detection based on element type (fallback)
      // Only if no data-cursor attribute found
      if (!labelText) {
        const tagName = labelElement.tagName;
        if (tagName === 'VIDEO' || labelElement.closest('video')) {
          labelText = labelMappings['watch'] || 'watch';
        } else if (tagName === 'A' && labelElement.href && !labelElement.href.startsWith('#')) {
          labelText = labelMappings['read'] || 'read';
        } else if (tagName === 'BUTTON' || labelElement.getAttribute('role') === 'button') {
          labelText = labelMappings['click'] || 'click';
        }
      }
    }
    
    // Only update if label changed (prevent unnecessary DOM updates)
    const currentLabel = labelEl.textContent;
    if (labelText && labelText !== currentLabel) {
      labelEl.textContent = labelText;
      cursorEl.classList.add('has-label');
      labelEl.classList.add('is-visible');
      console.log(`[CUSTOM-CURSOR] Label: "${labelText}" (from ${labelElement?.tagName || 'unknown'})`);
    } else if (!labelText && currentLabel) {
      labelEl.textContent = '';
      cursorEl.classList.remove('has-label');
      labelEl.classList.remove('is-visible');
      console.log('[CUSTOM-CURSOR] Label cleared');
    }
  }

  /**
   * Throttled label update (performance optimization)
   * 
   * This is crucial → mousemove fires 60+ times per second. Without throttling,
   * we'd be running elementFromPoint() and DOM traversal constantly, causing lag.
   * 
   * Why requestAnimationFrame instead of setTimeout?
   * - RAF is synced to browser repaint (~60fps)
   * - Automatically pauses when tab is hidden (battery-friendly)
   * - Higher priority than setTimeout (smoother)
   */
  function updateLabelThrottled(element) {
    // Clear any pending update → only process the latest hover target
    if (labelUpdateTimeout) {
      cancelAnimationFrame(labelUpdateTimeout);
    }
    
    // Use requestAnimationFrame for smooth throttling
    // This batches updates to once per frame, max
    labelUpdateTimeout = requestAnimationFrame(() => {
      // Only update if element actually changed
      // Small optimization → prevents unnecessary DOM writes when hovering same element
      if (element !== lastLabelElement) {
        updateLabel(element);
        lastLabelElement = element;
      }
    });
  }

  /**
   * Handle mouse move (desktop)
   * CRITICAL: Must update targetX/targetY for every mouse movement
   * This function is called by window mousemove event → catches all movements
   */
  function handleMouseMove(e) {
    // Use clientX/clientY (viewport coordinates, not page coordinates)
    // This ensures cursor works correctly even when page is scrolled
    targetX = e.clientX;
    targetY = e.clientY;
    
    // Ensure values are within viewport bounds (safety check)
    targetX = Math.max(0, Math.min(targetX, window.innerWidth));
    targetY = Math.max(0, Math.min(targetY, window.innerHeight));
    
    showCursor();
    
    // Update label based on element under cursor (throttled)
    // Use elementFromPoint to find what's under the cursor
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    updateLabelThrottled(elementUnderCursor);
  }

  /**
   * Handle mouse leave (hide cursor when leaving viewport)
   * CRITICAL: mouseleave on document fires when mouse leaves the document bounds
   * This includes leaving the browser window entirely
   */
  function handleMouseLeave(e) {
    // Only hide if mouse actually left the window (not just moved to another element)
    // RelatedTarget is null when mouse leaves the window entirely
    if (!e.relatedTarget && e.clientY <= 0) {
      hideCursor();
      console.log('[CUSTOM-CURSOR] Mouse left viewport');
    }
  }

  /**
   * Handle touch start (mobile)
   */
  function handleTouchStart(e) {
    const touch = e.touches[0];
    if (!touch) return;
    
    isDragging = true;
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    targetX = dragStartX;
    targetY = dragStartY;
    
    showCursor();
    
    // Update label (throttled)
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    updateLabelThrottled(elementUnderTouch);
    
    console.log('[CUSTOM-CURSOR] Touch start');
  }

  /**
   * Handle touch move (mobile drag)
   */
  function handleTouchMove(e) {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevent scrolling while dragging cursor
    
    const touch = e.touches[0];
    if (!touch) return;
    
    targetX = touch.clientX;
    targetY = touch.clientY;
    
    // Update label (throttled)
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    updateLabelThrottled(elementUnderTouch);
  }

  /**
   * Handle touch end (mobile)
   */
  function handleTouchEnd() {
    isDragging = false;
    console.log('[CUSTOM-CURSOR] Touch end');
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================
  
  // Device-specific event listeners
  // Here's why → mobile needs touch events (draggable), desktop needs mouse (follow)
  // The passive flags matter: passive:false on touchmove lets us preventDefault()
  // to stop scrolling while dragging cursor
  // CRITICAL: Use window for mouseenter/mouseleave (they don't bubble from document)
  // CRITICAL: Use window for mousemove to catch all movements across entire viewport
  if (isMobile) {
    // Mobile: touch events → cursor is draggable
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    console.log('[CUSTOM-CURSOR] ✓ Touch event listeners attached (mobile)');
  } else {
    // Desktop: mouse events → cursor follows mouse
    // Use window instead of document for better viewport coverage
    // mousemove on window catches all movements, even over iframes/embeds
    window.addEventListener('mousemove', handleMouseMove, { passive: true, capture: true });
    
    // mouseenter/mouseleave don't bubble, so we use mouseover/mouseout on window
    // Or simpler: just show cursor on first mousemove (already handled in handleMouseMove)
    // Only need to handle leaving viewport
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    console.log('[CUSTOM-CURSOR] ✓ Mouse event listeners attached (desktop)');
    console.log('[CUSTOM-CURSOR] ℹ️  Using window for mousemove to catch all movements');
  }

  // Start animation loop → this is what makes the cursor smoothly follow
  // Runs continuously at 60fps, updating position every frame
  rafId = requestAnimationFrame(updateCursor);
  console.log('[CUSTOM-CURSOR] ✓ Animation loop started');

  // Handle window resize → throttle with setTimeout to avoid performance hit
  // Resize fires constantly during drag, so we debounce to once per 100ms
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Re-center cursor if it's outside viewport → prevents cursor getting stuck off-screen
      currentX = Math.min(currentX, window.innerWidth);
      currentY = Math.min(currentY, window.innerHeight);
      targetX = Math.min(targetX, window.innerWidth);
      targetY = Math.min(targetY, window.innerHeight);
      console.log('[CUSTOM-CURSOR] Viewport resized');
    }, 100);
  }, { passive: true });

    // Cleanup function
  const cleanup = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    
    if (labelUpdateTimeout) {
      cancelAnimationFrame(labelUpdateTimeout);
      labelUpdateTimeout = null;
    }
    
    // Remove event listeners
    if (isMobile) {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mouseleave', handleMouseLeave);
    }
    
    // Restore default cursor
    const styleEl = document.getElementById('custom-cursor-override');
    if (styleEl) styleEl.remove();
    document.documentElement.style.cursor = '';
    document.body.style.cursor = '';
    
    console.log('[CUSTOM-CURSOR] Cleaned up');
  };

  // Expose cleanup function
  window.App = window.App || {};
  window.App.customCursor = {
    cleanup,
    show: showCursor,
    hide: hideCursor,
    updateLabel
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[CUSTOM-CURSOR] ✅ INITIALIZED SUCCESSFULLY\n');

  return { cleanup, showCursor, hideCursor, updateLabel };
}

