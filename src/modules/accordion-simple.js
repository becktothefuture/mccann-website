/**
 * ==================================================
 *  McCann Website — Simplified Accordion Module
 *  Purpose: ARIA, smooth transitions, class-based GSAP hooks
 *  Date: 2025-11-04
 * ==================================================
 */

console.log('[ACCORDION-SIMPLE] module loaded');

export function initAccordion(rootSel = '.accordeon'){
  const root = document.querySelector(rootSel);
  if (!root){ 
    console.log('[ACCORDION] ❌ root not found for selector:', rootSel); 
    return; 
  }
  console.log('[ACCORDION] ✅ Initializing accordion on:', rootSel);

  // Helper functions
  const panelOf = item => item?.querySelector(':scope > .acc-list');
  const triggerOf = item => item?.querySelector(':scope > .acc-trigger');
  const groupOf = item => {
    const parent = item.parentElement;
    return parent?.classList.contains('acc-list') ? parent : root;
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

  // Height management
  function expand(panel){
    panel.classList.add('is-active');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    panel.dataset.state = 'opening';
    
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      panel.removeEventListener('transitionend', onEnd);
      if (panel.dataset.state === 'opening'){
        panel.style.maxHeight = 'none';
        panel.dataset.state = 'open';
      }
    };
    panel.addEventListener('transitionend', onEnd);
  }

  function collapse(panel){
    const h = panel.style.maxHeight === 'none' ? panel.scrollHeight : parseFloat(panel.style.maxHeight || 0);
    panel.style.maxHeight = (h || panel.scrollHeight) + 'px';
    panel.offsetHeight; // force reflow
    panel.style.maxHeight = '0px';
    panel.dataset.state = 'closing';
    
    const onEnd = (e) => {
      if (e.propertyName !== 'max-height') return;
      panel.removeEventListener('transitionend', onEnd);
      panel.dataset.state = 'collapsed';
      panel.classList.remove('is-active');
    };
    panel.addEventListener('transitionend', onEnd);
  }

  function closeSiblings(item){
    const group = groupOf(item);
    if (!group) return;
    
    const itemType = item.matches('.acc-section') ? 'acc-section' : 'acc-item';
    Array.from(group.children).forEach(sibling => {
      if (sibling === item || !sibling.classList.contains(itemType)) return;
      
      const panel = panelOf(sibling);
      if (panel && (panel.dataset.state === 'open' || panel.dataset.state === 'opening')){
        collapse(panel);
        const trigger = triggerOf(sibling);
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.classList.remove('is-active');
        }
      }
    });
  }

  function toggle(item){
    const panel = panelOf(item);
    const trigger = triggerOf(item);
    if (!panel) return;
    
    const isOpening = !(panel.dataset.state === 'open' || panel.dataset.state === 'opening');
    
    if (isOpening) {
      closeSiblings(item);
      expand(panel);
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
        trigger.classList.add('is-active');
      }
      
      // Emit custom event for Webflow
      emitWebflowEvent('acc-open');
    } else {
      collapse(panel);
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.classList.remove('is-active');
      }
      
      // Emit custom event for Webflow
      emitWebflowEvent('acc-close');
    }
  }

  function emitWebflowEvent(eventName){
    // Try Webflow's system first
    try {
      if (window.Webflow && window.Webflow.require) {
        const ix = window.Webflow.require('ix2');
        if (ix && ix.emit) {
          ix.emit(eventName);
          console.log('[ACCORDION] Emitted via Webflow:', eventName);
          return;
        }
      }
    } catch(e) {
      console.log('[ACCORDION] Webflow emit failed:', e);
    }
    
    // Fallback to custom event
    window.dispatchEvent(new CustomEvent(eventName));
    console.log('[ACCORDION] Emitted via CustomEvent:', eventName);
  }

  // Initial state: collapse all panels
  root.querySelectorAll('.acc-list').forEach(panel => {
    panel.style.maxHeight = '0px';
    panel.dataset.state = 'collapsed';
  });

  // Event listeners
  root.addEventListener('click', e => {
    const trigger = e.target.closest('.acc-trigger');
    if (!trigger || !root.contains(trigger)) return;
    e.preventDefault();
    
    const item = trigger.closest('.acc-section, .acc-item');
    if (item) toggle(item);
  });

  // Resize observer for dynamic content
  const ro = new ResizeObserver(entries => {
    entries.forEach(({ target: panel }) => {
      if (panel.dataset.state === 'open'){
        panel.style.maxHeight = 'none';
      } else if (panel.dataset.state === 'opening'){
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
  root.querySelectorAll('.acc-list').forEach(panel => ro.observe(panel));

  console.log('[ACCORDION] Setup complete with', triggers.length, 'triggers');
}
