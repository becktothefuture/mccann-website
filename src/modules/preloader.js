/**
 * ==================================================
 *  McCann Website — Preloader
 *  Purpose: Prefetch videos (HTML5 + Vimeo), show TruthWellTold signet with pulse
 *  Date: 2025-11-06
 * ==================================================
 */

console.log('[PRELOADER] Module loaded');

import projectDataJson from '../data/project-data.json';
import { lockScroll, unlockScroll } from '../core/scrolllock.js';

// ============================================================
// STATE
// ============================================================

let preloaderEl = null;
let signetEl = null;
let progressEl = null;
let resizeTimeoutId = null;
let isResizing = false;
let resizeFadeDuration = 75; // Quick fade-out (ms)
let resizeFadeInDuration = 300; // Soft, refined, elegant fade-in (ms)
let resizeShowDelayTimeoutId = null;
let resizeHideDelayTimeoutId = null; // Delay before hiding after resize stops
let lastResizeCoverHideTime = 0;
let resizeShowDelay = 800; // Delay before showing again (ms)
let resizeHideDelay = 1200; // Delay before hiding after resize stops (ms)
let eventLeadMs = 100; // Time before hide to emit load-completed event (ms)
let isVerboseLogging = false;

// Webflow IX helper (ix3 or ix2)
const wfIx = (window.Webflow && window.Webflow.require)
  ? (window.Webflow.require('ix3') || window.Webflow.require('ix2'))
  : null;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

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
 * @param {number} options.pulseDuration - Pulse cycle duration in ms (default: 2400)
 * @param {number} options.pulseOpacity - Legacy amplitude setting (0-1, default: 0.42)
 * @param {number} options.pulseMinOpacity - Minimum opacity for CSS pulse (0-1, default: 0.4)
 * @param {boolean} options.enableResizeCover - Show preloader during resize (default: true)
 * @param {number} options.resizeFadeDuration - Fade in/out duration during resize (ms, default: 150)
 * @param {number} options.resizeShowDelay - Delay before showing cover again after hiding (ms, default: 800)
 * @param {number} options.eventLeadMs - Time before hide to emit load-completed event (ms, default: 100)
 */
