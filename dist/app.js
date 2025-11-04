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
  function initAccordion(rootSel = ".accordeon") {
    const root = document.querySelector(rootSel);
    if (!root) {
      console.log("[ACCORDION] root not found");
      return;
    }
    const panelOf = (item) => item == null ? void 0 : item.querySelector(":scope > .acc-list");
    const groupOf = (item) => {
      const parent = item.parentElement;
      return (parent == null ? void 0 : parent.classList.contains("acc-list")) ? parent : root;
    };
    const dbg = (...args) => {
      try {
        console.log("[ACCORDION]", ...args);
      } catch (_) {
      }
    };
    const itemKind = (el) => {
      var _a;
      return ((_a = el == null ? void 0 : el.classList) == null ? void 0 : _a.contains("acc-section")) ? "section" : "item";
    };
    const labelOf = (el) => {
      const t = el == null ? void 0 : el.querySelector(":scope > .acc-trigger");
      return ((t == null ? void 0 : t.textContent) || "").trim().replace(/\s+/g, " ").slice(0, 80);
    };
    const triggers = root.querySelectorAll(".acc-trigger");
    triggers.forEach((t, i) => {
      const item = t.closest(".acc-section, .acc-item");
      const p = panelOf(item);
      if (p) {
        const pid = p.id || `acc-panel-${i}`;
        p.id = pid;
        t.setAttribute("aria-controls", pid);
        t.setAttribute("aria-expanded", "false");
      }
    });
    dbg("bootstrapped", triggers.length, "triggers");
    function expand(p) {
      var _a;
      dbg("expand start", { id: p.id, children: (_a = p.children) == null ? void 0 : _a.length, h: p.scrollHeight });
      p.classList.add("is-active");
      Array.from(p.querySelectorAll(":scope > .acc-item")).forEach((row) => {
        row.style.removeProperty("opacity");
        row.style.removeProperty("visibility");
        row.style.removeProperty("transform");
      });
      p.style.maxHeight = p.scrollHeight + "px";
      p.dataset.state = "opening";
      const onEnd = (e) => {
        if (e.propertyName !== "max-height") return;
        p.removeEventListener("transitionend", onEnd);
        if (p.dataset.state === "opening") {
          p.style.maxHeight = "none";
          p.dataset.state = "open";
          dbg("expanded", { id: p.id });
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
        dbg("collapsed", { id: p.id });
      };
      p.addEventListener("transitionend", onEnd);
    }
    function closeSiblings(item) {
      const group = groupOf(item);
      if (!group) return;
      const want = item.matches(".acc-section") ? "acc-section" : "acc-item";
      Array.from(group.children).forEach((sib) => {
        if (sib === item || !sib.classList.contains(want)) return;
        const p = panelOf(sib);
        if (p && (p.dataset.state === "open" || p.dataset.state === "opening")) {
          dbg("close sibling", { kind: want, label: labelOf(sib), id: p.id });
          emit("acc-close", p);
          collapse(p);
          const trig = sib.querySelector(":scope > .acc-trigger");
          trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
        }
      });
    }
    function toggle(item) {
      const p = panelOf(item);
      if (!p) return;
      const trig = item.querySelector(":scope > .acc-trigger");
      const opening = !(p.dataset.state === "open" || p.dataset.state === "opening");
      dbg("toggle", { kind: itemKind(item), opening, label: labelOf(item), id: p.id });
      closeSiblings(item);
      if (opening) {
        expand(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "true");
        dbg("emit acc-open", { id: p.id });
        emit("acc-open", p);
      } else {
        dbg("emit acc-close", { id: p.id });
        emit("acc-close", p);
        collapse(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
      }
    }
    document.body.classList.add("js-prep");
    root.querySelectorAll(".acc-list").forEach((p) => {
      p.style.maxHeight = "0px";
      p.dataset.state = "collapsed";
    });
    Array.from(root.querySelectorAll(":scope > .acc-item")).forEach((row) => {
      row.style.removeProperty("opacity");
      row.style.removeProperty("visibility");
      row.style.removeProperty("transform");
    });
    requestAnimationFrame(() => document.body.classList.remove("js-prep"));
    root.addEventListener("click", (e) => {
      const t = e.target.closest(".acc-trigger");
      if (!t || !root.contains(t)) return;
      e.preventDefault();
      const item = t.closest(".acc-section, .acc-item");
      dbg("click", { label: (t.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80) });
      item && toggle(item);
    });
    root.addEventListener("keydown", (e) => {
      const t = e.target.closest(".acc-trigger");
      if (!t || !root.contains(t)) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const item = t.closest(".acc-section, .acc-item");
      dbg("keydown", { key: e.key, label: (t.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80) });
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
    root.querySelectorAll(".acc-list").forEach((p) => ro.observe(p));
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

  // src/modules/cursor.js
  function initCustomCursor(options = {}) {
    const hasFinePointer = typeof window.matchMedia === "function" ? window.matchMedia("(pointer: fine)").matches : true;
    if (!hasFinePointer) return;
    if (document.getElementById("mccann-custom-cursor")) return;
    const clickableSelector = options.clickableSelector || "a[href]";
    const style = document.createElement("style");
    style.id = "mccann-custom-cursor-style";
    style.textContent = `
    /* Hide native cursor everywhere, including pseudo elements */
    .has-custom-cursor,
    .has-custom-cursor * { cursor: none !important; }
    .has-custom-cursor *::before,
    .has-custom-cursor *::after { cursor: none !important; }

    .custom-cursor {
      position: fixed;
      left: 0;
      top: 0;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #0a3d91; /* dark blue */
      pointer-events: none;
      z-index: 2147483647;
      transform: translate3d(-9999px, -9999px, 0) translate(-50%, -50%) scale(0.3);
      opacity: 0;
      transition: transform 120ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 80ms linear;
      will-change: transform, opacity;
    }

    .custom-cursor.is-visible { opacity: 1; }

    @media (prefers-reduced-motion: reduce) {
      .custom-cursor { transition: none; }
    }
  `;
    document.head.appendChild(style);
    document.documentElement.classList.add("has-custom-cursor");
    const el = document.createElement("div");
    el.id = "mccann-custom-cursor";
    el.className = "custom-cursor";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    let mouseX = 0;
    let mouseY = 0;
    let isActive = false;
    let rafId = 0;
    let needsRender = false;
    const prefersReduced = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    function render() {
      rafId = 0;
      if (!needsRender) return;
      needsRender = false;
      const scale = isActive ? 1 : 0.3;
      el.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${scale})`;
    }
    function schedule() {
      if (!rafId) rafId = requestAnimationFrame(render);
    }
    function setVisible(v) {
      if (v) el.classList.add("is-visible");
      else el.classList.remove("is-visible");
    }
    function updateActive(target) {
      const match = target && target.closest ? target.closest(clickableSelector) : null;
      const next = !!match;
      if (next !== isActive) {
        if (!prefersReduced) {
          if (next) {
            el.style.transition = "transform 45ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 80ms linear";
          } else {
            el.style.transition = "transform 120ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 80ms linear";
          }
        }
        isActive = next;
        needsRender = true;
        schedule();
      }
    }
    function onPointerMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      updateActive(e.target);
      setVisible(true);
      needsRender = true;
      schedule();
    }
    function onMouseOut(e) {
      if (e.relatedTarget == null) setVisible(false);
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mouseout", onMouseOut, { passive: true });
    window.addEventListener("blur", () => setVisible(false));
    window.addEventListener("focus", () => setVisible(true));
    return function destroy() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mouseout", onMouseOut);
      document.documentElement.classList.remove("has-custom-cursor");
      try {
        el.remove();
      } catch (_) {
      }
      try {
        style.remove();
      } catch (_) {
      }
    };
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
    initAccordion(".accordeon");
    initLightbox({ root: lightboxRoot, closeDelayMs: 1e3 });
    try {
      initCustomCursor();
    } catch (_) {
    }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvbW9kdWxlcy9jdXJzb3IuanMiLCAiLi4vc3JjL2FwcC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBFdmVudHMgVXRpbGl0eVxuICogIFB1cnBvc2U6IEVtaXQgYnViYmxpbmcgQ3VzdG9tRXZlbnRzIGNvbXBhdGlibGUgd2l0aCBHU0FQLVVJICh3aW5kb3cgc2NvcGUpXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZW1pdChuYW1lLCB0YXJnZXQgPSB3aW5kb3csIGRldGFpbCA9IHt9KXtcbiAgdHJ5IHsgdGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSwgZGV0YWlsIH0pKTsgfSBjYXRjaCB7fVxuICB0cnkgeyB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQWNjb3JkaW9uIE1vZHVsZVxuICogIFB1cnBvc2U6IEFSSUEsIHNtb290aCB0cmFuc2l0aW9ucywgR1NBUCBldmVudCBob29rc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QWNjb3JkaW9uKHJvb3RTZWwgPSAnLmFjY29yZGVvbicpe1xuICBjb25zdCByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290U2VsKTtcbiAgaWYgKCFyb290KXsgY29uc29sZS5sb2coJ1tBQ0NPUkRJT05dIHJvb3Qgbm90IGZvdW5kJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IHBhbmVsT2YgPSBpdGVtID0+IGl0ZW0/LnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2MtbGlzdCcpO1xuICBjb25zdCBncm91cE9mID0gaXRlbSA9PiB7XG4gICAgY29uc3QgcGFyZW50ID0gaXRlbS5wYXJlbnRFbGVtZW50O1xuICAgIHJldHVybiBwYXJlbnQ/LmNsYXNzTGlzdC5jb250YWlucygnYWNjLWxpc3QnKSA/IHBhcmVudCA6IHJvb3Q7XG4gIH07XG4gIGNvbnN0IGRiZyA9ICguLi5hcmdzKSA9PiB7IHRyeSB7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXScsIC4uLmFyZ3MpOyB9IGNhdGNoKF8pIHt9IH07XG4gIGNvbnN0IGl0ZW1LaW5kID0gKGVsKSA9PiBlbD8uY2xhc3NMaXN0Py5jb250YWlucygnYWNjLXNlY3Rpb24nKSA/ICdzZWN0aW9uJyA6ICdpdGVtJztcbiAgY29uc3QgbGFiZWxPZiA9IChlbCkgPT4ge1xuICAgIGNvbnN0IHQgPSBlbD8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjYy10cmlnZ2VyJyk7XG4gICAgcmV0dXJuICh0Py50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywnICcpLnNsaWNlKDAsODApO1xuICB9O1xuXG4gIC8vIEFSSUEgYm9vdHN0cmFwXG4gIGNvbnN0IHRyaWdnZXJzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLXRyaWdnZXInKTtcbiAgdHJpZ2dlcnMuZm9yRWFjaCgodCwgaSkgPT4ge1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2Mtc2VjdGlvbiwgLmFjYy1pdGVtJyk7XG4gICAgY29uc3QgcCA9IHBhbmVsT2YoaXRlbSk7XG4gICAgaWYgKHApe1xuICAgICAgY29uc3QgcGlkID0gcC5pZCB8fCBgYWNjLXBhbmVsLSR7aX1gO1xuICAgICAgcC5pZCA9IHBpZDtcbiAgICAgIHQuc2V0QXR0cmlidXRlKCdhcmlhLWNvbnRyb2xzJywgcGlkKTtcbiAgICAgIHQuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgfVxuICB9KTtcbiAgZGJnKCdib290c3RyYXBwZWQnLCB0cmlnZ2Vycy5sZW5ndGgsICd0cmlnZ2VycycpO1xuXG4gIGZ1bmN0aW9uIGV4cGFuZChwKXtcbiAgICBkYmcoJ2V4cGFuZCBzdGFydCcsIHsgaWQ6IHAuaWQsIGNoaWxkcmVuOiBwLmNoaWxkcmVuPy5sZW5ndGgsIGg6IHAuc2Nyb2xsSGVpZ2h0IH0pO1xuICAgIHAuY2xhc3NMaXN0LmFkZCgnaXMtYWN0aXZlJyk7XG4gICAgLy8gRW5zdXJlIGRpcmVjdCBjaGlsZCByb3dzIGFyZSBub3Qgc3R1Y2sgaGlkZGVuIGJ5IGFueSBnbG9iYWwgR1NBUCBpbml0aWFsIHN0YXRlXG4gICAgQXJyYXkuZnJvbShwLnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbScpKS5mb3JFYWNoKChyb3cpID0+IHtcbiAgICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnb3BhY2l0eScpO1xuICAgICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd2aXNpYmlsaXR5Jyk7XG4gICAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RyYW5zZm9ybScpO1xuICAgIH0pO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gcC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXtcbiAgICAgICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuJztcbiAgICAgICAgZGJnKCdleHBhbmRlZCcsIHsgaWQ6IHAuaWQgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgICBwLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gIH1cblxuICBmdW5jdGlvbiBjb2xsYXBzZShwKXtcbiAgICBjb25zdCBoID0gcC5zdHlsZS5tYXhIZWlnaHQgPT09ICdub25lJyA/IHAuc2Nyb2xsSGVpZ2h0IDogcGFyc2VGbG9hdChwLnN0eWxlLm1heEhlaWdodCB8fCAwKTtcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9IChoIHx8IHAuc2Nyb2xsSGVpZ2h0KSArICdweCc7XG4gICAgcC5vZmZzZXRIZWlnaHQ7IC8vIHJlZmxvd1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gJzBweCc7XG4gICAgcC5kYXRhc2V0LnN0YXRlID0gJ2Nsb3NpbmcnO1xuICAgIGNvbnN0IG9uRW5kID0gKGUpID0+IHtcbiAgICAgIGlmIChlLnByb3BlcnR5TmFtZSAhPT0gJ21heC1oZWlnaHQnKSByZXR1cm47XG4gICAgICBwLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gICAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY29sbGFwc2VkJztcbiAgICAgIHAuY2xhc3NMaXN0LnJlbW92ZSgnaXMtYWN0aXZlJyk7XG4gICAgICBkYmcoJ2NvbGxhcHNlZCcsIHsgaWQ6IHAuaWQgfSk7XG4gICAgfTtcbiAgICBwLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZVNpYmxpbmdzKGl0ZW0pe1xuICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBPZihpdGVtKTtcbiAgICBpZiAoIWdyb3VwKSByZXR1cm47XG4gICAgY29uc3Qgd2FudCA9IGl0ZW0ubWF0Y2hlcygnLmFjYy1zZWN0aW9uJykgPyAnYWNjLXNlY3Rpb24nIDogJ2FjYy1pdGVtJztcbiAgICBBcnJheS5mcm9tKGdyb3VwLmNoaWxkcmVuKS5mb3JFYWNoKHNpYiA9PiB7XG4gICAgICBpZiAoc2liID09PSBpdGVtIHx8ICFzaWIuY2xhc3NMaXN0LmNvbnRhaW5zKHdhbnQpKSByZXR1cm47XG4gICAgICBjb25zdCBwID0gcGFuZWxPZihzaWIpO1xuICAgICAgaWYgKHAgJiYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nIHx8IHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKSl7XG4gICAgICAgIGRiZygnY2xvc2Ugc2libGluZycsIHsga2luZDogd2FudCwgbGFiZWw6IGxhYmVsT2Yoc2liKSwgaWQ6IHAuaWQgfSk7XG4gICAgICAgIGVtaXQoJ2FjYy1jbG9zZScsIHApO1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgdHJpZyA9IHNpYi5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLXRyaWdnZXInKTtcbiAgICAgICAgdHJpZz8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBObyBleHBsaWNpdCBsZXZlbCByZXNldCBuZWVkZWQgd2l0aCB1bml2ZXJzYWwgZ3JvdXBpbmdcblxuICBmdW5jdGlvbiB0b2dnbGUoaXRlbSl7XG4gICAgY29uc3QgcCA9IHBhbmVsT2YoaXRlbSk7XG4gICAgaWYgKCFwKSByZXR1cm47XG4gICAgY29uc3QgdHJpZyA9IGl0ZW0ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjYy10cmlnZ2VyJyk7XG4gICAgY29uc3Qgb3BlbmluZyA9ICEocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicgfHwgcC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpO1xuICAgIGRiZygndG9nZ2xlJywgeyBraW5kOiBpdGVtS2luZChpdGVtKSwgb3BlbmluZywgbGFiZWw6IGxhYmVsT2YoaXRlbSksIGlkOiBwLmlkIH0pO1xuICAgIFxuICAgIGNsb3NlU2libGluZ3MoaXRlbSk7XG5cbiAgICBpZiAob3BlbmluZyl7XG4gICAgICBleHBhbmQocCk7XG4gICAgICB0cmlnPy5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgICAgZGJnKCdlbWl0IGFjYy1vcGVuJywgeyBpZDogcC5pZCB9KTtcbiAgICAgIGVtaXQoJ2FjYy1vcGVuJywgcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRiZygnZW1pdCBhY2MtY2xvc2UnLCB7IGlkOiBwLmlkIH0pO1xuICAgICAgZW1pdCgnYWNjLWNsb3NlJywgcCk7XG4gICAgICBjb2xsYXBzZShwKTtcbiAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnanMtcHJlcCcpO1xuICAvLyBDb2xsYXBzZSBhbGwgcGFuZWxzOyB0b3AtbGV2ZWwgaXRlbXMgcmVtYWluIHZpc2libGUgKG5vdCBpbnNpZGUgcGFuZWxzKVxuICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtbGlzdCcpLmZvckVhY2gocCA9PiB7IHAuc3R5bGUubWF4SGVpZ2h0ID0gJzBweCc7IHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnOyB9KTtcbiAgLy8gU2FmZXR5OiBlbnN1cmUgdG9wLWxldmVsIHJvd3MgYXJlIHZpc2libGUgZXZlbiBpZiBhIEdTQVAgdGltZWxpbmUgc2V0IGlubGluZSBzdHlsZXMgZ2xvYmFsbHlcbiAgQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbScpKS5mb3JFYWNoKChyb3cpID0+IHtcbiAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcbiAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3Zpc2liaWxpdHknKTtcbiAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RyYW5zZm9ybScpO1xuICB9KTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnanMtcHJlcCcpKTtcblxuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2MtdHJpZ2dlcicpO1xuICAgIGlmICghdCB8fCAhcm9vdC5jb250YWlucyh0KSkgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjLXNlY3Rpb24sIC5hY2MtaXRlbScpO1xuICAgIGRiZygnY2xpY2snLCB7IGxhYmVsOiAodC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywnICcpLnNsaWNlKDAsODApIH0pO1xuICAgIGl0ZW0gJiYgdG9nZ2xlKGl0ZW0pO1xuICB9KTtcbiAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2MtdHJpZ2dlcicpO1xuICAgIGlmICghdCB8fCAhcm9vdC5jb250YWlucyh0KSkgcmV0dXJuO1xuICAgIGlmIChlLmtleSAhPT0gJ0VudGVyJyAmJiBlLmtleSAhPT0gJyAnKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2Mtc2VjdGlvbiwgLmFjYy1pdGVtJyk7XG4gICAgZGJnKCdrZXlkb3duJywgeyBrZXk6IGUua2V5LCBsYWJlbDogKHQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csJyAnKS5zbGljZSgwLDgwKSB9KTtcbiAgICBpdGVtICYmIHRvZ2dsZShpdGVtKTtcbiAgfSk7XG5cbiAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgZW50cmllcy5mb3JFYWNoKCh7IHRhcmdldDogcCB9KSA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicpeyBwLnN0eWxlLm1heEhlaWdodCA9ICdub25lJzsgfVxuICAgICAgZWxzZSBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpeyBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JzsgfVxuICAgIH0pO1xuICB9KTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLWxpc3QnKS5mb3JFYWNoKHAgPT4gcm8ub2JzZXJ2ZShwKSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgU2Nyb2xsIExvY2sgKEh5YnJpZCwgaU9TLXNhZmUpXG4gKiAgUHVycG9zZTogUmVsaWFibGUgcGFnZSBzY3JvbGwgbG9ja2luZyB3aXRoIGV4YWN0IHJlc3RvcmVcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmxldCBsb2NrcyA9IDA7XG5sZXQgc2F2ZWRZID0gMDtcbmxldCBwcmV2U2Nyb2xsQmVoYXZpb3IgPSAnJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2tTY3JvbGwoKXtcbiAgaWYgKGxvY2tzKyspIHJldHVybjtcbiAgY29uc3QgZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIHByZXZTY3JvbGxCZWhhdmlvciA9IGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yO1xuICBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvciA9ICdhdXRvJztcbiAgc2F2ZWRZID0gd2luZG93LnNjcm9sbFkgfHwgZGUuc2Nyb2xsVG9wIHx8IDA7XG5cbiAgLy8gRml4ZWQtYm9keSArIG1vZGFsLW9wZW4gY2xhc3MgZm9yIENTUyBob29rc1xuICBPYmplY3QuYXNzaWduKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICB0b3A6IGAtJHtzYXZlZFl9cHhgLFxuICAgIGxlZnQ6ICcwJyxcbiAgICByaWdodDogJzAnLFxuICAgIHdpZHRoOiAnMTAwJScsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgIG92ZXJzY3JvbGxCZWhhdmlvcjogJ25vbmUnXG4gIH0pO1xuICB0cnkgeyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLW9wZW4nKTsgfSBjYXRjaCB7fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5sb2NrU2Nyb2xsKHsgZGVsYXlNcyA9IDAgfSA9IHt9KXtcbiAgY29uc3QgcnVuID0gKCkgPT4ge1xuICAgIGlmICgtLWxvY2tzID4gMCkgcmV0dXJuO1xuICAgIGNvbnN0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuYm9keS5zdHlsZSwge1xuICAgICAgcG9zaXRpb246ICcnLCB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCB3aWR0aDogJycsIG92ZXJmbG93OiAnJywgb3ZlcnNjcm9sbEJlaGF2aW9yOiAnJ1xuICAgIH0pO1xuICAgIHRyeSB7IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtb3BlbicpOyB9IGNhdGNoIHt9XG4gICAgZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBwcmV2U2Nyb2xsQmVoYXZpb3IgfHwgJyc7XG4gICAgd2luZG93LnNjcm9sbFRvKDAsIHNhdmVkWSk7XG4gIH07XG4gIGRlbGF5TXMgPyBzZXRUaW1lb3V0KHJ1biwgZGVsYXlNcykgOiBydW4oKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBWaW1lbyBIZWxwZXJcbiAqICBQdXJwb3NlOiBNb3VudC9yZXBsYWNlIFZpbWVvIGlmcmFtZSB3aXRoIHByaXZhY3kgb3B0aW9uc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tWSU1FT10gbW9kdWxlIGxvYWRlZCcpO1xuXG5mdW5jdGlvbiBwYXJzZVZpbWVvSWQoaW5wdXQpe1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG4gIGNvbnN0IHN0ciA9IFN0cmluZyhpbnB1dCkudHJpbSgpO1xuICAvLyBBY2NlcHQgYmFyZSBJRHNcbiAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkgcmV0dXJuIHN0cjtcbiAgLy8gRXh0cmFjdCBmcm9tIGtub3duIFVSTCBmb3Jtc1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKHN0ciwgJ2h0dHBzOi8vZXhhbXBsZS5jb20nKTtcbiAgICBjb25zdCBob3N0ID0gdS5ob3N0bmFtZSB8fCAnJztcbiAgICBpZiAoaG9zdC5pbmNsdWRlcygndmltZW8uY29tJykpe1xuICAgICAgLy8gL3ZpZGVvL3tpZH0gb3IgL3tpZH1cbiAgICAgIGNvbnN0IHBhcnRzID0gdS5wYXRobmFtZS5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIGNvbnN0IGxhc3QgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICAgIGNvbnN0IGlkID0gbGFzdC5tYXRjaCgvXFxkKy8pPy5bMF0gfHwgJyc7XG4gICAgICByZXR1cm4gaWQgfHwgJyc7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50VmltZW8oY29udGFpbmVyLCBpbnB1dElkLCBwYXJhbXMgPSB7fSl7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm47XG4gIGNvbnN0IGlkID0gcGFyc2VWaW1lb0lkKGlucHV0SWQpO1xuICBpZiAoIWlkKXsgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOyByZXR1cm47IH1cbiAgY29uc3QgcXVlcnkgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgZG50OiAxLCAuLi5wYXJhbXMgfSkudG9TdHJpbmcoKTtcbiAgY29uc3Qgc3JjID0gYGh0dHBzOi8vcGxheWVyLnZpbWVvLmNvbS92aWRlby8ke2lkfT8ke3F1ZXJ5fWA7XG4gIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuc3JjID0gc3JjO1xuICAvLyBNaW5pbWFsIGFsbG93LWxpc3QgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluIERlc2lnbmVyXG4gIGlmcmFtZS5hbGxvdyA9ICdhdXRvcGxheTsgZnVsbHNjcmVlbjsgcGljdHVyZS1pbi1waWN0dXJlOyBlbmNyeXB0ZWQtbWVkaWEnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZWJvcmRlcicsICcwJyk7XG4gIGlmcmFtZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBMaWdodGJveCBNb2R1bGVcbiAqICBQdXJwb3NlOiBGb2N1cyB0cmFwLCBvdXRzaWRlLWNsaWNrLCBpbmVydC9hcmlhIGZhbGxiYWNrLCByZS1lbnRyYW5jeVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmltcG9ydCB7IGxvY2tTY3JvbGwsIHVubG9ja1Njcm9sbCB9IGZyb20gJy4uL2NvcmUvc2Nyb2xsbG9jay5qcyc7XG5pbXBvcnQgeyBtb3VudFZpbWVvIH0gZnJvbSAnLi92aW1lby5qcyc7XG5jb25zb2xlLmxvZygnW0xJR0hUQk9YXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0TGlnaHRib3goeyByb290ID0gJyNwcm9qZWN0LWxpZ2h0Ym94JywgY2xvc2VEZWxheU1zID0gMTAwMCB9ID0ge30pe1xuICBjb25zdCBsYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdCk7XG4gIGlmICghbGIpeyBjb25zb2xlLmxvZygnW0xJR0hUQk9YXSBub3QgZm91bmQnKTsgcmV0dXJuOyB9XG5cbiAgLy8gRW5zdXJlIGJhc2VsaW5lIGRpYWxvZyBhMTF5IGF0dHJpYnV0ZXNcbiAgbGIuc2V0QXR0cmlidXRlKCdyb2xlJywgbGIuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHwgJ2RpYWxvZycpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnKSB8fCAndHJ1ZScpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgbGIuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpIHx8ICd0cnVlJyk7XG5cbiAgY29uc3QgaW5uZXIgPSBsYi5xdWVyeVNlbGVjdG9yKCcucHJvamVjdC1saWdodGJveF9faW5uZXInKTtcbiAgY29uc3QgdmlkZW9BcmVhID0gbGIucXVlcnlTZWxlY3RvcignLnZpZGVvLWFyZWEnKTtcbiAgY29uc3Qgc2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJyk7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuXG4gIGxldCBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgbGV0IGxhc3RGb2N1cyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gc2V0UGFnZUluZXJ0KG9uKXtcbiAgICBjb25zdCBzaWJsaW5ncyA9IEFycmF5LmZyb20oZG9jdW1lbnQuYm9keS5jaGlsZHJlbikuZmlsdGVyKG4gPT4gbiAhPT0gbGIpO1xuICAgIHNpYmxpbmdzLmZvckVhY2gobiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoJ2luZXJ0JyBpbiBuKSBuLmluZXJ0ID0gISFvbjtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGlmIChvbikgbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIGVsc2Ugbi5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFwRm9jdXMoZSl7XG4gICAgaWYgKGUua2V5ICE9PSAnVGFiJykgcmV0dXJuO1xuICAgIGNvbnN0IGZvY3VzYWJsZXMgPSBsYi5xdWVyeVNlbGVjdG9yQWxsKFtcbiAgICAgICdhW2hyZWZdJywnYnV0dG9uJywnaW5wdXQnLCdzZWxlY3QnLCd0ZXh0YXJlYScsXG4gICAgICAnW3RhYmluZGV4XTpub3QoW3RhYmluZGV4PVwiLTFcIl0pJ1xuICAgIF0uam9pbignLCcpKTtcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuZnJvbShmb2N1c2FibGVzKS5maWx0ZXIoZWwgPT4gIWVsLmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSAmJiAhZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDApeyBlLnByZXZlbnREZWZhdWx0KCk7IChpbm5lciB8fCBsYikuZm9jdXMoKTsgcmV0dXJuOyB9XG4gICAgY29uc3QgZmlyc3QgPSBsaXN0WzBdO1xuICAgIGNvbnN0IGxhc3QgPSBsaXN0W2xpc3QubGVuZ3RoIC0gMV07XG4gICAgaWYgKGUuc2hpZnRLZXkgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZmlyc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGxhc3QuZm9jdXMoKTsgfVxuICAgIGVsc2UgaWYgKCFlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGxhc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGZpcnN0LmZvY3VzKCk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5Gcm9tU2xpZGUoc2xpZGUpe1xuICAgIGlmIChvcGVuR3VhcmQpIHJldHVybjtcbiAgICBvcGVuR3VhcmQgPSB0cnVlO1xuICAgIGxhc3RGb2N1cyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgOiBudWxsO1xuXG4gICAgY29uc3QgdmlkZW8gPSBzbGlkZT8uZGF0YXNldD8udmlkZW8gfHwgJyc7XG4gICAgY29uc3QgdGl0bGUgPSBzbGlkZT8uZGF0YXNldD8udGl0bGUgfHwgJyc7XG4gICAgY29uc3QgdGV4dCAgPSBzbGlkZT8uZGF0YXNldD8udGV4dCAgfHwgJyc7XG5cbiAgICBjb25zdCBpc0Rlc2lnbmVyID0gL1xcLndlYmZsb3dcXC5jb20kLy50ZXN0KGxvY2F0aW9uLmhvc3RuYW1lKSB8fCAvY2FudmFzXFwud2ViZmxvd1xcLmNvbSQvLnRlc3QobG9jYXRpb24uaG9zdG5hbWUpO1xuICAgIGNvbnN0IGF1dG9wbGF5ID0gaXNEZXNpZ25lciA/IDAgOiAxOyAvLyBhdm9pZCBhdXRvcGxheSB3YXJuaW5ncyBpbnNpZGUgV2ViZmxvdyBEZXNpZ25lclxuICAgIGlmICh2aWRlb0FyZWEpIG1vdW50VmltZW8odmlkZW9BcmVhLCB2aWRlbywgeyBhdXRvcGxheSwgbXV0ZWQ6IDEsIGNvbnRyb2xzOiAwLCBiYWNrZ3JvdW5kOiAxLCBwbGF5c2lubGluZTogMSwgZG50OiAxIH0pO1xuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3BlbicsICd0cnVlJyk7XG4gICAgc2V0UGFnZUluZXJ0KHRydWUpO1xuICAgIGxvY2tTY3JvbGwoKTtcblxuICAgIGxiLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAoaW5uZXIgfHwgbGIpLmZvY3VzKCk7XG5cbiAgICBlbWl0KCdMSUdIVEJPWF9PUEVOJywgbGIsIHsgdmlkZW8sIHRpdGxlLCB0ZXh0IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVxdWVzdENsb3NlKCl7XG4gICAgaWYgKCFvcGVuR3VhcmQpIHJldHVybjtcbiAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRScsIGxiKTtcbiAgICBpZiAocHJlZmVyc1JlZHVjZWQpe1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogMCB9KTtcbiAgICAgIGVtaXQoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgbGIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmxvY2tTY3JvbGwoeyBkZWxheU1zOiBjbG9zZURlbGF5TXMgfSk7XG4gICAgfVxuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGxiLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1vcGVuJyk7XG4gICAgc2V0UGFnZUluZXJ0KGZhbHNlKTtcbiAgICBpZiAodmlkZW9BcmVhKSB2aWRlb0FyZWEuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGxhc3RGb2N1cyAmJiBkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGxhc3RGb2N1cykpIGxhc3RGb2N1cy5mb2N1cygpO1xuICAgIG9wZW5HdWFyZCA9IGZhbHNlO1xuICB9XG5cbiAgc2xpZGVzLmZvckVhY2goc2xpZGUgPT4gc2xpZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBvcGVuRnJvbVNsaWRlKHNsaWRlKSkpO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgaWYgKGlubmVyICYmICFlLnRhcmdldC5jbG9zZXN0KCcucHJvamVjdC1saWdodGJveF9faW5uZXInKSkgcmVxdWVzdENsb3NlKCk7XG4gICAgZWxzZSBpZiAoIWlubmVyICYmIGUudGFyZ2V0ID09PSBsYikgcmVxdWVzdENsb3NlKCk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBpZiAobGIuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nKSA9PT0gJ3RydWUnKXtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHJlcXVlc3RDbG9zZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSAnVGFiJykgdHJhcEZvY3VzKGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgbGIuYWRkRXZlbnRMaXN0ZW5lcignTElHSFRCT1hfQ0xPU0VEX0RPTkUnLCAoKSA9PiB1bmxvY2tTY3JvbGwoKSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgV2ViZmxvdyBTY3JvbGxUcmlnZ2VyIEJyaWRnZVxuICogIFB1cnBvc2U6IFRyaWdnZXIgV2ViZmxvdyBJWCBpbnRlcmFjdGlvbnMgdmlhIEdTQVAgU2Nyb2xsVHJpZ2dlclxuICogIERhdGU6IDIwMjUtMTAtMzBcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tXRUJGTE9XXSBtb2R1bGUgbG9hZGVkJyk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVggYnJpZGdlLlxuICpcbiAqIEJlaGF2aW9yOlxuICogIDEuIE9uIGxvYWQ6IGVtaXQgbG9nby1ncm93IHRvIGFuaW1hdGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcgKGVuc3VyZXMgbG9nbyBzdGFydHMgaW4gYmlnIHN0YXRlKVxuICogIDIuIFNjcm9sbCBkb3duIHBhc3QgZmlyc3Qgc2xpZGU6IGVtaXQgbG9nby1zaHJpbmsgKGJpZyBcdTIxOTIgc21hbGwpXG4gKiAgMy4gU3RhcnQgc2Nyb2xsaW5nIHVwIChtaWRkbGUgc2VjdGlvbik6IGVtaXQgbG9nby1ncm93IGltbWVkaWF0ZWx5IChzbWFsbCBcdTIxOTIgYmlnKVxuICogIDQuIFJlYWNoIGxhc3Qgc2xpZGU6IGVtaXQgbG9nby1ncm93IChzbWFsbCBcdTIxOTIgYmlnLCBsb2dvIGdyb3dzIGF0IGJvdHRvbSlcbiAqICA1LiBTY3JvbGwgdXAgZnJvbSBsYXN0IHNsaWRlOiBlbWl0IGxvZ28tc2hyaW5rIChiaWcgXHUyMTkyIHNtYWxsKVxuICogIDYuIFJldHVybiB0byB0b3A6IGVtaXQgbG9nby1zdGFydCAoanVtcCB0byAwcywgYmFjayB0byBiaWcgc3RhdGljIHN0YXRlKVxuICpcbiAqIFJlcXVpcmVtZW50cyBpbiBXZWJmbG93OlxuICogIC0gbG9nby1zdGFydDogVXNlcyB0aGUgc2FtZSB0aW1lbGluZSBhcyBsb2dvLXNocmluay4gQ29udHJvbCBcdTIxOTIgSnVtcCB0byAwcywgdGhlbiBTdG9wLlxuICogICAgICAgICAgICAgICBVc2VkIHdoZW4gcmV0dXJuaW5nIHRvIHRvcCAob25FbnRlckJhY2spOyB3b3JrcyBiZWNhdXNlIHRpbWVsaW5lIGlzIGluaXRpYWxpemVkIGJ5IHRoZW4uXG4gKiAgICAgICAgICAgICAgIElmIG9taXR0ZWQsIGV2ZW50IGlzIHN0aWxsIGVtaXR0ZWQgYnV0IHNhZmVseSBpZ25vcmVkIGlmIG5vdCBjb25maWd1cmVkLlxuICogIC0gbG9nby1zaHJpbms6IENvbnRyb2wgXHUyMTkyIFBsYXkgZnJvbSBzdGFydCAoYmlnIFx1MjE5MiBzbWFsbCBhbmltYXRpb24pXG4gKiAgLSBsb2dvLWdyb3c6IENvbnRyb2wgXHUyMTkyIFBsYXkgZnJvbSBzdGFydCAoc21hbGwgXHUyMTkyIGJpZyBhbmltYXRpb24pXG4gKiAgICAgICAgICAgICAgIFRoaXMgaXMgdHJpZ2dlcmVkIG9uIGluaXRpYWwgcGFnZSBsb2FkIHRvIGFuaW1hdGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcuXG4gKiAgICAgICAgICAgICAgIEVuc3VyZSB5b3VyIGxvZ28gQ1NTIHNob3dzIGl0IGluIHRoZSBcInNtYWxsXCIgc3RhdGUgaW5pdGlhbGx5IChtYXRjaGluZyB0aGUgZW5kIHN0YXRlXG4gKiAgICAgICAgICAgICAgIG9mIHNocmluayBvciBzdGFydCBzdGF0ZSBvZiBncm93KSwgc28gdGhlIGdyb3cgYW5pbWF0aW9uIGhhcyBzb21ld2hlcmUgdG8gYW5pbWF0ZSBmcm9tLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2Nyb2xsZXJTZWxlY3Rvcj0nLnBlcnNwZWN0aXZlLXdyYXBwZXInXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRyaXZlclNlbGVjdG9yXSAtIERlZmF1bHRzIHRvIGZpcnN0IC5zbGlkZSBpbiBzY3JvbGxlclxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmluaXRFdmVudE5hbWU9J2xvZ28tc3RhcnQnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNocmlua0V2ZW50TmFtZT0nbG9nby1zaHJpbmsnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmdyb3dFdmVudE5hbWU9J2xvZ28tZ3JvdyddXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm1hcmtlcnM9ZmFsc2VdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IHNjcm9sbGVyU2VsZWN0b3IgPSBvcHRpb25zLnNjcm9sbGVyU2VsZWN0b3IgfHwgJy5wZXJzcGVjdGl2ZS13cmFwcGVyJztcbiAgY29uc3QgaW5pdEV2ZW50TmFtZSA9IG9wdGlvbnMuaW5pdEV2ZW50TmFtZSB8fCAnbG9nby1zdGFydCc7XG4gIGNvbnN0IHNocmlua0V2ZW50TmFtZSA9IG9wdGlvbnMuc2hyaW5rRXZlbnROYW1lIHx8IG9wdGlvbnMucGxheUV2ZW50TmFtZSB8fCAnbG9nby1zaHJpbmsnO1xuICBjb25zdCBncm93RXZlbnROYW1lID0gb3B0aW9ucy5ncm93RXZlbnROYW1lIHx8ICdsb2dvLWdyb3cnO1xuICBjb25zdCBtYXJrZXJzID0gISFvcHRpb25zLm1hcmtlcnM7XG5cbiAgZnVuY3Rpb24gb25XaW5kb3dMb2FkKGNiKXtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykgeyBzZXRUaW1lb3V0KGNiLCAwKTsgcmV0dXJuOyB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBjYiwgeyBvbmNlOiB0cnVlIH0pO1xuICB9XG5cbiAgb25XaW5kb3dMb2FkKGZ1bmN0aW9uKCl7XG4gICAgY29uc3QgV2ViZmxvdyA9IHdpbmRvdy5XZWJmbG93IHx8IFtdO1xuICAgIFxuICAgIFdlYmZsb3cucHVzaChmdW5jdGlvbigpe1xuICAgICAgLy8gR2V0IFdlYmZsb3cgSVggQVBJICh0cnkgaXgzIGZpcnN0LCBmYWxsYmFjayB0byBpeDIpXG4gICAgICBjb25zdCB3Zkl4ID0gKHdpbmRvdy5XZWJmbG93ICYmIHdpbmRvdy5XZWJmbG93LnJlcXVpcmUpIFxuICAgICAgICA/ICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSlcbiAgICAgICAgOiBudWxsO1xuICAgICAgY29uc3QgU2Nyb2xsVHJpZ2dlciA9IHdpbmRvdy5TY3JvbGxUcmlnZ2VyO1xuICAgICAgXG4gICAgICBpZiAoIXdmSXggfHwgIVNjcm9sbFRyaWdnZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IHNjcm9sbGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzY3JvbGxlclNlbGVjdG9yKTtcbiAgICAgIGlmICghc2Nyb2xsZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIEZpbmQgZmlyc3QgLnNsaWRlIGluc2lkZSB0aGUgc2Nyb2xsZXIgKGZvciB0b3AgZGV0ZWN0aW9uKVxuICAgICAgY29uc3QgZHJpdmVyID0gc2Nyb2xsZXIucXVlcnlTZWxlY3RvcignLnNsaWRlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNsaWRlJyk7XG4gICAgICBpZiAoIWRyaXZlcikgeyBcbiAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIERyaXZlciBzbGlkZSBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuOyBcbiAgICAgIH1cblxuICAgICAgLy8gRmluZCBsYXN0IC5zbGlkZSBpbnNpZGUgdGhlIHNjcm9sbGVyIChmb3IgYm90dG9tIGRldGVjdGlvbilcbiAgICAgIGNvbnN0IHNsaWRlcyA9IEFycmF5LmZyb20oc2Nyb2xsZXIucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJykpO1xuICAgICAgY29uc3QgbGFzdFNsaWRlID0gc2xpZGVzLmxlbmd0aCA+IDAgPyBzbGlkZXNbc2xpZGVzLmxlbmd0aCAtIDFdIDogbnVsbDtcbiAgICAgIGlmICghbGFzdFNsaWRlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW1dFQkZMT1ddIE5vIHNsaWRlcyBmb3VuZCwgbGFzdCBzbGlkZSBkZXRlY3Rpb24gZGlzYWJsZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTZXR1cCBjb21wbGV0ZTonLCB7IFxuICAgICAgICBzY3JvbGxlcjogISFzY3JvbGxlciwgXG4gICAgICAgIGRyaXZlcjogISFkcml2ZXIsXG4gICAgICAgIGxhc3RTbGlkZTogISFsYXN0U2xpZGUsXG4gICAgICAgIHRvdGFsU2xpZGVzOiBzbGlkZXMubGVuZ3RoLFxuICAgICAgICB3Zkl4OiAhIXdmSXgsIFxuICAgICAgICBTY3JvbGxUcmlnZ2VyOiAhIVNjcm9sbFRyaWdnZXIsXG4gICAgICAgIGluaXRFdmVudDogaW5pdEV2ZW50TmFtZSxcbiAgICAgICAgc2hyaW5rRXZlbnQ6IHNocmlua0V2ZW50TmFtZSxcbiAgICAgICAgZ3Jvd0V2ZW50OiBncm93RXZlbnROYW1lXG4gICAgICB9KTtcblxuICAgICAgLy8gVHJhY2sgc2Nyb2xsIHN0YXRlOiBhcmUgd2UgYmVsb3cgdGhlIHRvcCB6b25lPyBkaWQgd2Ugc2hyaW5rIGFscmVhZHk/IGRpZCB3ZSBncm93IGFscmVhZHk/XG4gICAgICAvLyBBbHNvIHRyYWNrIGxhc3Qgc2xpZGUgc3RhdGVcbiAgICAgIGxldCBpc0JlbG93VG9wID0gZmFsc2U7XG4gICAgICBsZXQgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICBsZXQgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgIGxldCBpc0F0TGFzdFNsaWRlID0gZmFsc2U7XG4gICAgICBsZXQgaGFzR3Jvd25BdExhc3QgPSBmYWxzZTtcblxuICAgICAgLy8gTWFpbiBTY3JvbGxUcmlnZ2VyOiB3YXRjaGVzIHdoZW4gZmlyc3Qgc2xpZGUgbGVhdmVzL2VudGVycyB0b3Agem9uZVxuICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICB0cmlnZ2VyOiBkcml2ZXIsXG4gICAgICAgIHNjcm9sbGVyOiBzY3JvbGxlcixcbiAgICAgICAgc3RhcnQ6ICd0b3AgdG9wJyxcbiAgICAgICAgZW5kOiAndG9wIC0xMCUnLCAvLyBTaG9ydCByYW5nZSBmb3IgaW1tZWRpYXRlIHRyaWdnZXJcbiAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgXG4gICAgICAgIG9uTGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHBhc3QgdG9wIFx1MjE5MiBzaHJpbmsgb25jZSAob25seSB3aGVuIGxlYXZpbmcsIG5vdCB3aGVuIGFscmVhZHkgYmVsb3cpXG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgb25seSBmaXJlIHdoZW4gY3Jvc3NpbmcgZnJvbSBcImF0IHRvcFwiIHRvIFwiYmVsb3cgdG9wXCJcbiAgICAgICAgICBpZiAoIWlzQmVsb3dUb3AgJiYgIWhhc1NocnVuaykge1xuICAgICAgICAgICAgaXNCZWxvd1RvcCA9IHRydWU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc2hyaW5rIChzY3JvbGxlZCBkb3duIHBhc3QgZmlyc3Qgc2xpZGUpOicsIHNocmlua0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChzaHJpbmtFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBoYXNTaHJ1bmsgPSB0cnVlO1xuICAgICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlOyAvLyBSZXNldCBncm93IGZsYWcgd2hlbiB3ZSBzaHJpbmtcbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBvbkVudGVyQmFjazogKCkgPT4ge1xuICAgICAgICAgIC8vIFNjcm9sbGVkIGJhY2sgdXAgdG8gdG9wIFx1MjE5MiBqdW1wIHNocmluayB0aW1lbGluZSB0byAwcyAoYmlnIHN0YXRlKSBhbmQgc3RvcFxuICAgICAgICAgIGlzQmVsb3dUb3AgPSBmYWxzZTtcbiAgICAgICAgICBoYXNTaHJ1bmsgPSBmYWxzZTtcbiAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgIGlzQXRMYXN0U2xpZGUgPSBmYWxzZTtcbiAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc3RhcnQgKHJldHVybiB0byB0b3ApOicsIGluaXRFdmVudE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSB3Zkl4IGF2YWlsYWJsZTonLCAhIXdmSXgsICdlbWl0IGF2YWlsYWJsZTonLCB0eXBlb2Ygd2ZJeD8uZW1pdCk7XG4gICAgICAgICAgICBpZiAod2ZJeCAmJiB0eXBlb2Ygd2ZJeC5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChpbml0RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSByZXR1cm4tdG8tdG9wIGV2ZW50IGVtaXR0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gQ2Fubm90IGVtaXQgcmV0dXJuLXRvLXRvcDogd2ZJeC5lbWl0IG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIEVycm9yIGVtaXR0aW5nIHJldHVybi10by10b3A6JywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBMYXN0IHNsaWRlIFNjcm9sbFRyaWdnZXI6IHdhdGNoZXMgd2hlbiBsYXN0IHNsaWRlIGVudGVycy9sZWF2ZXMgdmlld3BvcnRcbiAgICAgIGlmIChsYXN0U2xpZGUpIHtcbiAgICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICAgIHRyaWdnZXI6IGxhc3RTbGlkZSxcbiAgICAgICAgICBzY3JvbGxlcjogc2Nyb2xsZXIsXG4gICAgICAgICAgc3RhcnQ6ICd0b3AgYm90dG9tJywgLy8gTGFzdCBzbGlkZSBlbnRlcnMgZnJvbSBib3R0b20gb2Ygdmlld3BvcnRcbiAgICAgICAgICBlbmQ6ICdib3R0b20gdG9wJywgLy8gTGFzdCBzbGlkZSBsZWF2ZXMgdG9wIG9mIHZpZXdwb3J0XG4gICAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgICBcbiAgICAgICAgICBvbkVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHRvIGxhc3Qgc2xpZGUgXHUyMTkyIGdyb3cgb25jZSAob25seSB3aGVuIGVudGVyaW5nLCBub3Qgd2hlbiBhbHJlYWR5IHRoZXJlKVxuICAgICAgICAgICAgaWYgKCFpc0F0TGFzdFNsaWRlICYmICFoYXNHcm93bkF0TGFzdCkge1xuICAgICAgICAgICAgICBpc0F0TGFzdFNsaWRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAocmVhY2hlZCBsYXN0IHNsaWRlKTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgaGFzR3Jvd25BdExhc3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pZGRsZSBzZWN0aW9uIGZsYWdzIHNpbmNlIHdlJ3JlIGF0IHRoZSBsYXN0IHNsaWRlXG4gICAgICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgICAgb25MZWF2ZUJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGVkIFVQIGZyb20gbGFzdCBzbGlkZSAobGVhdmluZyBiYWNrd2FyZCkgXHUyMTkyIHNocmluayBvbmNlXG4gICAgICAgICAgICBpZiAoaXNBdExhc3RTbGlkZSAmJiBoYXNHcm93bkF0TGFzdCkge1xuICAgICAgICAgICAgICBpc0F0TGFzdFNsaWRlID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IHNocmluayAoc2Nyb2xsaW5nIHVwIGZyb20gbGFzdCBzbGlkZSk6Jywgc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGhhc1NocnVuayA9IHRydWU7IC8vIFdlJ3JlIG5vdyBpbiB0aGUgbWlkZGxlIHNlY3Rpb24gd2l0aCBsb2dvIHNtYWxsXG4gICAgICAgICAgICAgICAgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbXBsZSBzY3JvbGwgZGlyZWN0aW9uIHdhdGNoZXIgZm9yIGltbWVkaWF0ZSBncm93IG9uIHVwd2FyZCBzY3JvbGxcbiAgICAgIC8vIE9ubHkgdHJpZ2dlcnMgZ3JvdyB3aGVuOlxuICAgICAgLy8gLSBXZSdyZSBiZWxvdyB0aGUgdG9wIHpvbmUgKGlzQmVsb3dUb3ApXG4gICAgICAvLyAtIFdlJ3ZlIHNocnVuayAoaGFzU2hydW5rKVxuICAgICAgLy8gLSBXZSdyZSBzY3JvbGxpbmcgdXAgKGRpcmVjdGlvbiA9PT0gLTEpXG4gICAgICAvLyAtIFdlIGp1c3Qgc3RhcnRlZCBzY3JvbGxpbmcgdXAgKGxhc3REaXJlY3Rpb24gIT09IC0xLCBtZWFuaW5nIHdlIHdlcmVuJ3QgYWxyZWFkeSBzY3JvbGxpbmcgdXApXG4gICAgICAvLyAtIFdlIGhhdmVuJ3QgYWxyZWFkeSBncm93biAoaGFzR3Jvd24pXG4gICAgICBsZXQgbGFzdFNjcm9sbFRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcDtcbiAgICAgIGxldCBsYXN0RGlyZWN0aW9uID0gMDsgLy8gLTEgPSB1cCwgMSA9IGRvd24sIDAgPSB1bmtub3duXG4gICAgICBcbiAgICAgIFNjcm9sbFRyaWdnZXIuY3JlYXRlKHtcbiAgICAgICAgc2Nyb2xsZXI6IHNjcm9sbGVyLFxuICAgICAgICBzdGFydDogMCxcbiAgICAgICAgZW5kOiAoKSA9PiBTY3JvbGxUcmlnZ2VyLm1heFNjcm9sbChzY3JvbGxlciksXG4gICAgICAgIG9uVXBkYXRlOiAoc2VsZikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY3JvbGxUb3AgPSBzY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gY3VycmVudFNjcm9sbFRvcCA+IGxhc3RTY3JvbGxUb3AgPyAxIDogY3VycmVudFNjcm9sbFRvcCA8IGxhc3RTY3JvbGxUb3AgPyAtMSA6IGxhc3REaXJlY3Rpb247XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gR3JvdyBvbmx5IHdoZW4gc2Nyb2xsaW5nIHVwIGZyb20gYmVsb3cgdG9wIChtaWRkbGUgc2VjdGlvbiksIGFuZCB3ZSd2ZSBzaHJ1bmssIGFuZCB3ZSBoYXZlbid0IGdyb3duIHlldFxuICAgICAgICAgIC8vIERvbid0IHRyaWdnZXIgaWYgd2UncmUgYXQgdGhlIGxhc3Qgc2xpZGUgKHRoYXQncyBoYW5kbGVkIHNlcGFyYXRlbHkpXG4gICAgICAgICAgaWYgKGlzQmVsb3dUb3AgJiYgIWlzQXRMYXN0U2xpZGUgJiYgaGFzU2hydW5rICYmICFoYXNHcm93biAmJiBkaXJlY3Rpb24gPT09IC0xICYmIGxhc3REaXJlY3Rpb24gIT09IC0xKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAoc2Nyb2xsIHVwIGluIG1pZGRsZSBzZWN0aW9uKTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KGdyb3dFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBoYXNHcm93biA9IHRydWU7IC8vIFNldCBmbGFnIHNvIHdlIGRvbid0IGdyb3cgYWdhaW4gdW50aWwgd2Ugc2hyaW5rXG4gICAgICAgICAgICAgIGhhc1NocnVuayA9IGZhbHNlOyAvLyBSZXNldCBzaHJpbmsgZmxhZyBhZnRlciBncm93aW5nXG4gICAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFJlc2V0IGdyb3cgZmxhZyBpZiB3ZSBzdGFydCBzY3JvbGxpbmcgZG93biBhZ2FpbiAoYnV0IG9ubHkgaWYgd2UncmUgc3RpbGwgYmVsb3cgdG9wIGFuZCBub3QgYXQgbGFzdCBzbGlkZSlcbiAgICAgICAgICBpZiAoaXNCZWxvd1RvcCAmJiAhaXNBdExhc3RTbGlkZSAmJiBoYXNHcm93biAmJiBkaXJlY3Rpb24gPT09IDEgJiYgbGFzdERpcmVjdGlvbiAhPT0gMSkge1xuICAgICAgICAgICAgLy8gVXNlciBzdGFydGVkIHNjcm9sbGluZyBkb3duIGFnYWluIC0gcmVzZXQgc28gd2UgY2FuIHNocmluayBhZ2FpblxuICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBSZXNldCBmbGFncyAtIHJlYWR5IHRvIHNocmluayBhZ2FpbicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBsYXN0U2Nyb2xsVG9wID0gY3VycmVudFNjcm9sbFRvcDtcbiAgICAgICAgICBsYXN0RGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTY3JvbGxUcmlnZ2VyIGluaXRpYWxpemVkJyk7XG4gICAgICBcbiAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCBldmVudHMgZXhpc3QgaW4gV2ViZmxvdyBieSBjaGVja2luZyBpZiBlbWl0IHN1Y2NlZWRzXG4gICAgICAvLyBOb3RlOiBXZWJmbG93IGVtaXQgZG9lc24ndCB0aHJvdyBlcnJvcnMgZm9yIG1pc3NpbmcgZXZlbnRzLCBidXQgd2UgY2FuIGxvZyBhdHRlbXB0c1xuICAgICAgY29uc3QgdmVyaWZ5QW5kRW1pdCA9IChldmVudE5hbWUsIGRlc2NyaXB0aW9uKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAke2Rlc2NyaXB0aW9ufTpgLCBldmVudE5hbWUpO1xuICAgICAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdmSXguZW1pdChldmVudE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSBcdTI3MTMgRW1pdHRlZCAke2V2ZW50TmFtZX0gLSBJZiBub3RoaW5nIGhhcHBlbnMsIGNoZWNrIFdlYmZsb3cgY29uZmlnOmApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDEuIEV2ZW50IG5hbWUgbXVzdCBiZSBleGFjdGx5OiBcIiR7ZXZlbnROYW1lfVwiYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMi4gQ29udHJvbCBtdXN0IE5PVCBiZSBcIk5vIEFjdGlvblwiYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMy4gTXVzdCB0YXJnZXQgdGhlIGxvZ28gZWxlbWVudGApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDQuIFRpbWVsaW5lIG11c3QgYmUgc2V0IGNvcnJlY3RseWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXRUJGTE9XXSBcdTI3MTcgd2ZJeC5lbWl0IG5vdCBhdmFpbGFibGVgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW1dFQkZMT1ddIFx1MjcxNyBFcnJvciBlbWl0dGluZyAke2V2ZW50TmFtZX06YCwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIFdhaXQgZm9yIFNjcm9sbFRyaWdnZXIgdG8gcmVmcmVzaCwgdGhlbiB0cmlnZ2VyIGxvZ28tZ3JvdyBvbiBpbml0aWFsIGxvYWRcbiAgICAgIC8vIFRoaXMgYW5pbWF0ZXMgdGhlIGxvZ28gZnJvbSBzbWFsbCBcdTIxOTIgYmlnIG9uIHBhZ2UgbG9hZCwgZW5zdXJpbmcgaXQgc3RhcnRzIGluIHRoZSBiaWcgc3RhdGVcbiAgICAgIC8vIFdlIG9ubHkgZW1pdCBvbmNlIC0gdXNlIGEgZmxhZyB0byBwcmV2ZW50IG11bHRpcGxlIGluaXRpYWwgZW1pdHNcbiAgICAgIGxldCBpbml0aWFsR3Jvd0VtaXR0ZWQgPSBmYWxzZTtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgIFNjcm9sbFRyaWdnZXIucmVmcmVzaCgpO1xuICAgICAgICBcbiAgICAgICAgLy8gRW1pdCBsb2dvLWdyb3cgb24gaW5pdGlhbCBsb2FkIChhbmltYXRlcyBsb2dvIHRvIGJpZyBzdGF0ZSlcbiAgICAgICAgLy8gT25seSBlbWl0IG9uY2UsIHdpdGggYSBzaW5nbGUgZGVsYXllZCBhdHRlbXB0IHRvIGNhdGNoIFdlYmZsb3cgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFpbml0aWFsR3Jvd0VtaXR0ZWQpIHtcbiAgICAgICAgICAgIHZlcmlmeUFuZEVtaXQoZ3Jvd0V2ZW50TmFtZSwgJ0luaXRpYWwgbG9hZCAtIGdyb3cnKTtcbiAgICAgICAgICAgIGluaXRpYWxHcm93RW1pdHRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAyMDApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQ3VzdG9tIEN1cnNvclxuICogIFB1cnBvc2U6IFJlcGxhY2Ugc3lzdGVtIGN1cnNvciB3aXRoIGRhcmstYmx1ZSBjaXJjbGU7IHNuYXBweSBzY2FsZSBvbiBjbGlja2FibGVcbiAqICBEYXRlOiAyMDI1LTExLTA0XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q3VzdG9tQ3Vyc29yKG9wdGlvbnMgPSB7fSl7XG4gIC8vIEVuYWJsZSBvbmx5IG9uIGZpbmUgcG9pbnRlcnMgKG1vdXNlLCB0cmFja3BhZCkuIFNraXAgdG91Y2gtb25seSBkZXZpY2VzLlxuICBjb25zdCBoYXNGaW5lUG9pbnRlciA9IHR5cGVvZiB3aW5kb3cubWF0Y2hNZWRpYSA9PT0gJ2Z1bmN0aW9uJyBcbiAgICA/IHdpbmRvdy5tYXRjaE1lZGlhKCcocG9pbnRlcjogZmluZSknKS5tYXRjaGVzXG4gICAgOiB0cnVlO1xuICBpZiAoIWhhc0ZpbmVQb2ludGVyKSByZXR1cm47XG5cbiAgLy8gUHJldmVudCBkdXBsaWNhdGUgaW5pdGlhbGl6YXRpb25cbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY2Nhbm4tY3VzdG9tLWN1cnNvcicpKSByZXR1cm47XG5cbiAgLy8gT25seSB0cmVhdCBhbmNob3JzIGFzIHNjYWxlLXVwIHRhcmdldHMgcGVyIHNwZWNcbiAgY29uc3QgY2xpY2thYmxlU2VsZWN0b3IgPSBvcHRpb25zLmNsaWNrYWJsZVNlbGVjdG9yIHx8ICdhW2hyZWZdJztcblxuICAvLyBJbmplY3QgbWluaW1hbCBDU1NcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5pZCA9ICdtY2Nhbm4tY3VzdG9tLWN1cnNvci1zdHlsZSc7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgIC8qIEhpZGUgbmF0aXZlIGN1cnNvciBldmVyeXdoZXJlLCBpbmNsdWRpbmcgcHNldWRvIGVsZW1lbnRzICovXG4gICAgLmhhcy1jdXN0b20tY3Vyc29yLFxuICAgIC5oYXMtY3VzdG9tLWN1cnNvciAqIHsgY3Vyc29yOiBub25lICFpbXBvcnRhbnQ7IH1cbiAgICAuaGFzLWN1c3RvbS1jdXJzb3IgKjo6YmVmb3JlLFxuICAgIC5oYXMtY3VzdG9tLWN1cnNvciAqOjphZnRlciB7IGN1cnNvcjogbm9uZSAhaW1wb3J0YW50OyB9XG5cbiAgICAuY3VzdG9tLWN1cnNvciB7XG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICBsZWZ0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgICAgd2lkdGg6IDE4cHg7XG4gICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICBiYWNrZ3JvdW5kOiAjMGEzZDkxOyAvKiBkYXJrIGJsdWUgKi9cbiAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTk5OTlweCwgLTk5OTlweCwgMCkgdHJhbnNsYXRlKC01MCUsIC01MCUpIHNjYWxlKDAuMyk7XG4gICAgICBvcGFjaXR5OiAwO1xuICAgICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDEyMG1zIGN1YmljLWJlemllcigwLjIsIDAuOSwgMC4yLCAxKSwgb3BhY2l0eSA4MG1zIGxpbmVhcjtcbiAgICAgIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm0sIG9wYWNpdHk7XG4gICAgfVxuXG4gICAgLmN1c3RvbS1jdXJzb3IuaXMtdmlzaWJsZSB7IG9wYWNpdHk6IDE7IH1cblxuICAgIEBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKSB7XG4gICAgICAuY3VzdG9tLWN1cnNvciB7IHRyYW5zaXRpb246IG5vbmU7IH1cbiAgICB9XG4gIGA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoYXMtY3VzdG9tLWN1cnNvcicpO1xuXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGVsLmlkID0gJ21jY2Fubi1jdXN0b20tY3Vyc29yJztcbiAgZWwuY2xhc3NOYW1lID0gJ2N1c3RvbS1jdXJzb3InO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XG5cbiAgbGV0IG1vdXNlWCA9IDA7XG4gIGxldCBtb3VzZVkgPSAwO1xuICBsZXQgaXNBY3RpdmUgPSBmYWxzZTtcbiAgbGV0IHJhZklkID0gMDtcbiAgbGV0IG5lZWRzUmVuZGVyID0gZmFsc2U7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gdHlwZW9mIHdpbmRvdy5tYXRjaE1lZGlhID09PSAnZnVuY3Rpb24nIFxuICAgID8gd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpJykubWF0Y2hlc1xuICAgIDogZmFsc2U7XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCl7XG4gICAgcmFmSWQgPSAwO1xuICAgIGlmICghbmVlZHNSZW5kZXIpIHJldHVybjtcbiAgICBuZWVkc1JlbmRlciA9IGZhbHNlO1xuICAgIGNvbnN0IHNjYWxlID0gaXNBY3RpdmUgPyAxIDogMC4zO1xuICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgke21vdXNlWH1weCwgJHttb3VzZVl9cHgsIDApIHRyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgke3NjYWxlfSlgO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NoZWR1bGUoKXtcbiAgICBpZiAoIXJhZklkKSByYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0VmlzaWJsZSh2KXtcbiAgICBpZiAodikgZWwuY2xhc3NMaXN0LmFkZCgnaXMtdmlzaWJsZScpO1xuICAgIGVsc2UgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaXMtdmlzaWJsZScpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQWN0aXZlKHRhcmdldCl7XG4gICAgY29uc3QgbWF0Y2ggPSB0YXJnZXQgJiYgdGFyZ2V0LmNsb3Nlc3QgPyB0YXJnZXQuY2xvc2VzdChjbGlja2FibGVTZWxlY3RvcikgOiBudWxsO1xuICAgIGNvbnN0IG5leHQgPSAhIW1hdGNoO1xuICAgIGlmIChuZXh0ICE9PSBpc0FjdGl2ZSkge1xuICAgICAgaWYgKCFwcmVmZXJzUmVkdWNlZCkge1xuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIC8vIEdyb3c6IDQ1bXMgd2l0aCBhIGJvdW5jZS9vdmVyc2hvb3QgZmVlbFxuICAgICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDQ1bXMgY3ViaWMtYmV6aWVyKDAuMzQsIDEuNTYsIDAuNjQsIDEpLCBvcGFjaXR5IDgwbXMgbGluZWFyJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTaHJpbms6IHNuYXBweSBidXQgc2xpZ2h0bHkgbG9uZ2VyIHRvIGZlZWwgbmF0dXJhbFxuICAgICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDEyMG1zIGN1YmljLWJlemllcigwLjIsIDAuOSwgMC4yLCAxKSwgb3BhY2l0eSA4MG1zIGxpbmVhcic7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlzQWN0aXZlID0gbmV4dDtcbiAgICAgIG5lZWRzUmVuZGVyID0gdHJ1ZTtcbiAgICAgIHNjaGVkdWxlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25Qb2ludGVyTW92ZShlKXtcbiAgICBtb3VzZVggPSBlLmNsaWVudFg7XG4gICAgbW91c2VZID0gZS5jbGllbnRZO1xuICAgIHVwZGF0ZUFjdGl2ZShlLnRhcmdldCk7XG4gICAgc2V0VmlzaWJsZSh0cnVlKTtcbiAgICBuZWVkc1JlbmRlciA9IHRydWU7XG4gICAgc2NoZWR1bGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VPdXQoZSl7XG4gICAgaWYgKGUucmVsYXRlZFRhcmdldCA9PSBudWxsKSBzZXRWaXNpYmxlKGZhbHNlKTtcbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIG9uUG9pbnRlck1vdmUsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0Jywgb25Nb3VzZU91dCwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHNldFZpc2libGUoZmFsc2UpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4gc2V0VmlzaWJsZSh0cnVlKSk7XG5cbiAgLy8gUmV0dXJuIGNsZWFudXAgaGFuZGxlXG4gIHJldHVybiBmdW5jdGlvbiBkZXN0cm95KCl7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgb25Qb2ludGVyTW92ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1jdXN0b20tY3Vyc29yJyk7XG4gICAgdHJ5IHsgZWwucmVtb3ZlKCk7IH0gY2F0Y2goXykge31cbiAgICB0cnkgeyBzdHlsZS5yZW1vdmUoKTsgfSBjYXRjaChfKSB7fVxuICB9O1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEFwcCBFbnRyeVxuICogIFB1cnBvc2U6IFdpcmUgbW9kdWxlcyBhbmQgZXhwb3NlIG1pbmltYWwgZmFjYWRlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBpbml0QWNjb3JkaW9uIH0gZnJvbSAnLi9tb2R1bGVzL2FjY29yZGlvbi5qcyc7XG5pbXBvcnQgeyBpbml0TGlnaHRib3ggfSBmcm9tICcuL21vZHVsZXMvbGlnaHRib3guanMnO1xuaW1wb3J0IHsgaW5pdFdlYmZsb3dTY3JvbGxUcmlnZ2VycyB9IGZyb20gJy4vbW9kdWxlcy93ZWJmbG93LXNjcm9sbHRyaWdnZXIuanMnO1xuaW1wb3J0IHsgaW5pdEN1c3RvbUN1cnNvciB9IGZyb20gJy4vbW9kdWxlcy9jdXJzb3IuanMnO1xuXG5mdW5jdGlvbiBwYXRjaFlvdVR1YmVBbGxvd1Rva2Vucygpe1xuICAvLyBNaW5pbWFsIHNldCB0byByZWR1Y2UgcGVybWlzc2lvbiBwb2xpY3kgd2FybmluZ3MgaW5zaWRlIERlc2lnbmVyXG4gIGNvbnN0IHRva2VucyA9IFsnYXV0b3BsYXknLCdlbmNyeXB0ZWQtbWVkaWEnLCdwaWN0dXJlLWluLXBpY3R1cmUnXTtcbiAgY29uc3Qgc2VsID0gW1xuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tXCJdJyxcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dS5iZVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHViZS1ub2Nvb2tpZS5jb21cIl0nLFxuICBdLmpvaW4oJywnKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWwpLmZvckVhY2goKGlmcikgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gKGlmci5nZXRBdHRyaWJ1dGUoJ2FsbG93JykgfHwgJycpLnNwbGl0KCc7JykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBtZXJnZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLmV4aXN0aW5nLCAuLi50b2tlbnNdKSkuam9pbignOyAnKTtcbiAgICBpZnIuc2V0QXR0cmlidXRlKCdhbGxvdycsIG1lcmdlZCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0KG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IGxpZ2h0Ym94Um9vdCA9IG9wdGlvbnMubGlnaHRib3hSb290IHx8ICcjcHJvamVjdC1saWdodGJveCc7XG4gIGluaXRBY2NvcmRpb24oJy5hY2NvcmRlb24nKTtcbiAgaW5pdExpZ2h0Ym94KHsgcm9vdDogbGlnaHRib3hSb290LCBjbG9zZURlbGF5TXM6IDEwMDAgfSk7XG4gIC8vIFJlbHkgb24gQ1NTIHNjcm9sbC1zbmFwIGluIGAucGVyc3BlY3RpdmUtd3JhcHBlcmA7IGRvIG5vdCBhdHRhY2ggSlMgcGFnaW5nXG5cbiAgLy8gQ3VzdG9tIGRhcmstYmx1ZSBjdXJzb3Igd2l0aCBzbmFwcHkgc2NhbGUgb24gY2xpY2thYmxlIHRhcmdldHNcbiAgdHJ5IHsgaW5pdEN1c3RvbUN1cnNvcigpOyB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gQnJpZGdlIEdTQVAgU2Nyb2xsVHJpZ2dlciBcdTIxOTIgV2ViZmxvdyBJWFxuICB0cnkge1xuICAgIGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMoe1xuICAgICAgc2Nyb2xsZXJTZWxlY3RvcjogJy5wZXJzcGVjdGl2ZS13cmFwcGVyJyxcbiAgICAgIGluaXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JyxcbiAgICAgIHNocmlua0V2ZW50TmFtZTogJ2xvZ28tc2hyaW5rJyxcbiAgICAgIGdyb3dFdmVudE5hbWU6ICdsb2dvLWdyb3cnXG4gICAgfSk7XG4gIH0gY2F0Y2goXykge31cblxuICAvLyBOb3RlOiBubyBKUyBzbGlkZSBzbmFwcGluZzsgcmVseSBvbiBDU1Mgc2Nyb2xsLXNuYXAgaW4gYC5wZXJzcGVjdGl2ZS13cmFwcGVyYFxufVxuXG4vLyBFeHBvc2UgYSB0aW55IGdsb2JhbCBmb3IgV2ViZmxvdy9EZXNpZ25lciBob29rc1xuLy8gKEludGVybmFscyByZW1haW4gcHJpdmF0ZSBpbnNpZGUgdGhlIElJRkUgYnVuZGxlKVxuaWYgKCF3aW5kb3cuQXBwKSB3aW5kb3cuQXBwID0ge307XG53aW5kb3cuQXBwLmluaXQgPSBpbml0O1xuXG4vLyBBdXRvLWluaXQgb24gRE9NIHJlYWR5IChzYWZlIGlmIGVsZW1lbnRzIGFyZSBtaXNzaW5nKVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdHJ5IHsgcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKTsgaW5pdCgpOyB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcignW0FwcF0gaW5pdCBlcnJvcicsIGVycik7IH1cbn0pO1xuXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBUU8sV0FBUyxLQUFLLE1BQU0sU0FBUyxRQUFRLFNBQVMsQ0FBQyxHQUFFO0FBQ3RELFFBQUk7QUFBRSxhQUFPLGNBQWMsSUFBSSxZQUFZLE1BQU0sRUFBRSxTQUFTLE1BQU0sWUFBWSxNQUFNLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUN6RyxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBQSxJQUFHLFFBQVE7QUFBQSxJQUFDO0FBQUEsRUFDMUU7OztBQ0ZBLFVBQVEsSUFBSSwyQkFBMkI7QUFFaEMsV0FBUyxjQUFjLFVBQVUsY0FBYTtBQUNuRCxVQUFNLE9BQU8sU0FB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
