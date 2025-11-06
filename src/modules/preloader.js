/**
 * ==================================================
 *  McCann Website — Preloader
 *  Purpose: Prefetch videos (HTML5 + Vimeo), show TruthWellTold signet
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[PRELOADER] Module loaded');

import projectDataJson from '../data/project-data.json';

// ============================================================
// STATE
// ============================================================

let preloaderEl = null;
let signetEl = null;
let progressEl = null;
let logEl = null;
let animationFrameId = null;
let showDebugLog = true; // Toggle to show/hide real-time log


// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize preloader
 * Prefetches all autoplay videos (HTML5 + Vimeo) before showing content
 * 
 * @param {Object} options
 * @param {string} options.selector - Preloader container selector
 * @param {string} options.videoSelector - Webflow background video selector
 * @param {string} options.vimeoPreload - Vimeo strategy: 'none', 'prefetch', 'prebuffer'
 * @param {number} options.vimeoBufferLimit - Max Vimeo videos to prebuffer (default: 5)
 * @param {Object} options.projectData - Project data with vimeoId fields
 * @param {number} options.minLoadTime - Minimum time to show preloader (ms)
 * @param {boolean} options.showDebugLog - Show real-time debug log (default: true)
 * @param {number} options.pulseDuration - Pulse cycle duration in ms (default: 3000)
 * @param {number} options.pulseOpacity - Opacity range: 0.8 to 1.0
 */
export function initPreloader({
  selector = '#preloader',
  videoSelector = 'video[data-wf-ignore], video[autoplay], video[data-autoplay]',
  vimeoPreload = 'prefetch', // 'none', 'prefetch', 'prebuffer'
  vimeoBufferLimit = 5,
  projectData = projectDataJson,
  minLoadTime = 1000,
  showDebugLog: debugLogOption = true,
  pulseDuration = 3000,
  pulseOpacity = 0.2
} = {}) {

  showDebugLog = debugLogOption;
  
  log('Initializing preloader...');

  // Find elements
  preloaderEl = document.querySelector(selector);
  if (!preloaderEl) {
    console.error('[PRELOADER] ❌ Preloader element not found');
    return;
  }

  signetEl = preloaderEl.querySelector('.preloader__signet');
  progressEl = preloaderEl.querySelector('.preloader__progress');

  if (!signetEl) {
    console.error('[PRELOADER] ❌ Signet element not found');
    return;
  }

  // Create debug log element if enabled
  if (showDebugLog) {
    createLogElement();
  }

  log('✓ Elements found', 'success');
  log('✓ Pulse animation started', 'success');

  // Start pulse animation
  animatePulse(pulseDuration, pulseOpacity);

  // Normal mode: Begin loading process and auto-hide
  const startTime = performance.now();
  
  // Load both HTML5 videos and Vimeo videos
  Promise.all([
    prefetchVideos(videoSelector),
    preloadVimeoVideos(projectData, vimeoPreload, vimeoBufferLimit)
  ])
    .then(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      log(`✓ All media loaded in ${Math.round(elapsed)}ms`, 'success');
      
      if (remaining > 0) {
        log(`Waiting ${Math.round(remaining)}ms (min display time)...`, 'info');
      }
      
      setTimeout(() => {
        hidePreloader();
      }, remaining);
    })
    .catch(err => {
      console.error('[PRELOADER] ❌ Error:', err);
      log(`❌ Error loading media: ${err.message}`, 'error');
      
      // Graceful degradation - still hide after min time
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        log('Hiding despite errors (graceful degradation)', 'warning');
        hidePreloader();
      }, remaining);
    });
}

/**
 * Manually hide preloader (for customization panel)
 */
export function hidePreloaderManually() {
  hidePreloader();
}

// ============================================================
// LOGGING (Real-time UI feedback)
// ============================================================

/**
 * Create log element in bottom left corner
 */
function createLogElement() {
  if (!preloaderEl || logEl) return;

  logEl = document.createElement('div');
  logEl.className = 'preloader__log';
  logEl.setAttribute('aria-live', 'polite');
  logEl.setAttribute('aria-atomic', 'false');
  preloaderEl.appendChild(logEl);
  
  log('Debug log initialized', 'info');
}

/**
 * Add log entry to UI and console
 * @param {string} message - Log message
 * @param {string} type - Log type: 'info', 'success', 'warning', 'error'
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  const consoleMessage = `[PRELOADER] ${message}`;
  
  // Console output
  switch(type) {
    case 'error':
      console.error(consoleMessage);
      break;
    case 'warning':
      console.warn(consoleMessage);
      break;
    case 'success':
    case 'info':
    default:
      console.log(consoleMessage);
  }
  
  // UI output (if debug log enabled)
  if (!showDebugLog || !logEl) return;
  
  const entry = document.createElement('div');
  entry.className = `preloader__log-entry preloader__log-entry--${type}`;
  entry.textContent = `${timestamp} ${message}`;
  
  logEl.appendChild(entry);
  
  // Auto-scroll to bottom
  logEl.scrollTop = logEl.scrollHeight;
  
  // Limit to last 20 entries (performance)
  const entries = logEl.querySelectorAll('.preloader__log-entry');
  if (entries.length > 20) {
    entries[0].remove();
  }
}

// ============================================================
// VIDEO PREFETCHING (HTML5)
// ============================================================

/**
 * Prefetch all autoplay HTML5 videos
 * Uses Promise.allSettled for graceful handling of failed videos
 */