export function initPreloader({
  selector = '#preloader',
  videoSelector = 'video[data-wf-ignore], video[autoplay], video[data-autoplay]',
  vimeoPreload = 'prefetch', // 'none', 'prefetch', 'prebuffer'
  vimeoBufferLimit = 5,
  projectData = projectDataJson,
  minLoadTime = 1000,
  pulseDuration = 2400,
  pulseOpacity = 0.42,
  pulseMinOpacity = 0.4,
  enableResizeCover = true,
  resizeFadeDuration: fadeDuration = 150,
  resizeShowDelay: showDelay = 800,
  eventLeadMs: leadMs = 100,
  pageLoaders = {},
  debug = false
} = {}) {

  resizeFadeDuration = fadeDuration;
  resizeShowDelay = showDelay;
  eventLeadMs = leadMs;
  isVerboseLogging = Boolean(debug);
  
  log('Initializing preloader...', 'info', true);

  // Lock scroll immediately using robust scroll lock mechanism (iOS compatible)
  lockScroll();
  document.body.classList.add('preloader-active');

  // Find elements
  preloaderEl = document.querySelector(selector);
  if (!preloaderEl) {
    console.error('[PRELOADER] ❌ Preloader element not found');
    document.body.classList.remove('preloader-active');
    unlockScroll();
    return;
  }

  // Ensure preloader is visible and on top
  preloaderEl.style.display = 'flex';
  preloaderEl.style.position = 'fixed';
  preloaderEl.style.zIndex = '999999';
  
  // Initialize resize cover if enabled
  // TEMPORARILY DISABLED FOR TESTING
  // if (enableResizeCover) {
  //   initResizeCover();
  // }

  signetEl = preloaderEl.querySelector('.preloader__signet');
  progressEl = preloaderEl.querySelector('.preloader__progress');

  if (!signetEl) {
    console.error('[PRELOADER] ❌ Signet element not found');
    return;
  }

  log('✓ Elements found', 'success');
  log('✓ Pulse animation (CSS-driven) configured', 'info');
  applyPulseVariables({
    duration: pulseDuration,
    minOpacity: pulseMinOpacity,
    amplitude: pulseOpacity
  });

  // Begin loading process
  const startTime = performance.now();
  const normalizedPath = normalizePath(window.location.pathname);
  const loaderMap = buildPageLoaderMap(pageLoaders);
  const { loader: selectedLoader, id: loaderId } = resolvePageLoader(normalizedPath, loaderMap);
  
  log(`🎯 Page loader selected "${loaderId}" for "${normalizedPath}"`, 'info');
  
  const loaderContext = {
    videoSelector,
    vimeoPreload,
    vimeoBufferLimit,
    projectData,
    pathname: normalizedPath,
    helpers: {
      prefetchVideos,
      preloadVimeoVideos,
      waitForSlidesBuilt,
      waitForPreviewVideosPlaying
    }
  };
  
  Promise.resolve()
    .then(() => selectedLoader(loaderContext))
    .then(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      log(`✓ Page loader completed in ${Math.round(elapsed)}ms`, 'success');
      
      if (remaining > 0) {
        log(`Waiting ${Math.round(remaining)}ms (min display time)...`, 'info');
      }
      
      setTimeout(() => {
        hidePreloader();
      }, remaining);
    })
    .catch(err => {
      console.error('[PRELOADER] ❌ Error:', err);
      log(`❌ Error during page loader: ${err.message}`, 'error');
      
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
 * Manually hide preloader
 */
export function hidePreloaderManually() {
  hidePreloader();
}

// ============================================================
// LOGGING
// ============================================================

/**
 * Add log entry to console with consistent formatting
 * @param {string} message - Log message
 * @param {string} type - Log type: 'info', 'success', 'warning', 'error'
 */
function log(message, type = 'info', force = false) {
  const consoleMessage = `[PRELOADER] ${message}`;
  const alwaysVisible = type === 'error' || type === 'warning';

  if (!force && !alwaysVisible && !isVerboseLogging) {
    return;
  }
  
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
    log('ℹ No videos found to prefetch', 'info');
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
// PAGE LOADER SUPPORT
// ============================================================

function buildPageLoaderMap(customLoaders = {}) {
  const defaults = getDefaultPageLoaderMap();
  const loaderMap = { ...defaults };
  
  Object.entries(customLoaders || {}).forEach(([key, candidate]) => {
    if (typeof candidate === 'function') {
      loaderMap[key] = candidate;
    } else {
      log(`⚠ Invalid page loader for "${key}" (expected function)`, 'warning');
    }
  });
  
  return loaderMap;
}

function getDefaultPageLoaderMap() {
  return {
    '/': loadHomepageMedia,
    '/index': loadHomepageMedia,
    '/index.html': loadHomepageMedia,
    default: loadGenericMedia
  };
}

function resolvePageLoader(pathname, loaderMap) {
  if (loaderMap[pathname]) {
    return { loader: loaderMap[pathname], id: pathname };
  }
  
  return {
    loader: loaderMap.default || loadGenericMedia,
    id: 'default'
  };
}

function normalizePath(pathname) {
  if (!pathname) return '/';
  
  let normalized = pathname.split('#')[0].split('?')[0] || '/';
  
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  if (normalized === '/index' || normalized === '/index.html') {
    normalized = '/';
  }
  
  return normalized || '/';
}

async function loadHomepageMedia(context) {
  const {
    videoSelector,
    vimeoPreload,
    vimeoBufferLimit,
    projectData,
    helpers
  } = context;
  
  await Promise.all([
    helpers.prefetchVideos(videoSelector),
    helpers.preloadVimeoVideos(projectData, vimeoPreload, vimeoBufferLimit)
  ]);
  
  log('✓ HTML5 videos and Vimeo preload complete', 'success');
  
  await helpers.waitForSlidesBuilt();
  log('✓ Slides built', 'success');
  
  await helpers.waitForPreviewVideosPlaying();
}

async function loadGenericMedia(context) {
  const { videoSelector, helpers } = context;
  log('⏭ Skipping Vimeo preload for this page', 'info');
  await helpers.prefetchVideos(videoSelector);
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
 * Wait for slides module to finish building slides
 */
function waitForSlidesBuilt() {
  return new Promise((resolve) => {
    // Check if slides already built (slides module might have finished before we check)
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
      log(`✓ Found ${slides.length} existing slides`, 'success');
      resolve();
      return;
    }
    
    // Wait for slides:built event (with timeout)
    const timeout = setTimeout(() => {
      log('⚠️  Slides build timeout - proceeding anyway', 'warning');
      resolve();
    }, 5000); // 5 second timeout
    
    window.addEventListener('slides:built', () => {
      clearTimeout(timeout);
      log('✓ Slides built event received', 'success');
      resolve();
    }, { once: true });
  });
}

/**
 * Wait for all Vimeo preview videos to be mounted and playing
 */
function waitForPreviewVideosPlaying() {
  return new Promise((resolve) => {
    // Give slides module time to mount preview videos (rAF delay)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const previewContainers = document.querySelectorAll('.slide__preview iframe[src*="vimeo.com"]');
        
        if (previewContainers.length === 0) {
          log('⚠️  No preview videos found - proceeding', 'warning');
          resolve();
          return;
        }
        
        log(`🎬 Waiting for ${previewContainers.length} preview video(s) to play...`, 'info');
        
        // Load Vimeo Player API if needed
        ensureVimeoApi().then(() => {
          const checkPromises = Array.from(previewContainers).map((iframe, index) => {
            return new Promise((resolveVideo) => {
              try {
                // eslint-disable-next-line no-undef
                if (!window.Vimeo || !window.Vimeo.Player) {
                  log(`⚠️  Vimeo API not available for video ${index + 1} - assuming ready`, 'warning');
                  resolveVideo();
                  return;
                }
                
                // eslint-disable-next-line no-undef
                const player = new window.Vimeo.Player(iframe);
                
                // Wait for video to be ready and playing
                let isReady = false;
                let isPlaying = false;
                
                const checkComplete = () => {
                  if (isReady && isPlaying) {
                    log(`✓ Preview video ${index + 1}/${previewContainers.length} playing`, 'success');
                    resolveVideo();
                  }
                };
                
                // Listen for ready event
                player.ready().then(() => {
                  isReady = true;
                  checkComplete();
                }).catch(() => {
                  // If ready fails, assume ready after short delay
                  setTimeout(() => {
                    isReady = true;
                    checkComplete();
                  }, 1000);
                });
                
                // Listen for play event
                player.on('play', () => {
                  isPlaying = true;
                  checkComplete();
                });
                
                // Fallback: check playing state after delay (autoplay might work immediately)
                setTimeout(() => {
                  player.getPaused().then((paused) => {
                    if (!paused) {
                      isPlaying = true;
                      checkComplete();
                    }
                  }).catch(() => {
                    // Assume playing if check fails (graceful degradation)
                    isPlaying = true;
                    checkComplete();
                  });
                }, 1500);
                
                // Timeout fallback (4 seconds per video)
                setTimeout(() => {
                  if (!isReady || !isPlaying) {
                    log(`⚠️  Preview video ${index + 1} timeout - proceeding`, 'warning');
                    resolveVideo();
                  }
                }, 4000);
                
              } catch (err) {
                log(`⚠️  Error checking preview video ${index + 1}: ${err.message}`, 'warning');
                resolveVideo(); // Resolve anyway to not block
              }
            });
          });
          
          Promise.all(checkPromises).then(() => {
            log('✓ All preview videos playing', 'success');
            resolve();
          });
        }).catch(() => {
          log('⚠️  Vimeo API failed to load - proceeding without verification', 'warning');
          resolve();
        });
      });
    });
  });
}

