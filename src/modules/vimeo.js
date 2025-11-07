/**
 * ==================================================
 *  McCann Website — Vimeo Helper
 *  Purpose: Mount Vimeo iframe with privacy options
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[VIMEO] module loaded');

// ============================================================
// HELPERS
// ============================================================

function parseVimeoId(input){
  if (!input) return '';
  const str = String(input).trim();
  if (/^\d+$/.test(str)) return str;
  try {
    const u = new URL(str, 'https://example.com');
    const host = u.hostname || '';
    if (host.includes('vimeo.com')){
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || '';
      const id = last.match(/\d+/)?.[0] || '';
      return id || '';
    }
  } catch {}
  return '';
}

// ============================================================
// EXPORTS
// ============================================================

export function mountVimeo(container, inputId, params = {}){
  if (!container) return;
  const id = parseVimeoId(inputId);
  if (!id){ container.innerHTML = ''; return; }
  const query = new URLSearchParams({ dnt: 1, ...params }).toString();
  const src = `https://player.vimeo.com/video/${id}?${query}`;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowfullscreen', '');
  iframe.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  `;
  container.innerHTML = '';
  container.appendChild(iframe);
}
