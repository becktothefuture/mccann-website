/**
 * ==================================================
 *  McCann Website — Direct GSAP Accordion Animations
 *  Purpose: Provide direct, callable GSAP animation functions
 *  Date: 2025-11-04
 * ==================================================
 */

let gsap;

function findGSAP() {
  if (gsap) return gsap; // Return cached GSAP

  let attempts = 0;
  const find = () => {
    const gsapAvailable = window.gsap || window.TweenMax || window.TweenLite;
    if (gsapAvailable) {
      gsap = gsapAvailable.gsap || gsapAvailable;
      console.log('[DIRECT-GSAP] ✅ GSAP found and cached. Version:', gsap.version || 'Legacy');
    } else if (attempts < 20) {
      attempts++;
      setTimeout(find, 250);
    } else {
      console.log('[DIRECT-GSAP] ❌ GSAP not found after 5 seconds, animations disabled');
    }
  };
  find();
}

// Find GSAP as soon as the module loads
findGSAP();


export function gsapOpenAnimation() {
  if (!gsap) {
    console.log('[DIRECT-GSAP] Open animation skipped: GSAP not available.');
    return;
  }
  const targets = document.querySelectorAll('.acc-animate-target');
  if (targets.length === 0) return;
  
  console.log(`[DIRECT-GSAP] 🎬 Animating ${targets.length} items OPEN`);
  
  gsap.killTweensOf && gsap.killTweensOf(targets);
  
  gsap.set(targets, { opacity: 0, y: 30, scale: 0.98 });
  
  gsap.to(targets, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.4,
    stagger: 0.08,
    ease: "power2.out",
    onComplete: () => {
      console.log('[DIRECT-GSAP] ✅ Open animation complete');
      gsap.set(targets, { clearProps: "all" });
    }
  });
}

export function gsapCloseAnimation() {
  if (!gsap) {
    console.log('[DIRECT-GSAP] Close animation skipped: GSAP not available.');
    return;
  }
  const targets = document.querySelectorAll('.acc-animate-target');
  if (targets.length === 0) return;
  
  console.log(`[DIRECT-GSAP] 🎬 Animating ${targets.length} items CLOSE`);

  gsap.killTweensOf && gsap.killTweensOf(targets);
  
  gsap.to(targets, {
    opacity: 0,
    y: -20,
    scale: 0.98,
    duration: 0.25,
    stagger: {
      each: 0.04,
      from: "end"
    },
    ease: "power2.out",
    onComplete: () => {
      console.log('[DIRECT-GSAP] ✅ Close animation complete');
    }
  });
}

// Expose test functions
window.directGSAPTest = {
  testOpen: () => {
    console.log('[DIRECT-GSAP] Manual test: OPEN');
    document.querySelectorAll('.acc-item').forEach(el => el.classList.add('acc-animate-target'));
    gsapOpenAnimation();
  },
  testClose: () => {
    console.log('[DIRECT-GSAP] Manual test: CLOSE');
    document.querySelectorAll('.acc-item').forEach(el => el.classList.add('acc-animate-target'));
    gsapCloseAnimation();
  },
  checkGSAP: () => {
    const gsapFound = !!gsap;
    console.log('[DIRECT-GSAP] GSAP available:', gsapFound);
    return gsapFound;
  }
};
