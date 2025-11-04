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
    const ACTIVE_TRIGGER_CLASS = "acc-trigger--active";
    const ANIM_PANEL_CLASS = "acc-anim";
    function setAnimPanel(targetPanel) {
      root.querySelectorAll(".acc-list." + ANIM_PANEL_CLASS).forEach((x) => x.classList.remove(ANIM_PANEL_CLASS));
      if (targetPanel) targetPanel.classList.add(ANIM_PANEL_CLASS);
    }
    const wfIx = window.Webflow && window.Webflow.require ? window.Webflow.require("ix3") || window.Webflow.require("ix2") : null;
    dbg("Webflow IX available:", !!wfIx);
    function emitIx(name) {
      try {
        if (wfIx && typeof wfIx.emit === "function") {
          dbg("wfIx.emit", name);
          wfIx.emit(name);
          return true;
        }
      } catch (err) {
        dbg("wfIx.emit error", err && err.message);
      }
      try {
        window.dispatchEvent(new CustomEvent(name));
        dbg("window.dispatchEvent", name);
        return false;
      } catch (_) {
        return false;
      }
    }
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
        p.classList.remove(ANIM_PANEL_CLASS);
        dbg("collapsed", { id: p.id });
      };
      p.addEventListener("transitionend", onEnd);
    }
    function closeSiblings(item) {
      const group = groupOf(item);
      if (!group) return;
      const want = item.matches(".acc-section") ? "acc-section" : "acc-item";
      Array.from(group.children).forEach((sib) => {
        var _a;
        if (sib === item || !sib.classList.contains(want)) return;
        const p = panelOf(sib);
        if (p && (p.dataset.state === "open" || p.dataset.state === "opening")) {
          dbg("close sibling", { kind: want, label: labelOf(sib), id: p.id });
          p.classList.add(ANIM_PANEL_CLASS);
          emitIx("acc-close");
          collapse(p);
          const trig = sib.querySelector(":scope > .acc-trigger");
          trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
          (_a = trig == null ? void 0 : trig.classList) == null ? void 0 : _a.remove(ACTIVE_TRIGGER_CLASS);
        }
      });
    }
    function toggle(item) {
      var _a, _b;
      const p = panelOf(item);
      if (!p) return;
      const trig = item.querySelector(":scope > .acc-trigger");
      const opening = !(p.dataset.state === "open" || p.dataset.state === "opening");
      dbg("toggle", { kind: itemKind(item), opening, label: labelOf(item), id: p.id });
      if (opening) closeSiblings(item);
      if (opening) {
        setAnimPanel(p);
        dbg("emit acc-open", { id: p.id });
        emitIx("acc-open");
        expand(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "true");
        (_a = trig == null ? void 0 : trig.classList) == null ? void 0 : _a.add(ACTIVE_TRIGGER_CLASS);
      } else {
        p.classList.add(ANIM_PANEL_CLASS);
        dbg("emit acc-close", { id: p.id });
        emitIx("acc-close");
        collapse(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
        (_b = trig == null ? void 0 : trig.classList) == null ? void 0 : _b.remove(ACTIVE_TRIGGER_CLASS);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvbW9kdWxlcy9jdXJzb3IuanMiLCAiLi4vc3JjL2FwcC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBFdmVudHMgVXRpbGl0eVxuICogIFB1cnBvc2U6IEVtaXQgYnViYmxpbmcgQ3VzdG9tRXZlbnRzIGNvbXBhdGlibGUgd2l0aCBHU0FQLVVJICh3aW5kb3cgc2NvcGUpXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZW1pdChuYW1lLCB0YXJnZXQgPSB3aW5kb3csIGRldGFpbCA9IHt9KXtcbiAgdHJ5IHsgdGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSwgZGV0YWlsIH0pKTsgfSBjYXRjaCB7fVxuICB0cnkgeyB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQWNjb3JkaW9uIE1vZHVsZVxuICogIFB1cnBvc2U6IEFSSUEsIHNtb290aCB0cmFuc2l0aW9ucywgR1NBUCBldmVudCBob29rc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QWNjb3JkaW9uKHJvb3RTZWwgPSAnLmFjY29yZGVvbicpe1xuICBjb25zdCByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290U2VsKTtcbiAgaWYgKCFyb290KXsgY29uc29sZS5sb2coJ1tBQ0NPUkRJT05dIHJvb3Qgbm90IGZvdW5kJyk7IHJldHVybjsgfVxuXG4gIGNvbnN0IHBhbmVsT2YgPSBpdGVtID0+IGl0ZW0/LnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2MtbGlzdCcpO1xuICBjb25zdCBncm91cE9mID0gaXRlbSA9PiB7XG4gICAgY29uc3QgcGFyZW50ID0gaXRlbS5wYXJlbnRFbGVtZW50O1xuICAgIHJldHVybiBwYXJlbnQ/LmNsYXNzTGlzdC5jb250YWlucygnYWNjLWxpc3QnKSA/IHBhcmVudCA6IHJvb3Q7XG4gIH07XG4gIGNvbnN0IGRiZyA9ICguLi5hcmdzKSA9PiB7IHRyeSB7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXScsIC4uLmFyZ3MpOyB9IGNhdGNoKF8pIHt9IH07XG4gIGNvbnN0IGl0ZW1LaW5kID0gKGVsKSA9PiBlbD8uY2xhc3NMaXN0Py5jb250YWlucygnYWNjLXNlY3Rpb24nKSA/ICdzZWN0aW9uJyA6ICdpdGVtJztcbiAgY29uc3QgbGFiZWxPZiA9IChlbCkgPT4ge1xuICAgIGNvbnN0IHQgPSBlbD8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjYy10cmlnZ2VyJyk7XG4gICAgcmV0dXJuICh0Py50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywnICcpLnNsaWNlKDAsODApO1xuICB9O1xuICBjb25zdCBBQ1RJVkVfVFJJR0dFUl9DTEFTUyA9ICdhY2MtdHJpZ2dlci0tYWN0aXZlJztcbiAgY29uc3QgQU5JTV9QQU5FTF9DTEFTUyA9ICdhY2MtYW5pbSc7XG5cbiAgZnVuY3Rpb24gc2V0QW5pbVBhbmVsKHRhcmdldFBhbmVsKXtcbiAgICAvLyBSZW1vdmUgbWFya2VyIGZyb20gYWxsLCB0aGVuIGFkZCB0byB0aGUgY3VycmVudCB0YXJnZXRcbiAgICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtbGlzdC4nICsgQU5JTV9QQU5FTF9DTEFTUykuZm9yRWFjaCh4ID0+IHguY2xhc3NMaXN0LnJlbW92ZShBTklNX1BBTkVMX0NMQVNTKSk7XG4gICAgaWYgKHRhcmdldFBhbmVsKSB0YXJnZXRQYW5lbC5jbGFzc0xpc3QuYWRkKEFOSU1fUEFORUxfQ0xBU1MpO1xuICB9XG4gIC8vIFdlYmZsb3cgSVggKGl4MyBwcmVmZXJyZWQsIGZhbGxiYWNrIGl4MikuIElmIG5vdCBwcmVzZW50LCB3ZSBzdGlsbCBkaXNwYXRjaCB3aW5kb3cgQ3VzdG9tRXZlbnRcbiAgY29uc3Qgd2ZJeCA9ICh3aW5kb3cuV2ViZmxvdyAmJiB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKVxuICAgID8gKHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MycpIHx8IHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MicpKVxuICAgIDogbnVsbDtcbiAgZGJnKCdXZWJmbG93IElYIGF2YWlsYWJsZTonLCAhIXdmSXgpO1xuICBmdW5jdGlvbiBlbWl0SXgobmFtZSl7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZGJnKCd3Zkl4LmVtaXQnLCBuYW1lKTtcbiAgICAgICAgd2ZJeC5lbWl0KG5hbWUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgZGJnKCd3Zkl4LmVtaXQgZXJyb3InLCBlcnIgJiYgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgLy8gRmFsbGJhY2s6IGJ1YmJsZSBhIEN1c3RvbUV2ZW50IG9uIHdpbmRvdyBmb3IgYW55IGxpc3RlbmVyc1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUpKTtcbiAgICAgIGRiZygnd2luZG93LmRpc3BhdGNoRXZlbnQnLCBuYW1lKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGNhdGNoKF8pIHsgcmV0dXJuIGZhbHNlOyB9XG4gIH1cblxuICAvLyBBUklBIGJvb3RzdHJhcFxuICBjb25zdCB0cmlnZ2VycyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjYy10cmlnZ2VyJyk7XG4gIHRyaWdnZXJzLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjLXNlY3Rpb24sIC5hY2MtaXRlbScpO1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pO1xuICAgIGlmIChwKXtcbiAgICAgIGNvbnN0IHBpZCA9IHAuaWQgfHwgYGFjYy1wYW5lbC0ke2l9YDtcbiAgICAgIHAuaWQgPSBwaWQ7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHBpZCk7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgfSk7XG4gIGRiZygnYm9vdHN0cmFwcGVkJywgdHJpZ2dlcnMubGVuZ3RoLCAndHJpZ2dlcnMnKTtcblxuICBmdW5jdGlvbiBleHBhbmQocCl7XG4gICAgZGJnKCdleHBhbmQgc3RhcnQnLCB7IGlkOiBwLmlkLCBjaGlsZHJlbjogcC5jaGlsZHJlbj8ubGVuZ3RoLCBoOiBwLnNjcm9sbEhlaWdodCB9KTtcbiAgICBwLmNsYXNzTGlzdC5hZGQoJ2lzLWFjdGl2ZScpO1xuICAgIC8vIEVuc3VyZSBkaXJlY3QgY2hpbGQgcm93cyBhcmUgbm90IHN0dWNrIGhpZGRlbiBieSBhbnkgZ2xvYmFsIEdTQVAgaW5pdGlhbCBzdGF0ZVxuICAgIEFycmF5LmZyb20ocC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiAuYWNjLWl0ZW0nKSkuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcbiAgICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndmlzaWJpbGl0eScpO1xuICAgICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd0cmFuc2Zvcm0nKTtcbiAgICB9KTtcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnb3BlbmluZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gJ25vbmUnO1xuICAgICAgICBwLmRhdGFzZXQuc3RhdGUgPSAnb3Blbic7XG4gICAgICAgIGRiZygnZXhwYW5kZWQnLCB7IGlkOiBwLmlkIH0pO1xuICAgICAgfVxuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sbGFwc2UocCl7XG4gICAgY29uc3QgaCA9IHAuc3R5bGUubWF4SGVpZ2h0ID09PSAnbm9uZScgPyBwLnNjcm9sbEhlaWdodCA6IHBhcnNlRmxvYXQocC5zdHlsZS5tYXhIZWlnaHQgfHwgMCk7XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAoaCB8fCBwLnNjcm9sbEhlaWdodCkgKyAncHgnO1xuICAgIHAub2Zmc2V0SGVpZ2h0OyAvLyByZWZsb3dcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9ICcwcHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjbG9zaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgcC5kYXRhc2V0LnN0YXRlID0gJ2NvbGxhcHNlZCc7XG4gICAgICBwLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpO1xuICAgICAgcC5jbGFzc0xpc3QucmVtb3ZlKEFOSU1fUEFORUxfQ0xBU1MpO1xuICAgICAgZGJnKCdjb2xsYXBzZWQnLCB7IGlkOiBwLmlkIH0pO1xuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VTaWJsaW5ncyhpdGVtKXtcbiAgICBjb25zdCBncm91cCA9IGdyb3VwT2YoaXRlbSk7XG4gICAgaWYgKCFncm91cCkgcmV0dXJuO1xuICAgIGNvbnN0IHdhbnQgPSBpdGVtLm1hdGNoZXMoJy5hY2Mtc2VjdGlvbicpID8gJ2FjYy1zZWN0aW9uJyA6ICdhY2MtaXRlbSc7XG4gICAgQXJyYXkuZnJvbShncm91cC5jaGlsZHJlbikuZm9yRWFjaChzaWIgPT4ge1xuICAgICAgaWYgKHNpYiA9PT0gaXRlbSB8fCAhc2liLmNsYXNzTGlzdC5jb250YWlucyh3YW50KSkgcmV0dXJuO1xuICAgICAgY29uc3QgcCA9IHBhbmVsT2Yoc2liKTtcbiAgICAgIGlmIChwICYmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJykpe1xuICAgICAgICBkYmcoJ2Nsb3NlIHNpYmxpbmcnLCB7IGtpbmQ6IHdhbnQsIGxhYmVsOiBsYWJlbE9mKHNpYiksIGlkOiBwLmlkIH0pO1xuICAgICAgICAvLyBUYWcgdGhlIGNsb3NpbmcgcGFuZWwgc28gcmV2ZXJzZSB0YXJnZXRzIG9ubHkgaXRcbiAgICAgICAgcC5jbGFzc0xpc3QuYWRkKEFOSU1fUEFORUxfQ0xBU1MpO1xuICAgICAgICBlbWl0SXgoJ2FjYy1jbG9zZScpO1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgdHJpZyA9IHNpYi5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLXRyaWdnZXInKTtcbiAgICAgICAgdHJpZz8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgIHRyaWc/LmNsYXNzTGlzdD8ucmVtb3ZlKEFDVElWRV9UUklHR0VSX0NMQVNTKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIE5vIGV4cGxpY2l0IGxldmVsIHJlc2V0IG5lZWRlZCB3aXRoIHVuaXZlcnNhbCBncm91cGluZ1xuXG4gIGZ1bmN0aW9uIHRvZ2dsZShpdGVtKXtcbiAgICBjb25zdCBwID0gcGFuZWxPZihpdGVtKTtcbiAgICBpZiAoIXApIHJldHVybjtcbiAgICBjb25zdCB0cmlnID0gaXRlbS5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLXRyaWdnZXInKTtcbiAgICBjb25zdCBvcGVuaW5nID0gIShwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyk7XG4gICAgZGJnKCd0b2dnbGUnLCB7IGtpbmQ6IGl0ZW1LaW5kKGl0ZW0pLCBvcGVuaW5nLCBsYWJlbDogbGFiZWxPZihpdGVtKSwgaWQ6IHAuaWQgfSk7XG4gICAgXG4gICAgaWYgKG9wZW5pbmcpIGNsb3NlU2libGluZ3MoaXRlbSk7XG5cbiAgICBpZiAob3BlbmluZyl7XG4gICAgICAvLyBNYXJrIG9ubHkgdGhpcyBwYW5lbCBmb3IgYW5pbWF0aW9uLCB0aGVuIGVtaXQgb3BlbiBhbmQgZXhwYW5kIGhlaWdodFxuICAgICAgc2V0QW5pbVBhbmVsKHApO1xuICAgICAgZGJnKCdlbWl0IGFjYy1vcGVuJywgeyBpZDogcC5pZCB9KTtcbiAgICAgIGVtaXRJeCgnYWNjLW9wZW4nKTtcbiAgICAgIGV4cGFuZChwKTtcbiAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICB0cmlnPy5jbGFzc0xpc3Q/LmFkZChBQ1RJVkVfVFJJR0dFUl9DTEFTUyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRhZyB0aGlzIHBhbmVsIHNvIHJldmVyc2UgdGFyZ2V0cyBvbmx5IGl0XG4gICAgICBwLmNsYXNzTGlzdC5hZGQoQU5JTV9QQU5FTF9DTEFTUyk7XG4gICAgICBkYmcoJ2VtaXQgYWNjLWNsb3NlJywgeyBpZDogcC5pZCB9KTtcbiAgICAgIGVtaXRJeCgnYWNjLWNsb3NlJyk7XG4gICAgICBjb2xsYXBzZShwKTtcbiAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgdHJpZz8uY2xhc3NMaXN0Py5yZW1vdmUoQUNUSVZFX1RSSUdHRVJfQ0xBU1MpO1xuICAgIH1cbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnanMtcHJlcCcpO1xuICAvLyBDb2xsYXBzZSBhbGwgcGFuZWxzOyB0b3AtbGV2ZWwgaXRlbXMgcmVtYWluIHZpc2libGUgKG5vdCBpbnNpZGUgcGFuZWxzKVxuICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtbGlzdCcpLmZvckVhY2gocCA9PiB7IHAuc3R5bGUubWF4SGVpZ2h0ID0gJzBweCc7IHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnOyB9KTtcbiAgLy8gU2FmZXR5OiBlbnN1cmUgdG9wLWxldmVsIHJvd3MgYXJlIHZpc2libGUgZXZlbiBpZiBhIEdTQVAgdGltZWxpbmUgc2V0IGlubGluZSBzdHlsZXMgZ2xvYmFsbHlcbiAgQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbScpKS5mb3JFYWNoKChyb3cpID0+IHtcbiAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcbiAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3Zpc2liaWxpdHknKTtcbiAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RyYW5zZm9ybScpO1xuICB9KTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnanMtcHJlcCcpKTtcblxuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2MtdHJpZ2dlcicpO1xuICAgIGlmICghdCB8fCAhcm9vdC5jb250YWlucyh0KSkgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjLXNlY3Rpb24sIC5hY2MtaXRlbScpO1xuICAgIGRiZygnY2xpY2snLCB7IGxhYmVsOiAodC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywnICcpLnNsaWNlKDAsODApIH0pO1xuICAgIGl0ZW0gJiYgdG9nZ2xlKGl0ZW0pO1xuICB9KTtcbiAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2MtdHJpZ2dlcicpO1xuICAgIGlmICghdCB8fCAhcm9vdC5jb250YWlucyh0KSkgcmV0dXJuO1xuICAgIGlmIChlLmtleSAhPT0gJ0VudGVyJyAmJiBlLmtleSAhPT0gJyAnKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2Mtc2VjdGlvbiwgLmFjYy1pdGVtJyk7XG4gICAgZGJnKCdrZXlkb3duJywgeyBrZXk6IGUua2V5LCBsYWJlbDogKHQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csJyAnKS5zbGljZSgwLDgwKSB9KTtcbiAgICBpdGVtICYmIHRvZ2dsZShpdGVtKTtcbiAgfSk7XG5cbiAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgZW50cmllcy5mb3JFYWNoKCh7IHRhcmdldDogcCB9KSA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicpeyBwLnN0eWxlLm1heEhlaWdodCA9ICdub25lJzsgfVxuICAgICAgZWxzZSBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpeyBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JzsgfVxuICAgIH0pO1xuICB9KTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLWxpc3QnKS5mb3JFYWNoKHAgPT4gcm8ub2JzZXJ2ZShwKSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgU2Nyb2xsIExvY2sgKEh5YnJpZCwgaU9TLXNhZmUpXG4gKiAgUHVycG9zZTogUmVsaWFibGUgcGFnZSBzY3JvbGwgbG9ja2luZyB3aXRoIGV4YWN0IHJlc3RvcmVcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmxldCBsb2NrcyA9IDA7XG5sZXQgc2F2ZWRZID0gMDtcbmxldCBwcmV2U2Nyb2xsQmVoYXZpb3IgPSAnJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2tTY3JvbGwoKXtcbiAgaWYgKGxvY2tzKyspIHJldHVybjtcbiAgY29uc3QgZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIHByZXZTY3JvbGxCZWhhdmlvciA9IGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yO1xuICBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvciA9ICdhdXRvJztcbiAgc2F2ZWRZID0gd2luZG93LnNjcm9sbFkgfHwgZGUuc2Nyb2xsVG9wIHx8IDA7XG5cbiAgLy8gRml4ZWQtYm9keSArIG1vZGFsLW9wZW4gY2xhc3MgZm9yIENTUyBob29rc1xuICBPYmplY3QuYXNzaWduKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICB0b3A6IGAtJHtzYXZlZFl9cHhgLFxuICAgIGxlZnQ6ICcwJyxcbiAgICByaWdodDogJzAnLFxuICAgIHdpZHRoOiAnMTAwJScsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgIG92ZXJzY3JvbGxCZWhhdmlvcjogJ25vbmUnXG4gIH0pO1xuICB0cnkgeyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLW9wZW4nKTsgfSBjYXRjaCB7fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5sb2NrU2Nyb2xsKHsgZGVsYXlNcyA9IDAgfSA9IHt9KXtcbiAgY29uc3QgcnVuID0gKCkgPT4ge1xuICAgIGlmICgtLWxvY2tzID4gMCkgcmV0dXJuO1xuICAgIGNvbnN0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuYm9keS5zdHlsZSwge1xuICAgICAgcG9zaXRpb246ICcnLCB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCB3aWR0aDogJycsIG92ZXJmbG93OiAnJywgb3ZlcnNjcm9sbEJlaGF2aW9yOiAnJ1xuICAgIH0pO1xuICAgIHRyeSB7IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtb3BlbicpOyB9IGNhdGNoIHt9XG4gICAgZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBwcmV2U2Nyb2xsQmVoYXZpb3IgfHwgJyc7XG4gICAgd2luZG93LnNjcm9sbFRvKDAsIHNhdmVkWSk7XG4gIH07XG4gIGRlbGF5TXMgPyBzZXRUaW1lb3V0KHJ1biwgZGVsYXlNcykgOiBydW4oKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBWaW1lbyBIZWxwZXJcbiAqICBQdXJwb3NlOiBNb3VudC9yZXBsYWNlIFZpbWVvIGlmcmFtZSB3aXRoIHByaXZhY3kgb3B0aW9uc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tWSU1FT10gbW9kdWxlIGxvYWRlZCcpO1xuXG5mdW5jdGlvbiBwYXJzZVZpbWVvSWQoaW5wdXQpe1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG4gIGNvbnN0IHN0ciA9IFN0cmluZyhpbnB1dCkudHJpbSgpO1xuICAvLyBBY2NlcHQgYmFyZSBJRHNcbiAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkgcmV0dXJuIHN0cjtcbiAgLy8gRXh0cmFjdCBmcm9tIGtub3duIFVSTCBmb3Jtc1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKHN0ciwgJ2h0dHBzOi8vZXhhbXBsZS5jb20nKTtcbiAgICBjb25zdCBob3N0ID0gdS5ob3N0bmFtZSB8fCAnJztcbiAgICBpZiAoaG9zdC5pbmNsdWRlcygndmltZW8uY29tJykpe1xuICAgICAgLy8gL3ZpZGVvL3tpZH0gb3IgL3tpZH1cbiAgICAgIGNvbnN0IHBhcnRzID0gdS5wYXRobmFtZS5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIGNvbnN0IGxhc3QgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICAgIGNvbnN0IGlkID0gbGFzdC5tYXRjaCgvXFxkKy8pPy5bMF0gfHwgJyc7XG4gICAgICByZXR1cm4gaWQgfHwgJyc7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50VmltZW8oY29udGFpbmVyLCBpbnB1dElkLCBwYXJhbXMgPSB7fSl7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm47XG4gIGNvbnN0IGlkID0gcGFyc2VWaW1lb0lkKGlucHV0SWQpO1xuICBpZiAoIWlkKXsgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOyByZXR1cm47IH1cbiAgY29uc3QgcXVlcnkgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgZG50OiAxLCAuLi5wYXJhbXMgfSkudG9TdHJpbmcoKTtcbiAgY29uc3Qgc3JjID0gYGh0dHBzOi8vcGxheWVyLnZpbWVvLmNvbS92aWRlby8ke2lkfT8ke3F1ZXJ5fWA7XG4gIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuc3JjID0gc3JjO1xuICAvLyBNaW5pbWFsIGFsbG93LWxpc3QgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluIERlc2lnbmVyXG4gIGlmcmFtZS5hbGxvdyA9ICdhdXRvcGxheTsgZnVsbHNjcmVlbjsgcGljdHVyZS1pbi1waWN0dXJlOyBlbmNyeXB0ZWQtbWVkaWEnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZWJvcmRlcicsICcwJyk7XG4gIGlmcmFtZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBMaWdodGJveCBNb2R1bGVcbiAqICBQdXJwb3NlOiBGb2N1cyB0cmFwLCBvdXRzaWRlLWNsaWNrLCBpbmVydC9hcmlhIGZhbGxiYWNrLCByZS1lbnRyYW5jeVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmltcG9ydCB7IGxvY2tTY3JvbGwsIHVubG9ja1Njcm9sbCB9IGZyb20gJy4uL2NvcmUvc2Nyb2xsbG9jay5qcyc7XG5pbXBvcnQgeyBtb3VudFZpbWVvIH0gZnJvbSAnLi92aW1lby5qcyc7XG5jb25zb2xlLmxvZygnW0xJR0hUQk9YXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0TGlnaHRib3goeyByb290ID0gJyNwcm9qZWN0LWxpZ2h0Ym94JywgY2xvc2VEZWxheU1zID0gMTAwMCB9ID0ge30pe1xuICBjb25zdCBsYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdCk7XG4gIGlmICghbGIpeyBjb25zb2xlLmxvZygnW0xJR0hUQk9YXSBub3QgZm91bmQnKTsgcmV0dXJuOyB9XG5cbiAgLy8gRW5zdXJlIGJhc2VsaW5lIGRpYWxvZyBhMTF5IGF0dHJpYnV0ZXNcbiAgbGIuc2V0QXR0cmlidXRlKCdyb2xlJywgbGIuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHwgJ2RpYWxvZycpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnKSB8fCAndHJ1ZScpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgbGIuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpIHx8ICd0cnVlJyk7XG5cbiAgY29uc3QgaW5uZXIgPSBsYi5xdWVyeVNlbGVjdG9yKCcucHJvamVjdC1saWdodGJveF9faW5uZXInKTtcbiAgY29uc3QgdmlkZW9BcmVhID0gbGIucXVlcnlTZWxlY3RvcignLnZpZGVvLWFyZWEnKTtcbiAgY29uc3Qgc2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJyk7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuXG4gIGxldCBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgbGV0IGxhc3RGb2N1cyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gc2V0UGFnZUluZXJ0KG9uKXtcbiAgICBjb25zdCBzaWJsaW5ncyA9IEFycmF5LmZyb20oZG9jdW1lbnQuYm9keS5jaGlsZHJlbikuZmlsdGVyKG4gPT4gbiAhPT0gbGIpO1xuICAgIHNpYmxpbmdzLmZvckVhY2gobiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoJ2luZXJ0JyBpbiBuKSBuLmluZXJ0ID0gISFvbjtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGlmIChvbikgbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIGVsc2Ugbi5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFwRm9jdXMoZSl7XG4gICAgaWYgKGUua2V5ICE9PSAnVGFiJykgcmV0dXJuO1xuICAgIGNvbnN0IGZvY3VzYWJsZXMgPSBsYi5xdWVyeVNlbGVjdG9yQWxsKFtcbiAgICAgICdhW2hyZWZdJywnYnV0dG9uJywnaW5wdXQnLCdzZWxlY3QnLCd0ZXh0YXJlYScsXG4gICAgICAnW3RhYmluZGV4XTpub3QoW3RhYmluZGV4PVwiLTFcIl0pJ1xuICAgIF0uam9pbignLCcpKTtcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuZnJvbShmb2N1c2FibGVzKS5maWx0ZXIoZWwgPT4gIWVsLmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSAmJiAhZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDApeyBlLnByZXZlbnREZWZhdWx0KCk7IChpbm5lciB8fCBsYikuZm9jdXMoKTsgcmV0dXJuOyB9XG4gICAgY29uc3QgZmlyc3QgPSBsaXN0WzBdO1xuICAgIGNvbnN0IGxhc3QgPSBsaXN0W2xpc3QubGVuZ3RoIC0gMV07XG4gICAgaWYgKGUuc2hpZnRLZXkgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZmlyc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGxhc3QuZm9jdXMoKTsgfVxuICAgIGVsc2UgaWYgKCFlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGxhc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGZpcnN0LmZvY3VzKCk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5Gcm9tU2xpZGUoc2xpZGUpe1xuICAgIGlmIChvcGVuR3VhcmQpIHJldHVybjtcbiAgICBvcGVuR3VhcmQgPSB0cnVlO1xuICAgIGxhc3RGb2N1cyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgOiBudWxsO1xuXG4gICAgY29uc3QgdmlkZW8gPSBzbGlkZT8uZGF0YXNldD8udmlkZW8gfHwgJyc7XG4gICAgY29uc3QgdGl0bGUgPSBzbGlkZT8uZGF0YXNldD8udGl0bGUgfHwgJyc7XG4gICAgY29uc3QgdGV4dCAgPSBzbGlkZT8uZGF0YXNldD8udGV4dCAgfHwgJyc7XG5cbiAgICBjb25zdCBpc0Rlc2lnbmVyID0gL1xcLndlYmZsb3dcXC5jb20kLy50ZXN0KGxvY2F0aW9uLmhvc3RuYW1lKSB8fCAvY2FudmFzXFwud2ViZmxvd1xcLmNvbSQvLnRlc3QobG9jYXRpb24uaG9zdG5hbWUpO1xuICAgIGNvbnN0IGF1dG9wbGF5ID0gaXNEZXNpZ25lciA/IDAgOiAxOyAvLyBhdm9pZCBhdXRvcGxheSB3YXJuaW5ncyBpbnNpZGUgV2ViZmxvdyBEZXNpZ25lclxuICAgIGlmICh2aWRlb0FyZWEpIG1vdW50VmltZW8odmlkZW9BcmVhLCB2aWRlbywgeyBhdXRvcGxheSwgbXV0ZWQ6IDEsIGNvbnRyb2xzOiAwLCBiYWNrZ3JvdW5kOiAxLCBwbGF5c2lubGluZTogMSwgZG50OiAxIH0pO1xuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3BlbicsICd0cnVlJyk7XG4gICAgc2V0UGFnZUluZXJ0KHRydWUpO1xuICAgIGxvY2tTY3JvbGwoKTtcblxuICAgIGxiLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAoaW5uZXIgfHwgbGIpLmZvY3VzKCk7XG5cbiAgICBlbWl0KCdMSUdIVEJPWF9PUEVOJywgbGIsIHsgdmlkZW8sIHRpdGxlLCB0ZXh0IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVxdWVzdENsb3NlKCl7XG4gICAgaWYgKCFvcGVuR3VhcmQpIHJldHVybjtcbiAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRScsIGxiKTtcbiAgICBpZiAocHJlZmVyc1JlZHVjZWQpe1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogMCB9KTtcbiAgICAgIGVtaXQoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgbGIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmxvY2tTY3JvbGwoeyBkZWxheU1zOiBjbG9zZURlbGF5TXMgfSk7XG4gICAgfVxuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGxiLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1vcGVuJyk7XG4gICAgc2V0UGFnZUluZXJ0KGZhbHNlKTtcbiAgICBpZiAodmlkZW9BcmVhKSB2aWRlb0FyZWEuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGxhc3RGb2N1cyAmJiBkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGxhc3RGb2N1cykpIGxhc3RGb2N1cy5mb2N1cygpO1xuICAgIG9wZW5HdWFyZCA9IGZhbHNlO1xuICB9XG5cbiAgc2xpZGVzLmZvckVhY2goc2xpZGUgPT4gc2xpZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBvcGVuRnJvbVNsaWRlKHNsaWRlKSkpO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgaWYgKGlubmVyICYmICFlLnRhcmdldC5jbG9zZXN0KCcucHJvamVjdC1saWdodGJveF9faW5uZXInKSkgcmVxdWVzdENsb3NlKCk7XG4gICAgZWxzZSBpZiAoIWlubmVyICYmIGUudGFyZ2V0ID09PSBsYikgcmVxdWVzdENsb3NlKCk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBpZiAobGIuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nKSA9PT0gJ3RydWUnKXtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHJlcXVlc3RDbG9zZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSAnVGFiJykgdHJhcEZvY3VzKGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgbGIuYWRkRXZlbnRMaXN0ZW5lcignTElHSFRCT1hfQ0xPU0VEX0RPTkUnLCAoKSA9PiB1bmxvY2tTY3JvbGwoKSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgV2ViZmxvdyBTY3JvbGxUcmlnZ2VyIEJyaWRnZVxuICogIFB1cnBvc2U6IFRyaWdnZXIgV2ViZmxvdyBJWCBpbnRlcmFjdGlvbnMgdmlhIEdTQVAgU2Nyb2xsVHJpZ2dlclxuICogIERhdGU6IDIwMjUtMTAtMzBcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tXRUJGTE9XXSBtb2R1bGUgbG9hZGVkJyk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVggYnJpZGdlLlxuICpcbiAqIEJlaGF2aW9yOlxuICogIDEuIE9uIGxvYWQ6IGVtaXQgbG9nby1ncm93IHRvIGFuaW1hdGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcgKGVuc3VyZXMgbG9nbyBzdGFydHMgaW4gYmlnIHN0YXRlKVxuICogIDIuIFNjcm9sbCBkb3duIHBhc3QgZmlyc3Qgc2xpZGU6IGVtaXQgbG9nby1zaHJpbmsgKGJpZyBcdTIxOTIgc21hbGwpXG4gKiAgMy4gU3RhcnQgc2Nyb2xsaW5nIHVwIChtaWRkbGUgc2VjdGlvbik6IGVtaXQgbG9nby1ncm93IGltbWVkaWF0ZWx5IChzbWFsbCBcdTIxOTIgYmlnKVxuICogIDQuIFJlYWNoIGxhc3Qgc2xpZGU6IGVtaXQgbG9nby1ncm93IChzbWFsbCBcdTIxOTIgYmlnLCBsb2dvIGdyb3dzIGF0IGJvdHRvbSlcbiAqICA1LiBTY3JvbGwgdXAgZnJvbSBsYXN0IHNsaWRlOiBlbWl0IGxvZ28tc2hyaW5rIChiaWcgXHUyMTkyIHNtYWxsKVxuICogIDYuIFJldHVybiB0byB0b3A6IGVtaXQgbG9nby1zdGFydCAoanVtcCB0byAwcywgYmFjayB0byBiaWcgc3RhdGljIHN0YXRlKVxuICpcbiAqIFJlcXVpcmVtZW50cyBpbiBXZWJmbG93OlxuICogIC0gbG9nby1zdGFydDogVXNlcyB0aGUgc2FtZSB0aW1lbGluZSBhcyBsb2dvLXNocmluay4gQ29udHJvbCBcdTIxOTIgSnVtcCB0byAwcywgdGhlbiBTdG9wLlxuICogICAgICAgICAgICAgICBVc2VkIHdoZW4gcmV0dXJuaW5nIHRvIHRvcCAob25FbnRlckJhY2spOyB3b3JrcyBiZWNhdXNlIHRpbWVsaW5lIGlzIGluaXRpYWxpemVkIGJ5IHRoZW4uXG4gKiAgICAgICAgICAgICAgIElmIG9taXR0ZWQsIGV2ZW50IGlzIHN0aWxsIGVtaXR0ZWQgYnV0IHNhZmVseSBpZ25vcmVkIGlmIG5vdCBjb25maWd1cmVkLlxuICogIC0gbG9nby1zaHJpbms6IENvbnRyb2wgXHUyMTkyIFBsYXkgZnJvbSBzdGFydCAoYmlnIFx1MjE5MiBzbWFsbCBhbmltYXRpb24pXG4gKiAgLSBsb2dvLWdyb3c6IENvbnRyb2wgXHUyMTkyIFBsYXkgZnJvbSBzdGFydCAoc21hbGwgXHUyMTkyIGJpZyBhbmltYXRpb24pXG4gKiAgICAgICAgICAgICAgIFRoaXMgaXMgdHJpZ2dlcmVkIG9uIGluaXRpYWwgcGFnZSBsb2FkIHRvIGFuaW1hdGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcuXG4gKiAgICAgICAgICAgICAgIEVuc3VyZSB5b3VyIGxvZ28gQ1NTIHNob3dzIGl0IGluIHRoZSBcInNtYWxsXCIgc3RhdGUgaW5pdGlhbGx5IChtYXRjaGluZyB0aGUgZW5kIHN0YXRlXG4gKiAgICAgICAgICAgICAgIG9mIHNocmluayBvciBzdGFydCBzdGF0ZSBvZiBncm93KSwgc28gdGhlIGdyb3cgYW5pbWF0aW9uIGhhcyBzb21ld2hlcmUgdG8gYW5pbWF0ZSBmcm9tLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2Nyb2xsZXJTZWxlY3Rvcj0nLnBlcnNwZWN0aXZlLXdyYXBwZXInXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRyaXZlclNlbGVjdG9yXSAtIERlZmF1bHRzIHRvIGZpcnN0IC5zbGlkZSBpbiBzY3JvbGxlclxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmluaXRFdmVudE5hbWU9J2xvZ28tc3RhcnQnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNocmlua0V2ZW50TmFtZT0nbG9nby1zaHJpbmsnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmdyb3dFdmVudE5hbWU9J2xvZ28tZ3JvdyddXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm1hcmtlcnM9ZmFsc2VdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IHNjcm9sbGVyU2VsZWN0b3IgPSBvcHRpb25zLnNjcm9sbGVyU2VsZWN0b3IgfHwgJy5wZXJzcGVjdGl2ZS13cmFwcGVyJztcbiAgY29uc3QgaW5pdEV2ZW50TmFtZSA9IG9wdGlvbnMuaW5pdEV2ZW50TmFtZSB8fCAnbG9nby1zdGFydCc7XG4gIGNvbnN0IHNocmlua0V2ZW50TmFtZSA9IG9wdGlvbnMuc2hyaW5rRXZlbnROYW1lIHx8IG9wdGlvbnMucGxheUV2ZW50TmFtZSB8fCAnbG9nby1zaHJpbmsnO1xuICBjb25zdCBncm93RXZlbnROYW1lID0gb3B0aW9ucy5ncm93RXZlbnROYW1lIHx8ICdsb2dvLWdyb3cnO1xuICBjb25zdCBtYXJrZXJzID0gISFvcHRpb25zLm1hcmtlcnM7XG5cbiAgZnVuY3Rpb24gb25XaW5kb3dMb2FkKGNiKXtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykgeyBzZXRUaW1lb3V0KGNiLCAwKTsgcmV0dXJuOyB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBjYiwgeyBvbmNlOiB0cnVlIH0pO1xuICB9XG5cbiAgb25XaW5kb3dMb2FkKGZ1bmN0aW9uKCl7XG4gICAgY29uc3QgV2ViZmxvdyA9IHdpbmRvdy5XZWJmbG93IHx8IFtdO1xuICAgIFxuICAgIFdlYmZsb3cucHVzaChmdW5jdGlvbigpe1xuICAgICAgLy8gR2V0IFdlYmZsb3cgSVggQVBJICh0cnkgaXgzIGZpcnN0LCBmYWxsYmFjayB0byBpeDIpXG4gICAgICBjb25zdCB3Zkl4ID0gKHdpbmRvdy5XZWJmbG93ICYmIHdpbmRvdy5XZWJmbG93LnJlcXVpcmUpIFxuICAgICAgICA/ICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSlcbiAgICAgICAgOiBudWxsO1xuICAgICAgY29uc3QgU2Nyb2xsVHJpZ2dlciA9IHdpbmRvdy5TY3JvbGxUcmlnZ2VyO1xuICAgICAgXG4gICAgICBpZiAoIXdmSXggfHwgIVNjcm9sbFRyaWdnZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IHNjcm9sbGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzY3JvbGxlclNlbGVjdG9yKTtcbiAgICAgIGlmICghc2Nyb2xsZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIEZpbmQgZmlyc3QgLnNsaWRlIGluc2lkZSB0aGUgc2Nyb2xsZXIgKGZvciB0b3AgZGV0ZWN0aW9uKVxuICAgICAgY29uc3QgZHJpdmVyID0gc2Nyb2xsZXIucXVlcnlTZWxlY3RvcignLnNsaWRlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNsaWRlJyk7XG4gICAgICBpZiAoIWRyaXZlcikgeyBcbiAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIERyaXZlciBzbGlkZSBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuOyBcbiAgICAgIH1cblxuICAgICAgLy8gRmluZCBsYXN0IC5zbGlkZSBpbnNpZGUgdGhlIHNjcm9sbGVyIChmb3IgYm90dG9tIGRldGVjdGlvbilcbiAgICAgIGNvbnN0IHNsaWRlcyA9IEFycmF5LmZyb20oc2Nyb2xsZXIucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJykpO1xuICAgICAgY29uc3QgbGFzdFNsaWRlID0gc2xpZGVzLmxlbmd0aCA+IDAgPyBzbGlkZXNbc2xpZGVzLmxlbmd0aCAtIDFdIDogbnVsbDtcbiAgICAgIGlmICghbGFzdFNsaWRlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW1dFQkZMT1ddIE5vIHNsaWRlcyBmb3VuZCwgbGFzdCBzbGlkZSBkZXRlY3Rpb24gZGlzYWJsZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTZXR1cCBjb21wbGV0ZTonLCB7IFxuICAgICAgICBzY3JvbGxlcjogISFzY3JvbGxlciwgXG4gICAgICAgIGRyaXZlcjogISFkcml2ZXIsXG4gICAgICAgIGxhc3RTbGlkZTogISFsYXN0U2xpZGUsXG4gICAgICAgIHRvdGFsU2xpZGVzOiBzbGlkZXMubGVuZ3RoLFxuICAgICAgICB3Zkl4OiAhIXdmSXgsIFxuICAgICAgICBTY3JvbGxUcmlnZ2VyOiAhIVNjcm9sbFRyaWdnZXIsXG4gICAgICAgIGluaXRFdmVudDogaW5pdEV2ZW50TmFtZSxcbiAgICAgICAgc2hyaW5rRXZlbnQ6IHNocmlua0V2ZW50TmFtZSxcbiAgICAgICAgZ3Jvd0V2ZW50OiBncm93RXZlbnROYW1lXG4gICAgICB9KTtcblxuICAgICAgLy8gVHJhY2sgc2Nyb2xsIHN0YXRlOiBhcmUgd2UgYmVsb3cgdGhlIHRvcCB6b25lPyBkaWQgd2Ugc2hyaW5rIGFscmVhZHk/IGRpZCB3ZSBncm93IGFscmVhZHk/XG4gICAgICAvLyBBbHNvIHRyYWNrIGxhc3Qgc2xpZGUgc3RhdGVcbiAgICAgIGxldCBpc0JlbG93VG9wID0gZmFsc2U7XG4gICAgICBsZXQgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICBsZXQgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgIGxldCBpc0F0TGFzdFNsaWRlID0gZmFsc2U7XG4gICAgICBsZXQgaGFzR3Jvd25BdExhc3QgPSBmYWxzZTtcblxuICAgICAgLy8gTWFpbiBTY3JvbGxUcmlnZ2VyOiB3YXRjaGVzIHdoZW4gZmlyc3Qgc2xpZGUgbGVhdmVzL2VudGVycyB0b3Agem9uZVxuICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICB0cmlnZ2VyOiBkcml2ZXIsXG4gICAgICAgIHNjcm9sbGVyOiBzY3JvbGxlcixcbiAgICAgICAgc3RhcnQ6ICd0b3AgdG9wJyxcbiAgICAgICAgZW5kOiAndG9wIC0xMCUnLCAvLyBTaG9ydCByYW5nZSBmb3IgaW1tZWRpYXRlIHRyaWdnZXJcbiAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgXG4gICAgICAgIG9uTGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHBhc3QgdG9wIFx1MjE5MiBzaHJpbmsgb25jZSAob25seSB3aGVuIGxlYXZpbmcsIG5vdCB3aGVuIGFscmVhZHkgYmVsb3cpXG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgb25seSBmaXJlIHdoZW4gY3Jvc3NpbmcgZnJvbSBcImF0IHRvcFwiIHRvIFwiYmVsb3cgdG9wXCJcbiAgICAgICAgICBpZiAoIWlzQmVsb3dUb3AgJiYgIWhhc1NocnVuaykge1xuICAgICAgICAgICAgaXNCZWxvd1RvcCA9IHRydWU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc2hyaW5rIChzY3JvbGxlZCBkb3duIHBhc3QgZmlyc3Qgc2xpZGUpOicsIHNocmlua0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChzaHJpbmtFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBoYXNTaHJ1bmsgPSB0cnVlO1xuICAgICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlOyAvLyBSZXNldCBncm93IGZsYWcgd2hlbiB3ZSBzaHJpbmtcbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBvbkVudGVyQmFjazogKCkgPT4ge1xuICAgICAgICAgIC8vIFNjcm9sbGVkIGJhY2sgdXAgdG8gdG9wIFx1MjE5MiBqdW1wIHNocmluayB0aW1lbGluZSB0byAwcyAoYmlnIHN0YXRlKSBhbmQgc3RvcFxuICAgICAgICAgIGlzQmVsb3dUb3AgPSBmYWxzZTtcbiAgICAgICAgICBoYXNTaHJ1bmsgPSBmYWxzZTtcbiAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgIGlzQXRMYXN0U2xpZGUgPSBmYWxzZTtcbiAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc3RhcnQgKHJldHVybiB0byB0b3ApOicsIGluaXRFdmVudE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSB3Zkl4IGF2YWlsYWJsZTonLCAhIXdmSXgsICdlbWl0IGF2YWlsYWJsZTonLCB0eXBlb2Ygd2ZJeD8uZW1pdCk7XG4gICAgICAgICAgICBpZiAod2ZJeCAmJiB0eXBlb2Ygd2ZJeC5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChpbml0RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSByZXR1cm4tdG8tdG9wIGV2ZW50IGVtaXR0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gQ2Fubm90IGVtaXQgcmV0dXJuLXRvLXRvcDogd2ZJeC5lbWl0IG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIEVycm9yIGVtaXR0aW5nIHJldHVybi10by10b3A6JywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBMYXN0IHNsaWRlIFNjcm9sbFRyaWdnZXI6IHdhdGNoZXMgd2hlbiBsYXN0IHNsaWRlIGVudGVycy9sZWF2ZXMgdmlld3BvcnRcbiAgICAgIGlmIChsYXN0U2xpZGUpIHtcbiAgICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICAgIHRyaWdnZXI6IGxhc3RTbGlkZSxcbiAgICAgICAgICBzY3JvbGxlcjogc2Nyb2xsZXIsXG4gICAgICAgICAgc3RhcnQ6ICd0b3AgYm90dG9tJywgLy8gTGFzdCBzbGlkZSBlbnRlcnMgZnJvbSBib3R0b20gb2Ygdmlld3BvcnRcbiAgICAgICAgICBlbmQ6ICdib3R0b20gdG9wJywgLy8gTGFzdCBzbGlkZSBsZWF2ZXMgdG9wIG9mIHZpZXdwb3J0XG4gICAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgICBcbiAgICAgICAgICBvbkVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHRvIGxhc3Qgc2xpZGUgXHUyMTkyIGdyb3cgb25jZSAob25seSB3aGVuIGVudGVyaW5nLCBub3Qgd2hlbiBhbHJlYWR5IHRoZXJlKVxuICAgICAgICAgICAgaWYgKCFpc0F0TGFzdFNsaWRlICYmICFoYXNHcm93bkF0TGFzdCkge1xuICAgICAgICAgICAgICBpc0F0TGFzdFNsaWRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAocmVhY2hlZCBsYXN0IHNsaWRlKTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgaGFzR3Jvd25BdExhc3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pZGRsZSBzZWN0aW9uIGZsYWdzIHNpbmNlIHdlJ3JlIGF0IHRoZSBsYXN0IHNsaWRlXG4gICAgICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgICAgb25MZWF2ZUJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGVkIFVQIGZyb20gbGFzdCBzbGlkZSAobGVhdmluZyBiYWNrd2FyZCkgXHUyMTkyIHNocmluayBvbmNlXG4gICAgICAgICAgICBpZiAoaXNBdExhc3RTbGlkZSAmJiBoYXNHcm93bkF0TGFzdCkge1xuICAgICAgICAgICAgICBpc0F0TGFzdFNsaWRlID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IHNocmluayAoc2Nyb2xsaW5nIHVwIGZyb20gbGFzdCBzbGlkZSk6Jywgc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGhhc1NocnVuayA9IHRydWU7IC8vIFdlJ3JlIG5vdyBpbiB0aGUgbWlkZGxlIHNlY3Rpb24gd2l0aCBsb2dvIHNtYWxsXG4gICAgICAgICAgICAgICAgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbXBsZSBzY3JvbGwgZGlyZWN0aW9uIHdhdGNoZXIgZm9yIGltbWVkaWF0ZSBncm93IG9uIHVwd2FyZCBzY3JvbGxcbiAgICAgIC8vIE9ubHkgdHJpZ2dlcnMgZ3JvdyB3aGVuOlxuICAgICAgLy8gLSBXZSdyZSBiZWxvdyB0aGUgdG9wIHpvbmUgKGlzQmVsb3dUb3ApXG4gICAgICAvLyAtIFdlJ3ZlIHNocnVuayAoaGFzU2hydW5rKVxuICAgICAgLy8gLSBXZSdyZSBzY3JvbGxpbmcgdXAgKGRpcmVjdGlvbiA9PT0gLTEpXG4gICAgICAvLyAtIFdlIGp1c3Qgc3RhcnRlZCBzY3JvbGxpbmcgdXAgKGxhc3REaXJlY3Rpb24gIT09IC0xLCBtZWFuaW5nIHdlIHdlcmVuJ3QgYWxyZWFkeSBzY3JvbGxpbmcgdXApXG4gICAgICAvLyAtIFdlIGhhdmVuJ3QgYWxyZWFkeSBncm93biAoaGFzR3Jvd24pXG4gICAgICBsZXQgbGFzdFNjcm9sbFRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcDtcbiAgICAgIGxldCBsYXN0RGlyZWN0aW9uID0gMDsgLy8gLTEgPSB1cCwgMSA9IGRvd24sIDAgPSB1bmtub3duXG4gICAgICBcbiAgICAgIFNjcm9sbFRyaWdnZXIuY3JlYXRlKHtcbiAgICAgICAgc2Nyb2xsZXI6IHNjcm9sbGVyLFxuICAgICAgICBzdGFydDogMCxcbiAgICAgICAgZW5kOiAoKSA9PiBTY3JvbGxUcmlnZ2VyLm1heFNjcm9sbChzY3JvbGxlciksXG4gICAgICAgIG9uVXBkYXRlOiAoc2VsZikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY3JvbGxUb3AgPSBzY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gY3VycmVudFNjcm9sbFRvcCA+IGxhc3RTY3JvbGxUb3AgPyAxIDogY3VycmVudFNjcm9sbFRvcCA8IGxhc3RTY3JvbGxUb3AgPyAtMSA6IGxhc3REaXJlY3Rpb247XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gR3JvdyBvbmx5IHdoZW4gc2Nyb2xsaW5nIHVwIGZyb20gYmVsb3cgdG9wIChtaWRkbGUgc2VjdGlvbiksIGFuZCB3ZSd2ZSBzaHJ1bmssIGFuZCB3ZSBoYXZlbid0IGdyb3duIHlldFxuICAgICAgICAgIC8vIERvbid0IHRyaWdnZXIgaWYgd2UncmUgYXQgdGhlIGxhc3Qgc2xpZGUgKHRoYXQncyBoYW5kbGVkIHNlcGFyYXRlbHkpXG4gICAgICAgICAgaWYgKGlzQmVsb3dUb3AgJiYgIWlzQXRMYXN0U2xpZGUgJiYgaGFzU2hydW5rICYmICFoYXNHcm93biAmJiBkaXJlY3Rpb24gPT09IC0xICYmIGxhc3REaXJlY3Rpb24gIT09IC0xKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAoc2Nyb2xsIHVwIGluIG1pZGRsZSBzZWN0aW9uKTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KGdyb3dFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBoYXNHcm93biA9IHRydWU7IC8vIFNldCBmbGFnIHNvIHdlIGRvbid0IGdyb3cgYWdhaW4gdW50aWwgd2Ugc2hyaW5rXG4gICAgICAgICAgICAgIGhhc1NocnVuayA9IGZhbHNlOyAvLyBSZXNldCBzaHJpbmsgZmxhZyBhZnRlciBncm93aW5nXG4gICAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFJlc2V0IGdyb3cgZmxhZyBpZiB3ZSBzdGFydCBzY3JvbGxpbmcgZG93biBhZ2FpbiAoYnV0IG9ubHkgaWYgd2UncmUgc3RpbGwgYmVsb3cgdG9wIGFuZCBub3QgYXQgbGFzdCBzbGlkZSlcbiAgICAgICAgICBpZiAoaXNCZWxvd1RvcCAmJiAhaXNBdExhc3RTbGlkZSAmJiBoYXNHcm93biAmJiBkaXJlY3Rpb24gPT09IDEgJiYgbGFzdERpcmVjdGlvbiAhPT0gMSkge1xuICAgICAgICAgICAgLy8gVXNlciBzdGFydGVkIHNjcm9sbGluZyBkb3duIGFnYWluIC0gcmVzZXQgc28gd2UgY2FuIHNocmluayBhZ2FpblxuICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBSZXNldCBmbGFncyAtIHJlYWR5IHRvIHNocmluayBhZ2FpbicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBsYXN0U2Nyb2xsVG9wID0gY3VycmVudFNjcm9sbFRvcDtcbiAgICAgICAgICBsYXN0RGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTY3JvbGxUcmlnZ2VyIGluaXRpYWxpemVkJyk7XG4gICAgICBcbiAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCBldmVudHMgZXhpc3QgaW4gV2ViZmxvdyBieSBjaGVja2luZyBpZiBlbWl0IHN1Y2NlZWRzXG4gICAgICAvLyBOb3RlOiBXZWJmbG93IGVtaXQgZG9lc24ndCB0aHJvdyBlcnJvcnMgZm9yIG1pc3NpbmcgZXZlbnRzLCBidXQgd2UgY2FuIGxvZyBhdHRlbXB0c1xuICAgICAgY29uc3QgdmVyaWZ5QW5kRW1pdCA9IChldmVudE5hbWUsIGRlc2NyaXB0aW9uKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAke2Rlc2NyaXB0aW9ufTpgLCBldmVudE5hbWUpO1xuICAgICAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdmSXguZW1pdChldmVudE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSBcdTI3MTMgRW1pdHRlZCAke2V2ZW50TmFtZX0gLSBJZiBub3RoaW5nIGhhcHBlbnMsIGNoZWNrIFdlYmZsb3cgY29uZmlnOmApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDEuIEV2ZW50IG5hbWUgbXVzdCBiZSBleGFjdGx5OiBcIiR7ZXZlbnROYW1lfVwiYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMi4gQ29udHJvbCBtdXN0IE5PVCBiZSBcIk5vIEFjdGlvblwiYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMy4gTXVzdCB0YXJnZXQgdGhlIGxvZ28gZWxlbWVudGApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDQuIFRpbWVsaW5lIG11c3QgYmUgc2V0IGNvcnJlY3RseWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXRUJGTE9XXSBcdTI3MTcgd2ZJeC5lbWl0IG5vdCBhdmFpbGFibGVgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW1dFQkZMT1ddIFx1MjcxNyBFcnJvciBlbWl0dGluZyAke2V2ZW50TmFtZX06YCwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIFdhaXQgZm9yIFNjcm9sbFRyaWdnZXIgdG8gcmVmcmVzaCwgdGhlbiB0cmlnZ2VyIGxvZ28tZ3JvdyBvbiBpbml0aWFsIGxvYWRcbiAgICAgIC8vIFRoaXMgYW5pbWF0ZXMgdGhlIGxvZ28gZnJvbSBzbWFsbCBcdTIxOTIgYmlnIG9uIHBhZ2UgbG9hZCwgZW5zdXJpbmcgaXQgc3RhcnRzIGluIHRoZSBiaWcgc3RhdGVcbiAgICAgIC8vIFdlIG9ubHkgZW1pdCBvbmNlIC0gdXNlIGEgZmxhZyB0byBwcmV2ZW50IG11bHRpcGxlIGluaXRpYWwgZW1pdHNcbiAgICAgIGxldCBpbml0aWFsR3Jvd0VtaXR0ZWQgPSBmYWxzZTtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgIFNjcm9sbFRyaWdnZXIucmVmcmVzaCgpO1xuICAgICAgICBcbiAgICAgICAgLy8gRW1pdCBsb2dvLWdyb3cgb24gaW5pdGlhbCBsb2FkIChhbmltYXRlcyBsb2dvIHRvIGJpZyBzdGF0ZSlcbiAgICAgICAgLy8gT25seSBlbWl0IG9uY2UsIHdpdGggYSBzaW5nbGUgZGVsYXllZCBhdHRlbXB0IHRvIGNhdGNoIFdlYmZsb3cgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFpbml0aWFsR3Jvd0VtaXR0ZWQpIHtcbiAgICAgICAgICAgIHZlcmlmeUFuZEVtaXQoZ3Jvd0V2ZW50TmFtZSwgJ0luaXRpYWwgbG9hZCAtIGdyb3cnKTtcbiAgICAgICAgICAgIGluaXRpYWxHcm93RW1pdHRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAyMDApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQ3VzdG9tIEN1cnNvclxuICogIFB1cnBvc2U6IFJlcGxhY2Ugc3lzdGVtIGN1cnNvciB3aXRoIGRhcmstYmx1ZSBjaXJjbGU7IHNuYXBweSBzY2FsZSBvbiBjbGlja2FibGVcbiAqICBEYXRlOiAyMDI1LTExLTA0XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q3VzdG9tQ3Vyc29yKG9wdGlvbnMgPSB7fSl7XG4gIC8vIEVuYWJsZSBvbmx5IG9uIGZpbmUgcG9pbnRlcnMgKG1vdXNlLCB0cmFja3BhZCkuIFNraXAgdG91Y2gtb25seSBkZXZpY2VzLlxuICBjb25zdCBoYXNGaW5lUG9pbnRlciA9IHR5cGVvZiB3aW5kb3cubWF0Y2hNZWRpYSA9PT0gJ2Z1bmN0aW9uJyBcbiAgICA/IHdpbmRvdy5tYXRjaE1lZGlhKCcocG9pbnRlcjogZmluZSknKS5tYXRjaGVzXG4gICAgOiB0cnVlO1xuICBpZiAoIWhhc0ZpbmVQb2ludGVyKSByZXR1cm47XG5cbiAgLy8gUHJldmVudCBkdXBsaWNhdGUgaW5pdGlhbGl6YXRpb25cbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY2Nhbm4tY3VzdG9tLWN1cnNvcicpKSByZXR1cm47XG5cbiAgLy8gT25seSB0cmVhdCBhbmNob3JzIGFzIHNjYWxlLXVwIHRhcmdldHMgcGVyIHNwZWNcbiAgY29uc3QgY2xpY2thYmxlU2VsZWN0b3IgPSBvcHRpb25zLmNsaWNrYWJsZVNlbGVjdG9yIHx8ICdhW2hyZWZdJztcblxuICAvLyBJbmplY3QgbWluaW1hbCBDU1NcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5pZCA9ICdtY2Nhbm4tY3VzdG9tLWN1cnNvci1zdHlsZSc7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgIC8qIEhpZGUgbmF0aXZlIGN1cnNvciBldmVyeXdoZXJlLCBpbmNsdWRpbmcgcHNldWRvIGVsZW1lbnRzICovXG4gICAgLmhhcy1jdXN0b20tY3Vyc29yLFxuICAgIC5oYXMtY3VzdG9tLWN1cnNvciAqIHsgY3Vyc29yOiBub25lICFpbXBvcnRhbnQ7IH1cbiAgICAuaGFzLWN1c3RvbS1jdXJzb3IgKjo6YmVmb3JlLFxuICAgIC5oYXMtY3VzdG9tLWN1cnNvciAqOjphZnRlciB7IGN1cnNvcjogbm9uZSAhaW1wb3J0YW50OyB9XG5cbiAgICAuY3VzdG9tLWN1cnNvciB7XG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICBsZWZ0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgICAgd2lkdGg6IDE4cHg7XG4gICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICBiYWNrZ3JvdW5kOiAjMGEzZDkxOyAvKiBkYXJrIGJsdWUgKi9cbiAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTk5OTlweCwgLTk5OTlweCwgMCkgdHJhbnNsYXRlKC01MCUsIC01MCUpIHNjYWxlKDAuMyk7XG4gICAgICBvcGFjaXR5OiAwO1xuICAgICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDEyMG1zIGN1YmljLWJlemllcigwLjIsIDAuOSwgMC4yLCAxKSwgb3BhY2l0eSA4MG1zIGxpbmVhcjtcbiAgICAgIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm0sIG9wYWNpdHk7XG4gICAgfVxuXG4gICAgLmN1c3RvbS1jdXJzb3IuaXMtdmlzaWJsZSB7IG9wYWNpdHk6IDE7IH1cblxuICAgIEBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKSB7XG4gICAgICAuY3VzdG9tLWN1cnNvciB7IHRyYW5zaXRpb246IG5vbmU7IH1cbiAgICB9XG4gIGA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoYXMtY3VzdG9tLWN1cnNvcicpO1xuXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGVsLmlkID0gJ21jY2Fubi1jdXN0b20tY3Vyc29yJztcbiAgZWwuY2xhc3NOYW1lID0gJ2N1c3RvbS1jdXJzb3InO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XG5cbiAgbGV0IG1vdXNlWCA9IDA7XG4gIGxldCBtb3VzZVkgPSAwO1xuICBsZXQgaXNBY3RpdmUgPSBmYWxzZTtcbiAgbGV0IHJhZklkID0gMDtcbiAgbGV0IG5lZWRzUmVuZGVyID0gZmFsc2U7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gdHlwZW9mIHdpbmRvdy5tYXRjaE1lZGlhID09PSAnZnVuY3Rpb24nIFxuICAgID8gd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpJykubWF0Y2hlc1xuICAgIDogZmFsc2U7XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCl7XG4gICAgcmFmSWQgPSAwO1xuICAgIGlmICghbmVlZHNSZW5kZXIpIHJldHVybjtcbiAgICBuZWVkc1JlbmRlciA9IGZhbHNlO1xuICAgIGNvbnN0IHNjYWxlID0gaXNBY3RpdmUgPyAxIDogMC4zO1xuICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgke21vdXNlWH1weCwgJHttb3VzZVl9cHgsIDApIHRyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgke3NjYWxlfSlgO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NoZWR1bGUoKXtcbiAgICBpZiAoIXJhZklkKSByYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0VmlzaWJsZSh2KXtcbiAgICBpZiAodikgZWwuY2xhc3NMaXN0LmFkZCgnaXMtdmlzaWJsZScpO1xuICAgIGVsc2UgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaXMtdmlzaWJsZScpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQWN0aXZlKHRhcmdldCl7XG4gICAgY29uc3QgbWF0Y2ggPSB0YXJnZXQgJiYgdGFyZ2V0LmNsb3Nlc3QgPyB0YXJnZXQuY2xvc2VzdChjbGlja2FibGVTZWxlY3RvcikgOiBudWxsO1xuICAgIGNvbnN0IG5leHQgPSAhIW1hdGNoO1xuICAgIGlmIChuZXh0ICE9PSBpc0FjdGl2ZSkge1xuICAgICAgaWYgKCFwcmVmZXJzUmVkdWNlZCkge1xuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIC8vIEdyb3c6IDQ1bXMgd2l0aCBhIGJvdW5jZS9vdmVyc2hvb3QgZmVlbFxuICAgICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDQ1bXMgY3ViaWMtYmV6aWVyKDAuMzQsIDEuNTYsIDAuNjQsIDEpLCBvcGFjaXR5IDgwbXMgbGluZWFyJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTaHJpbms6IHNuYXBweSBidXQgc2xpZ2h0bHkgbG9uZ2VyIHRvIGZlZWwgbmF0dXJhbFxuICAgICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDEyMG1zIGN1YmljLWJlemllcigwLjIsIDAuOSwgMC4yLCAxKSwgb3BhY2l0eSA4MG1zIGxpbmVhcic7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlzQWN0aXZlID0gbmV4dDtcbiAgICAgIG5lZWRzUmVuZGVyID0gdHJ1ZTtcbiAgICAgIHNjaGVkdWxlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25Qb2ludGVyTW92ZShlKXtcbiAgICBtb3VzZVggPSBlLmNsaWVudFg7XG4gICAgbW91c2VZID0gZS5jbGllbnRZO1xuICAgIHVwZGF0ZUFjdGl2ZShlLnRhcmdldCk7XG4gICAgc2V0VmlzaWJsZSh0cnVlKTtcbiAgICBuZWVkc1JlbmRlciA9IHRydWU7XG4gICAgc2NoZWR1bGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VPdXQoZSl7XG4gICAgaWYgKGUucmVsYXRlZFRhcmdldCA9PSBudWxsKSBzZXRWaXNpYmxlKGZhbHNlKTtcbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIG9uUG9pbnRlck1vdmUsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0Jywgb25Nb3VzZU91dCwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHNldFZpc2libGUoZmFsc2UpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4gc2V0VmlzaWJsZSh0cnVlKSk7XG5cbiAgLy8gUmV0dXJuIGNsZWFudXAgaGFuZGxlXG4gIHJldHVybiBmdW5jdGlvbiBkZXN0cm95KCl7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgb25Qb2ludGVyTW92ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1jdXN0b20tY3Vyc29yJyk7XG4gICAgdHJ5IHsgZWwucmVtb3ZlKCk7IH0gY2F0Y2goXykge31cbiAgICB0cnkgeyBzdHlsZS5yZW1vdmUoKTsgfSBjYXRjaChfKSB7fVxuICB9O1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEFwcCBFbnRyeVxuICogIFB1cnBvc2U6IFdpcmUgbW9kdWxlcyBhbmQgZXhwb3NlIG1pbmltYWwgZmFjYWRlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBpbml0QWNjb3JkaW9uIH0gZnJvbSAnLi9tb2R1bGVzL2FjY29yZGlvbi5qcyc7XG5pbXBvcnQgeyBpbml0TGlnaHRib3ggfSBmcm9tICcuL21vZHVsZXMvbGlnaHRib3guanMnO1xuaW1wb3J0IHsgaW5pdFdlYmZsb3dTY3JvbGxUcmlnZ2VycyB9IGZyb20gJy4vbW9kdWxlcy93ZWJmbG93LXNjcm9sbHRyaWdnZXIuanMnO1xuaW1wb3J0IHsgaW5pdEN1c3RvbUN1cnNvciB9IGZyb20gJy4vbW9kdWxlcy9jdXJzb3IuanMnO1xuXG5mdW5jdGlvbiBwYXRjaFlvdVR1YmVBbGxvd1Rva2Vucygpe1xuICAvLyBNaW5pbWFsIHNldCB0byByZWR1Y2UgcGVybWlzc2lvbiBwb2xpY3kgd2FybmluZ3MgaW5zaWRlIERlc2lnbmVyXG4gIGNvbnN0IHRva2VucyA9IFsnYXV0b3BsYXknLCdlbmNyeXB0ZWQtbWVkaWEnLCdwaWN0dXJlLWluLXBpY3R1cmUnXTtcbiAgY29uc3Qgc2VsID0gW1xuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tXCJdJyxcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dS5iZVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHViZS1ub2Nvb2tpZS5jb21cIl0nLFxuICBdLmpvaW4oJywnKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWwpLmZvckVhY2goKGlmcikgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gKGlmci5nZXRBdHRyaWJ1dGUoJ2FsbG93JykgfHwgJycpLnNwbGl0KCc7JykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBtZXJnZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLmV4aXN0aW5nLCAuLi50b2tlbnNdKSkuam9pbignOyAnKTtcbiAgICBpZnIuc2V0QXR0cmlidXRlKCdhbGxvdycsIG1lcmdlZCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0KG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IGxpZ2h0Ym94Um9vdCA9IG9wdGlvbnMubGlnaHRib3hSb290IHx8ICcjcHJvamVjdC1saWdodGJveCc7XG4gIGluaXRBY2NvcmRpb24oJy5hY2NvcmRlb24nKTtcbiAgaW5pdExpZ2h0Ym94KHsgcm9vdDogbGlnaHRib3hSb290LCBjbG9zZURlbGF5TXM6IDEwMDAgfSk7XG4gIC8vIFJlbHkgb24gQ1NTIHNjcm9sbC1zbmFwIGluIGAucGVyc3BlY3RpdmUtd3JhcHBlcmA7IGRvIG5vdCBhdHRhY2ggSlMgcGFnaW5nXG5cbiAgLy8gQ3VzdG9tIGRhcmstYmx1ZSBjdXJzb3Igd2l0aCBzbmFwcHkgc2NhbGUgb24gY2xpY2thYmxlIHRhcmdldHNcbiAgdHJ5IHsgaW5pdEN1c3RvbUN1cnNvcigpOyB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gQnJpZGdlIEdTQVAgU2Nyb2xsVHJpZ2dlciBcdTIxOTIgV2ViZmxvdyBJWFxuICB0cnkge1xuICAgIGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMoe1xuICAgICAgc2Nyb2xsZXJTZWxlY3RvcjogJy5wZXJzcGVjdGl2ZS13cmFwcGVyJyxcbiAgICAgIGluaXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JyxcbiAgICAgIHNocmlua0V2ZW50TmFtZTogJ2xvZ28tc2hyaW5rJyxcbiAgICAgIGdyb3dFdmVudE5hbWU6ICdsb2dvLWdyb3cnXG4gICAgfSk7XG4gIH0gY2F0Y2goXykge31cblxuICAvLyBOb3RlOiBubyBKUyBzbGlkZSBzbmFwcGluZzsgcmVseSBvbiBDU1Mgc2Nyb2xsLXNuYXAgaW4gYC5wZXJzcGVjdGl2ZS13cmFwcGVyYFxufVxuXG4vLyBFeHBvc2UgYSB0aW55IGdsb2JhbCBmb3IgV2ViZmxvdy9EZXNpZ25lciBob29rc1xuLy8gKEludGVybmFscyByZW1haW4gcHJpdmF0ZSBpbnNpZGUgdGhlIElJRkUgYnVuZGxlKVxuaWYgKCF3aW5kb3cuQXBwKSB3aW5kb3cuQXBwID0ge307XG53aW5kb3cuQXBwLmluaXQgPSBpbml0O1xuXG4vLyBBdXRvLWluaXQgb24gRE9NIHJlYWR5IChzYWZlIGlmIGVsZW1lbnRzIGFyZSBtaXNzaW5nKVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdHJ5IHsgcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKTsgaW5pdCgpOyB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcignW0FwcF0gaW5pdCBlcnJvcicsIGVycik7IH1cbn0pO1xuXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBUU8sV0FBUyxLQUFLLE1BQU0sU0FBUyxRQUFRLFNBQVMsQ0FBQyxHQUFFO0FBQ3RELFFBQUk7QUFBRSxhQUFPLGNBQWMsSUFBSSxZQUFZLE1BQU0sRUFBRSxTQUFTLE1BQU0sWUFBWSxNQUFNLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUN6RyxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBQSxJQUFHLFFBQVE7QUFBQSxJQUFDO0FBQUEsRUFDMUU7OztBQ0ZBLFVBQVEsSUFBSSwyQkFBMkI7QUFFaEMsV0FBUyxjQUFjLFVBQVUsY0FBYTtBQUNuRCxVQUFNLE9BQU8sU0FBUyxjQUFjLE9BQU87QUFDM0MsUUFBSSxDQUFDLE1BQUs7QUFBRSxjQUFRLElBQUksNEJBQTRCO0FBQUc7QUFBQSxJQUFRO0FBRS9ELFVBQU0sVUFBVSxVQUFRLDZCQUFNLGNBQWM7QUFDNUMsVUFBTSxVQUFVLFVB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