/**
 * Ensure Vimeo Player API is available
 */
function ensureVimeoApi() {
  if (window.Vimeo && window.Vimeo.Player) return Promise.resolve();
  return new Promise(resolve => {
    const existing = document.querySelector('script[src*="player.vimeo.com/api/player.js"]');
    if (existing) { 
      existing.addEventListener('load', () => resolve()); 
      return; 
    }
    const s = document.createElement('script');
    s.src = 'https://player.vimeo.com/api/player.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // Graceful fallback
    document.head.appendChild(s);
  });
}

/**
 * Emit load-completed event via Webflow IX and window
 */
function emitLoadCompleted() {
  try { 
    if (wfIx?.emit) wfIx.emit('load-completed'); 
  } catch(_) {}
  
  try { 
    window.dispatchEvent(new CustomEvent('load-completed')); 
  } catch(_) {}
  
  log('🎯 Emitted "load-completed" event', 'success');
}

/**
 * Hide preloader with fast, energetic reveal animation
 * Creates overlap between cover disappearing and loader appearing
 * Emits load-completed BEFORE fade starts so Webflow animation can begin
 */
function hidePreloader() {
  if (!preloaderEl) {
    document.body.classList.remove('preloader-active');
    unlockScroll();
    return;
  }

  log('🎯 Hiding preloader...', 'info');
  // Check for prefers-reduced-motion
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Emit load-completed first, then hide immediately
    emitLoadCompleted();
    
    // IMMEDIATELY unlock scroll for reduced motion
    document.body.classList.remove('preloader-active');
    unlockScroll();
    
    setTimeout(() => {
      if (preloaderEl) {
        preloaderEl.style.display = 'none';
        preloaderEl.style.pointerEvents = 'none';
      }
      
      // Double-check unlock
      document.body.classList.remove('preloader-active');
      unlockScroll();
      
      window.dispatchEvent(new CustomEvent('preloader:complete'));
      log('✓ Preloader complete', 'success');
    }, eventLeadMs);
    return;
  }

  // Fast, energetic reveal: scale up + fade out (250ms total)
  preloaderEl.classList.add('is-revealing');
  
  // Emit load-completed BEFORE fade starts (creates overlap)
  // The Webflow animation triggered by load-completed will start immediately
  // while preloader is still visible, creating smooth overlap
  emitLoadCompleted();
  
  // IMMEDIATELY unlock scroll (don't wait for animation)
  // This prevents the page from staying frozen if animation fails
  document.body.classList.remove('preloader-active');
  unlockScroll();
  
  // Start fade-out after a brief delay to ensure event is processed
  setTimeout(() => {
    // Complete: Remove from DOM and ensure cleanup
    if (preloaderEl) {
      preloaderEl.style.display = 'none';
      preloaderEl.style.pointerEvents = 'none'; // Extra safety
    }
    
    // Double-check scroll is unlocked
    document.body.classList.remove('preloader-active');
    unlockScroll();
    
    window.dispatchEvent(new CustomEvent('preloader:complete'));
    log('✓ Preloader complete', 'success');
  }, 250); // 250ms fade-out duration
}

