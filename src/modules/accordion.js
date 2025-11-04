/**
 * ==================================================
 *  McCann Website — Accordion Module
 *  Purpose: ARIA, smooth transitions, RO image safety
 *  Date: 2025-10-28
 * ==================================================
 */

import { emit } from '../core/events.js';
console.log('[ACCORDION] module loaded');

export function initAccordion(rootOrOptions = '.accordeon'){
  const rootSel = typeof rootOrOptions === 'string' ? rootOrOptions : (rootOrOptions && rootOrOptions.rootSel) || '.accordeon';
  const useInlineGsapOpt = typeof rootOrOptions === 'object' && !!rootOrOptions.useInlineGsap;
  const root = document.querySelector(rootSel);
  if (!root){ console.log('[ACCORDION] root not found'); return; }

  const isL1 = el => el.classList.contains('accordeon-item--level1');
  const isL2 = el => el.classList.contains('accordeon-item--level2');
  const panelOf = item => item?.querySelector(':scope > .accordeon__list');
  const groupOf = item => isL1(item) ? root : item.closest('.accordeon__list');
  const itemsInPanel = (panel) => Array.from(panel ? panel.children : []);

  // Optional single-timeline GSAP mode (simpler): play on open, reverse on close
  const wantsInlineGsap = useInlineGsapOpt || root.dataset.accGsap === 'inline';
  const hasGsap = !!(window && window.gsap);
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canInlineGsap = wantsInlineGsap && hasGsap && !reducedMotion;
  const tlStore = new WeakMap();

  function getTimeline(panel){
    if (!canInlineGsap) return null;
    let tl = tlStore.get(panel);
    if (tl) return tl;
    const items = itemsInPanel(panel);
    if (!items.length) return null;
    const gsap = window.gsap;
    tl = gsap.timeline({ paused: true, defaults: { duration: 0.35, ease: 'power2.out' } });
    // Stagger IN timeline; reversing will create the OUT
    tl.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.35, ease: 'power2.out', immediateRender: false }, 0);
    tlStore.set(panel, tl);
    return tl;
  }

  // Fire GSAP UI (Webflow) item animations via CustomEvents scoped to the panel element
  function emitItemsAnimation(item, direction){ // direction: 'in' | 'out'
    const panel = panelOf(item); if (!panel) return;
    const level = isL1(item) ? 1 : 2;
    const name = level === 1
      ? (direction === 'in' ? 'ACC_L1_ITEMS_IN' : 'ACC_L1_ITEMS_OUT')
      : (direction === 'in' ? 'ACC_L2_ITEMS_IN' : 'ACC_L2_ITEMS_OUT');
    const items = itemsInPanel(panel);
    emit(name, panel, { level, direction, itemsLength: items.length });
  }

  // ARIA bootstrap
  root.querySelectorAll('.accordeon__trigger').forEach((t, i) => {
    t.setAttribute('role', 'button');
    t.setAttribute('tabindex', '0');
    const item = t.closest('.accordeon-item--level1, .accordeon-item--level2');
    const p = panelOf(item);
    if (p){
      const pid = p.id || `acc-panel-${i}`;
      p.id = pid;
      t.setAttribute('aria-controls', pid);
      t.setAttribute('aria-expanded', 'false');
    }
  });

  function expand(p){
    p.classList.add('is-active');
    p.style.maxHeight = p.scrollHeight + 'px';
    p.dataset.state = 'opening';
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      p.removeEventListener('transitionend', onEnd);
      if (p.dataset.state === 'opening'){
        p.style.maxHeight = 'none';
        p.dataset.state = 'open';
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
    };
    p.addEventListener('transitionend', onEnd);
  }

  function closeSiblings(item){
    const group = groupOf(item); if (!group) return;
    const want = isL1(item) ? 'accordeon-item--level1' : 'accordeon-item--level2';
    Array.from(group.children).forEach(sib => {
      if (sib === item || !sib.classList?.contains(want)) return;
      const p = panelOf(sib);
      if (p && (p.dataset.state === 'open' || p.dataset.state === 'opening')){
        if (canInlineGsap) {
          const tl = getTimeline(p); tl && tl.time(tl.duration()).reverse();
        } else {
          emitItemsAnimation(sib, 'out'); // animate items out in the closing sibling
        }
        collapse(p);
        const trig = sib.querySelector('.accordeon__trigger');
        trig?.setAttribute('aria-expanded', 'false');
        emit(isL1(item) ? 'ACC_L1_CLOSE' : 'ACC_L2_CLOSE', sib, { source: 'sibling' });
      }
    });
  }

  function resetAllL2(){
    root.querySelectorAll('.accordeon-item--level2 .accordeon__list').forEach(p => {
      if (p.dataset.state === 'open' || p.dataset.state === 'opening'){
        if (canInlineGsap) { const tl = getTimeline(p); tl && tl.time(tl.duration()).reverse(); }
        collapse(p);
        const it = p.closest('.accordeon-item--level2');
        it?.querySelector('.accordeon__trigger')?.setAttribute('aria-expanded', 'false');
        emit('ACC_L2_CLOSE', it, { source: 'reset-all' });
      }
    });
  }

  function toggle(item){
    const p = panelOf(item); if (!p) return;
    const trig = item.querySelector('.accordeon__trigger');
    const opening = !(p.dataset.state === 'open' || p.dataset.state === 'opening');
    closeSiblings(item);
    if (opening && isL1(item)) resetAllL2();

    if (opening){
      expand(p); trig?.setAttribute('aria-expanded', 'true');
      if (canInlineGsap) { const tl = getTimeline(p); tl && tl.time(0).play(); }
      else { emitItemsAnimation(item, 'in'); }
      emit(isL1(item) ? 'ACC_L1_OPEN' : 'ACC_L2_OPEN', item, { opening: true });
    } else {
      if (canInlineGsap) { const tl = getTimeline(p); tl && tl.time((tl.duration && tl.duration()) || 0).reverse(); }
      else { emitItemsAnimation(item, 'out'); }
      collapse(p); trig?.setAttribute('aria-expanded', 'false');
      if (isL1(item)) resetAllL2();
      emit(isL1(item) ? 'ACC_L1_CLOSE' : 'ACC_L2_CLOSE', item, { opening: false });
    }
  }

  document.body.classList.add('js-prep');
  root.querySelectorAll('.accordeon__list').forEach(p => { p.style.maxHeight = '0px'; p.dataset.state = 'collapsed'; });
  requestAnimationFrame(() => document.body.classList.remove('js-prep'));

  root.addEventListener('click', e => {
    const t = e.target.closest('.accordeon__trigger'); if (!t || !root.contains(t)) return;
    e.preventDefault();
    const item = t.closest('.accordeon-item--level1, .accordeon-item--level2');
    item && toggle(item);
  });
  root.addEventListener('keydown', e => {
    const t = e.target.closest('.accordeon__trigger'); if (!t || !root.contains(t)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const item = t.closest('.accordeon-item--level1, .accordeon-item--level2');
    item && toggle(item);
  });

  const ro = new ResizeObserver(entries => {
    entries.forEach(({ target: p }) => {
      if (p.dataset.state === 'open'){ p.style.maxHeight = 'none'; }
      else if (p.dataset.state === 'opening'){ p.style.maxHeight = p.scrollHeight + 'px'; }
    });
  });
  root.querySelectorAll('.accordeon__list').forEach(p => ro.observe(p));
}