async function prefetchVideos(selector) {
  const videos = Array.from(document.querySelectorAll(selector));
  
  if (videos.length === 0) {
    log('⚠ No videos found to prefetch', 'warning');
    return;
  }

  log(`🎬 Found ${videos.length} video(s) to prefetch`, 'info');

  // Track loaded count for real-time updates
  let loadedCount = 0;

  // Create array of promises for each video
  const videoPromises = videos.map((video, index) => 
    prefetchSingleVideo(video, index + 1, videos.length, () => {
      loadedCount++;
      updateProgress(loadedCount, videos.length);
    })
  );

  // Wait for all videos (graceful handling of failures)
  const results = await Promise.allSettled(videoPromises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  if (failed > 0) {
    log(`⚠ ${failed} video(s) failed to load`, 'warning');
  }
  
  log(`✓ ${successful}/${videos.length} video(s) ready`, 'success');
}

/**
 * Prefetch a single video
 * @param {HTMLVideoElement} video - Video element
 * @param {number} index - Video index (1-based for display)
 * @param {number} total - Total number of videos
 * @param {Function} onProgress - Progress callback
 */
function prefetchSingleVideo(video, index, total, onProgress) {
  return new Promise((resolve, reject) => {
    
    // Normal loading flow (stayOpen mode handled earlier, never gets here)
    
    // If video already loaded/ready
    if (video.readyState >= 3) { // HAVE_FUTURE_DATA or higher
      log(`✓ Video ${index}/${total} already loaded`, 'success');
      onProgress();
      resolve(video);
      return;
    }

    // Event handlers
    const onCanPlay = () => {
      log(`✓ Video ${index}/${total} ready`, 'success');
      cleanup();
      onProgress();
      resolve(video);
    };

    const onError = (err) => {
      log(`⚠ Video ${index}/${total} failed`, 'warning');
      cleanup();
      reject(err);
    };

    const onTimeout = () => {
      log(`⚠ Video ${index}/${total} timeout (10s)`, 'warning');
      cleanup();
      reject(new Error('Video load timeout'));
    };

    const cleanup = () => {
      video.removeEventListener('canplaythrough', onCanPlay);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      clearTimeout(timeoutId);
    };

    // Timeout safety net (10s per video)
    const timeoutId = setTimeout(onTimeout, 10000);

    // Listen for ready states
    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Trigger load if not already loading
    if (video.readyState === 0) {
      log(`Loading video ${index}/${total}...`, 'info');
      video.load();
    }
  });
}

/**
 * Update progress display
 */
function updateProgress(current, total) {
  if (!progressEl) return;
  
  const percentage = Math.round((current / total) * 100);
  progressEl.textContent = `${percentage}%`;
  progressEl.setAttribute('aria-valuenow', percentage);
}

// ============================================================
// VIMEO PREFETCHING
// ============================================================

/**
 * Preload Vimeo videos from project data
 * @param {Object} projectData - Project data with vimeoId fields
 * @param {string} strategy - 'none', 'prefetch', or 'prebuffer'
 * @param {number} bufferLimit - Max videos to prebuffer
 */
async function preloadVimeoVideos(projectData, strategy = 'prefetch', bufferLimit = 5) {
  if (strategy === 'none') {
    log('⏭ Vimeo preloading disabled', 'info');
    return;
  }

  // Extract valid Vimeo IDs from project data
  const vimeoIds = Object.values(projectData)
    .map(project => project?.vimeoId)
    .filter(id => id && id !== '000000000' && id !== 'null' && id !== null);
  
  if (vimeoIds.length === 0) {
    log('⚠ No valid Vimeo IDs found in project data', 'warning');
    return;
  }

  log(`🎬 Found ${vimeoIds.length} Vimeo video(s) in project data`, 'info');

  switch(strategy) {
    case 'prebuffer':
      return prebufferVimeoIframes(vimeoIds, bufferLimit);
    
    case 'prefetch':
    default:
      return addVimeoPrefetchHints(vimeoIds);
  }
}

/**
 * Add prefetch hints for Vimeo videos (lightweight)
 * Browser preloads in background without blocking
 */
function addVimeoPrefetchHints(vimeoIds) {
  log(`🔗 Adding prefetch hints for ${vimeoIds.length} Vimeo video(s)`, 'info');
  
  vimeoIds.forEach((id, index) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `https://player.vimeo.com/video/${id}`;
    link.as = 'document';
    document.head.appendChild(link);
    
    log(`✓ Vimeo ${index + 1}/${vimeoIds.length} prefetch hint added`, 'success');
  });
  
  log('✓ All Vimeo prefetch hints added (lightweight)', 'success');
  return Promise.resolve();
}

/**
 * Prebuffer Vimeo videos with hidden iframes (aggressive)
 * Only use on good connections with few videos
 */