// ============================================================
// ANIMATION
// ============================================================

/**
 * Pulse animation — pure opacity sine wave
 * Minimal RAF loop with options for duration and amplitude
 * @param {number} duration - Cycle duration in ms
 * @param {number} opacityRange - Pulse amplitude control (0-1)
 */
function applyPulseVariables({
  duration = 2400,
  minOpacity,
  amplitude = 0.42
} = {}) {
  if (!signetEl) return;
  
  const durationValue = typeof duration === 'number' && !Number.isNaN(duration)
    ? duration
    : 2400;
  const interpretedDuration = durationValue > 0 && durationValue <= 10
    ? durationValue * 1000
    : durationValue;
  const safeDuration = Math.max(400, interpretedDuration);

  const hasExplicitMin = typeof minOpacity === 'number' && !Number.isNaN(minOpacity);
  const normalizedAmplitude = Math.min(Math.max(amplitude, 0), 0.95);
  const derivedMin = 1 - normalizedAmplitude;
  const resolvedMin = hasExplicitMin ? minOpacity : derivedMin;
  const clampedMin = Math.min(Math.max(resolvedMin, 0), 0.95);

  signetEl.style.setProperty('--pulse-duration', `${safeDuration}ms`);
  signetEl.style.setProperty('--pulse-min-opacity', clampedMin.toFixed(3));
  log(`✓ Pulse variables applied (duration: ${safeDuration}ms, min opacity: ${clampedMin.toFixed(2)})`, 'success');
}

// ============================================================
// RESIZE COVER
// ============================================================

/**
 * Initialize resize cover functionality
 * Shows preloader during browser resize to prevent visual jank
 */
