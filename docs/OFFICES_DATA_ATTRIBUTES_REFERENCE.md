# Offices Accordion Data Attributes Reference

Complete reference for all data attributes used in the offices accordion system.

## Attribute Naming Convention

All attributes follow a consistent pattern:
- **Root identifier**: `data-locations-root`
- **Template markers**: `data-locations-template`
- **Content slots**: `data-slot` (scoped within templates)
- **Field markers**: `data-field` (for all text/link content)

## Complete Attribute List

### 1. Root Level

**`data-locations-root="offices"`**
- **Element**: `.accordeon` wrapper
- **Purpose**: Identifies the offices accordion container
- **Required**: Yes
- **Example**: `<div class="accordeon" data-locations-root="offices">`

---

### 2. Template Markers

**`data-locations-template="continent"`**
- **Element**: `.acc-section` (continent template)
- **Purpose**: Marks the continent-level template
- **Required**: Yes
- **Example**: `<div class="acc-section" data-locations-template="continent">`

**`data-locations-template="country"`**
- **Element**: `.acc-item` (country template)
- **Purpose**: Marks the country-level template
- **Required**: Yes
- **Example**: `<div class="acc-item" data-locations-template="country">`

**`data-locations-template="location"`**
- **Element**: `.acc-item` (location template)
- **Purpose**: Marks the individual location template
- **Required**: Yes
- **Example**: `<div class="acc-item" data-locations-template="location">`

---

### 3. Content Slots

**`data-slot="countries"`**
- **Element**: `.acc-list` inside continent template
- **Purpose**: Container where country items are inserted
- **Required**: Yes (or module falls back to `.acc-list`)
- **Example**: `<div class="acc-list" data-slot="countries">`

**`data-slot="locations"`**
- **Element**: `.acc-list` inside country template
- **Purpose**: Container where location items are inserted
- **Required**: Yes (or module falls back to `.acc-list`)
- **Example**: `<div class="acc-list" data-slot="locations">`

---

### 4. Field Markers

#### Continent & Country Fields

**`data-field="continent-name"`**
- **Element**: `.acc-trigger` inside continent template
- **Purpose**: Populates continent name text
- **Required**: No (falls back to `.acc-trigger` selector)
- **Example**: `<a href="#" class="acc-trigger" data-field="continent-name">Africa</a>`

**`data-field="country-name"`**
- **Element**: `.acc-trigger` inside country template
- **Purpose**: Populates country name text
- **Required**: No (falls back to `.acc-trigger` selector)
- **Example**: `<a href="#" class="acc-trigger" data-field="country-name">South Africa</a>`

#### Location Fields

**`data-field="location-city"`**
- **Element**: Any text element (typically `<h4>`)
- **Purpose**: City name
- **Required**: Yes
- **Example**: `<h4 data-field="location-city">Johannesburg</h4>`

**`data-field="location-address"`**
- **Element**: Any text element (typically `<p>`)
- **Purpose**: Full street address
- **Required**: Yes
- **Example**: `<p data-field="location-address">Main Road, Bryanston</p>`

**`data-field="location-email"`**
- **Element**: Link element (`<a>`)
- **Purpose**: Contact email (removed if no email in JSON)
- **Required**: No (optional field)
- **Behavior**: Sets `href="mailto:..."` and text content, or removes element
- **Example**: `<a href="#" data-field="location-email">contact@mccann.co.za</a>`

**`data-field="location-instagram"`**
- **Element**: Link element (`<a>`)
- **Purpose**: Instagram profile link (removed if no URL in JSON)
- **Required**: No (optional field)
- **Behavior**: Sets `href` to full Instagram URL, adds `aria-label`, or removes element
- **Example**: `<a href="#" class="link--social" data-field="location-instagram">Instagram</a>`

**`data-field="location-linkedin"`**
- **Element**: Link element (`<a>`)
- **Purpose**: LinkedIn company page link (removed if no URL in JSON)
- **Required**: No (optional field)
- **Behavior**: Sets `href` to full LinkedIn URL, adds `aria-label`, or removes element
- **Example**: `<a href="#" class="link--social" data-field="location-linkedin">LinkedIn</a>`

---

## Complete Example

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
            <div class="content-location">
              <h4 class="acc_location" data-field="location-city">Johannesburg</h4>
              <p class="text--body-L" data-field="location-address">Block B, The Main Straight Office Park</p>
              <a href="#" class="link--social" data-field="location-instagram">Instagram</a>
              <a href="#" class="link--social" data-field="location-linkedin">LinkedIn</a>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
  </div>
  
</div>
```

---

## Quick Checklist

### Required Attributes
- [ ] `data-locations-root="offices"` on `.accordeon`
- [ ] `data-locations-template="continent"` on continent `.acc-section`
- [ ] `data-locations-template="country"` on country `.acc-item`
- [ ] `data-locations-template="location"` on location `.acc-item`
- [ ] `data-slot="countries"` on continent's `.acc-list`
- [ ] `data-slot="locations"` on country's `.acc-list`
- [ ] `data-field="location-city"` on city element
- [ ] `data-field="location-address"` on address element

### Optional Attributes (Recommended)
- [ ] `data-field="continent-name"` on continent trigger
- [ ] `data-field="country-name"` on country trigger
- [ ] `data-field="location-email"` on email link (if email exists)
- [ ] `data-field="location-instagram"` on Instagram link (if URL exists)
- [ ] `data-field="location-linkedin"` on LinkedIn link (if URL exists)

---

## Notes

1. **Backward Compatibility**: Continent and country triggers work without `data-field` attributes (falls back to `.acc-trigger` selector), but using `data-field` is recommended for consistency.

2. **Optional Fields**: Email, Instagram, and LinkedIn fields are removed from the DOM if the corresponding data is missing in the JSON.

3. **URL Handling**: Instagram and LinkedIn URLs can be provided as:
   - Full URLs: `"https://instagram.com/mccann"`
   - Handles: `"@mccann"` (Instagram) or `"mccann"` (LinkedIn)
   - The module automatically formats them correctly.

4. **Template Removal**: All elements with `data-locations-template` attributes are removed from the DOM after cloning, so they only exist in Webflow Designer for editing purposes.
