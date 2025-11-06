/**
 * ==================================================
 *  PASTE THIS IN YOUR BROWSER CONSOLE TO TEST
 * ==================================================
 */

console.log('🧪 ACCORDION ANIMATION TEST STARTING...\n');

// Step 1: Check what's loaded
console.log('1️⃣ Checking environment...');
console.log('  GSAP loaded:', !!(window.gsap || window.TweenMax || window.TweenLite));
console.log('  Webflow loaded:', !!window.Webflow);
console.log('  Accordion loaded:', !!window._accordionTest);
console.log('  Direct GSAP loaded:', !!window.directGSAPTest);

// Step 2: Check if GSAP is available at all
if (window.gsap || window.TweenMax || window.TweenLite) {
  console.log('\n✅ GSAP IS AVAILABLE! Version:', window.gsap?.version || 'Legacy');
  
  // Step 3: Force test the animations
  console.log('\n2️⃣ Testing animations directly...');
  console.log('  Adding test classes to all accordion items...');
  
  // Add the animation class to all items
  const items = document.querySelectorAll('.acc-item');
  items.forEach(el => el.classList.add('acc-animate-target'));
  console.log(`  Added class to ${items.length} items`);
  
  // Try the direct GSAP test first
  if (window.directGSAPTest) {
    console.log('\n3️⃣ Running Direct GSAP animation test...');
    console.log('  Watch the accordion items - they should animate!');
    window.directGSAPTest.testOpen();
    
    setTimeout(() => {
      console.log('\n  Now testing close animation...');
      window.directGSAPTest.testClose();
    }, 2000);
  } else {
    console.log('\n⚠️ Direct GSAP test not available - trying manual animation...');
    
    // Manual GSAP animation as last resort
    const gsap = window.gsap || window.TweenMax;
    if (gsap && gsap.to) {
      gsap.set('.acc-item', { opacity: 0, y: 20 });
      gsap.to('.acc-item', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      });
      console.log('✅ Manual animation triggered!');
    }
  }
} else {
  console.log('\n❌ GSAP NOT FOUND!');
  console.log('Webflow should include GSAP by default. Possible issues:');
  console.log('  1. You\'re in Designer (GSAP may not load there)');
  console.log('  2. You need to publish the site first');
  console.log('  3. GSAP is loading asynchronously - try again in a few seconds');
  
  // Try to load GSAP manually
  console.log('\n4️⃣ Attempting to load GSAP manually...');
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  script.onload = () => {
    console.log('✅ GSAP loaded manually! Refresh and try again.');
  };
  document.head.appendChild(script);
}

console.log('\n📋 AVAILABLE DEBUG COMMANDS:');
console.log('  directGSAPTest.testOpen()  - Test open animation');
console.log('  directGSAPTest.testClose() - Test close animation');
console.log('  directGSAPTest.checkGSAP() - Check GSAP status');
console.log('  _accordionTest.getMarkedItems() - See marked items');