function initResizeCover() {
  if (!preloaderEl) return;
  
  let isResizingActive = false;
  
  function handleResizeStart() {
    // Cancel any pending hide delay timeout (resize started again)
    if (resizeHideDelayTimeoutId) {
      clearTimeout(resizeHideDelayTimeoutId);
      resizeHideDelayTimeoutId = null;
    }
    
    if (isResizingActive) return; // Already showing
    
    isResizingActive = true;
    isResizing = true;
    
    // Check if we're within the delay window since last hide
    const timeSinceLastHide = performance.now() - lastResizeCoverHideTime;
    const shouldDelay = timeSinceLastHide < resizeShowDelay;
    
    if (shouldDelay) {
      // Clear any existing delay timeout
      if (resizeShowDelayTimeoutId) {
        clearTimeout(resizeShowDelayTimeoutId);
      }
      
      // Wait for the remaining delay time before showing
      const remainingDelay = resizeShowDelay - timeSinceLastHide;
      resizeShowDelayTimeoutId = setTimeout(() => {
        // Only show if still resizing (user hasn't stopped)
        if (isResizing && isResizingActive) {
          showResizeCover();
        } else {
          // User stopped resizing during delay, cancel
          isResizingActive = false;
          isResizing = false;
        }
      }, remainingDelay);
    } else {
      // Show immediately if enough time has passed
      showResizeCover();
    }
  }
  
  function handleResizeEnd() {
    if (!isResizingActive) return; // Already hidden
    
    // Cancel any pending delay timeout
    if (resizeShowDelayTimeoutId) {
      clearTimeout(resizeShowDelayTimeoutId);
      resizeShowDelayTimeoutId = null;
    }
    
    // Cancel any existing hide delay timeout
    if (resizeHideDelayTimeoutId) {
      clearTimeout(resizeHideDelayTimeoutId);
      resizeHideDelayTimeoutId = null;
    }
    
    isResizingActive = false;
    isResizing = false;
    
    // Wait 1200ms before hiding overlay (super robust delay)
    resizeHideDelayTimeoutId = setTimeout(() => {
      // Double-check we're still not resizing before hiding
      if (!isResizing && !isResizingActive) {
        hideResizeCover();
      }
      resizeHideDelayTimeoutId = null;
    }, resizeHideDelay);
  }
  
  // Throttled resize handler using RAF
  function handleResize() {
    handleResizeStart();
    
    // Clear existing timeout
    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId);
    }
    
    // Debounce end detection
    resizeTimeoutId = setTimeout(() => {
      handleResizeEnd();
    }, 100); // Small delay to detect resize end
  }
  
  // Use passive listener for performance
  window.addEventListener('resize', handleResize, { passive: true });
  
  log(`✓ Resize cover enabled (fade: ${resizeFadeDuration}ms, show delay: ${resizeShowDelay}ms)`, 'success');
}

/**
 * Show preloader cover during resize
 * Fades in super fast and stays visible
 */
