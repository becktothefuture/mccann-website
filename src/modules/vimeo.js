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
    top: 50%;
    left: 50%;
    /* Sizes are set dynamically to achieve true cover */
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    border: 0;
  `;
  container.innerHTML = '';
  container.appendChild(iframe);

  // Ensure container can crop overflow
  const prevOverflow = container.style.overflow;
  if (!container.style.position || container.style.position === 'static') {
    container.style.position = 'relative';
  }
  container.style.overflow = 'hidden';

  // Try to use Vimeo Player API to get exact video aspect ratio
  ensureVimeoApi().then(() => {
    // eslint-disable-next-line no-undef
    const player = new (window.Vimeo && window.Vimeo.Player ? window.Vimeo.Player : function(){}) (iframe);
    if (!player || !player.getVideoWidth) {
      // Fallback to 16:9 if API not available
      fitIframeToCover(container, iframe, 16 / 9, 1.02);
      return;
    }

    Promise.all([player.getVideoWidth(), player.getVideoHeight()])
      .then(([vw, vh]) => {
        const ratio = vw && vh ? vw / vh : 16 / 9;
        fitIframeToCover(container, iframe, ratio, 1.02);
        // Refit on container resize
        const ro = new ResizeObserver(() => fitIframeToCover(container, iframe, ratio, 1.02));
        ro.observe(container);
        window.addEventListener('resize', () => fitIframeToCover(container, iframe, ratio, 1.02), { passive: true });
      })
      .catch(() => {
        fitIframeToCover(container, iframe, 16 / 9, 1.02);
      });
  });
}

/**
 * Ensure Vimeo Player API is available (loads script once)
 */
function ensureVimeoApi(){
  if (window.Vimeo && window.Vimeo.Player) return Promise.resolve();
  return new Promise(resolve => {
    const existing = document.querySelector('script[src*="player.vimeo.com/api/player.js"]');
    if (existing) { existing.addEventListener('load', () => resolve()); return; }
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // Graceful fallback
    document.head.appendChild(s);
  });
}

/**
 * Size and center the iframe so the video covers the container (like background-size: cover)
 * @param {HTMLElement} container
 * @param {HTMLIFrameElement} iframe
 * @param {number} videoRatio - width/height of the video
 */
function fitIframeToCover(container, iframe, videoRatio, overscan = 1.0){
  const rect = container.getBoundingClientRect();
  const cw = Math.max(1, rect.width);
  const ch = Math.max(1, rect.height);
  const containerRatio = cw / ch;

  let w, h;
  if (containerRatio > videoRatio) {
    // Container is wider → match width, grow height
    w = cw;
    h = cw / videoRatio;
  } else {
    // Container is taller → match height, grow width
    h = ch;
    w = ch * videoRatio;
  }

  // Apply slight overscan to avoid subpixel guttering at extreme ratios
  const ow = Math.ceil(w * overscan);
  const oh = Math.ceil(h * overscan);

  iframe.style.width = `${ow}px`;
  iframe.style.height = `${oh}px`;
  iframe.style.top = '50%';
  iframe.style.left = '50%';
  iframe.style.transform = 'translate(-50%, -50%)';
}
