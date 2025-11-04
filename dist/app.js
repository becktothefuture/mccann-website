(() => {
  // src/core/events.js
  function emit(name, target = window, detail = {}) {
    try {
      target.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable: true, detail }));
    } catch {
    }
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {
    }
  }

  // src/modules/accordion.js
  console.log("[ACCORDION] module loaded");
  function initAccordion(rootOrOptions = ".accordeon") {
    const rootSel = typeof rootOrOptions === "string" ? rootOrOptions : rootOrOptions && rootOrOptions.rootSel || ".accordeon";
    const useInlineGsapOpt = typeof rootOrOptions === "object" && !!rootOrOptions.useInlineGsap;
    const root = document.querySelector(rootSel);
    if (!root) {
      console.log("[ACCORDION] root not found");
      return;
    }
    const isL1 = (el) => el.classList.contains("accordeon-item--level1");
    const isL2 = (el) => el.classList.contains("accordeon-item--level2");
    const panelOf = (item) => item == null ? void 0 : item.querySelector(":scope > .accordeon__list");
    const groupOf = (item) => isL1(item) ? root : item.closest(".accordeon__list");
    const itemsInPanel = (panel) => Array.from(panel ? panel.children : []);
    const wantsInlineGsap = useInlineGsapOpt || root.dataset.accGsap === "inline";
    const hasGsap = !!(window && window.gsap);
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canInlineGsap = wantsInlineGsap && hasGsap && !reducedMotion;
    const tlStore = /* @__PURE__ */ new WeakMap();
    function getTimeline(panel) {
      if (!canInlineGsap) return null;
      let tl = tlStore.get(panel);
      if (tl) return tl;
      const items = itemsInPanel(panel);
      if (!items.length) return null;
      const gsap = window.gsap;
      tl = gsap.timeline({ paused: true, defaults: { duration: 0.35, ease: "power2.out" } });
      tl.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.35, ease: "power2.out", immediateRender: false }, 0);
      tlStore.set(panel, tl);
      return tl;
    }
    function emitItemsAnimation(item, direction) {
      const panel = panelOf(item);
      if (!panel) return;
      const level = isL1(item) ? 1 : 2;
      const name = level === 1 ? direction === "in" ? "ACC_L1_ITEMS_IN" : "ACC_L1_ITEMS_OUT" : direction === "in" ? "ACC_L2_ITEMS_IN" : "ACC_L2_ITEMS_OUT";
      const items = itemsInPanel(panel);
      emit(name, panel, { level, direction, itemsLength: items.length });
    }
    root.querySelectorAll(".accordeon__trigger").forEach((t, i) => {
      t.setAttribute("role", "button");
      t.setAttribute("tabindex", "0");
      const item = t.closest(".accordeon-item--level1, .accordeon-item--level2");
      const p = panelOf(item);
      if (p) {
        const pid = p.id || `acc-panel-${i}`;
        p.id = pid;
        t.setAttribute("aria-controls", pid);
        t.setAttribute("aria-expanded", "false");
      }
    });
    function expand(p) {
      p.classList.add("is-active");
      p.style.maxHeight = p.scrollHeight + "px";
      p.dataset.state = "opening";
      const onEnd = (e) => {
        if (e.propertyName !== "max-height") return;
        p.removeEventListener("transitionend", onEnd);
        if (p.dataset.state === "opening") {
          p.style.maxHeight = "none";
          p.dataset.state = "open";
        }
      };
      p.addEventListener("transitionend", onEnd);
    }
    function collapse(p) {
      const h = p.style.maxHeight === "none" ? p.scrollHeight : parseFloat(p.style.maxHeight || 0);
      p.style.maxHeight = (h || p.scrollHeight) + "px";
      p.offsetHeight;
      p.style.maxHeight = "0px";
      p.dataset.state = "closing";
      const onEnd = (e) => {
        if (e.propertyName !== "max-height") return;
        p.removeEventListener("transitionend", onEnd);
        p.dataset.state = "collapsed";
        p.classList.remove("is-active");
      };
      p.addEventListener("transitionend", onEnd);
    }
    function closeSiblings(item) {
      const group = groupOf(item);
      if (!group) return;
      const want = isL1(item) ? "accordeon-item--level1" : "accordeon-item--level2";
      Array.from(group.children).forEach((sib) => {
        var _a;
        if (sib === item || !((_a = sib.classList) == null ? void 0 : _a.contains(want))) return;
        const p = panelOf(sib);
        if (p && (p.dataset.state === "open" || p.dataset.state === "opening")) {
          if (canInlineGsap) {
            const tl = getTimeline(p);
            tl && tl.time(tl.duration()).reverse();
          } else {
            emitItemsAnimation(sib, "out");
          }
          collapse(p);
          const trig = sib.querySelector(".accordeon__trigger");
          trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
          emit(isL1(item) ? "ACC_L1_CLOSE" : "ACC_L2_CLOSE", sib, { source: "sibling" });
        }
      });
    }
    function resetAllL2() {
      root.querySelectorAll(".accordeon-item--level2 .accordeon__list").forEach((p) => {
        var _a;
        if (p.dataset.state === "open" || p.dataset.state === "opening") {
          if (canInlineGsap) {
            const tl = getTimeline(p);
            tl && tl.time(tl.duration()).reverse();
          }
          collapse(p);
          const it = p.closest(".accordeon-item--level2");
          (_a = it == null ? void 0 : it.querySelector(".accordeon__trigger")) == null ? void 0 : _a.setAttribute("aria-expanded", "false");
          emit("ACC_L2_CLOSE", it, { source: "reset-all" });
        }
      });
    }
    function toggle(item) {
      const p = panelOf(item);
      if (!p) return;
      const trig = item.querySelector(".accordeon__trigger");
      const opening = !(p.dataset.state === "open" || p.dataset.state === "opening");
      closeSiblings(item);
      if (opening && isL1(item)) resetAllL2();
      if (opening) {
        expand(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "true");
        if (canInlineGsap) {
          const tl = getTimeline(p);
          tl && tl.time(0).play();
        } else {
          emitItemsAnimation(item, "in");
        }
        emit(isL1(item) ? "ACC_L1_OPEN" : "ACC_L2_OPEN", item, { opening: true });
      } else {
        if (canInlineGsap) {
          const tl = getTimeline(p);
          tl && tl.time(tl.duration && tl.duration() || 0).reverse();
        } else {
          emitItemsAnimation(item, "out");
        }
        collapse(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
        if (isL1(item)) resetAllL2();
        emit(isL1(item) ? "ACC_L1_CLOSE" : "ACC_L2_CLOSE", item, { opening: false });
      }
    }
    document.body.classList.add("js-prep");
    root.querySelectorAll(".accordeon__list").forEach((p) => {
      p.style.maxHeight = "0px";
      p.dataset.state = "collapsed";
    });
    requestAnimationFrame(() => document.body.classList.remove("js-prep"));
    root.addEventListener("click", (e) => {
      const t = e.target.closest(".accordeon__trigger");
      if (!t || !root.contains(t)) return;
      e.preventDefault();
      const item = t.closest(".accordeon-item--level1, .accordeon-item--level2");
      item && toggle(item);
    });
    root.addEventListener("keydown", (e) => {
      const t = e.target.closest(".accordeon__trigger");
      if (!t || !root.contains(t)) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const item = t.closest(".accordeon-item--level1, .accordeon-item--level2");
      item && toggle(item);
    });
    const ro = new ResizeObserver((entries) => {
      entries.forEach(({ target: p }) => {
        if (p.dataset.state === "open") {
          p.style.maxHeight = "none";
        } else if (p.dataset.state === "opening") {
          p.style.maxHeight = p.scrollHeight + "px";
        }
      });
    });
    root.querySelectorAll(".accordeon__list").forEach((p) => ro.observe(p));
  }

  // src/core/scrolllock.js
  var locks = 0;
  var savedY = 0;
  var prevScrollBehavior = "";
  function lockScroll() {
    if (locks++) return;
    const de = document.documentElement;
    prevScrollBehavior = de.style.scrollBehavior;
    de.style.scrollBehavior = "auto";
    savedY = window.scrollY || de.scrollTop || 0;
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${savedY}px`,
      left: "0",
      right: "0",
      width: "100%",
      overflow: "hidden",
      overscrollBehavior: "none"
    });
    try {
      document.body.classList.add("modal-open");
    } catch {
    }
  }
  function unlockScroll({ delayMs = 0 } = {}) {
    const run = () => {
      if (--locks > 0) return;
      const de = document.documentElement;
      Object.assign(document.body.style, {
        position: "",
        top: "",
        left: "",
        right: "",
        width: "",
        overflow: "",
        overscrollBehavior: ""
      });
      try {
        document.body.classList.remove("modal-open");
      } catch {
      }
      de.style.scrollBehavior = prevScrollBehavior || "";
      window.scrollTo(0, savedY);
    };
    delayMs ? setTimeout(run, delayMs) : run();
  }

  // src/modules/vimeo.js
  console.log("[VIMEO] module loaded");
  function parseVimeoId(input) {
    var _a;
    if (!input) return "";
    const str = String(input).trim();
    if (/^\d+$/.test(str)) return str;
    try {
      const u = new URL(str, "https://example.com");
      const host = u.hostname || "";
      if (host.includes("vimeo.com")) {
        const parts = u.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] || "";
        const id = ((_a = last.match(/\d+/)) == null ? void 0 : _a[0]) || "";
        return id || "";
      }
    } catch {
    }
    return "";
  }
  function mountVimeo(container, inputId, params = {}) {
    if (!container) return;
    const id = parseVimeoId(inputId);
    if (!id) {
      container.innerHTML = "";
      return;
    }
    const query = new URLSearchParams({ dnt: 1, ...params }).toString();
    const src = `https://player.vimeo.com/video/${id}?${query}`;
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.setAttribute("frameborder", "0");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(iframe);
  }

  // src/modules/lightbox.js
  console.log("[LIGHTBOX] module loaded");
  function initLightbox({ root = "#project-lightbox", closeDelayMs = 1e3 } = {}) {
    const lb = document.querySelector(root);
    if (!lb) {
      console.log("[LIGHTBOX] not found");
      return;
    }
    lb.setAttribute("role", lb.getAttribute("role") || "dialog");
    lb.setAttribute("aria-modal", lb.getAttribute("aria-modal") || "true");
    lb.setAttribute("aria-hidden", lb.getAttribute("aria-hidden") || "true");
    const inner = lb.querySelector(".project-lightbox__inner");
    const videoArea = lb.querySelector(".video-area");
    const slides = document.querySelectorAll(".slide");
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let openGuard = false;
    let lastFocus = null;
    function setPageInert(on) {
      const siblings = Array.from(document.body.children).filter((n) => n !== lb);
      siblings.forEach((n) => {
        try {
          if ("inert" in n) n.inert = !!on;
        } catch {
        }
        if (on) n.setAttribute("aria-hidden", "true");
        else n.removeAttribute("aria-hidden");
      });
    }
    function trapFocus(e) {
      if (e.key !== "Tab") return;
      const focusables = lb.querySelectorAll([
        "a[href]",
        "button",
        "input",
        "select",
        "textarea",
        '[tabindex]:not([tabindex="-1"])'
      ].join(","));
      const list = Array.from(focusables).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
      if (list.length === 0) {
        e.preventDefault();
        (inner || lb).focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    function openFromSlide(slide) {
      var _a, _b, _c;
      if (openGuard) return;
      openGuard = true;
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const video = ((_a = slide == null ? void 0 : slide.dataset) == null ? void 0 : _a.video) || "";
      const title = ((_b = slide == null ? void 0 : slide.dataset) == null ? void 0 : _b.title) || "";
      const text = ((_c = slide == null ? void 0 : slide.dataset) == null ? void 0 : _c.text) || "";
      const isDesigner = /\.webflow\.com$/.test(location.hostname) || /canvas\.webflow\.com$/.test(location.hostname);
      const autoplay = isDesigner ? 0 : 1;
      if (videoArea) mountVimeo(videoArea, video, { autoplay, muted: 1, controls: 0, background: 1, playsinline: 1, dnt: 1 });
      lb.setAttribute("aria-hidden", "false");
      lb.setAttribute("data-open", "true");
      setPageInert(true);
      lockScroll();
      lb.setAttribute("tabindex", "-1");
      (inner || lb).focus();
      emit("LIGHTBOX_OPEN", lb, { video, title, text });
    }
    function requestClose() {
      if (!openGuard) return;
      emit("LIGHTBOX_CLOSE", lb);
      if (prefersReduced) {
        unlockScroll({ delayMs: 0 });
        emit("LIGHTBOX_CLOSED_DONE", lb);
      } else {
        unlockScroll({ delayMs: closeDelayMs });
      }
      lb.setAttribute("aria-hidden", "true");
      lb.removeAttribute("data-open");
      setPageInert(false);
      if (videoArea) videoArea.innerHTML = "";
      if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
      openGuard = false;
    }
    slides.forEach((slide) => slide.addEventListener("click", () => openFromSlide(slide)));
    lb.addEventListener("click", (e) => {
      if (inner && !e.target.closest(".project-lightbox__inner")) requestClose();
      else if (!inner && e.target === lb) requestClose();
    });
    document.addEventListener("keydown", (e) => {
      if (lb.getAttribute("data-open") === "true") {
        if (e.key === "Escape") requestClose();
        if (e.key === "Tab") trapFocus(e);
      }
    });
    lb.addEventListener("LIGHTBOX_CLOSED_DONE", () => unlockScroll());
  }

  // src/modules/webflow-scrolltrigger.js
  console.log("[WEBFLOW] module loaded");
  function initWebflowScrollTriggers(options = {}) {
    const scrollerSelector = options.scrollerSelector || ".perspective-wrapper";
    const initEventName = options.initEventName || "logo-start";
    const shrinkEventName = options.shrinkEventName || options.playEventName || "logo-shrink";
    const growEventName = options.growEventName || "logo-grow";
    const markers = !!options.markers;
    function onWindowLoad(cb) {
      if (document.readyState === "complete") {
        setTimeout(cb, 0);
        return;
      }
      window.addEventListener("load", cb, { once: true });
    }
    onWindowLoad(function() {
      const Webflow = window.Webflow || [];
      Webflow.push(function() {
        const wfIx = window.Webflow && window.Webflow.require ? window.Webflow.require("ix3") || window.Webflow.require("ix2") : null;
        const ScrollTrigger = window.ScrollTrigger;
        if (!wfIx || !ScrollTrigger) {
          return;
        }
        const scroller = document.querySelector(scrollerSelector);
        if (!scroller) {
          return;
        }
        const driver = scroller.querySelector(".slide") || document.querySelector(".slide");
        if (!driver) {
          console.error("[WEBFLOW] Driver slide not found");
          return;
        }
        const slides = Array.from(scroller.querySelectorAll(".slide"));
        const lastSlide = slides.length > 0 ? slides[slides.length - 1] : null;
        if (!lastSlide) {
          console.warn("[WEBFLOW] No slides found, last slide detection disabled");
        }
        console.log("[WEBFLOW] Setup complete:", {
          scroller: !!scroller,
          driver: !!driver,
          lastSlide: !!lastSlide,
          totalSlides: slides.length,
          wfIx: !!wfIx,
          ScrollTrigger: !!ScrollTrigger,
          initEvent: initEventName,
          shrinkEvent: shrinkEventName,
          growEvent: growEventName
        });
        let isBelowTop = false;
        let hasShrunk = false;
        let hasGrown = false;
        let isAtLastSlide = false;
        let hasGrownAtLast = false;
        ScrollTrigger.create({
          trigger: driver,
          scroller,
          start: "top top",
          end: "top -10%",
          // Short range for immediate trigger
          markers,
          onLeave: () => {
            if (!isBelowTop && !hasShrunk) {
              isBelowTop = true;
              try {
                console.log("[WEBFLOW] emit shrink (scrolled down past first slide):", shrinkEventName);
                wfIx.emit(shrinkEventName);
                hasShrunk = true;
                hasGrown = false;
              } catch (_) {
              }
            }
          },
          onEnterBack: () => {
            isBelowTop = false;
            hasShrunk = false;
            hasGrown = false;
            isAtLastSlide = false;
            hasGrownAtLast = false;
            try {
              console.log("[WEBFLOW] emit start (return to top):", initEventName);
              console.log("[WEBFLOW] wfIx available:", !!wfIx, "emit available:", typeof (wfIx == null ? void 0 : wfIx.emit));
              if (wfIx && typeof wfIx.emit === "function") {
                wfIx.emit(initEventName);
                console.log("[WEBFLOW] return-to-top event emitted successfully");
              } else {
                console.error("[WEBFLOW] Cannot emit return-to-top: wfIx.emit not available");
              }
            } catch (err) {
              console.error("[WEBFLOW] Error emitting return-to-top:", err);
            }
          }
        });
        if (lastSlide) {
          ScrollTrigger.create({
            trigger: lastSlide,
            scroller,
            start: "top bottom",
            // Last slide enters from bottom of viewport
            end: "bottom top",
            // Last slide leaves top of viewport
            markers,
            onEnter: () => {
              if (!isAtLastSlide && !hasGrownAtLast) {
                isAtLastSlide = true;
                try {
                  console.log("[WEBFLOW] emit grow (reached last slide):", growEventName);
                  wfIx.emit(growEventName);
                  hasGrownAtLast = true;
                  hasShrunk = false;
                  hasGrown = false;
                } catch (_) {
                }
              }
            },
            onLeaveBack: () => {
              if (isAtLastSlide && hasGrownAtLast) {
                isAtLastSlide = false;
                try {
                  console.log("[WEBFLOW] emit shrink (scrolling up from last slide):", shrinkEventName);
                  wfIx.emit(shrinkEventName);
                  hasGrownAtLast = false;
                  hasShrunk = true;
                  hasGrown = false;
                } catch (_) {
                }
              }
            }
          });
        }
        let lastScrollTop = scroller.scrollTop;
        let lastDirection = 0;
        ScrollTrigger.create({
          scroller,
          start: 0,
          end: () => ScrollTrigger.maxScroll(scroller),
          onUpdate: (self) => {
            const currentScrollTop = scroller.scrollTop;
            const direction = currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : lastDirection;
            if (isBelowTop && !isAtLastSlide && hasShrunk && !hasGrown && direction === -1 && lastDirection !== -1) {
              try {
                console.log("[WEBFLOW] emit grow (scroll up in middle section):", growEventName);
                wfIx.emit(growEventName);
                hasGrown = true;
                hasShrunk = false;
              } catch (_) {
              }
            }
            if (isBelowTop && !isAtLastSlide && hasGrown && direction === 1 && lastDirection !== 1) {
              hasShrunk = false;
              hasGrown = false;
              console.log("[WEBFLOW] Reset flags - ready to shrink again");
            }
            lastScrollTop = currentScrollTop;
            lastDirection = direction;
          }
        });
        console.log("[WEBFLOW] ScrollTrigger initialized");
        const verifyAndEmit = (eventName, description) => {
          try {
            console.log(`[WEBFLOW] ${description}:`, eventName);
            if (wfIx && typeof wfIx.emit === "function") {
              wfIx.emit(eventName);
              console.log(`[WEBFLOW] \u2713 Emitted ${eventName} - If nothing happens, check Webflow config:`);
              console.log(`[WEBFLOW]   1. Event name must be exactly: "${eventName}"`);
              console.log(`[WEBFLOW]   2. Control must NOT be "No Action"`);
              console.log(`[WEBFLOW]   3. Must target the logo element`);
              console.log(`[WEBFLOW]   4. Timeline must be set correctly`);
              return true;
            } else {
              console.error(`[WEBFLOW] \u2717 wfIx.emit not available`);
              return false;
            }
          } catch (err) {
            console.error(`[WEBFLOW] \u2717 Error emitting ${eventName}:`, err);
            return false;
          }
        };
        let initialGrowEmitted = false;
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          setTimeout(() => {
            if (!initialGrowEmitted) {
              verifyAndEmit(growEventName, "Initial load - grow");
              initialGrowEmitted = true;
            }
          }, 200);
        });
      });
    });
  }

  // src/app.js
  function patchYouTubeAllowTokens() {
    const tokens = ["autoplay", "encrypted-media", "picture-in-picture"];
    const sel = [
      'iframe[src*="youtube.com"]',
      'iframe[src*="youtu.be"]',
      'iframe[src*="youtube-nocookie.com"]'
    ].join(",");
    document.querySelectorAll(sel).forEach((ifr) => {
      const existing = (ifr.getAttribute("allow") || "").split(";").map((s) => s.trim()).filter(Boolean);
      const merged = Array.from(/* @__PURE__ */ new Set([...existing, ...tokens])).join("; ");
      ifr.setAttribute("allow", merged);
    });
  }
  function init(options = {}) {
    const lightboxRoot = options.lightboxRoot || "#project-lightbox";
    initAccordion({ rootSel: ".accordeon", useInlineGsap: !!options.accordionInlineGsap });
    initLightbox({ root: lightboxRoot, closeDelayMs: 1e3 });
    try {
      initWebflowScrollTriggers({
        scrollerSelector: ".perspective-wrapper",
        initEventName: "logo-start",
        shrinkEventName: "logo-shrink",
        growEventName: "logo-grow"
      });
    } catch (_) {
    }
  }
  if (!window.App) window.App = {};
  window.App.init = init;
  document.addEventListener("DOMContentLoaded", () => {
    try {
      patchYouTubeAllowTokens();
      init();
    } catch (err) {
      console.error("[App] init error", err);
    }
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvYXBwLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEV2ZW50cyBVdGlsaXR5XG4gKiAgUHVycG9zZTogRW1pdCBidWJibGluZyBDdXN0b21FdmVudHMgY29tcGF0aWJsZSB3aXRoIEdTQVAtVUkgKHdpbmRvdyBzY29wZSlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0KG5hbWUsIHRhcmdldCA9IHdpbmRvdywgZGV0YWlsID0ge30pe1xuICB0cnkgeyB0YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG4gIHRyeSB7IHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCB7IGRldGFpbCB9KSk7IH0gY2F0Y2gge31cbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBY2NvcmRpb24gTW9kdWxlXG4gKiAgUHVycG9zZTogQVJJQSwgc21vb3RoIHRyYW5zaXRpb25zLCBSTyBpbWFnZSBzYWZldHlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGVtaXQgfSBmcm9tICcuLi9jb3JlL2V2ZW50cy5qcyc7XG5jb25zb2xlLmxvZygnW0FDQ09SRElPTl0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFjY29yZGlvbihyb290T3JPcHRpb25zID0gJy5hY2NvcmRlb24nKXtcbiAgY29uc3Qgcm9vdFNlbCA9IHR5cGVvZiByb290T3JPcHRpb25zID09PSAnc3RyaW5nJyA/IHJvb3RPck9wdGlvbnMgOiAocm9vdE9yT3B0aW9ucyAmJiByb290T3JPcHRpb25zLnJvb3RTZWwpIHx8ICcuYWNjb3JkZW9uJztcbiAgY29uc3QgdXNlSW5saW5lR3NhcE9wdCA9IHR5cGVvZiByb290T3JPcHRpb25zID09PSAnb2JqZWN0JyAmJiAhIXJvb3RPck9wdGlvbnMudXNlSW5saW5lR3NhcDtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbCk7XG4gIGlmICghcm9vdCl7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSByb290IG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICBjb25zdCBpc0wxID0gZWwgPT4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyk7XG4gIGNvbnN0IGlzTDIgPSBlbCA9PiBlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgY29uc3QgcGFuZWxPZiA9IGl0ZW0gPT4gaXRlbT8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjY29yZGVvbl9fbGlzdCcpO1xuICBjb25zdCBncm91cE9mID0gaXRlbSA9PiBpc0wxKGl0ZW0pID8gcm9vdCA6IGl0ZW0uY2xvc2VzdCgnLmFjY29yZGVvbl9fbGlzdCcpO1xuICBjb25zdCBpdGVtc0luUGFuZWwgPSAocGFuZWwpID0+IEFycmF5LmZyb20ocGFuZWwgPyBwYW5lbC5jaGlsZHJlbiA6IFtdKTtcblxuICAvLyBPcHRpb25hbCBzaW5nbGUtdGltZWxpbmUgR1NBUCBtb2RlIChzaW1wbGVyKTogcGxheSBvbiBvcGVuLCByZXZlcnNlIG9uIGNsb3NlXG4gIGNvbnN0IHdhbnRzSW5saW5lR3NhcCA9IHVzZUlubGluZUdzYXBPcHQgfHwgcm9vdC5kYXRhc2V0LmFjY0dzYXAgPT09ICdpbmxpbmUnO1xuICBjb25zdCBoYXNHc2FwID0gISEod2luZG93ICYmIHdpbmRvdy5nc2FwKTtcbiAgY29uc3QgcmVkdWNlZE1vdGlvbiA9IHdpbmRvdy5tYXRjaE1lZGlhICYmIHdpbmRvdy5tYXRjaE1lZGlhKCcocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKScpLm1hdGNoZXM7XG4gIGNvbnN0IGNhbklubGluZUdzYXAgPSB3YW50c0lubGluZUdzYXAgJiYgaGFzR3NhcCAmJiAhcmVkdWNlZE1vdGlvbjtcbiAgY29uc3QgdGxTdG9yZSA9IG5ldyBXZWFrTWFwKCk7XG5cbiAgZnVuY3Rpb24gZ2V0VGltZWxpbmUocGFuZWwpe1xuICAgIGlmICghY2FuSW5saW5lR3NhcCkgcmV0dXJuIG51bGw7XG4gICAgbGV0IHRsID0gdGxTdG9yZS5nZXQocGFuZWwpO1xuICAgIGlmICh0bCkgcmV0dXJuIHRsO1xuICAgIGNvbnN0IGl0ZW1zID0gaXRlbXNJblBhbmVsKHBhbmVsKTtcbiAgICBpZiAoIWl0ZW1zLmxlbmd0aCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgZ3NhcCA9IHdpbmRvdy5nc2FwO1xuICAgIHRsID0gZ3NhcC50aW1lbGluZSh7IHBhdXNlZDogdHJ1ZSwgZGVmYXVsdHM6IHsgZHVyYXRpb246IDAuMzUsIGVhc2U6ICdwb3dlcjIub3V0JyB9IH0pO1xuICAgIC8vIFN0YWdnZXIgSU4gdGltZWxpbmU7IHJldmVyc2luZyB3aWxsIGNyZWF0ZSB0aGUgT1VUXG4gICAgdGwuZnJvbVRvKGl0ZW1zLCB7IGF1dG9BbHBoYTogMCwgeTogMTYgfSwgeyBhdXRvQWxwaGE6IDEsIHk6IDAsIHN0YWdnZXI6IDAuMDYsIGR1cmF0aW9uOiAwLjM1LCBlYXNlOiAncG93ZXIyLm91dCcsIGltbWVkaWF0ZVJlbmRlcjogZmFsc2UgfSwgMCk7XG4gICAgdGxTdG9yZS5zZXQocGFuZWwsIHRsKTtcbiAgICByZXR1cm4gdGw7XG4gIH1cblxuICAvLyBGaXJlIEdTQVAgVUkgKFdlYmZsb3cpIGl0ZW0gYW5pbWF0aW9ucyB2aWEgQ3VzdG9tRXZlbnRzIHNjb3BlZCB0byB0aGUgcGFuZWwgZWxlbWVudFxuICBmdW5jdGlvbiBlbWl0SXRlbXNBbmltYXRpb24oaXRlbSwgZGlyZWN0aW9uKXsgLy8gZGlyZWN0aW9uOiAnaW4nIHwgJ291dCdcbiAgICBjb25zdCBwYW5lbCA9IHBhbmVsT2YoaXRlbSk7IGlmICghcGFuZWwpIHJldHVybjtcbiAgICBjb25zdCBsZXZlbCA9IGlzTDEoaXRlbSkgPyAxIDogMjtcbiAgICBjb25zdCBuYW1lID0gbGV2ZWwgPT09IDFcbiAgICAgID8gKGRpcmVjdGlvbiA9PT0gJ2luJyA/ICdBQ0NfTDFfSVRFTVNfSU4nIDogJ0FDQ19MMV9JVEVNU19PVVQnKVxuICAgICAgOiAoZGlyZWN0aW9uID09PSAnaW4nID8gJ0FDQ19MMl9JVEVNU19JTicgOiAnQUNDX0wyX0lURU1TX09VVCcpO1xuICAgIGNvbnN0IGl0ZW1zID0gaXRlbXNJblBhbmVsKHBhbmVsKTtcbiAgICBlbWl0KG5hbWUsIHBhbmVsLCB7IGxldmVsLCBkaXJlY3Rpb24sIGl0ZW1zTGVuZ3RoOiBpdGVtcy5sZW5ndGggfSk7XG4gIH1cblxuICAvLyBBUklBIGJvb3RzdHJhcFxuICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2NvcmRlb25fX3RyaWdnZXInKS5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgdC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG4gICAgdC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzAnKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMSwgLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICBjb25zdCBwID0gcGFuZWxPZihpdGVtKTtcbiAgICBpZiAocCl7XG4gICAgICBjb25zdCBwaWQgPSBwLmlkIHx8IGBhY2MtcGFuZWwtJHtpfWA7XG4gICAgICBwLmlkID0gcGlkO1xuICAgICAgdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCBwaWQpO1xuICAgICAgdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGV4cGFuZChwKXtcbiAgICBwLmNsYXNzTGlzdC5hZGQoJ2lzLWFjdGl2ZScpO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gcC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXtcbiAgICAgICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuJztcbiAgICAgIH1cbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKHApe1xuICAgIGNvbnN0IGggPSBwLnN0eWxlLm1heEhlaWdodCA9PT0gJ25vbmUnID8gcC5zY3JvbGxIZWlnaHQgOiBwYXJzZUZsb2F0KHAuc3R5bGUubWF4SGVpZ2h0IHx8IDApO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gKGggfHwgcC5zY3JvbGxIZWlnaHQpICsgJ3B4JztcbiAgICBwLm9mZnNldEhlaWdodDsgLy8gcmVmbG93XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY2xvc2luZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnO1xuICAgICAgcC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1hY3RpdmUnKTtcbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlU2libGluZ3MoaXRlbSl7XG4gICAgY29uc3QgZ3JvdXAgPSBncm91cE9mKGl0ZW0pOyBpZiAoIWdyb3VwKSByZXR1cm47XG4gICAgY29uc3Qgd2FudCA9IGlzTDEoaXRlbSkgPyAnYWNjb3JkZW9uLWl0ZW0tLWxldmVsMScgOiAnYWNjb3JkZW9uLWl0ZW0tLWxldmVsMic7XG4gICAgQXJyYXkuZnJvbShncm91cC5jaGlsZHJlbikuZm9yRWFjaChzaWIgPT4ge1xuICAgICAgaWYgKHNpYiA9PT0gaXRlbSB8fCAhc2liLmNsYXNzTGlzdD8uY29udGFpbnMod2FudCkpIHJldHVybjtcbiAgICAgIGNvbnN0IHAgPSBwYW5lbE9mKHNpYik7XG4gICAgICBpZiAocCAmJiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicgfHwgcC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpKXtcbiAgICAgICAgaWYgKGNhbklubGluZUdzYXApIHtcbiAgICAgICAgICBjb25zdCB0bCA9IGdldFRpbWVsaW5lKHApOyB0bCAmJiB0bC50aW1lKHRsLmR1cmF0aW9uKCkpLnJldmVyc2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbWl0SXRlbXNBbmltYXRpb24oc2liLCAnb3V0Jyk7IC8vIGFuaW1hdGUgaXRlbXMgb3V0IGluIHRoZSBjbG9zaW5nIHNpYmxpbmdcbiAgICAgICAgfVxuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgdHJpZyA9IHNpYi5xdWVyeVNlbGVjdG9yKCcuYWNjb3JkZW9uX190cmlnZ2VyJyk7XG4gICAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX0NMT1NFJyA6ICdBQ0NfTDJfQ0xPU0UnLCBzaWIsIHsgc291cmNlOiAnc2libGluZycgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldEFsbEwyKCl7XG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMiAuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIGlmIChjYW5JbmxpbmVHc2FwKSB7IGNvbnN0IHRsID0gZ2V0VGltZWxpbmUocCk7IHRsICYmIHRsLnRpbWUodGwuZHVyYXRpb24oKSkucmV2ZXJzZSgpOyB9XG4gICAgICAgIGNvbGxhcHNlKHApO1xuICAgICAgICBjb25zdCBpdCA9IHAuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICAgICAgaXQ/LnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKT8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgIGVtaXQoJ0FDQ19MMl9DTE9TRScsIGl0LCB7IHNvdXJjZTogJ3Jlc2V0LWFsbCcgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoaXRlbSl7XG4gICAgY29uc3QgcCA9IHBhbmVsT2YoaXRlbSk7IGlmICghcCkgcmV0dXJuO1xuICAgIGNvbnN0IHRyaWcgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKTtcbiAgICBjb25zdCBvcGVuaW5nID0gIShwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyk7XG4gICAgY2xvc2VTaWJsaW5ncyhpdGVtKTtcbiAgICBpZiAob3BlbmluZyAmJiBpc0wxKGl0ZW0pKSByZXNldEFsbEwyKCk7XG5cbiAgICBpZiAob3BlbmluZyl7XG4gICAgICBleHBhbmQocCk7IHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICBpZiAoY2FuSW5saW5lR3NhcCkgeyBjb25zdCB0bCA9IGdldFRpbWVsaW5lKHApOyB0bCAmJiB0bC50aW1lKDApLnBsYXkoKTsgfVxuICAgICAgZWxzZSB7IGVtaXRJdGVtc0FuaW1hdGlvbihpdGVtLCAnaW4nKTsgfVxuICAgICAgZW1pdChpc0wxKGl0ZW0pID8gJ0FDQ19MMV9PUEVOJyA6ICdBQ0NfTDJfT1BFTicsIGl0ZW0sIHsgb3BlbmluZzogdHJ1ZSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNhbklubGluZUdzYXApIHsgY29uc3QgdGwgPSBnZXRUaW1lbGluZShwKTsgdGwgJiYgdGwudGltZSgodGwuZHVyYXRpb24gJiYgdGwuZHVyYXRpb24oKSkgfHwgMCkucmV2ZXJzZSgpOyB9XG4gICAgICBlbHNlIHsgZW1pdEl0ZW1zQW5pbWF0aW9uKGl0ZW0sICdvdXQnKTsgfVxuICAgICAgY29sbGFwc2UocCk7IHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgaWYgKGlzTDEoaXRlbSkpIHJlc2V0QWxsTDIoKTtcbiAgICAgIGVtaXQoaXNMMShpdGVtKSA/ICdBQ0NfTDFfQ0xPU0UnIDogJ0FDQ19MMl9DTE9TRScsIGl0ZW0sIHsgb3BlbmluZzogZmFsc2UgfSk7XG4gICAgfVxuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdqcy1wcmVwJyk7XG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fbGlzdCcpLmZvckVhY2gocCA9PiB7IHAuc3R5bGUubWF4SGVpZ2h0ID0gJzBweCc7IHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnOyB9KTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnanMtcHJlcCcpKTtcblxuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2NvcmRlb25fX3RyaWdnZXInKTsgaWYgKCF0IHx8ICFyb290LmNvbnRhaW5zKHQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2NvcmRlb24taXRlbS0tbGV2ZWwxLCAuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMicpO1xuICAgIGl0ZW0gJiYgdG9nZ2xlKGl0ZW0pO1xuICB9KTtcbiAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2NvcmRlb25fX3RyaWdnZXInKTsgaWYgKCF0IHx8ICFyb290LmNvbnRhaW5zKHQpKSByZXR1cm47XG4gICAgaWYgKGUua2V5ICE9PSAnRW50ZXInICYmIGUua2V5ICE9PSAnICcpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDEsIC5hY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuXG4gIGNvbnN0IHJvID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgIGVudHJpZXMuZm9yRWFjaCgoeyB0YXJnZXQ6IHAgfSkgPT4ge1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nKXsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7IH1cbiAgICAgIGVsc2UgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXsgcC5zdHlsZS5tYXhIZWlnaHQgPSBwLnNjcm9sbEhlaWdodCArICdweCc7IH1cbiAgICB9KTtcbiAgfSk7XG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fbGlzdCcpLmZvckVhY2gocCA9PiByby5vYnNlcnZlKHApKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBTY3JvbGwgTG9jayAoSHlicmlkLCBpT1Mtc2FmZSlcbiAqICBQdXJwb3NlOiBSZWxpYWJsZSBwYWdlIHNjcm9sbCBsb2NraW5nIHdpdGggZXhhY3QgcmVzdG9yZVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxubGV0IGxvY2tzID0gMDtcbmxldCBzYXZlZFkgPSAwO1xubGV0IHByZXZTY3JvbGxCZWhhdmlvciA9ICcnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9ja1Njcm9sbCgpe1xuICBpZiAobG9ja3MrKykgcmV0dXJuO1xuICBjb25zdCBkZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgcHJldlNjcm9sbEJlaGF2aW9yID0gZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3I7XG4gIGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nO1xuICBzYXZlZFkgPSB3aW5kb3cuc2Nyb2xsWSB8fCBkZS5zY3JvbGxUb3AgfHwgMDtcblxuICAvLyBGaXhlZC1ib2R5ICsgbW9kYWwtb3BlbiBjbGFzcyBmb3IgQ1NTIGhvb2tzXG4gIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuYm9keS5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgIHRvcDogYC0ke3NhdmVkWX1weGAsXG4gICAgbGVmdDogJzAnLFxuICAgIHJpZ2h0OiAnMCcsXG4gICAgd2lkdGg6ICcxMDAlJyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgb3ZlcnNjcm9sbEJlaGF2aW9yOiAnbm9uZSdcbiAgfSk7XG4gIHRyeSB7IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbW9kYWwtb3BlbicpOyB9IGNhdGNoIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmxvY2tTY3JvbGwoeyBkZWxheU1zID0gMCB9ID0ge30pe1xuICBjb25zdCBydW4gPSAoKSA9PiB7XG4gICAgaWYgKC0tbG9ja3MgPiAwKSByZXR1cm47XG4gICAgY29uc3QgZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgT2JqZWN0LmFzc2lnbihkb2N1bWVudC5ib2R5LnN0eWxlLCB7XG4gICAgICBwb3NpdGlvbjogJycsIHRvcDogJycsIGxlZnQ6ICcnLCByaWdodDogJycsIHdpZHRoOiAnJywgb3ZlcmZsb3c6ICcnLCBvdmVyc2Nyb2xsQmVoYXZpb3I6ICcnXG4gICAgfSk7XG4gICAgdHJ5IHsgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1vcGVuJyk7IH0gY2F0Y2gge31cbiAgICBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IHByZXZTY3JvbGxCZWhhdmlvciB8fCAnJztcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgc2F2ZWRZKTtcbiAgfTtcbiAgZGVsYXlNcyA/IHNldFRpbWVvdXQocnVuLCBkZWxheU1zKSA6IHJ1bigpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFZpbWVvIEhlbHBlclxuICogIFB1cnBvc2U6IE1vdW50L3JlcGxhY2UgVmltZW8gaWZyYW1lIHdpdGggcHJpdmFjeSBvcHRpb25zXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5jb25zb2xlLmxvZygnW1ZJTUVPXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmZ1bmN0aW9uIHBhcnNlVmltZW9JZChpbnB1dCl7XG4gIGlmICghaW5wdXQpIHJldHVybiAnJztcbiAgY29uc3Qgc3RyID0gU3RyaW5nKGlucHV0KS50cmltKCk7XG4gIC8vIEFjY2VwdCBiYXJlIElEc1xuICBpZiAoL15cXGQrJC8udGVzdChzdHIpKSByZXR1cm4gc3RyO1xuICAvLyBFeHRyYWN0IGZyb20ga25vd24gVVJMIGZvcm1zXG4gIHRyeSB7XG4gICAgY29uc3QgdSA9IG5ldyBVUkwoc3RyLCAnaHR0cHM6Ly9leGFtcGxlLmNvbScpO1xuICAgIGNvbnN0IGhvc3QgPSB1Lmhvc3RuYW1lIHx8ICcnO1xuICAgIGlmIChob3N0LmluY2x1ZGVzKCd2aW1lby5jb20nKSl7XG4gICAgICAvLyAvdmlkZW8ve2lkfSBvciAve2lkfVxuICAgICAgY29uc3QgcGFydHMgPSB1LnBhdGhuYW1lLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pO1xuICAgICAgY29uc3QgbGFzdCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdIHx8ICcnO1xuICAgICAgY29uc3QgaWQgPSBsYXN0Lm1hdGNoKC9cXGQrLyk/LlswXSB8fCAnJztcbiAgICAgIHJldHVybiBpZCB8fCAnJztcbiAgICB9XG4gIH0gY2F0Y2gge31cbiAgcmV0dXJuICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbW91bnRWaW1lbyhjb250YWluZXIsIGlucHV0SWQsIHBhcmFtcyA9IHt9KXtcbiAgaWYgKCFjb250YWluZXIpIHJldHVybjtcbiAgY29uc3QgaWQgPSBwYXJzZVZpbWVvSWQoaW5wdXRJZCk7XG4gIGlmICghaWQpeyBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7IHJldHVybjsgfVxuICBjb25zdCBxdWVyeSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoeyBkbnQ6IDEsIC4uLnBhcmFtcyB9KS50b1N0cmluZygpO1xuICBjb25zdCBzcmMgPSBgaHR0cHM6Ly9wbGF5ZXIudmltZW8uY29tL3ZpZGVvLyR7aWR9PyR7cXVlcnl9YDtcbiAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gIGlmcmFtZS5zcmMgPSBzcmM7XG4gIC8vIE1pbmltYWwgYWxsb3ctbGlzdCB0byByZWR1Y2UgcGVybWlzc2lvbiBwb2xpY3kgd2FybmluZ3MgaW4gRGVzaWduZXJcbiAgaWZyYW1lLmFsbG93ID0gJ2F1dG9wbGF5OyBmdWxsc2NyZWVuOyBwaWN0dXJlLWluLXBpY3R1cmU7IGVuY3J5cHRlZC1tZWRpYSc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lYm9yZGVyJywgJzAnKTtcbiAgaWZyYW1lLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IExpZ2h0Ym94IE1vZHVsZVxuICogIFB1cnBvc2U6IEZvY3VzIHRyYXAsIG91dHNpZGUtY2xpY2ssIGluZXJ0L2FyaWEgZmFsbGJhY2ssIHJlLWVudHJhbmN5XG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBlbWl0IH0gZnJvbSAnLi4vY29yZS9ldmVudHMuanMnO1xuaW1wb3J0IHsgbG9ja1Njcm9sbCwgdW5sb2NrU2Nyb2xsIH0gZnJvbSAnLi4vY29yZS9zY3JvbGxsb2NrLmpzJztcbmltcG9ydCB7IG1vdW50VmltZW8gfSBmcm9tICcuL3ZpbWVvLmpzJztcbmNvbnNvbGUubG9nKCdbTElHSFRCT1hdIG1vZHVsZSBsb2FkZWQnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRMaWdodGJveCh7IHJvb3QgPSAnI3Byb2plY3QtbGlnaHRib3gnLCBjbG9zZURlbGF5TXMgPSAxMDAwIH0gPSB7fSl7XG4gIGNvbnN0IGxiID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290KTtcbiAgaWYgKCFsYil7IGNvbnNvbGUubG9nKCdbTElHSFRCT1hdIG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICAvLyBFbnN1cmUgYmFzZWxpbmUgZGlhbG9nIGExMXkgYXR0cmlidXRlc1xuICBsYi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCBsYi5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSB8fCAnZGlhbG9nJyk7XG4gIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1tb2RhbCcsIGxiLmdldEF0dHJpYnV0ZSgnYXJpYS1tb2RhbCcpIHx8ICd0cnVlJyk7XG4gIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykgfHwgJ3RydWUnKTtcblxuICBjb25zdCBpbm5lciA9IGxiLnF1ZXJ5U2VsZWN0b3IoJy5wcm9qZWN0LWxpZ2h0Ym94X19pbm5lcicpO1xuICBjb25zdCB2aWRlb0FyZWEgPSBsYi5xdWVyeVNlbGVjdG9yKCcudmlkZW8tYXJlYScpO1xuICBjb25zdCBzbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc2xpZGUnKTtcbiAgY29uc3QgcHJlZmVyc1JlZHVjZWQgPSBtYXRjaE1lZGlhKCcocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKScpLm1hdGNoZXM7XG5cbiAgbGV0IG9wZW5HdWFyZCA9IGZhbHNlO1xuICBsZXQgbGFzdEZvY3VzID0gbnVsbDtcblxuICBmdW5jdGlvbiBzZXRQYWdlSW5lcnQob24pe1xuICAgIGNvbnN0IHNpYmxpbmdzID0gQXJyYXkuZnJvbShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKS5maWx0ZXIobiA9PiBuICE9PSBsYik7XG4gICAgc2libGluZ3MuZm9yRWFjaChuID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICgnaW5lcnQnIGluIG4pIG4uaW5lcnQgPSAhIW9uO1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgaWYgKG9uKSBuLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgZWxzZSBuLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYXBGb2N1cyhlKXtcbiAgICBpZiAoZS5rZXkgIT09ICdUYWInKSByZXR1cm47XG4gICAgY29uc3QgZm9jdXNhYmxlcyA9IGxiLnF1ZXJ5U2VsZWN0b3JBbGwoW1xuICAgICAgJ2FbaHJlZl0nLCdidXR0b24nLCdpbnB1dCcsJ3NlbGVjdCcsJ3RleHRhcmVhJyxcbiAgICAgICdbdGFiaW5kZXhdOm5vdChbdGFiaW5kZXg9XCItMVwiXSknXG4gICAgXS5qb2luKCcsJykpO1xuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5mcm9tKGZvY3VzYWJsZXMpLmZpbHRlcihlbCA9PiAhZWwuaGFzQXR0cmlidXRlKCdkaXNhYmxlZCcpICYmICFlbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCl7IGUucHJldmVudERlZmF1bHQoKTsgKGlubmVyIHx8IGxiKS5mb2N1cygpOyByZXR1cm47IH1cbiAgICBjb25zdCBmaXJzdCA9IGxpc3RbMF07XG4gICAgY29uc3QgbGFzdCA9IGxpc3RbbGlzdC5sZW5ndGggLSAxXTtcbiAgICBpZiAoZS5zaGlmdEtleSAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBmaXJzdCl7IGUucHJldmVudERlZmF1bHQoKTsgbGFzdC5mb2N1cygpOyB9XG4gICAgZWxzZSBpZiAoIWUuc2hpZnRLZXkgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gbGFzdCl7IGUucHJldmVudERlZmF1bHQoKTsgZmlyc3QuZm9jdXMoKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlbkZyb21TbGlkZShzbGlkZSl7XG4gICAgaWYgKG9wZW5HdWFyZCkgcmV0dXJuO1xuICAgIG9wZW5HdWFyZCA9IHRydWU7XG4gICAgbGFzdEZvY3VzID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA6IG51bGw7XG5cbiAgICBjb25zdCB2aWRlbyA9IHNsaWRlPy5kYXRhc2V0Py52aWRlbyB8fCAnJztcbiAgICBjb25zdCB0aXRsZSA9IHNsaWRlPy5kYXRhc2V0Py50aXRsZSB8fCAnJztcbiAgICBjb25zdCB0ZXh0ICA9IHNsaWRlPy5kYXRhc2V0Py50ZXh0ICB8fCAnJztcblxuICAgIGNvbnN0IGlzRGVzaWduZXIgPSAvXFwud2ViZmxvd1xcLmNvbSQvLnRlc3QobG9jYXRpb24uaG9zdG5hbWUpIHx8IC9jYW52YXNcXC53ZWJmbG93XFwuY29tJC8udGVzdChsb2NhdGlvbi5ob3N0bmFtZSk7XG4gICAgY29uc3QgYXV0b3BsYXkgPSBpc0Rlc2lnbmVyID8gMCA6IDE7IC8vIGF2b2lkIGF1dG9wbGF5IHdhcm5pbmdzIGluc2lkZSBXZWJmbG93IERlc2lnbmVyXG4gICAgaWYgKHZpZGVvQXJlYSkgbW91bnRWaW1lbyh2aWRlb0FyZWEsIHZpZGVvLCB7IGF1dG9wbGF5LCBtdXRlZDogMSwgY29udHJvbHM6IDAsIGJhY2tncm91bmQ6IDEsIHBsYXlzaW5saW5lOiAxLCBkbnQ6IDEgfSk7XG4gICAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgIGxiLnNldEF0dHJpYnV0ZSgnZGF0YS1vcGVuJywgJ3RydWUnKTtcbiAgICBzZXRQYWdlSW5lcnQodHJ1ZSk7XG4gICAgbG9ja1Njcm9sbCgpO1xuXG4gICAgbGIuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xuICAgIChpbm5lciB8fCBsYikuZm9jdXMoKTtcblxuICAgIGVtaXQoJ0xJR0hUQk9YX09QRU4nLCBsYiwgeyB2aWRlbywgdGl0bGUsIHRleHQgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXF1ZXN0Q2xvc2UoKXtcbiAgICBpZiAoIW9wZW5HdWFyZCkgcmV0dXJuO1xuICAgIGVtaXQoJ0xJR0hUQk9YX0NMT1NFJywgbGIpO1xuICAgIGlmIChwcmVmZXJzUmVkdWNlZCl7XG4gICAgICB1bmxvY2tTY3JvbGwoeyBkZWxheU1zOiAwIH0pO1xuICAgICAgZW1pdCgnTElHSFRCT1hfQ0xPU0VEX0RPTkUnLCBsYik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVubG9ja1Njcm9sbCh7IGRlbGF5TXM6IGNsb3NlRGVsYXlNcyB9KTtcbiAgICB9XG4gICAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgbGIucmVtb3ZlQXR0cmlidXRlKCdkYXRhLW9wZW4nKTtcbiAgICBzZXRQYWdlSW5lcnQoZmFsc2UpO1xuICAgIGlmICh2aWRlb0FyZWEpIHZpZGVvQXJlYS5pbm5lckhUTUwgPSAnJztcbiAgICBpZiAobGFzdEZvY3VzICYmIGRvY3VtZW50LmJvZHkuY29udGFpbnMobGFzdEZvY3VzKSkgbGFzdEZvY3VzLmZvY3VzKCk7XG4gICAgb3Blbkd1YXJkID0gZmFsc2U7XG4gIH1cblxuICBzbGlkZXMuZm9yRWFjaChzbGlkZSA9PiBzbGlkZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IG9wZW5Gcm9tU2xpZGUoc2xpZGUpKSk7XG5cbiAgbGIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICBpZiAoaW5uZXIgJiYgIWUudGFyZ2V0LmNsb3Nlc3QoJy5wcm9qZWN0LWxpZ2h0Ym94X19pbm5lcicpKSByZXF1ZXN0Q2xvc2UoKTtcbiAgICBlbHNlIGlmICghaW5uZXIgJiYgZS50YXJnZXQgPT09IGxiKSByZXF1ZXN0Q2xvc2UoKTtcbiAgfSk7XG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGUgPT4ge1xuICAgIGlmIChsYi5nZXRBdHRyaWJ1dGUoJ2RhdGEtb3BlbicpID09PSAndHJ1ZScpe1xuICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgcmVxdWVzdENsb3NlKCk7XG4gICAgICBpZiAoZS5rZXkgPT09ICdUYWInKSB0cmFwRm9jdXMoZSk7XG4gICAgfVxuICB9KTtcblxuICBsYi5hZGRFdmVudExpc3RlbmVyKCdMSUdIVEJPWF9DTE9TRURfRE9ORScsICgpID0+IHVubG9ja1Njcm9sbCgpKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBXZWJmbG93IFNjcm9sbFRyaWdnZXIgQnJpZGdlXG4gKiAgUHVycG9zZTogVHJpZ2dlciBXZWJmbG93IElYIGludGVyYWN0aW9ucyB2aWEgR1NBUCBTY3JvbGxUcmlnZ2VyXG4gKiAgRGF0ZTogMjAyNS0xMC0zMFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5jb25zb2xlLmxvZygnW1dFQkZMT1ddIG1vZHVsZSBsb2FkZWQnKTtcblxuLyoqXG4gKiBJbml0aWFsaXplIEdTQVAgU2Nyb2xsVHJpZ2dlciBcdTIxOTIgV2ViZmxvdyBJWCBicmlkZ2UuXG4gKlxuICogQmVoYXZpb3I6XG4gKiAgMS4gT24gbG9hZDogZW1pdCBsb2dvLWdyb3cgdG8gYW5pbWF0ZSBsb2dvIGZyb20gc21hbGwgXHUyMTkyIGJpZyAoZW5zdXJlcyBsb2dvIHN0YXJ0cyBpbiBiaWcgc3RhdGUpXG4gKiAgMi4gU2Nyb2xsIGRvd24gcGFzdCBmaXJzdCBzbGlkZTogZW1pdCBsb2dvLXNocmluayAoYmlnIFx1MjE5MiBzbWFsbClcbiAqICAzLiBTdGFydCBzY3JvbGxpbmcgdXAgKG1pZGRsZSBzZWN0aW9uKTogZW1pdCBsb2dvLWdyb3cgaW1tZWRpYXRlbHkgKHNtYWxsIFx1MjE5MiBiaWcpXG4gKiAgNC4gUmVhY2ggbGFzdCBzbGlkZTogZW1pdCBsb2dvLWdyb3cgKHNtYWxsIFx1MjE5MiBiaWcsIGxvZ28gZ3Jvd3MgYXQgYm90dG9tKVxuICogIDUuIFNjcm9sbCB1cCBmcm9tIGxhc3Qgc2xpZGU6IGVtaXQgbG9nby1zaHJpbmsgKGJpZyBcdTIxOTIgc21hbGwpXG4gKiAgNi4gUmV0dXJuIHRvIHRvcDogZW1pdCBsb2dvLXN0YXJ0IChqdW1wIHRvIDBzLCBiYWNrIHRvIGJpZyBzdGF0aWMgc3RhdGUpXG4gKlxuICogUmVxdWlyZW1lbnRzIGluIFdlYmZsb3c6XG4gKiAgLSBsb2dvLXN0YXJ0OiBVc2VzIHRoZSBzYW1lIHRpbWVsaW5lIGFzIGxvZ28tc2hyaW5rLiBDb250cm9sIFx1MjE5MiBKdW1wIHRvIDBzLCB0aGVuIFN0b3AuXG4gKiAgICAgICAgICAgICAgIFVzZWQgd2hlbiByZXR1cm5pbmcgdG8gdG9wIChvbkVudGVyQmFjayk7IHdvcmtzIGJlY2F1c2UgdGltZWxpbmUgaXMgaW5pdGlhbGl6ZWQgYnkgdGhlbi5cbiAqICAgICAgICAgICAgICAgSWYgb21pdHRlZCwgZXZlbnQgaXMgc3RpbGwgZW1pdHRlZCBidXQgc2FmZWx5IGlnbm9yZWQgaWYgbm90IGNvbmZpZ3VyZWQuXG4gKiAgLSBsb2dvLXNocmluazogQ29udHJvbCBcdTIxOTIgUGxheSBmcm9tIHN0YXJ0IChiaWcgXHUyMTkyIHNtYWxsIGFuaW1hdGlvbilcbiAqICAtIGxvZ28tZ3JvdzogQ29udHJvbCBcdTIxOTIgUGxheSBmcm9tIHN0YXJ0IChzbWFsbCBcdTIxOTIgYmlnIGFuaW1hdGlvbilcbiAqICAgICAgICAgICAgICAgVGhpcyBpcyB0cmlnZ2VyZWQgb24gaW5pdGlhbCBwYWdlIGxvYWQgdG8gYW5pbWF0ZSBsb2dvIGZyb20gc21hbGwgXHUyMTkyIGJpZy5cbiAqICAgICAgICAgICAgICAgRW5zdXJlIHlvdXIgbG9nbyBDU1Mgc2hvd3MgaXQgaW4gdGhlIFwic21hbGxcIiBzdGF0ZSBpbml0aWFsbHkgKG1hdGNoaW5nIHRoZSBlbmQgc3RhdGVcbiAqICAgICAgICAgICAgICAgb2Ygc2hyaW5rIG9yIHN0YXJ0IHN0YXRlIG9mIGdyb3cpLCBzbyB0aGUgZ3JvdyBhbmltYXRpb24gaGFzIHNvbWV3aGVyZSB0byBhbmltYXRlIGZyb20uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY3JvbGxlclNlbGVjdG9yPScucGVyc3BlY3RpdmUtd3JhcHBlciddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZHJpdmVyU2VsZWN0b3JdIC0gRGVmYXVsdHMgdG8gZmlyc3QgLnNsaWRlIGluIHNjcm9sbGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW5pdEV2ZW50TmFtZT0nbG9nby1zdGFydCddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2hyaW5rRXZlbnROYW1lPSdsb2dvLXNocmluayddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZ3Jvd0V2ZW50TmFtZT0nbG9nby1ncm93J11cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubWFya2Vycz1mYWxzZV1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMob3B0aW9ucyA9IHt9KXtcbiAgY29uc3Qgc2Nyb2xsZXJTZWxlY3RvciA9IG9wdGlvbnMuc2Nyb2xsZXJTZWxlY3RvciB8fCAnLnBlcnNwZWN0aXZlLXdyYXBwZXInO1xuICBjb25zdCBpbml0RXZlbnROYW1lID0gb3B0aW9ucy5pbml0RXZlbnROYW1lIHx8ICdsb2dvLXN0YXJ0JztcbiAgY29uc3Qgc2hyaW5rRXZlbnROYW1lID0gb3B0aW9ucy5zaHJpbmtFdmVudE5hbWUgfHwgb3B0aW9ucy5wbGF5RXZlbnROYW1lIHx8ICdsb2dvLXNocmluayc7XG4gIGNvbnN0IGdyb3dFdmVudE5hbWUgPSBvcHRpb25zLmdyb3dFdmVudE5hbWUgfHwgJ2xvZ28tZ3Jvdyc7XG4gIGNvbnN0IG1hcmtlcnMgPSAhIW9wdGlvbnMubWFya2VycztcblxuICBmdW5jdGlvbiBvbldpbmRvd0xvYWQoY2Ipe1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7IHNldFRpbWVvdXQoY2IsIDApOyByZXR1cm47IH1cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCB7IG9uY2U6IHRydWUgfSk7XG4gIH1cblxuICBvbldpbmRvd0xvYWQoZnVuY3Rpb24oKXtcbiAgICBjb25zdCBXZWJmbG93ID0gd2luZG93LldlYmZsb3cgfHwgW107XG4gICAgXG4gICAgV2ViZmxvdy5wdXNoKGZ1bmN0aW9uKCl7XG4gICAgICAvLyBHZXQgV2ViZmxvdyBJWCBBUEkgKHRyeSBpeDMgZmlyc3QsIGZhbGxiYWNrIHRvIGl4MilcbiAgICAgIGNvbnN0IHdmSXggPSAod2luZG93LldlYmZsb3cgJiYgd2luZG93LldlYmZsb3cucmVxdWlyZSkgXG4gICAgICAgID8gKHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MycpIHx8IHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MicpKVxuICAgICAgICA6IG51bGw7XG4gICAgICBjb25zdCBTY3JvbGxUcmlnZ2VyID0gd2luZG93LlNjcm9sbFRyaWdnZXI7XG4gICAgICBcbiAgICAgIGlmICghd2ZJeCB8fCAhU2Nyb2xsVHJpZ2dlcikgeyByZXR1cm47IH1cblxuICAgICAgY29uc3Qgc2Nyb2xsZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNjcm9sbGVyU2VsZWN0b3IpO1xuICAgICAgaWYgKCFzY3JvbGxlcikgeyByZXR1cm47IH1cblxuICAgICAgLy8gRmluZCBmaXJzdCAuc2xpZGUgaW5zaWRlIHRoZSBzY3JvbGxlciAoZm9yIHRvcCBkZXRlY3Rpb24pXG4gICAgICBjb25zdCBkcml2ZXIgPSBzY3JvbGxlci5xdWVyeVNlbGVjdG9yKCcuc2xpZGUnKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2xpZGUnKTtcbiAgICAgIGlmICghZHJpdmVyKSB7IFxuICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gRHJpdmVyIHNsaWRlIG5vdCBmb3VuZCcpO1xuICAgICAgICByZXR1cm47IFxuICAgICAgfVxuXG4gICAgICAvLyBGaW5kIGxhc3QgLnNsaWRlIGluc2lkZSB0aGUgc2Nyb2xsZXIgKGZvciBib3R0b20gZGV0ZWN0aW9uKVxuICAgICAgY29uc3Qgc2xpZGVzID0gQXJyYXkuZnJvbShzY3JvbGxlci5xdWVyeVNlbGVjdG9yQWxsKCcuc2xpZGUnKSk7XG4gICAgICBjb25zdCBsYXN0U2xpZGUgPSBzbGlkZXMubGVuZ3RoID4gMCA/IHNsaWRlc1tzbGlkZXMubGVuZ3RoIC0gMV0gOiBudWxsO1xuICAgICAgaWYgKCFsYXN0U2xpZGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbV0VCRkxPV10gTm8gc2xpZGVzIGZvdW5kLCBsYXN0IHNsaWRlIGRldGVjdGlvbiBkaXNhYmxlZCcpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIFNldHVwIGNvbXBsZXRlOicsIHsgXG4gICAgICAgIHNjcm9sbGVyOiAhIXNjcm9sbGVyLCBcbiAgICAgICAgZHJpdmVyOiAhIWRyaXZlcixcbiAgICAgICAgbGFzdFNsaWRlOiAhIWxhc3RTbGlkZSxcbiAgICAgICAgdG90YWxTbGlkZXM6IHNsaWRlcy5sZW5ndGgsXG4gICAgICAgIHdmSXg6ICEhd2ZJeCwgXG4gICAgICAgIFNjcm9sbFRyaWdnZXI6ICEhU2Nyb2xsVHJpZ2dlcixcbiAgICAgICAgaW5pdEV2ZW50OiBpbml0RXZlbnROYW1lLFxuICAgICAgICBzaHJpbmtFdmVudDogc2hyaW5rRXZlbnROYW1lLFxuICAgICAgICBncm93RXZlbnQ6IGdyb3dFdmVudE5hbWVcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUcmFjayBzY3JvbGwgc3RhdGU6IGFyZSB3ZSBiZWxvdyB0aGUgdG9wIHpvbmU/IGRpZCB3ZSBzaHJpbmsgYWxyZWFkeT8gZGlkIHdlIGdyb3cgYWxyZWFkeT9cbiAgICAgIC8vIEFsc28gdHJhY2sgbGFzdCBzbGlkZSBzdGF0ZVxuICAgICAgbGV0IGlzQmVsb3dUb3AgPSBmYWxzZTtcbiAgICAgIGxldCBoYXNTaHJ1bmsgPSBmYWxzZTtcbiAgICAgIGxldCBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgbGV0IGlzQXRMYXN0U2xpZGUgPSBmYWxzZTtcbiAgICAgIGxldCBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuXG4gICAgICAvLyBNYWluIFNjcm9sbFRyaWdnZXI6IHdhdGNoZXMgd2hlbiBmaXJzdCBzbGlkZSBsZWF2ZXMvZW50ZXJzIHRvcCB6b25lXG4gICAgICBTY3JvbGxUcmlnZ2VyLmNyZWF0ZSh7XG4gICAgICAgIHRyaWdnZXI6IGRyaXZlcixcbiAgICAgICAgc2Nyb2xsZXI6IHNjcm9sbGVyLFxuICAgICAgICBzdGFydDogJ3RvcCB0b3AnLFxuICAgICAgICBlbmQ6ICd0b3AgLTEwJScsIC8vIFNob3J0IHJhbmdlIGZvciBpbW1lZGlhdGUgdHJpZ2dlclxuICAgICAgICBtYXJrZXJzOiBtYXJrZXJzLFxuICAgICAgICBcbiAgICAgICAgb25MZWF2ZTogKCkgPT4ge1xuICAgICAgICAgIC8vIFNjcm9sbGVkIERPV04gcGFzdCB0b3AgXHUyMTkyIHNocmluayBvbmNlIChvbmx5IHdoZW4gbGVhdmluZywgbm90IHdoZW4gYWxyZWFkeSBiZWxvdylcbiAgICAgICAgICAvLyBUaGlzIHNob3VsZCBvbmx5IGZpcmUgd2hlbiBjcm9zc2luZyBmcm9tIFwiYXQgdG9wXCIgdG8gXCJiZWxvdyB0b3BcIlxuICAgICAgICAgIGlmICghaXNCZWxvd1RvcCAmJiAhaGFzU2hydW5rKSB7XG4gICAgICAgICAgICBpc0JlbG93VG9wID0gdHJ1ZTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBzaHJpbmsgKHNjcm9sbGVkIGRvd24gcGFzdCBmaXJzdCBzbGlkZSk6Jywgc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KHNocmlua0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIGhhc1NocnVuayA9IHRydWU7XG4gICAgICAgICAgICAgIGhhc0dyb3duID0gZmFsc2U7IC8vIFJlc2V0IGdyb3cgZmxhZyB3aGVuIHdlIHNocmlua1xuICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXG4gICAgICAgIG9uRW50ZXJCYWNrOiAoKSA9PiB7XG4gICAgICAgICAgLy8gU2Nyb2xsZWQgYmFjayB1cCB0byB0b3AgXHUyMTkyIGp1bXAgc2hyaW5rIHRpbWVsaW5lIHRvIDBzIChiaWcgc3RhdGUpIGFuZCBzdG9wXG4gICAgICAgICAgaXNCZWxvd1RvcCA9IGZhbHNlO1xuICAgICAgICAgIGhhc1NocnVuayA9IGZhbHNlO1xuICAgICAgICAgIGhhc0dyb3duID0gZmFsc2U7XG4gICAgICAgICAgaXNBdExhc3RTbGlkZSA9IGZhbHNlO1xuICAgICAgICAgIGhhc0dyb3duQXRMYXN0ID0gZmFsc2U7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBzdGFydCAocmV0dXJuIHRvIHRvcCk6JywgaW5pdEV2ZW50TmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIHdmSXggYXZhaWxhYmxlOicsICEhd2ZJeCwgJ2VtaXQgYXZhaWxhYmxlOicsIHR5cGVvZiB3Zkl4Py5lbWl0KTtcbiAgICAgICAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KGluaXRFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIHJldHVybi10by10b3AgZXZlbnQgZW1pdHRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tXRUJGTE9XXSBDYW5ub3QgZW1pdCByZXR1cm4tdG8tdG9wOiB3Zkl4LmVtaXQgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gRXJyb3IgZW1pdHRpbmcgcmV0dXJuLXRvLXRvcDonLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIExhc3Qgc2xpZGUgU2Nyb2xsVHJpZ2dlcjogd2F0Y2hlcyB3aGVuIGxhc3Qgc2xpZGUgZW50ZXJzL2xlYXZlcyB2aWV3cG9ydFxuICAgICAgaWYgKGxhc3RTbGlkZSkge1xuICAgICAgICBTY3JvbGxUcmlnZ2VyLmNyZWF0ZSh7XG4gICAgICAgICAgdHJpZ2dlcjogbGFzdFNsaWRlLFxuICAgICAgICAgIHNjcm9sbGVyOiBzY3JvbGxlcixcbiAgICAgICAgICBzdGFydDogJ3RvcCBib3R0b20nLCAvLyBMYXN0IHNsaWRlIGVudGVycyBmcm9tIGJvdHRvbSBvZiB2aWV3cG9ydFxuICAgICAgICAgIGVuZDogJ2JvdHRvbSB0b3AnLCAvLyBMYXN0IHNsaWRlIGxlYXZlcyB0b3Agb2Ygdmlld3BvcnRcbiAgICAgICAgICBtYXJrZXJzOiBtYXJrZXJzLFxuICAgICAgICAgIFxuICAgICAgICAgIG9uRW50ZXI6ICgpID0+IHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGVkIERPV04gdG8gbGFzdCBzbGlkZSBcdTIxOTIgZ3JvdyBvbmNlIChvbmx5IHdoZW4gZW50ZXJpbmcsIG5vdCB3aGVuIGFscmVhZHkgdGhlcmUpXG4gICAgICAgICAgICBpZiAoIWlzQXRMYXN0U2xpZGUgJiYgIWhhc0dyb3duQXRMYXN0KSB7XG4gICAgICAgICAgICAgIGlzQXRMYXN0U2xpZGUgPSB0cnVlO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBncm93IChyZWFjaGVkIGxhc3Qgc2xpZGUpOicsIGdyb3dFdmVudE5hbWUpO1xuICAgICAgICAgICAgICAgIHdmSXguZW1pdChncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gUmVzZXQgbWlkZGxlIHNlY3Rpb24gZmxhZ3Mgc2luY2Ugd2UncmUgYXQgdGhlIGxhc3Qgc2xpZGVcbiAgICAgICAgICAgICAgICBoYXNTaHJ1bmsgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBcbiAgICAgICAgICBvbkxlYXZlQmFjazogKCkgPT4ge1xuICAgICAgICAgICAgLy8gU2Nyb2xsZWQgVVAgZnJvbSBsYXN0IHNsaWRlIChsZWF2aW5nIGJhY2t3YXJkKSBcdTIxOTIgc2hyaW5rIG9uY2VcbiAgICAgICAgICAgIGlmIChpc0F0TGFzdFNsaWRlICYmIGhhc0dyb3duQXRMYXN0KSB7XG4gICAgICAgICAgICAgIGlzQXRMYXN0U2xpZGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc2hyaW5rIChzY3JvbGxpbmcgdXAgZnJvbSBsYXN0IHNsaWRlKTonLCBzaHJpbmtFdmVudE5hbWUpO1xuICAgICAgICAgICAgICAgIHdmSXguZW1pdChzaHJpbmtFdmVudE5hbWUpO1xuICAgICAgICAgICAgICAgIGhhc0dyb3duQXRMYXN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaGFzU2hydW5rID0gdHJ1ZTsgLy8gV2UncmUgbm93IGluIHRoZSBtaWRkbGUgc2VjdGlvbiB3aXRoIGxvZ28gc21hbGxcbiAgICAgICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2ltcGxlIHNjcm9sbCBkaXJlY3Rpb24gd2F0Y2hlciBmb3IgaW1tZWRpYXRlIGdyb3cgb24gdXB3YXJkIHNjcm9sbFxuICAgICAgLy8gT25seSB0cmlnZ2VycyBncm93IHdoZW46XG4gICAgICAvLyAtIFdlJ3JlIGJlbG93IHRoZSB0b3Agem9uZSAoaXNCZWxvd1RvcClcbiAgICAgIC8vIC0gV2UndmUgc2hydW5rIChoYXNTaHJ1bmspXG4gICAgICAvLyAtIFdlJ3JlIHNjcm9sbGluZyB1cCAoZGlyZWN0aW9uID09PSAtMSlcbiAgICAgIC8vIC0gV2UganVzdCBzdGFydGVkIHNjcm9sbGluZyB1cCAobGFzdERpcmVjdGlvbiAhPT0gLTEsIG1lYW5pbmcgd2Ugd2VyZW4ndCBhbHJlYWR5IHNjcm9sbGluZyB1cClcbiAgICAgIC8vIC0gV2UgaGF2ZW4ndCBhbHJlYWR5IGdyb3duIChoYXNHcm93bilcbiAgICAgIGxldCBsYXN0U2Nyb2xsVG9wID0gc2Nyb2xsZXIuc2Nyb2xsVG9wO1xuICAgICAgbGV0IGxhc3REaXJlY3Rpb24gPSAwOyAvLyAtMSA9IHVwLCAxID0gZG93biwgMCA9IHVua25vd25cbiAgICAgIFxuICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICBzY3JvbGxlcjogc2Nyb2xsZXIsXG4gICAgICAgIHN0YXJ0OiAwLFxuICAgICAgICBlbmQ6ICgpID0+IFNjcm9sbFRyaWdnZXIubWF4U2Nyb2xsKHNjcm9sbGVyKSxcbiAgICAgICAgb25VcGRhdGU6IChzZWxmKSA9PiB7XG4gICAgICAgICAgY29uc3QgY3VycmVudFNjcm9sbFRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcDtcbiAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSBjdXJyZW50U2Nyb2xsVG9wID4gbGFzdFNjcm9sbFRvcCA/IDEgOiBjdXJyZW50U2Nyb2xsVG9wIDwgbGFzdFNjcm9sbFRvcCA/IC0xIDogbGFzdERpcmVjdGlvbjtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBHcm93IG9ubHkgd2hlbiBzY3JvbGxpbmcgdXAgZnJvbSBiZWxvdyB0b3AgKG1pZGRsZSBzZWN0aW9uKSwgYW5kIHdlJ3ZlIHNocnVuaywgYW5kIHdlIGhhdmVuJ3QgZ3Jvd24geWV0XG4gICAgICAgICAgLy8gRG9uJ3QgdHJpZ2dlciBpZiB3ZSdyZSBhdCB0aGUgbGFzdCBzbGlkZSAodGhhdCdzIGhhbmRsZWQgc2VwYXJhdGVseSlcbiAgICAgICAgICBpZiAoaXNCZWxvd1RvcCAmJiAhaXNBdExhc3RTbGlkZSAmJiBoYXNTaHJ1bmsgJiYgIWhhc0dyb3duICYmIGRpcmVjdGlvbiA9PT0gLTEgJiYgbGFzdERpcmVjdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBncm93IChzY3JvbGwgdXAgaW4gbWlkZGxlIHNlY3Rpb24pOicsIGdyb3dFdmVudE5hbWUpO1xuICAgICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIGhhc0dyb3duID0gdHJ1ZTsgLy8gU2V0IGZsYWcgc28gd2UgZG9uJ3QgZ3JvdyBhZ2FpbiB1bnRpbCB3ZSBzaHJpbmtcbiAgICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7IC8vIFJlc2V0IHNocmluayBmbGFnIGFmdGVyIGdyb3dpbmdcbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gUmVzZXQgZ3JvdyBmbGFnIGlmIHdlIHN0YXJ0IHNjcm9sbGluZyBkb3duIGFnYWluIChidXQgb25seSBpZiB3ZSdyZSBzdGlsbCBiZWxvdyB0b3AgYW5kIG5vdCBhdCBsYXN0IHNsaWRlKVxuICAgICAgICAgIGlmIChpc0JlbG93VG9wICYmICFpc0F0TGFzdFNsaWRlICYmIGhhc0dyb3duICYmIGRpcmVjdGlvbiA9PT0gMSAmJiBsYXN0RGlyZWN0aW9uICE9PSAxKSB7XG4gICAgICAgICAgICAvLyBVc2VyIHN0YXJ0ZWQgc2Nyb2xsaW5nIGRvd24gYWdhaW4gLSByZXNldCBzbyB3ZSBjYW4gc2hyaW5rIGFnYWluXG4gICAgICAgICAgICBoYXNTaHJ1bmsgPSBmYWxzZTtcbiAgICAgICAgICAgIGhhc0dyb3duID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIFJlc2V0IGZsYWdzIC0gcmVhZHkgdG8gc2hyaW5rIGFnYWluJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGxhc3RTY3JvbGxUb3AgPSBjdXJyZW50U2Nyb2xsVG9wO1xuICAgICAgICAgIGxhc3REaXJlY3Rpb24gPSBkaXJlY3Rpb247XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIFNjcm9sbFRyaWdnZXIgaW5pdGlhbGl6ZWQnKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IHRoYXQgYWxsIGV2ZW50cyBleGlzdCBpbiBXZWJmbG93IGJ5IGNoZWNraW5nIGlmIGVtaXQgc3VjY2VlZHNcbiAgICAgIC8vIE5vdGU6IFdlYmZsb3cgZW1pdCBkb2Vzbid0IHRocm93IGVycm9ycyBmb3IgbWlzc2luZyBldmVudHMsIGJ1dCB3ZSBjYW4gbG9nIGF0dGVtcHRzXG4gICAgICBjb25zdCB2ZXJpZnlBbmRFbWl0ID0gKGV2ZW50TmFtZSwgZGVzY3JpcHRpb24pID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICR7ZGVzY3JpcHRpb259OmAsIGV2ZW50TmFtZSk7XG4gICAgICAgICAgaWYgKHdmSXggJiYgdHlwZW9mIHdmSXguZW1pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgd2ZJeC5lbWl0KGV2ZW50TmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddIFx1MjcxMyBFbWl0dGVkICR7ZXZlbnROYW1lfSAtIElmIG5vdGhpbmcgaGFwcGVucywgY2hlY2sgV2ViZmxvdyBjb25maWc6YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMS4gRXZlbnQgbmFtZSBtdXN0IGJlIGV4YWN0bHk6IFwiJHtldmVudE5hbWV9XCJgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbV0VCRkxPV10gICAyLiBDb250cm9sIG11c3QgTk9UIGJlIFwiTm8gQWN0aW9uXCJgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbV0VCRkxPV10gICAzLiBNdXN0IHRhcmdldCB0aGUgbG9nbyBlbGVtZW50YCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgNC4gVGltZWxpbmUgbXVzdCBiZSBzZXQgY29ycmVjdGx5YCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW1dFQkZMT1ddIFx1MjcxNyB3Zkl4LmVtaXQgbm90IGF2YWlsYWJsZWApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBbV0VCRkxPV10gXHUyNzE3IEVycm9yIGVtaXR0aW5nICR7ZXZlbnROYW1lfTpgLCBlcnIpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgLy8gV2FpdCBmb3IgU2Nyb2xsVHJpZ2dlciB0byByZWZyZXNoLCB0aGVuIHRyaWdnZXIgbG9nby1ncm93IG9uIGluaXRpYWwgbG9hZFxuICAgICAgLy8gVGhpcyBhbmltYXRlcyB0aGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcgb24gcGFnZSBsb2FkLCBlbnN1cmluZyBpdCBzdGFydHMgaW4gdGhlIGJpZyBzdGF0ZVxuICAgICAgLy8gV2Ugb25seSBlbWl0IG9uY2UgLSB1c2UgYSBmbGFnIHRvIHByZXZlbnQgbXVsdGlwbGUgaW5pdGlhbCBlbWl0c1xuICAgICAgbGV0IGluaXRpYWxHcm93RW1pdHRlZCA9IGZhbHNlO1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgU2Nyb2xsVHJpZ2dlci5yZWZyZXNoKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBFbWl0IGxvZ28tZ3JvdyBvbiBpbml0aWFsIGxvYWQgKGFuaW1hdGVzIGxvZ28gdG8gYmlnIHN0YXRlKVxuICAgICAgICAvLyBPbmx5IGVtaXQgb25jZSwgd2l0aCBhIHNpbmdsZSBkZWxheWVkIGF0dGVtcHQgdG8gY2F0Y2ggV2ViZmxvdyBpbml0aWFsaXphdGlvblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBpZiAoIWluaXRpYWxHcm93RW1pdHRlZCkge1xuICAgICAgICAgICAgdmVyaWZ5QW5kRW1pdChncm93RXZlbnROYW1lLCAnSW5pdGlhbCBsb2FkIC0gZ3JvdycpO1xuICAgICAgICAgICAgaW5pdGlhbEdyb3dFbWl0dGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBcHAgRW50cnlcbiAqICBQdXJwb3NlOiBXaXJlIG1vZHVsZXMgYW5kIGV4cG9zZSBtaW5pbWFsIGZhY2FkZVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgaW5pdEFjY29yZGlvbiB9IGZyb20gJy4vbW9kdWxlcy9hY2NvcmRpb24uanMnO1xuaW1wb3J0IHsgaW5pdExpZ2h0Ym94IH0gZnJvbSAnLi9tb2R1bGVzL2xpZ2h0Ym94LmpzJztcbmltcG9ydCB7IGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMgfSBmcm9tICcuL21vZHVsZXMvd2ViZmxvdy1zY3JvbGx0cmlnZ2VyLmpzJztcblxuZnVuY3Rpb24gcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKXtcbiAgLy8gTWluaW1hbCBzZXQgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluc2lkZSBEZXNpZ25lclxuICBjb25zdCB0b2tlbnMgPSBbJ2F1dG9wbGF5JywnZW5jcnlwdGVkLW1lZGlhJywncGljdHVyZS1pbi1waWN0dXJlJ107XG4gIGNvbnN0IHNlbCA9IFtcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHUuYmVcIl0nLFxuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUtbm9jb29raWUuY29tXCJdJyxcbiAgXS5qb2luKCcsJyk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKS5mb3JFYWNoKChpZnIpID0+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IChpZnIuZ2V0QXR0cmlidXRlKCdhbGxvdycpIHx8ICcnKS5zcGxpdCgnOycpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgbWVyZ2VkID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5leGlzdGluZywgLi4udG9rZW5zXSkpLmpvaW4oJzsgJyk7XG4gICAgaWZyLnNldEF0dHJpYnV0ZSgnYWxsb3cnLCBtZXJnZWQpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdChvcHRpb25zID0ge30pe1xuICBjb25zdCBsaWdodGJveFJvb3QgPSBvcHRpb25zLmxpZ2h0Ym94Um9vdCB8fCAnI3Byb2plY3QtbGlnaHRib3gnO1xuICAvLyBBbGxvdyBlbmFibGluZyBzaW5nbGUtdGltZWxpbmUgR1NBUCBtb2RlIHZpYSBpbml0IG9wdGlvbnNcbiAgaW5pdEFjY29yZGlvbih7IHJvb3RTZWw6ICcuYWNjb3JkZW9uJywgdXNlSW5saW5lR3NhcDogISFvcHRpb25zLmFjY29yZGlvbklubGluZUdzYXAgfSk7XG4gIGluaXRMaWdodGJveCh7IHJvb3Q6IGxpZ2h0Ym94Um9vdCwgY2xvc2VEZWxheU1zOiAxMDAwIH0pO1xuICAvLyBSZWx5IG9uIENTUyBzY3JvbGwtc25hcCBpbiBgLnBlcnNwZWN0aXZlLXdyYXBwZXJgOyBkbyBub3QgYXR0YWNoIEpTIHBhZ2luZ1xuXG4gIC8vIEJyaWRnZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVhcbiAgdHJ5IHtcbiAgICBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKHtcbiAgICAgIHNjcm9sbGVyU2VsZWN0b3I6ICcucGVyc3BlY3RpdmUtd3JhcHBlcicsXG4gICAgICBpbml0RXZlbnROYW1lOiAnbG9nby1zdGFydCcsXG4gICAgICBzaHJpbmtFdmVudE5hbWU6ICdsb2dvLXNocmluaycsXG4gICAgICBncm93RXZlbnROYW1lOiAnbG9nby1ncm93J1xuICAgIH0pO1xuICB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gTm90ZTogbm8gSlMgc2xpZGUgc25hcHBpbmc7IHJlbHkgb24gQ1NTIHNjcm9sbC1zbmFwIGluIGAucGVyc3BlY3RpdmUtd3JhcHBlcmBcbn1cblxuLy8gRXhwb3NlIGEgdGlueSBnbG9iYWwgZm9yIFdlYmZsb3cvRGVzaWduZXIgaG9va3Ncbi8vIChJbnRlcm5hbHMgcmVtYWluIHByaXZhdGUgaW5zaWRlIHRoZSBJSUZFIGJ1bmRsZSlcbmlmICghd2luZG93LkFwcCkgd2luZG93LkFwcCA9IHt9O1xud2luZG93LkFwcC5pbml0ID0gaW5pdDtcblxuLy8gQXV0by1pbml0IG9uIERPTSByZWFkeSAoc2FmZSBpZiBlbGVtZW50cyBhcmUgbWlzc2luZylcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIHRyeSB7IHBhdGNoWW91VHViZUFsbG93VG9rZW5zKCk7IGluaXQoKTsgfSBjYXRjaCAoZXJyKSB7IGNvbnNvbGUuZXJyb3IoJ1tBcHBdIGluaXQgZXJyb3InLCBlcnIpOyB9XG59KTtcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiOztBQVFPLFdBQVMsS0FBSyxNQUFNLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBRTtBQUN0RCxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsU0FBUyxNQUFNLFlBQVksTUFBTSxPQUFPLENBQUMsQ0FBQztBQUFBLElBQUcsUUFBUTtBQUFBLElBQUM7QUFDekcsUUFBSTtBQUFFLGFBQU8sY0FBYyxJQUFJLFlBQVksTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUFBLEVBQzFFOzs7QUNGQSxVQUFRLElBQUksMkJBQTJCO0FBRWhDLFdBQVMsY0FBYyxnQkFBZ0IsY0FBYTtBQUN6RCxVQUFNLFVBQVUsT0FBTyxrQkFBa0IsV0FBVyxnQkFBaUIsaUJBQWlCLGNBQWMsV0FBWTtBQUNoSCxVQUFNLG1CQUFtQixPQUFPLGtCQUFrQixZQUFZLENBQUMsQ0FBQyxjQUFjO0FBQzlFLFVBQU0sT0FBTyxTQUFTLGNBQWMsT0FBTztBQUMzQyxRQUFJLENBQUMsTUFBSztBQUFFLGNBQVEsSUFBSSw0QkFBNEI7QUFBRztBQUFBLElB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