function showResizeCover() {
  if (!preloaderEl) return;
  
  // Check for prefers-reduced-motion
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReduced) {
    // Instant show for reduced motion
    preloaderEl.style.display = 'flex';
    preloaderEl.classList.add('is-resizing', 'is-resize-visible');
    preloaderEl.style.opacity = '1';
    preloaderEl.style.visibility = 'visible';
    preloaderEl.style.pointerEvents = 'auto';
    return;
  }
  
  // Set CSS custom properties for fade durations
  preloaderEl.style.setProperty('--resize-fade-in-duration', `${resizeFadeInDuration}ms`);
  preloaderEl.style.setProperty('--resize-fade-duration', `${resizeFadeDuration}ms`);
  
  // Ensure preloader is visible and on top
  preloaderEl.style.display = 'flex';
  preloaderEl.style.position = 'fixed';
  preloaderEl.style.zIndex = '999999';
  preloaderEl.style.pointerEvents = 'auto';
  
  // Remove any reveal class that might be hiding it
  preloaderEl.classList.remove('is-revealing');
  
  // Add resize state class (but not visible yet - will fade in)
  preloaderEl.classList.add('is-resizing');
  preloaderEl.classList.remove('is-resize-visible');
  
  // Start from opacity 0 for fade-in
  preloaderEl.style.opacity = '0';
  preloaderEl.style.visibility = 'visible';
  preloaderEl.style.transition = `opacity ${resizeFadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  
  // Trigger fade-in animation
  // Check if element still has is-resizing class (not module flag) to avoid race condition
  requestAnimationFrame(() => {
    if (preloaderEl && preloaderEl.classList.contains('is-resizing')) {
      preloaderEl.classList.add('is-resize-visible');
      preloaderEl.style.opacity = '1';
    }
  });
}

/**
 * Hide preloader cover after resize ends
 * Fades out quickly
 */
function hideResizeCover() {
  if (!preloaderEl) return;
  
  // Check if initial preloader is still active
  const isInitialPreload = document.body.classList.contains('preloader-active') && 
                          !preloaderEl.classList.contains('is-revealing');
  
  // Check for prefers-reduced-motion
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReduced) {
    // Instant hide for reduced motion
    preloaderEl.classList.remove('is-resizing', 'is-resize-visible');
    preloaderEl.style.pointerEvents = 'none';
    // Only hide if not in initial preload state
    if (!isInitialPreload) {
      preloaderEl.style.display = 'none';
    }
    return;
  }
  
  // Remove visible class to trigger fade out
  preloaderEl.classList.remove('is-resize-visible');
  
  // Set transition for smooth fade-out and trigger it
  preloaderEl.style.transition = `opacity ${resizeFadeDuration}ms cubic-bezier(0.4, 0, 0.2, 1), visibility ${resizeFadeDuration}ms step-end`;
  
  // Trigger fade-out by setting opacity to 0
  requestAnimationFrame(() => {
    if (preloaderEl) {
      preloaderEl.style.opacity = '0';
    }
  });
  
  // Remove resize state after fade completes
  setTimeout(() => {
    if (preloaderEl && !isResizing) {
      preloaderEl.classList.remove('is-resizing');
      // Clean up inline styles
      preloaderEl.style.opacity = '';
      preloaderEl.style.visibility = '';
      preloaderEl.style.transition = '';
      preloaderEl.style.pointerEvents = 'none';
      // Only hide if not in initial preload state
      if (!isInitialPreload) {
        preloaderEl.style.display = 'none';
      }
      // Track when cover was hidden for delay calculation
      lastResizeCoverHideTime = performance.now();
    }
  }, resizeFadeDuration);
}

// ============================================================
// NAVIGATION COVER
// ============================================================

let isNavigating = false;
let navigationTimeoutId = null;

/**
 * Show navigation cover for page transitions
 * Reuses resize fade logic but with navigation-specific guards
 * 
 * @param {Object} options
 * @param {number} options.delay - Delay before navigation proceeds (ms)
 * @returns {Promise} Resolves when cover is fully shown
 */
export function showNavigationCover({ delay = 300 } = {}) {
  return new Promise((resolve) => {
    // Guard against concurrent navigation or missing preloader
    if (isNavigating || !preloaderEl) {
      resolve();
      return;
    }
    
    // Guard against concurrent resize operations
    if (isResizing) {
      log('[NAV-COVER] ⚠️ Resize in progress, skipping navigation cover', 'warning');
      resolve();
      return;
    }
    
    isNavigating = true;
    log('[NAV-COVER] 🎯 Showing navigation cover', 'info');
    
    // Check for prefers-reduced-motion
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReduced) {
      log('[NAV-COVER] ⚡ Reduced motion: instant navigation', 'info');
      resolve();
      isNavigating = false;
      return;
    }
    
    // Reuse resize cover show logic
    showResizeCover();
    
    // Wait for fade-in to complete before resolving
    navigationTimeoutId = setTimeout(() => {
      log('[NAV-COVER] ✓ Navigation cover ready', 'success');
      resolve();
      // Keep isNavigating true - will be cleared on page unload
    }, Math.min(delay, resizeFadeInDuration));
    
    // Safety timeout: clear navigation state if navigation fails
    setTimeout(() => {
      if (isNavigating) {
        isNavigating = false;
      }
    }, 5000);
  });
}

/**
 * Abort navigation cover (e.g., if navigation was cancelled)
 */
export function abortNavigationCover() {
  if (!isNavigating) return;
  
  log('[NAV-COVER] ❌ Navigation aborted', 'warning');
  isNavigating = false;
  
  if (navigationTimeoutId) {
    clearTimeout(navigationTimeoutId);
    navigationTimeoutId = null;
  }
  
  // Hide cover immediately using resize hide logic
  hideResizeCover();
}

// ============================================================
// CLEANUP & API
// ============================================================

/**
 * Cleanup function for unmounting
 */
export function cleanupPreloader() {
  stopAnimations();
  
  // Cleanup resize handlers
  if (resizeTimeoutId) {
    clearTimeout(resizeTimeoutId);
    resizeTimeoutId = null;
  }
  
  if (resizeShowDelayTimeoutId) {
    clearTimeout(resizeShowDelayTimeoutId);
    resizeShowDelayTimeoutId = null;
  }
  
  if (resizeHideDelayTimeoutId) {
    clearTimeout(resizeHideDelayTimeoutId);
    resizeHideDelayTimeoutId = null;
  }
  
  // Cleanup navigation handlers
  if (navigationTimeoutId) {
    clearTimeout(navigationTimeoutId);
    navigationTimeoutId = null;
  }
  isNavigating = false;
  
  if (signetEl) {
    signetEl.style.removeProperty('--pulse-duration');
    signetEl.style.removeProperty('--pulse-min-opacity');
  }

  preloaderEl = null;
  signetEl = null;
  progressEl = null;
  isResizing = false;
  lastResizeCoverHideTime = 0;
  
  document.body?.classList.remove('preloader-active');
  unlockScroll();
  log('Cleaned up', 'info');
}

// Expose minimal API
if (typeof window !== 'undefined') {
  window.App = window.App || {};
  window.App.preloader = {
    cleanup: cleanupPreloader,
    hide: hidePreloaderManually
  };
}