function prebufferVimeoIframes(vimeoIds, bufferLimit = 5) {
  // Check connection quality
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Skip prebuffering on slow connections or mobile
  if (connection && connection.effectiveType !== '4g') {
    log('⚠ Skipping Vimeo prebuffer (slow connection detected)', 'warning');
    log('✓ Falling back to prefetch hints only', 'info');
    return addVimeoPrefetchHints(vimeoIds);
  }
  
  if (isMobile) {
    log('⚠ Skipping Vimeo prebuffer (mobile device detected)', 'warning');
    log('✓ Falling back to prefetch hints only', 'info');
    return addVimeoPrefetchHints(vimeoIds);
  }
  
  // Limit number of videos to prebuffer
  const idsToBuffer = vimeoIds.slice(0, bufferLimit);
  
  if (idsToBuffer.length < vimeoIds.length) {
    log(`⚠ Limiting prebuffer to first ${bufferLimit} videos`, 'warning');
    
    // Add prefetch hints for remaining videos
    const remaining = vimeoIds.slice(bufferLimit);
    remaining.forEach(id => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `https://player.vimeo.com/video/${id}`;
      link.as = 'document';
      document.head.appendChild(link);
    });
  }
  
  log(`🎬 Prebuffering ${idsToBuffer.length} Vimeo video(s)`, 'info');
  
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.id = 'vimeo-prebuffer-container';
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: -9999px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
    `;
    container.setAttribute('aria-hidden', 'true');
    
    let buffered = 0;
    
    idsToBuffer.forEach((id, index) => {
      const iframe = document.createElement('iframe');
      // Use low quality for prebuffering to save bandwidth
      iframe.src = `https://player.vimeo.com/video/${id}?muted=1&autoplay=1&background=1&quality=360p`;
      iframe.allow = 'autoplay';
      iframe.width = '1';
      iframe.height = '1';
      iframe.loading = 'eager';
      
      log(`Loading Vimeo ${index + 1}/${idsToBuffer.length} (ID: ${id})...`, 'info');
      
      // Remove iframe after 8 seconds (should be buffering by then)
      setTimeout(() => {
        buffered++;
        log(`✓ Vimeo ${index + 1}/${idsToBuffer.length} prebuffered`, 'success');
        iframe.remove();
        
        if (buffered === idsToBuffer.length) {
          container.remove();
          log(`✓ All Vimeo videos prebuffered`, 'success');
          resolve();
        }
      }, 8000);
      
      container.appendChild(iframe);
    });
    
    document.body.appendChild(container);
  });
}

/**
 * Hide preloader with sudden, energetic reveal
 * Scales up quickly (60ms) - no blur
 */
function hidePreloader() {
  if (!preloaderEl) return;

  log('🎯 Hiding preloader with energetic reveal...', 'info');
  stopAnimations();

  // Check for prefers-reduced-motion
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Instant removal for reduced motion
    preloaderEl.style.display = 'none';
    document.body.classList.remove('preloader-active');
    window.dispatchEvent(new CustomEvent('preloader:complete'));
    log('✓ Preloader complete', 'success');
    return;
  }

  // Sudden, energetic reveal - 60ms scale up
  preloaderEl.classList.add('is-revealing');
  
  setTimeout(() => {
    // Complete: Remove from DOM
    preloaderEl.style.display = 'none';
    document.body.classList.remove('preloader-active');
    window.dispatchEvent(new CustomEvent('preloader:complete'));
    log('✓ Preloader complete', 'success');
  }, 60);
}

// ============================================================
// ANIMATION
// ============================================================


/**
 * Pulse animation - gentle opacity breathing
 * @param {number} duration - Cycle duration in ms
 * @param {number} opacityRange - Opacity variation (0.2 = 0.8 to 1.0)
 */
function animatePulse(duration = 3000, opacityRange = 0.2) {
  const startTime = performance.now();

  function loop(currentTime) {
    const progress = ((currentTime - startTime) % duration) / duration;
    // Sine wave for smooth breathing: 0.8 to 1.0
    const opacity = 1 - (opacityRange / 2) + Math.sin(progress * Math.PI * 2) * (opacityRange / 2);
    
    signetEl.style.setProperty('--pulse-opacity', opacity);
    animationFrameId = requestAnimationFrame(loop);
  }

  animationFrameId = requestAnimationFrame(loop);
}


/**
 * Stop animation
 */
function stopAnimations() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    console.log('[PRELOADER] ✓ Animation stopped');
  }
}

/**
 * Check if animation is running
 */
function isAnimationRunning() {
  return animationFrameId !== null;
}

// ============================================================
// CLEANUP & API
// ============================================================

/**
 * Cleanup function for unmounting
 */
export function cleanupPreloader() {
  stopAnimations();
  preloaderEl = null;
  signetEl = null;
  progressEl = null;
  logEl = null;
  log('Cleaned up', 'info');
}

// Expose minimal API
if (typeof window !== 'undefined') {
  window.App = window.App || {};
  window.App.preloader = {
    cleanup: cleanupPreloader
  };
}

