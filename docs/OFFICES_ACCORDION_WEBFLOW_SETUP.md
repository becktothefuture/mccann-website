# Offices Accordion Webflow Setup

## Overview

The offices accordion is dynamically generated from `mccann-locations.json` data. You create template elements in Webflow that the JavaScript clones and populates. The existing accordion animations and ARIA support remain intact.

## Required Markup Structure

### 1. Root Accordion

Add the data attribute to identify this specific accordion:

```html
<div class="accordeon" data-locations-root="offices">
  <!-- Templates go here -->
</div>
```

### 2. Continent Template

Create one `.acc-section` with the continent template attribute:

```html
<div class="acc-section" data-locations-template="continent">
  <a href="#" class="acc-trigger" data-field="continent-name">Continent Name</a>
  <div class="acc-list" data-slot="countries">
    <!-- Country templates will be inserted here -->
  </div>
</div>
```

**Note:** The `data-field="continent-name"` is optional but recommended for consistency. If omitted, the module will use `.acc-trigger` as fallback.

### 3. Country Template

Create one `.acc-item` with nested accordion structure:

```html
<div class="acc-item" data-locations-template="country">
  <a href="#" class="acc-trigger" data-field="country-name">Country Name</a>
  <div class="acc-list" data-slot="locations">
    <!-- Location items will be inserted here -->
  </div>
</div>
```

**Note:** The `data-field="country-name"` is optional but recommended for consistency. If omitted, the module will use `.acc-trigger` as fallback.

### 4. Location Template

Create one `.acc-item` for individual office locations:

```html
<div class="acc-item" data-locations-template="location">
  <div class="location-info">
    <h4 data-field="location-city">City</h4>
    <p data-field="location-address">Full Address</p>
    <a href="#" data-field="location-email">email@example.com</a>
  </div>
</div>
```

## Data Attributes Reference

### Template Markers
- `data-locations-root="offices"` - Identifies the offices accordion
- `data-locations-template="continent"` - Marks the continent template
- `data-locations-template="country"` - Marks the country template  
- `data-locations-template="location"` - Marks the location template

### Content Slots
- `data-slot="countries"` - Container where country items are inserted
- `data-slot="locations"` - Container where location items are inserted

### Field Markers

**Continent & Country (optional, fallback to `.acc-trigger`):**
- `data-field="continent-name"` - Continent name text (on trigger element)
- `data-field="country-name"` - Country name text (on trigger element)

**Location Fields:**
- `data-field="location-city"` - City name text
- `data-field="location-address"` - Full address text
- `data-field="location-email"` - Email link (removed if no email)
- `data-field="location-phone"` - Phone link (removed if no number)
- `data-field="location-instagram"` - Instagram link (removed if no URL)
- `data-field="location-facebook"` - Facebook link (removed if no URL)
- `data-field="location-linkedin"` - LinkedIn link (removed if no URL)

## Important Notes

1. **Templates Stay Visible in Designer** - The template elements remain visible in Webflow Designer for easy editing. The JavaScript removes them at runtime after cloning.

2. **Preserve Accordion Classes** - Keep all existing `.acc-section`, `.acc-item`, `.acc-trigger`, and `.acc-list` classes. The accordion module depends on these.

3. **Styling Freedom** - Style the location info however you want. The JavaScript only updates text content and removes empty email links.

4. **ARIA Handled Automatically** - The module generates unique IDs and proper ARIA attributes. Don't add these manually.

5. **One Accordion Per Page** - If you have multiple accordions, only the one with `data-locations-root="offices"` will be populated with location data.

## Testing Checklist

1. Preview the page and check console for:
   - `[LOCATIONS] ✓ Found all templates`
   - `[LOCATIONS] ✓ Built accordion with X continents and Y locations`

2. Verify accordion functionality:
   - Continents expand to show countries
   - Countries expand to show individual offices
   - Animations work as before
   - Keyboard navigation works

3. Check that email links:
   - Appear when contact email exists
   - Are removed when no email provided

## Example Complete Structure

```html
<div class="accordeon" data-locations-root="offices">
  <!-- Continent Template -->
  <div class="acc-section" data-locations-template="continent">
    <a href="#" class="acc-trigger" data-field="continent-name">Africa</a>
    <div class="acc-list" data-slot="countries">
      
      <!-- Country Template -->
      <div class="acc-item" data-locations-template="country">
        <a href="#" class="acc-trigger" data-field="country-name">South Africa</a>
        <div class="acc-list" data-slot="locations">
          
          <!-- Location Template -->
          <div class="acc-item" data-locations-template="location">
            <div class="office-card">
              <h4 class="office-city" data-field="location-city">Johannesburg</h4>
              <p class="office-address" data-field="location-address">Main Road, Bryanston</p>
              <a href="#" class="office-email" data-field="location-email">contact@mccann.co.za</a>
              <a href="tel:+00" class="office-phone" data-field="location-phone">+00 0000 000</a>
              <a href="#" class="link--social" data-field="location-instagram">Instagram</a>
              <a href="#" class="link--social" data-field="location-facebook">Facebook</a>
              <a href="#" class="link--social" data-field="location-linkedin">LinkedIn</a>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  </div>
</div>
```

The JavaScript will clone these templates, populate them with all location data, and remove the originals.
