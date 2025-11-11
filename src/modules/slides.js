/**
 * ==================================================
 *  McCann Website — Slides Module
 *  Purpose: Build .slide elements from JSON, populate text/preview
 *  Date: 2025-11-10
 * ==================================================
 */

import projectDataJson from '../data/project-data.json';
import { mountVimeo } from './vimeo.js';
import { emit } from '../core/events.js';

console.log('[SLIDES] Module loaded');

// ============================================================
// STATE
// ============================================================

let projectData = null;

// ============================================================
// INITIALIZATION
// ============================================================

export function initSlides(options = {}) {
  const {
    containerSelector = '.perspective-wrapper',
    replaceExisting = true,
    projectDataOverride = (window.McCANN_PROJECT_DATA ?? projectDataJson)
  } = options;

  projectData = projectDataOverride;
  const projectIds = Object.keys(projectData || {});
  console.log(`[SLIDES] ✓ Loaded ${projectIds.length} project${projectIds.length !== 1 ? 's' : ''} from JSON`);

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.log('[SLIDES] ❌ Container not found:', containerSelector);
    return;
  }

  // Find template: first .slide in container (or anywhere if not found)
  const existingSlides = container.querySelectorAll('.slide');
  const template = existingSlides[0] || document.querySelector('.slide');
  
  if (!template) {
    console.log('[SLIDES] ❌ No .slide template found');
    return;
  }

  // Store insertion point: find next non-slide element sibling (to preserve DOM order)
  // This ensures we insert at the original position even after removing slides
  let insertBefore = null;
  let sibling = template.nextElementSibling;
  while (sibling) {
    if (!sibling.classList.contains('slide')) {
      insertBefore = sibling;
      break;
    }
    sibling = sibling.nextElementSibling;
  }
  // If no non-slide sibling found, insertBefore remains null (will append)

  // Clone template and strip IDs to avoid duplicates
  const baseTemplate = template.cloneNode(true);
  stripIds(baseTemplate);

  // Build fragment for batch DOM update
  const fragment = document.createDocumentFragment();

  projectIds.forEach((projectId) => {
    const project = projectData[projectId];
    if (!project) {
      console.warn(`[SLIDES] ⚠️  Project "${projectId}" missing data, skipping`);
      return;
    }

    // Clone template for this slide
    const slide = baseTemplate.cloneNode(true);
    
    // Set data-project attribute (lightbox reads this)
    slide.dataset.project = projectId;
    slide.setAttribute('role', 'button');
    slide.setAttribute('tabindex', '0');
    slide.setAttribute('aria-label', `${project.client || ''} — ${project.title || ''}`.trim());

    // Populate text content (with fallback to class selectors for backward compatibility)
    const clientEl = slide.querySelector('[data-field="slide-client"]') || slide.querySelector('.slide__client');
    const titleEl = slide.querySelector('[data-field="slide-title"]') || slide.querySelector('.slide__title');
    if (clientEl) clientEl.textContent = project.client || '';
    if (titleEl) titleEl.textContent = project.title || '';

    // Mount preview video (always) - with fallback to class selector
    const previewContainer = slide.querySelector('[data-field="slide-preview"]') || slide.querySelector('.slide__preview');
    if (previewContainer) {
      if (!project.vimeoPreviewId || project.vimeoPreviewId === '000000000') {
        console.warn(`[SLIDES] ⚠️  Missing vimeoPreviewId for "${projectId}"`);
      } else {
        // Use rAF to batch DOM writes
        requestAnimationFrame(() => {
          mountVimeo(previewContainer, project.vimeoPreviewId, {
            autoplay: 1,
            muted: 1,
            autopause: 0,
            controls: 0,
            background: 1,
            playsinline: 1,
            loop: 1,
            dnt: 1
          });
        });
      }
    }

    fragment.appendChild(slide);
  });

  // Replace existing slides with JSON-driven ones
  if (replaceExisting) {
    // Remove all existing .slide elements in container
    existingSlides.forEach(slide => slide.remove());
  }

  // Insert all new slides at original position (preserve DOM order)
  if (insertBefore && insertBefore.parentNode === container) {
    container.insertBefore(fragment, insertBefore);
  } else {
    // Fallback: append if no next sibling or sibling is in different parent
    container.appendChild(fragment);
  }

  console.log(`[SLIDES] ✓ Rendered ${projectIds.length} slide${projectIds.length !== 1 ? 's' : ''}`);
  emit('slides:built', container, { count: projectIds.length });

  // Expose API
  window.App = window.App || {};
  window.App.slides = {
    rebuild: () => initSlides(options),
    getProjectData: () => projectData
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function stripIds(element) {
  if (element.hasAttribute && element.hasAttribute('id')) {
    element.removeAttribute('id');
  }
  element.querySelectorAll?.('[id]').forEach(el => el.removeAttribute('id'));
}

