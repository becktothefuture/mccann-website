# McCann Website — Cleanup Plan

> Track code we intend to remove or refactor. Update this log whenever we decide to retire a module so the whole crew stays aligned.

---

## Candidates

| Item | Current behaviour | Why it can go | Proposed actions | Owner / Status |
|------|-------------------|---------------|------------------|----------------|
| Legacy ScrollTrigger wiring (double-check) | `webflow-scrolltrigger.js` emits logo events; ensure no duplicate pathways remain | Prevent overlapping logic now that smooth scroll has been removed | Audit existing listeners and confirm only the active path remains. | _Unassigned_ → **Pending** |

---

## Recently Completed

| Item | Notes | Completed |
|------|-------|-----------|
| Smooth scroll module (`src/modules/smooth-scroll.js`) & Lenis dependency | Removed module/imports, dropped Lenis from `package.json`, updated docs (`README`, onboarding, quick reference, preloader guide). | 2025-11-12 |

---

## Process

1. Capture proposed cleanup here (what, why, risk, steps).
2. Align with design ↔ dev stakeholders (Webflow interactions, animation expectations).
3. Execute removal in a dedicated PR branch; smoke-test on homepage + a deep link.
4. Update docs + onboarding references the same day we remove the code.

---

_Last updated: 2025-11-12_
