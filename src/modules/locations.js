/**
 * ==================================================
 *  McCann Website — Locations Module
 *  Purpose: Build office accordion from JSON data using Webflow templates
 *  Date: 2025-11-11
 * ==================================================
 */

import locationsJson from '../data/mccann-locations.json';
import { emit } from '../core/events.js';

// ============================================================
// INITIALIZATION
// ============================================================

export function initLocations(options = {}) {
  const {
    rootSelector = '.accordeon[data-locations-root="offices"]',
    data = window.McCANN_LOCATION_DATA ?? locationsJson
  } = options;

  const root = document.querySelector(rootSelector);
  if (!root) {
    // No accordion root found → exit quietly to keep runtime clean in production
    return;
  }

  // Find templates within the accordion
  const continentTemplate = root.querySelector('[data-locations-template="continent"]');
  const countryTemplate = root.querySelector('[data-locations-template="country"]');
  const locationTemplate = root.querySelector('[data-locations-template="location"]');

  if (!continentTemplate || !countryTemplate || !locationTemplate) {
    // Template set incomplete → skip build to avoid half-rendered accordion
    return;
  }

  // Clone templates and strip IDs
  const continentBase = continentTemplate.cloneNode(true);
  const countryBase = countryTemplate.cloneNode(true);
  const locationBase = locationTemplate.cloneNode(true);
  
  stripIds(continentBase);
  stripIds(countryBase);
  stripIds(locationBase);

  // Remove template attributes from clones
  continentBase.removeAttribute('data-locations-template');
  countryBase.removeAttribute('data-locations-template');
  locationBase.removeAttribute('data-locations-template');

  // Remove nested templates from cloned bases (prevents first item using template)
  continentBase.querySelectorAll('[data-locations-template]').forEach(el => el.remove());
  countryBase.querySelectorAll('[data-locations-template]').forEach(el => el.remove());
  locationBase.querySelectorAll('[data-locations-template]').forEach(el => el.remove());

  // Build fragment for batch DOM update
  const fragment = document.createDocumentFragment();
  let totalLocations = 0;
  let idCounter = 0;

  // Process continents
  const { continents, meta } = data;
  const continentOrder = meta.continentOrder || Object.keys(continents);

  continentOrder.forEach(continentKey => {
    const continent = continents[continentKey];
    if (!continent) {
      // Missing continent data → continue without emitting noisy console output
      return;
    }

    // Clone continent section
    const continentEl = continentBase.cloneNode(true);
    continentEl.dataset.continent = continentKey;

    // Set continent name (prefer data-field, fallback to .acc-trigger)
    const continentNameEl = continentEl.querySelector('[data-field="continent-name"]');
    const continentTrigger = continentNameEl || continentEl.querySelector('.acc-trigger');
    if (continentTrigger) {
      continentTrigger.textContent = continent.label;
      // Set unique IDs for ARIA
      const panelId = `locations-panel-${idCounter++}`;
      const triggerId = `locations-trigger-${idCounter++}`;
      continentTrigger.id = triggerId;
      continentTrigger.setAttribute('aria-controls', panelId);
    }

    // Find countries container (prefer data-slot, fallback to .acc-list)
    const countriesContainer = continentEl.querySelector('[data-slot="countries"], .acc-list');
    if (!countriesContainer) {
      // No countries container → abort this continent to preserve accordion structure
      return;
    }

    // Set panel ID
    countriesContainer.id = continentTrigger?.getAttribute('aria-controls') || `locations-panel-${idCounter++}`;
    countriesContainer.setAttribute('aria-labelledby', continentTrigger?.id || '');

    // Process countries
    const countryOrder = continent.countryOrder || Object.keys(continent.countries);
    
    countryOrder.forEach(countryKey => {
      const country = continent.countries[countryKey];
      if (!country) {
        // Country data missing → skip entry while keeping rest intact
        return;
      }

      // Clone country item
      const countryEl = countryBase.cloneNode(true);
      countryEl.dataset.country = countryKey;

      // Set country name (prefer data-field, fallback to .acc-trigger)
      const countryNameEl = countryEl.querySelector('[data-field="country-name"]');
      const countryTrigger = countryNameEl || countryEl.querySelector('.acc-trigger');
      if (countryTrigger) {
        countryTrigger.textContent = country.label;
        // Set unique IDs for ARIA
        const panelId = `locations-panel-${idCounter++}`;
        const triggerId = `locations-trigger-${idCounter++}`;
        countryTrigger.id = triggerId;
        countryTrigger.setAttribute('aria-controls', panelId);
      }

      // Find locations container (prefer data-slot, fallback to .acc-list)
      const locationsContainer = countryEl.querySelector('[data-slot="locations"], .acc-list');
      if (!locationsContainer) {
        // No locations container → skip country rather than rendering broken markup
        return;
      }

      // Set panel ID
      locationsContainer.id = countryTrigger?.getAttribute('aria-controls') || `locations-panel-${idCounter++}`;
      locationsContainer.setAttribute('aria-labelledby', countryTrigger?.id || '');

      // Process locations
      country.locations.forEach(location => {
        const locationEl = locationBase.cloneNode(true);
        locationEl.dataset.locationId = location.id;

        // Populate location fields
        const cityEl = locationEl.querySelector('[data-field="location-city"]');
        const addressEl = locationEl.querySelector('[data-field="location-address"]');
        const emailEl = locationEl.querySelector('[data-field="location-email"]');
        const instagramEl = locationEl.querySelector('[data-field="location-instagram"]');
        const phoneEl = locationEl.querySelector('[data-field="location-phone"]');
        const facebookEl = locationEl.querySelector('[data-field="location-facebook"]');
        const linkedinEl = locationEl.querySelector('[data-field="location-linkedin"]');

        if (cityEl) cityEl.textContent = location.city || '';
        if (addressEl) addressEl.textContent = location.address || '';

        // Handle email link
        if (emailEl) {
          if (location.contactEmail) {
            emailEl.href = `mailto:${location.contactEmail}`;
            emailEl.textContent = location.contactEmail;
          } else {
            // Remove email element if no email
            emailEl.remove();
          }
        }

        if (phoneEl) {
          if (location.phone) {
            const phoneNumber = location.phone.toString().trim();
            phoneEl.href = phoneNumber.startsWith('tel:')
              ? phoneNumber
              : `tel:${phoneNumber.replace(/[^+\\d]/g, '')}`;
            phoneEl.textContent = location.phone;
            phoneEl.setAttribute('aria-label', `Call ${location.city ?? location.name ?? 'office'}`);
          } else {
            phoneEl.remove();
          }
        }

        // Social handles → remove anchors when empty so Webflow only shows valid links
        if (instagramEl) {
          if (location.instagram) {
            // Ensure URL is complete (add https:// if missing)
            const instagramUrl = location.instagram.startsWith('http')
              ? location.instagram
              : `https://instagram.com/${location.instagram.replace(/^@?/, '')}`;
            instagramEl.href = instagramUrl;
            instagramEl.setAttribute('aria-label', `Instagram: ${location.city ?? location.name ?? ''}`);
          } else {
            // Remove Instagram element if no URL
            instagramEl.remove();
          }
        }

        if (facebookEl) {
          if (location.facebook) {
            // Ensure URL is complete (add https:// if missing)
            const facebookUrl = location.facebook.startsWith('http')
              ? location.facebook
              : `https://facebook.com/${location.facebook.replace(/^@?/, '')}`;
            facebookEl.href = facebookUrl;
            facebookEl.setAttribute('aria-label', `Facebook: ${location.city ?? location.name ?? ''}`);
          } else {
            // Remove Facebook element if no URL
            facebookEl.remove();
          }
        }

        // Handle LinkedIn link
        if (linkedinEl) {
          if (location.linkedin) {
            // Ensure URL is complete (add https:// if missing)
            const linkedinUrl = location.linkedin.startsWith('http')
              ? location.linkedin
              : `https://linkedin.com/company/${location.linkedin.replace(/^\/?/, '')}`;
            linkedinEl.href = linkedinUrl;
            linkedinEl.setAttribute('aria-label', `LinkedIn: ${location.city ?? location.name ?? ''}`);
          } else {
            // Remove LinkedIn element if no URL
            linkedinEl.remove();
          }
        }

        locationsContainer.appendChild(locationEl);
        totalLocations++;
      });

      countriesContainer.appendChild(countryEl);
    });

    fragment.appendChild(continentEl);
  });

  // Remove all template elements
  continentTemplate.remove();
  countryTemplate.remove();
  locationTemplate.remove();

  // Remove any existing non-template accordion content
  const existingContent = root.querySelectorAll('.acc-section:not([data-locations-template])');
  existingContent.forEach(el => el.remove());

  // Insert all new content
  root.appendChild(fragment);

  emit('offices:built', root, { 
    continents: continentOrder.length,
    locations: totalLocations 
  });

  // Expose API
  window.App = window.App || {};
  window.App.locations = {
    rebuild: () => initLocations(options),
    getData: () => data
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
