/**
 * ==================================================
 *  McCann Website — Accordion Module
 *  Purpose: ARIA-compliant nested accordion with GSAP-driven stagger
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
    panelOpenDuration: openOpt,
    panelCloseDuration: closeOpt,
    itemDuration: itemDurationOpt,
    itemStagger: itemStaggerOpt,
    itemDistance: itemDistanceOpt,
    openDuration,
    closeDuration
  } = options;

  let panelOpenDuration = openOpt ?? openDuration ?? 200;
  let panelCloseDuration = closeOpt ?? closeDuration ?? 150;
  let itemDuration = itemDurationOpt ?? 50; // ms per item
  let itemStagger = itemStaggerOpt ?? 20;   // ms between items
  let itemDistance = itemDistanceOpt ?? 6;  // px travel

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

  const hasGSAP = Boolean(window.gsap && typeof window.gsap.timeline === 'function');
  const motionReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const toSeconds = (ms) => ms / 1000;

  panelOpenDuration = motionReduce ? 0 : Math.max(panelOpenDuration ?? 200, 0);
  panelCloseDuration = motionReduce ? 0 : Math.max(panelCloseDuration ?? 150, 0);
  itemDuration = motionReduce ? 0 : Math.max(itemDuration ?? 50, 0);
  itemStagger = motionReduce ? 0 : Math.max(itemStagger ?? 20, 0);
  itemDistance = motionReduce ? 0 : Math.max(itemDistance ?? 6, 0);

  const openDurationSec = toSeconds(panelOpenDuration);
  const closeDurationSec = toSeconds(panelCloseDuration);
  const itemDurationSec = toSeconds(itemDuration);
  const itemStaggerSec = toSeconds(itemStagger);

  const panelTimelines = new WeakMap();

  const panelOf = (item) => item?.querySelector(':scope > .acc-list');
  const groupOf = (item) => {
    const parent = item.parentElement;
    return parent?.classList.contains('acc-list') ? parent : root;
  };
  const dbg = (...args) => { try { console.log('[ACCORDION]', ...args); } catch (_) {} };
  const itemKind = (el) => el?.classList?.contains('acc-section') ? 'section' : 'item';
  const labelOf = (el) => {
    const trigger = el?.querySelector(':scope > .acc-trigger');
    return (trigger?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  };
  const ACTIVE_TRIGGER_CLASS = 'is-active';
  const PANEL_STATES = {
    COLLAPSED: 'collapsed',
    CLOSING: 'closing',
    OPENING: 'opening',
    OPEN: 'open'
  };

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

  function killTimeline(panel) {
    const tl = panelTimelines.get(panel);
    if (!tl) return;
    tl.eventCallback('onComplete', null);
    tl.kill();
    panelTimelines.delete(panel);
  }

  function emitAll(primary, detail = {}) {
    const aliases = [];
    if (primary === 'acc-open') aliases.push('accordeon-open');
    if (primary === 'acc-close') aliases.push('accordeon-close');
    [primary, ...aliases].forEach((name) => {
      try {
        window.dispatchEvent(new CustomEvent(name, { detail }));
        dbg(`📢 EMIT: "${name}"`, detail);
      } catch (error) {
        dbg('emit error', error?.message);
      }
    });
  }

  function finalizeOpen(panel) {
    panelTimelines.delete(panel);
    setPanelState(panel, PANEL_STATES.OPEN);
    panel.style.height = 'auto';
    panel.style.overflow = 'visible';
    if (hasGSAP) {
      const items = panel.querySelectorAll(':scope > .acc-item');
      window.gsap.set(items, { clearProps: 'transform,opacity' });
    }
    dbg('expanded', { id: panel.id });
  }

  function finalizeClose(panel) {
    panelTimelines.delete(panel);
    setPanelState(panel, PANEL_STATES.COLLAPSED);
    panel.classList.remove('is-active');
    panel.setAttribute('aria-hidden', 'true');
    panel.style.height = '0px';
    panel.style.overflow = 'hidden';
    if (hasGSAP) {
      const items = panel.querySelectorAll(':scope > .acc-item');
      window.gsap.set(items, { y: -itemDistance, opacity: 0 });
    }
    dbg('collapsed', { id: panel.id });
  }

  function openInstant(panel) {
    finalizeOpen(panel);
  }

  function closeInstant(panel) {
    finalizeClose(panel);
  }

  function openPanel(panel) {
    ensurePanelRegistration(panel);
    killTimeline(panel);

    setPanelState(panel, PANEL_STATES.OPENING);
    panel.classList.add('is-active');
    panel.setAttribute('aria-hidden', 'false');
    panel.style.display = panel.dataset.accDisplay || 'block';

    emitAll('acc-open', { id: panel.id });

    if (!hasGSAP || (openDurationSec === 0 && itemDurationSec === 0)) {
      openInstant(panel);
      return;
    }

    const items = Array.from(panel.querySelectorAll(':scope > .acc-item'));
    window.gsap.set(panel, {
      height: panel.getBoundingClientRect().height,
      overflow: 'hidden'
    });
    window.gsap.set(items, { y: -itemDistance, opacity: 0 });

    const tl = window.gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => finalizeOpen(panel)
    });

    tl.to(panel, {
      height: () => panel.scrollHeight,
      duration: openDurationSec || 0
    });

    if (items.length && itemDurationSec >= 0) {
      tl.to(items, {
        y: 0,
        opacity: 1,
        duration: Math.max(itemDurationSec, 0.05),
        stagger: Math.max(itemStaggerSec || 0.02, 0),
        ease: 'power1.out'
      }, 0);
    }

    panelTimelines.set(panel, tl);
  }

  function closePanel(panel) {
    ensurePanelRegistration(panel);
    killTimeline(panel);

    setPanelState(panel, PANEL_STATES.CLOSING);
    emitAll('acc-close', { id: panel.id });

    if (!hasGSAP || (closeDurationSec === 0 && itemDurationSec === 0)) {
      closeInstant(panel);
      return;
    }

    const items = Array.from(panel.querySelectorAll(':scope > .acc-item'));
    window.gsap.set(panel, {
      height: panel.getBoundingClientRect().height,
      overflow: 'hidden'
    });
    window.gsap.set(items, { y: 0, opacity: 1 });

    const tl = window.gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => finalizeClose(panel)
    });

    if (items.length && itemDurationSec >= 0) {
      tl.to([...items].reverse(), {
        y: -itemDistance,
        opacity: 0,
        duration: Math.max(itemDurationSec, 0.05),
        stagger: Math.max(itemStaggerSec || 0.02, 0),
        ease: 'power1.in'
      });
    }

    tl.to(panel, {
      height: 0,
      duration: closeDurationSec || 0
    }, 0);

    panelTimelines.set(panel, tl);
  }

  function collapseDescendants(container) {
    const scope = container || root;
    scope.querySelectorAll('.acc-item > .acc-list').forEach((panel) => {
      if (panel.dataset.state === PANEL_STATES.COLLAPSED) return;
      killTimeline(panel);
      closeInstant(panel);
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
    Array.from(group.children).forEach((sibling) => {
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
  root.querySelectorAll('.acc-list').forEach((panel) => {
    ensurePanelRegistration(panel);
    const isActive = panel.classList.contains('is-active');
    if (isActive) {
      finalizeOpen(panel);
    } else {
      finalizeClose(panel);
    }
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
      root.querySelectorAll('.acc-list').forEach((panel) => {
        killTimeline(panel);
        closeInstant(panel);
      });
      root.querySelectorAll('.acc-trigger').forEach((trigger) => {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.classList.remove(ACTIVE_TRIGGER_CLASS);
      });
    },
    state: () => Array.from(root.querySelectorAll('.acc-list')).map((panel) => ({
      id: panel.id,
      state: panel.dataset.state,
      height: panel.style.height
    }))
  };

  console.log('[ACCORDION] Debug functions available at window._accordionTest');
}
