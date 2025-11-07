/**
 * ==================================================
 *  McCann Website — Accordion Module
 *  Purpose: ARIA-compliant nested accordion with GSAP animations
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[ACCORDION] Module loaded');

// ============================================================
// EXPORTS
// ============================================================

export function initAccordion(options = {}){
  const { selector = '.accordeon' } = options;
  
  const root = document.querySelector(selector);
  if (!root){ 
    console.log('[ACCORDION] ❌ Root element not found:', selector); 
    return; 
  }
  console.log('[ACCORDION] ✓ Root element found:', selector);
  
  window._accordionRoot = root;
  window._accordionDebug = true;

  // ============================================================
  // HELPERS
  // ============================================================

  const panelOf = item => item?.querySelector(':scope > .acc-list');
  const groupOf = item => {
    const parent = item.parentElement;
    return parent?.classList.contains('acc-list') ? parent : root;
  };
  const dbg = (...args) => { try { console.log('[ACCORDION]', ...args); } catch(_) {} };
  const itemKind = (el) => el?.classList?.contains('acc-section') ? 'section' : 'item';
  const labelOf = (el) => {
    const t = el?.querySelector(':scope > .acc-trigger');
    return (t?.textContent || '').trim().replace(/\s+/g,' ').slice(0,80);
  };
  const ACTIVE_TRIGGER_CLASS = 'acc-trigger--active';
  
  function markItemsForAnimation(panel, show = true) {
    const items = panel.querySelectorAll(':scope > .acc-item');
    items.forEach(item => {
      if (show) {
        item.classList.add('acc-animate-target');
      } else {
        item.classList.remove('acc-animate-target');
      }
    });
    dbg(`Marked ${items.length} items for ${show ? 'show' : 'hide'} animation in panel ${panel.id}`);
  }
  
  function clearAllAnimationMarkers() {
    root.querySelectorAll('.acc-animate-target').forEach(el => {
      el.classList.remove('acc-animate-target');
    });
  }

  // ============================================================
  // WEBFLOW IX INTEGRATION
  // ============================================================

  const wfIx = (window.Webflow && window.Webflow.require)
    ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
    : null;
  dbg('Webflow IX available:', !!wfIx);

  function emitIx(name){
    try {
      if (wfIx && typeof wfIx.emit === 'function') {
        dbg(`🎯 EMITTING via wfIx.emit: "${name}"`);
        wfIx.emit(name);
      }
    } catch(err) {
      dbg('wfIx.emit error', err && err.message);
    }
    
    try {
      window.dispatchEvent(new CustomEvent(name));
      dbg(`📢 EMITTING via window.dispatchEvent: "${name}"`);
    } catch(err) { 
      dbg('window.dispatchEvent error', err && err.message);
    }
  }

  function emitAll(primary){
    const aliases = [];
    if (primary === 'acc-open') aliases.push('accordeon-open');
    if (primary === 'acc-close') aliases.push('accordeon-close');
    [primary, ...aliases].forEach(ev => emitIx(ev));
  }

  // ============================================================
  // ARIA SETUP
  // ============================================================

  const triggers = root.querySelectorAll('.acc-trigger');
  triggers.forEach((t, i) => {
    const item = t.closest('.acc-section, .acc-item');
    const p = panelOf(item);
    if (p){
      const pid = p.id || `acc-panel-${i}`;
      p.id = pid;
      t.setAttribute('aria-controls', pid);
      t.setAttribute('aria-expanded', 'false');
    }
  });
  dbg('bootstrapped', triggers.length, 'triggers');

  // ============================================================
  // CORE FUNCTIONS
  // ============================================================

  function expand(p){
    dbg('expand start', { id: p.id, children: p.children?.length });
    p.classList.add('is-active', 'acc-list--expanding');
    p.dataset.state = 'opening';
    
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      if (p.dataset.state === 'opening'){
        p.classList.remove('acc-list--expanding');
        p.classList.add('acc-list--expanded');
        p.dataset.state = 'open';
        dbg('expanded', { id: p.id });
      }
    };
    p.addEventListener('transitionend', onEnd, { once: true });
  }

  function collapse(p){
    dbg('collapse start', { id: p.id });
    p.classList.remove('acc-list--expanding', 'acc-list--expanded');
    p.dataset.state = 'closing';
    
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      if (p.dataset.state === 'closing'){
        p.dataset.state = 'collapsed';
        p.classList.remove('is-active');
        markItemsForAnimation(p, false);
        dbg('collapsed', { id: p.id });
      }
    };
    p.addEventListener('transitionend', onEnd, { once: true });
  }

  function closeSiblings(item){
    const group = groupOf(item);
    if (!group) return;
    const want = item.matches('.acc-section') ? 'acc-section' : 'acc-item';
    Array.from(group.children).forEach(sib => {
      if (sib === item || !sib.classList.contains(want)) return;
      const p = panelOf(sib);
      if (p && (p.dataset.state === 'open' || p.dataset.state === 'opening')){
        dbg('close sibling', { kind: want, label: labelOf(sib), id: p.id });
        clearAllAnimationMarkers();
        markItemsForAnimation(p, true);
        requestAnimationFrame(() => emitAll('acc-close'));
        collapse(p);
        const trig = sib.querySelector(':scope > .acc-trigger');
        trig?.setAttribute('aria-expanded', 'false');
        trig?.classList?.remove(ACTIVE_TRIGGER_CLASS);
      }
    });
  }

  function resetAllL2Under(container){
    const scope = container || root;
    scope.querySelectorAll('.acc-item > .acc-list').forEach(p => {
      if (p.dataset.state === 'open' || p.dataset.state === 'opening'){
        collapse(p);
        const it = p.closest('.acc-item');
        const t = it?.querySelector(':scope > .acc-trigger');
        t?.setAttribute('aria-expanded', 'false');
        t?.classList?.remove(ACTIVE_TRIGGER_CLASS);
      }
    });
  }

  function toggle(item){
    const p = panelOf(item);
    if (!p) return;
    const trig = item.querySelector(':scope > .acc-trigger');
    const opening = !(p.dataset.state === 'open' || p.dataset.state === 'opening');
    dbg('toggle', { kind: itemKind(item), opening, label: labelOf(item), id: p.id });
    
    if (opening) closeSiblings(item);

    if (itemKind(item) === 'section'){
      if (opening) resetAllL2Under(root);
      else resetAllL2Under(item);
    }

    if (opening){
      clearAllAnimationMarkers();
      markItemsForAnimation(p, true);
      requestAnimationFrame(() => {
        dbg('emit acc-open', { id: p.id });
        emitAll('acc-open');
      });
      expand(p);
      trig?.setAttribute('aria-expanded', 'true');
      trig?.classList?.add(ACTIVE_TRIGGER_CLASS);
    } else {
      clearAllAnimationMarkers();
      markItemsForAnimation(p, true);
      requestAnimationFrame(() => {
        dbg('emit acc-close', { id: p.id });
        emitAll('acc-close');
      });
      collapse(p);
      trig?.setAttribute('aria-expanded', 'false');
      trig?.classList?.remove(ACTIVE_TRIGGER_CLASS);
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  document.body.classList.add('js-prep');
  root.querySelectorAll('.acc-list').forEach(p => { 
    p.dataset.state = 'collapsed'; 
  });
  requestAnimationFrame(() => {
    document.body.classList.remove('js-prep');
  });

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  function handleInteraction(e) {
    const t = e.target.closest('.acc-trigger');
    if (!t || !root.contains(t)) return;
    
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    
    e.preventDefault();
    const item = t.closest('.acc-section, .acc-item');
    if (item) {
      dbg(e.type, { label: (t.textContent || '').trim().replace(/\s+/g,' ').slice(0,80) });
      toggle(item);
    }
  }
  
  root.addEventListener('click', handleInteraction);
  root.addEventListener('keydown', handleInteraction);

  const ro = new ResizeObserver(entries => {
    entries.forEach(({ target: p }) => {
      if (p.dataset.state === 'open'){ 
        if (!p.classList.contains('acc-list--expanded')) {
          p.classList.add('acc-list--expanded');
        }
      }
    });
  });
  root.querySelectorAll('.acc-list').forEach(p => ro.observe(p));
  
  // ============================================================
  // DEBUG API
  // ============================================================

  window._accordionTest = {
    markItems: (panelId) => {
      const panel = document.getElementById(panelId) || root.querySelector('.acc-list');
      if (panel) {
        markItemsForAnimation(panel, true);
        console.log('Marked items in panel:', panel);
      }
    },
    clearMarks: () => {
      clearAllAnimationMarkers();
      console.log('Cleared all marks');
    },
    emitOpen: () => {
      emitAll('acc-open');
      console.log('Emitted acc-open');
    },
    emitClose: () => {
      emitAll('acc-close');
      console.log('Emitted acc-close');
    },
    checkWebflow: () => {
      console.log('Webflow object:', window.Webflow);
      console.log('wfIx:', wfIx);
    },
    getMarkedItems: () => {
      const items = root.querySelectorAll('.acc-animate-target');
      console.log(`Found ${items.length} items with .acc-animate-target class`);
      return items;
    }
  };
  
  console.log('[ACCORDION] Debug functions available at window._accordionTest');
}
