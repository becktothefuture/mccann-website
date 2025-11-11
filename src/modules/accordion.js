/**
 * ==================================================
 *  McCann Website — Accordion Module
 *  Purpose: ARIA-compliant nested accordion with native staggered animation
 *  Date: 2025-11-10
 * ==================================================
 */

console.log('[ACCORDION] Module loaded');

// ============================================================
// EXPORTS
// ============================================================

export function initAccordion(options = {}) {
  const {
    selector = '.accordeon',
    openDuration = 360,
    closeDuration = 260,
    itemDuration = 320,
    itemOverlap = 100,
    itemDistance = 16
  } = options;

  const root = document.querySelector(selector);
  if (!root) {
    console.log('[ACCORDION] ❌ Root element not found:', selector);
    return;
  }
  console.log('[ACCORDION] ✓ Root element found:', selector);

  window._accordionRoot = root;
  window._accordionDebug = true;

  // ============================================================
  // HELPERS
  // ============================================================

  const panelOf = (item) => item?.querySelector(':scope > .acc-list');
  const groupOf = (item) => {
    const parent = item.parentElement;
    return parent?.classList.contains('acc-list') ? parent : root;
  };
  const dbg = (...args) => { try { console.log('[ACCORDION]', ...args); } catch (_) {} };
  const itemKind = (el) => el?.classList?.contains('acc-section') ? 'section' : 'item';
  const labelOf = (el) => {
    const t = el?.querySelector(':scope > .acc-trigger');
    return (t?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  };
  const ACTIVE_TRIGGER_CLASS = 'is-active';
  const PANEL_STATES = {
    COLLAPSED: 'collapsed',
    CLOSING: 'closing',
    OPENING: 'opening',
    OPEN: 'open'
  };

  const motionReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const resolvedOpenDuration = motionReduce ? 0 : Math.max(openDuration, 16);
  const resolvedCloseDuration = motionReduce ? 0 : Math.max(closeDuration, 16);
  const resolvedItemDuration = motionReduce ? 0 : Math.max(itemDuration, 16);
  const resolvedOverlap = motionReduce ? 0 : Math.min(Math.max(itemOverlap, 0), resolvedItemDuration);
  const itemStep = resolvedItemDuration > 0 ? Math.max(resolvedItemDuration - resolvedOverlap, 0) : 0;
  const resolvedDistance = Math.max(itemDistance, 0);

  root.style.setProperty('--acc-item-distance', `${resolvedDistance}px`);

  const panelRafMap = new WeakMap();
  const itemRafMap = new WeakMap();

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;

  function setPanelState(panel, state) {
    panel.dataset.state = state;
    panel.setAttribute('data-accordion-state', state);
  }

  function ensurePanelRegistration(panel) {
    if (!panel.dataset.accDisplay) {
      const computedDisplay = window.getComputedStyle(panel).display;
      panel.dataset.accDisplay = computedDisplay === 'none' ? 'block' : computedDisplay;
    }
    panel.style.display = panel.dataset.accDisplay || 'block';
  }

  // ============================================================
  // ANIMATION
  // ============================================================

  function cancelPanelAnimation(panel) {
    const raf = panelRafMap.get(panel);
    if (typeof raf === 'number') {
      cancelAnimationFrame(raf);
    }
    panelRafMap.delete(panel);
    panel.style.willChange = '';
  }

  function animatePanelHeight(panel, direction, onComplete) {
    cancelPanelAnimation(panel);

    const duration = direction === 'open' ? resolvedOpenDuration : resolvedCloseDuration;
    const startHeight = panel.getBoundingClientRect().height;
    const targetHeight = direction === 'open' ? panel.scrollHeight : 0;

    if (duration <= 16) {
      panel.style.height = direction === 'open' ? 'auto' : '0px';
      panel.style.overflow = direction === 'open' ? 'visible' : 'hidden';
      onComplete?.();
      return;
    }

    const startTime = performance.now();
    const ease = direction === 'open' ? easeOutCubic : easeInCubic;

    if (direction === 'open' && startHeight === 0) {
      panel.style.height = '0px';
    } else if (direction === 'close' && (panel.style.height === 'auto' || panel.style.height === '')) {
      panel.style.height = `${startHeight}px`;
    }

    panel.style.overflow = 'hidden';
    panel.style.willChange = 'height';

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const current = startHeight + (targetHeight - startHeight) * eased;
      panel.style.height = `${current}px`;

      if (progress < 1) {
        panelRafMap.set(panel, requestAnimationFrame(step));
        return;
      }

      panelRafMap.delete(panel);
      panel.style.height = direction === 'open' ? 'auto' : '0px';
      panel.style.overflow = direction === 'open' ? 'visible' : 'hidden';
      panel.style.willChange = '';
      onComplete?.();
    };

    panelRafMap.set(panel, requestAnimationFrame(step));
  }

  function cancelItemAnimation(item) {
    const raf = itemRafMap.get(item);
    if (typeof raf === 'number') {
      cancelAnimationFrame(raf);
    }
    itemRafMap.delete(item);
    item.style.willChange = '';
  }

  function animateItem(item, direction, delayMs) {
    cancelItemAnimation(item);

    const duration = resolvedItemDuration;
    const stored = parseFloat(item.style.getPropertyValue('--acc-progress'));
    const startValue = Number.isFinite(stored) ? stored : (direction === 'open' ? 0 : 1);
    const endValue = direction === 'open' ? 1 : 0;

    if (duration <= 16) {
      item.style.setProperty('--acc-progress', endValue.toString());
      return;
    }

    const startTime = performance.now() + delayMs;
    const ease = direction === 'open' ? easeOutCubic : easeInCubic;

    item.style.willChange = 'transform, opacity';

    const step = (now) => {
      if (now < startTime) {
        itemRafMap.set(item, requestAnimationFrame(step));
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = ease(progress);
      const current = startValue + (endValue - startValue) * eased;
      item.style.setProperty('--acc-progress', current.toFixed(3));

      if (progress < 1) {
        itemRafMap.set(item, requestAnimationFrame(step));
        return;
      }

      itemRafMap.delete(item);
      item.style.setProperty('--acc-progress', endValue.toString());
      item.style.willChange = '';
    };

    itemRafMap.set(item, requestAnimationFrame(step));
  }

  function animateItems(panel, direction) {
    const items = Array.from(panel.querySelectorAll(':scope > .acc-item'));
    if (!items.length) return;

    const total = items.length;
    items.forEach((item, index) => {
      const order = direction === 'open' ? index : total - index - 1;
      const delay = Math.max(itemStep * order, 0);
      animateItem(item, direction, delay);
    });
  }

  function setItemsProgress(panel, value) {
    const clamped = Math.max(0, Math.min(1, value));
    panel.querySelectorAll(':scope > .acc-item').forEach(item => {
      cancelItemAnimation(item);
      item.style.setProperty('--acc-progress', clamped.toFixed(3));
    });
  }

  function emitAll(primary, detail = {}) {
    const aliases = [];
    if (primary === 'acc-open') aliases.push('accordeon-open');
    if (primary === 'acc-close') aliases.push('accordeon-close');
    [primary, ...aliases].forEach(name => {
      try {
        window.dispatchEvent(new CustomEvent(name, { detail }));
        dbg(`📢 EMITTING: "${name}"`, detail);
      } catch (err) {
        dbg('emit error', err?.message);
      }
    });
  }

  function finalizeOpen(panel) {
    setPanelState(panel, PANEL_STATES.OPEN);
    panel.style.height = 'auto';
    panel.style.overflow = 'visible';
    setItemsProgress(panel, 1);
    dbg('expanded', { id: panel.id });
  }

  function finalizeClose(panel) {
    setPanelState(panel, PANEL_STATES.COLLAPSED);
    panel.classList.remove('is-active');
    panel.setAttribute('aria-hidden', 'true');
    panel.style.height = '0px';
    panel.style.overflow = 'hidden';
    setItemsProgress(panel, 0);
    dbg('collapsed', { id: panel.id });
  }

  function openPanel(panel) {
    ensurePanelRegistration(panel);
    cancelPanelAnimation(panel);
    setPanelState(panel, PANEL_STATES.OPENING);
    panel.classList.add('is-active');
    panel.setAttribute('aria-hidden', 'false');
    panel.style.display = panel.dataset.accDisplay || 'block';
    panel.style.overflow = 'hidden';
    if (panel.style.height === '' || panel.style.height === 'auto') {
      panel.style.height = '0px';
    }
    setItemsProgress(panel, 0);
    animateItems(panel, 'open');
    emitAll('acc-open', { id: panel.id });
    animatePanelHeight(panel, 'open', () => finalizeOpen(panel));
  }

  function closePanel(panel) {
    ensurePanelRegistration(panel);
    cancelPanelAnimation(panel);
    setPanelState(panel, PANEL_STATES.CLOSING);
    panel.style.overflow = 'hidden';
    panel.style.height = `${panel.getBoundingClientRect().height}px`;
    animateItems(panel, 'close');
    emitAll('acc-close', { id: panel.id });
    animatePanelHeight(panel, 'close', () => finalizeClose(panel));
  }

  function forceCollapse(panel) {
    ensurePanelRegistration(panel);
    cancelPanelAnimation(panel);
    setPanelState(panel, PANEL_STATES.COLLAPSED);
    panel.classList.remove('is-active');
    panel.setAttribute('aria-hidden', 'true');
    panel.style.display = panel.dataset.accDisplay || 'block';
    panel.style.height = '0px';
    panel.style.overflow = 'hidden';
    setItemsProgress(panel, 0);
  }

  function collapseDescendants(container) {
    const scope = container || root;
    scope.querySelectorAll('.acc-item > .acc-list').forEach(panel => {
      if (panel.dataset.state === PANEL_STATES.COLLAPSED) return;
      forceCollapse(panel);
      const owner = panel.closest('.acc-item');
      const trigger = owner?.querySelector(':scope > .acc-trigger');
      trigger?.setAttribute('aria-expanded', 'false');
      trigger?.classList?.remove(ACTIVE_TRIGGER_CLASS);
    });
  }

  function closeSiblings(item) {
    const group = groupOf(item);
    if (!group) return;
    const targetClass = item.matches('.acc-section') ? 'acc-section' : 'acc-item';
    Array.from(group.children).forEach(sibling => {
      if (sibling === item || !sibling.classList.contains(targetClass)) return;
      const panel = panelOf(sibling);
      if (!panel) return;
      const state = panel.dataset.state;
      if (state === PANEL_STATES.COLLAPSED || state === PANEL_STATES.CLOSING) return;
      dbg('close sibling', { kind: targetClass, label: labelOf(sibling), id: panel.id });
      closePanel(panel);
      const trigger = sibling.querySelector(':scope > .acc-trigger');
      trigger?.setAttribute('aria-expanded', 'false');
      trigger?.classList?.remove(ACTIVE_TRIGGER_CLASS);
    });
  }

  // ============================================================
  // ARIA SETUP
  // ============================================================

  const triggers = root.querySelectorAll('.acc-trigger');
  triggers.forEach((trigger, index) => {
    const item = trigger.closest('.acc-section, .acc-item');
    const panel = panelOf(item);
    if (!panel) return;

    const pid = panel.id || `acc-panel-${index}`;
    panel.id = pid;
    trigger.setAttribute('aria-controls', pid);

    const initiallyExpanded = panel.classList.contains('is-active');
    trigger.setAttribute('aria-expanded', initiallyExpanded ? 'true' : 'false');
    if (initiallyExpanded) {
      trigger.classList.add(ACTIVE_TRIGGER_CLASS);
    } else {
      trigger.classList.remove(ACTIVE_TRIGGER_CLASS);
    }
  });
  dbg('bootstrapped', triggers.length, 'triggers');

  // ============================================================
  // INITIALIZATION
  // ============================================================

  document.body.classList.add('js-prep');
  root.querySelectorAll('.acc-list').forEach(panel => {
    ensurePanelRegistration(panel);
    const isActive = panel.classList.contains('is-active');
    const state = isActive ? PANEL_STATES.OPEN : PANEL_STATES.COLLAPSED;
    setPanelState(panel, state);
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    panel.style.height = isActive ? 'auto' : '0px';
    panel.style.overflow = isActive ? 'visible' : 'hidden';
    setItemsProgress(panel, isActive ? 1 : 0);
  });
  requestAnimationFrame(() => {
    document.body.classList.remove('js-prep');
  });

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================

  function toggle(item) {
    const panel = panelOf(item);
    if (!panel) return;
    const trigger = item.querySelector(':scope > .acc-trigger');
    const state = panel.dataset.state;
    const opening = !(state === PANEL_STATES.OPEN || state === PANEL_STATES.OPENING);

    dbg('toggle', { kind: itemKind(item), opening, label: labelOf(item), id: panel.id });

    if (opening) closeSiblings(item);

    if (itemKind(item) === 'section') {
      if (opening) {
        collapseDescendants(root);
      } else {
        collapseDescendants(item);
      }
    }

    if (opening) {
      openPanel(panel);
      trigger?.setAttribute('aria-expanded', 'true');
      trigger?.classList?.add(ACTIVE_TRIGGER_CLASS);
      return;
    }

    closePanel(panel);
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.classList?.remove(ACTIVE_TRIGGER_CLASS);
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  function handleInteraction(event) {
    const trigger = event.target.closest('.acc-trigger');
    if (!trigger || !root.contains(trigger)) return;

    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    const item = trigger.closest('.acc-section, .acc-item');
    if (item) {
      dbg(event.type, { label: (trigger.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80) });
      toggle(item);
    }
  }

  root.addEventListener('click', handleInteraction);
  root.addEventListener('keydown', handleInteraction);

  // ============================================================
  // DEBUG API
  // ============================================================

  window._accordionTest = {
    open: (panelId) => {
      const panel = document.getElementById(panelId);
      if (panel) openPanel(panel);
    },
    close: (panelId) => {
      const panel = document.getElementById(panelId);
      if (panel) closePanel(panel);
    },
    forceCloseAll: () => {
      root.querySelectorAll('.acc-list').forEach(panel => forceCollapse(panel));
      root.querySelectorAll('.acc-trigger').forEach(trigger => {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.classList.remove(ACTIVE_TRIGGER_CLASS);
      });
    },
    state: () => {
      return Array.from(root.querySelectorAll('.acc-list')).map(panel => ({
        id: panel.id,
        state: panel.dataset.state,
        height: panel.style.height
      }));
    }
  };

  console.log('[ACCORDION] Debug functions available at window._accordionTest');
}
