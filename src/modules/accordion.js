/**
 * ==================================================
 *  McCann Website — Accordion Module
 *  Purpose: ARIA, smooth transitions, GSAP event hooks
 *  Date: 2025-10-28
 * ==================================================
 */

import { emit } from '../core/events.js';
console.log('[ACCORDION] module loaded');

export function initAccordion(rootSel = '.accordeon'){
  const root = document.querySelector(rootSel);
  if (!root){ console.log('[ACCORDION] ❌ root not found for selector:', rootSel); return; }
  console.log('[ACCORDION] ✅ Initializing accordion on:', rootSel);
  
  // Store reference globally for debugging
  window._accordionRoot = root;
  window._accordionDebug = true;

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
  
  // Instead of using a class, we'll use data attributes on the items themselves
  function markItemsForAnimation(panel, show = true) {
    // Mark direct child items of this panel for animation
    const items = panel.querySelectorAll(':scope > .acc-item');
    items.forEach(item => {
      if (show) {
        item.setAttribute('data-acc-animate', 'true');
      } else {
        item.removeAttribute('data-acc-animate');
      }
    });
    dbg(`Marked ${items.length} items for ${show ? 'show' : 'hide'} animation in panel ${panel.id}`);
    
    // Debug: Log what elements have the attribute now
    const allMarked = root.querySelectorAll('[data-acc-animate]');
    dbg(`Total elements with data-acc-animate in DOM: ${allMarked.length}`);
    allMarked.forEach(el => {
      dbg(`  - ${el.className} | Text: ${(el.textContent || '').trim().slice(0, 50)}`);
    });
  }
  
  function clearAllAnimationMarkers() {
    root.querySelectorAll('[data-acc-animate]').forEach(el => {
      el.removeAttribute('data-acc-animate');
    });
  }
  // Webflow IX (ix3 preferred, fallback ix2). If not present, we still dispatch window CustomEvent
  const wfIx = (window.Webflow && window.Webflow.require)
    ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
    : null;
  dbg('Webflow IX available:', !!wfIx);
  function emitIx(name){
    try {
      if (wfIx && typeof wfIx.emit === 'function') {
        dbg(`🎯 EMITTING via wfIx.emit: "${name}"`);
        wfIx.emit(name);
        
        // Also check what elements currently have the attribute
        const marked = root.querySelectorAll('[data-acc-animate="true"]');
        dbg(`  → ${marked.length} elements have data-acc-animate when "${name}" fires`);
        
        return true;
      }
    } catch(err) {
      dbg('wfIx.emit error', err && err.message);
    }
    try {
      // Fallback: bubble a CustomEvent on window for any listeners
      window.dispatchEvent(new CustomEvent(name));
      dbg(`📢 EMITTING via window.dispatchEvent: "${name}"`);
      return false;
    } catch(_) { return false; }
  }

  // Emit primary event plus legacy aliases (without global toggle) so existing Webflow timelines keep working
  function emitAll(primary){
    const aliases = [];
    if (primary === 'acc-open') aliases.push('accordeon-open');
    if (primary === 'acc-close') aliases.push('accordeon-close');
    [primary, ...aliases].forEach(ev => emitIx(ev));
  }

  // ARIA bootstrap
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

  function expand(p){
    dbg('expand start', { id: p.id, children: p.children?.length, h: p.scrollHeight });
    p.classList.add('is-active');
    // Ensure direct child rows are not stuck hidden by any global GSAP initial state
    Array.from(p.querySelectorAll(':scope > .acc-item')).forEach((row) => {
      row.style.removeProperty('opacity');
      row.style.removeProperty('visibility');
      row.style.removeProperty('transform');
    });
    p.style.maxHeight = p.scrollHeight + 'px';
    p.dataset.state = 'opening';
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      p.removeEventListener('transitionend', onEnd);
      if (p.dataset.state === 'opening'){
        p.style.maxHeight = 'none';
        p.dataset.state = 'open';
        dbg('expanded', { id: p.id });
      }
    };
    p.addEventListener('transitionend', onEnd);
  }

  function collapse(p){
    const h = p.style.maxHeight === 'none' ? p.scrollHeight : parseFloat(p.style.maxHeight || 0);
    p.style.maxHeight = (h || p.scrollHeight) + 'px';
    p.offsetHeight; // reflow
    p.style.maxHeight = '0px';
    p.dataset.state = 'closing';
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      p.removeEventListener('transitionend', onEnd);
      p.dataset.state = 'collapsed';
      p.classList.remove('is-active');
      // Clear animation markers when collapse completes
      markItemsForAnimation(p, false);
      dbg('collapsed', { id: p.id });
    };
    p.addEventListener('transitionend', onEnd);
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
        // Clear all markers first, then mark only the closing panel's items
        clearAllAnimationMarkers();
        markItemsForAnimation(p, true); // Mark for hide animation
        setTimeout(() => emitAll('acc-close'), 10);
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

  // No explicit level reset needed with universal grouping

  function toggle(item){
    const p = panelOf(item);
    if (!p) return;
    const trig = item.querySelector(':scope > .acc-trigger');
    const opening = !(p.dataset.state === 'open' || p.dataset.state === 'opening');
    dbg('toggle', { kind: itemKind(item), opening, label: labelOf(item), id: p.id });
    
    if (opening) closeSiblings(item);

    // Reset all nested level‑2 panels when a section opens or closes
    if (itemKind(item) === 'section'){
      if (opening) resetAllL2Under(root);
      else resetAllL2Under(item);
    }

    if (opening){
      // Clear all markers first, then mark only this panel's items
      clearAllAnimationMarkers();
      markItemsForAnimation(p, true);
      // Small delay to ensure DOM updates before GSAP reads it
      setTimeout(() => {
        const markedItems = p.querySelectorAll(':scope > .acc-item[data-acc-animate]');
        dbg('emit acc-open', { id: p.id, markedItems: markedItems.length, totalItems: p.querySelectorAll(':scope > .acc-item').length });
        emitAll('acc-open');
      }, 10);
      expand(p);
      trig?.setAttribute('aria-expanded', 'true');
      trig?.classList?.add(ACTIVE_TRIGGER_CLASS);
    } else {
      // Clear all markers first, then mark only this panel's items
      clearAllAnimationMarkers();
      markItemsForAnimation(p, true);
      setTimeout(() => {
        const markedItems = p.querySelectorAll(':scope > .acc-item[data-acc-animate]');
        dbg('emit acc-close', { id: p.id, markedItems: markedItems.length, totalItems: p.querySelectorAll(':scope > .acc-item').length });
        emitAll('acc-close');
      }, 10);
      collapse(p);
      trig?.setAttribute('aria-expanded', 'false');
      trig?.classList?.remove(ACTIVE_TRIGGER_CLASS);
    }
  }

  document.body.classList.add('js-prep');
  // Collapse all panels; top-level items remain visible (not inside panels)
  root.querySelectorAll('.acc-list').forEach(p => { p.style.maxHeight = '0px'; p.dataset.state = 'collapsed'; });
  // Safety: ensure top-level rows are visible even if a GSAP timeline set inline styles globally
  Array.from(root.querySelectorAll(':scope > .acc-item')).forEach((row) => {
    row.style.removeProperty('opacity');
    row.style.removeProperty('visibility');
    row.style.removeProperty('transform');
  });
  requestAnimationFrame(() => document.body.classList.remove('js-prep'));

  root.addEventListener('click', e => {
    const t = e.target.closest('.acc-trigger');
    if (!t || !root.contains(t)) return;
    e.preventDefault();
    const item = t.closest('.acc-section, .acc-item');
    dbg('click', { label: (t.textContent || '').trim().replace(/\s+/g,' ').slice(0,80) });
    item && toggle(item);
  });
  root.addEventListener('keydown', e => {
    const t = e.target.closest('.acc-trigger');
    if (!t || !root.contains(t)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const item = t.closest('.acc-section, .acc-item');
    dbg('keydown', { key: e.key, label: (t.textContent || '').trim().replace(/\s+/g,' ').slice(0,80) });
    item && toggle(item);
  });

  const ro = new ResizeObserver(entries => {
    entries.forEach(({ target: p }) => {
      if (p.dataset.state === 'open'){ p.style.maxHeight = 'none'; }
      else if (p.dataset.state === 'opening'){ p.style.maxHeight = p.scrollHeight + 'px'; }
    });
  });
  root.querySelectorAll('.acc-list').forEach(p => ro.observe(p));
  
  // Expose debugging functions globally
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
      return root.querySelectorAll('[data-acc-animate]');
    }
  };
  
  console.log('[ACCORDION] Debug functions available at window._accordionTest');
}


