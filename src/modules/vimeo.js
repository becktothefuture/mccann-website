/**
 * ==================================================
 *  McCann Website — Vimeo Helper
 *  Purpose: Mount Vimeo iframe with privacy options
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[VIMEO] Module loaded');

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

export function mountVimeo(container, inputId, options = {}){
  if (!container) {
    console.log('[VIMEO] ❌ mountVimeo called without container');
    return null;
  }

  // Run previous cleanup (if any) to avoid stacking observers/listeners
  if (typeof container.__vimeoCleanup === 'function') {
    try {
      container.__vimeoCleanup();
    } catch (err) {
      console.warn('[VIMEO] ⚠️ Previous cleanup failed:', err);
    }
  }

  const id = parseVimeoId(inputId);
  if (!id){
    container.innerHTML = '';
    container.__vimeoCleanup = undefined;
    console.log('[VIMEO] ⚠️ No valid video ID found');
    return null;
  }

  const reservedKeys = new Set([
    'query',
    'startAt',
    'playOnReady',
    'unmuteOnStart',
    'desiredVolume'
  ]);

  const legacyQuery = {};
  Object.entries(options || {}).forEach(([key, value]) => {
    if (!reservedKeys.has(key) && typeof options.query === 'undefined') {
      legacyQuery[key] = value;
    }
  });

  const queryParams = {
    dnt: 1,
    ...legacyQuery,
    ...(options.query || {})
  };

  const query = new URLSearchParams(queryParams).toString();
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
  const cleanupCallbacks = [];
  container.__vimeoCleanup = () => {
    cleanupCallbacks.splice(0).forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.warn('[VIMEO] ⚠️ Cleanup error:', err);
      }
    });
    container.__vimeoCleanup = undefined;
  };

  ensureVimeoApi().then(() => {
    if (!(window.Vimeo && window.Vimeo.Player)) {
      fitIframeToCover(container, iframe, 16 / 9, 1.02);
      console.warn('[VIMEO] ⚠️ Vimeo Player API unavailable – using fallback sizing');
      return;
    }

    const player = new window.Vimeo.Player(iframe);
    const { startAt = null, playOnReady = false, unmuteOnStart = false, desiredVolume } = options;

    player.ready()
      .then(() => {
        console.log('[VIMEO] ✓ Player ready');

        const ratioPromise = Promise.all([player.getVideoWidth(), player.getVideoHeight()])
          .then(([vw, vh]) => {
            const ratio = vw && vh ? vw / vh : 16 / 9;
            fitIframeToCover(container, iframe, ratio, 1.02);
            if (typeof ResizeObserver === 'function') {
              const ro = new ResizeObserver(() => fitIframeToCover(container, iframe, ratio, 1.02));
              ro.observe(container);
              cleanupCallbacks.push(() => ro.disconnect());
            } else {
              console.warn('[VIMEO] ⚠️ ResizeObserver not supported; skipping container observer');
            }
            const handleResize = () => fitIframeToCover(container, iframe, ratio, 1.02);
            window.addEventListener('resize', handleResize, { passive: true });
            cleanupCallbacks.push(() => window.removeEventListener('resize', handleResize));
          })
          .catch(() => {
            fitIframeToCover(container, iframe, 16 / 9, 1.02);
          });

        const startOps = [];
        if (typeof startAt === 'number' && !Number.isNaN(startAt)) {
          const clampedStart = Math.max(0, startAt);
          startOps.push(
            player.setCurrentTime(clampedStart).then(() => {
              console.log(`[VIMEO] 🎯 Seeked to ${clampedStart}s`);
            }).catch(err => {
              console.warn('[VIMEO] ⚠️ Could not set start time:', err?.message || err);
            })
          );
        }

        if (unmuteOnStart) {
          startOps.push(
            player.setVolume(typeof desiredVolume === 'number' ? desiredVolume : 1)
              .then(() => player.setMuted(false).catch(() => {}))
              .catch(err => {
                console.warn('[VIMEO] ⚠️ Could not set volume:', err?.message || err);
              })
          );
        } else if (typeof desiredVolume === 'number') {
          startOps.push(
            player.setVolume(desiredVolume).catch(err => {
              console.warn('[VIMEO] ⚠️ Could not set desired volume:', err?.message || err);
            })
          );
        }

        return Promise.all([ratioPromise, ...startOps]);
      })
      .then(() => {
        if (playOnReady) {
          return player.play().catch(err => {
            console.warn('[VIMEO] ⚠️ Playback blocked by browser policy:', err?.message || err);
          });
        }
        return null;
      })
      .catch(err => {
        console.warn('[VIMEO] ⚠️ Player initialization issue:', err?.message || err);
      });
  });

  cleanupCallbacks.push(() => {
    // Restore original overflow if mountVimeo is re-run for same container
    container.style.overflow = prevOverflow;
  });

  return iframe;
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
