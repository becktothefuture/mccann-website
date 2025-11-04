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
  if (!root){ console.log('[ACCORDION] root not found'); return; }

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
        emit('acc-close', p);
        collapse(p);
        const trig = sib.querySelector(':scope > .acc-trigger');
        trig?.setAttribute('aria-expanded', 'false');
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
    
    closeSiblings(item);

    if (opening){
      expand(p);
      trig?.setAttribute('aria-expanded', 'true');
      dbg('emit acc-open', { id: p.id });
      emit('acc-open', p);
    } else {
      dbg('emit acc-close', { id: p.id });
      emit('acc-close', p);
      collapse(p);
      trig?.setAttribute('aria-expanded', 'false');
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
}


