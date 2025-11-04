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
      console.log("[ACCORDION] \u274C root not found for selector:", rootSel);
      return;
    }
    console.log("[ACCORDION] \u2705 Initializing accordion on:", rootSel);
    window._accordionRoot = root;
    window._accordionDebug = true;
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
    function markItemsForAnimation(panel, show = true) {
      const items = panel.querySelectorAll(":scope > .acc-item");
      items.forEach((item) => {
        if (show) {
          item.setAttribute("data-acc-animate", "true");
        } else {
          item.removeAttribute("data-acc-animate");
        }
      });
      dbg(`Marked ${items.length} items for ${show ? "show" : "hide"} animation in panel ${panel.id}`);
      const allMarked = root.querySelectorAll("[data-acc-animate]");
      dbg(`Total elements with data-acc-animate in DOM: ${allMarked.length}`);
      allMarked.forEach((el) => {
        dbg(`  - ${el.className} | Text: ${(el.textContent || "").trim().slice(0, 50)}`);
      });
    }
    function clearAllAnimationMarkers() {
      root.querySelectorAll("[data-acc-animate]").forEach((el) => {
        el.removeAttribute("data-acc-animate");
      });
    }
    const wfIx = window.Webflow && window.Webflow.require ? window.Webflow.require("ix3") || window.Webflow.require("ix2") : null;
    dbg("Webflow IX available:", !!wfIx);
    function emitIx(name) {
      try {
        if (wfIx && typeof wfIx.emit === "function") {
          dbg(`\u{1F3AF} EMITTING via wfIx.emit: "${name}"`);
          wfIx.emit(name);
          const marked = root.querySelectorAll('[data-acc-animate="true"]');
          dbg(`  \u2192 ${marked.length} elements have data-acc-animate when "${name}" fires`);
          return true;
        }
      } catch (err) {
        dbg("wfIx.emit error", err && err.message);
      }
      try {
        window.dispatchEvent(new CustomEvent(name));
        dbg(`\u{1F4E2} EMITTING via window.dispatchEvent: "${name}"`);
        return false;
      } catch (_) {
        return false;
      }
    }
    function emitAll(primary) {
      const aliases = [];
      if (primary === "acc-open") aliases.push("accordeon-open");
      if (primary === "acc-close") aliases.push("accordeon-close");
      [primary, ...aliases].forEach((ev) => emitIx(ev));
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
        markItemsForAnimation(p, false);
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
          clearAllAnimationMarkers();
          markItemsForAnimation(p, true);
          setTimeout(() => emitAll("acc-close"), 10);
          collapse(p);
          const trig = sib.querySelector(":scope > .acc-trigger");
          trig == null ? void 0 : trig.setAttribute("aria-expanded", "false");
          (_a = trig == null ? void 0 : trig.classList) == null ? void 0 : _a.remove(ACTIVE_TRIGGER_CLASS);
        }
      });
    }
    function resetAllL2Under(container) {
      const scope = container || root;
      scope.querySelectorAll(".acc-item > .acc-list").forEach((p) => {
        var _a;
        if (p.dataset.state === "open" || p.dataset.state === "opening") {
          collapse(p);
          const it = p.closest(".acc-item");
          const t = it == null ? void 0 : it.querySelector(":scope > .acc-trigger");
          t == null ? void 0 : t.setAttribute("aria-expanded", "false");
          (_a = t == null ? void 0 : t.classList) == null ? void 0 : _a.remove(ACTIVE_TRIGGER_CLASS);
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
      if (itemKind(item) === "section") {
        if (opening) resetAllL2Under(root);
        else resetAllL2Under(item);
      }
      if (opening) {
        clearAllAnimationMarkers();
        markItemsForAnimation(p, true);
        setTimeout(() => {
          const markedItems = p.querySelectorAll(":scope > .acc-item[data-acc-animate]");
          dbg("emit acc-open", { id: p.id, markedItems: markedItems.length, totalItems: p.querySelectorAll(":scope > .acc-item").length });
          emitAll("acc-open");
        }, 10);
        expand(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "true");
        (_a = trig == null ? void 0 : trig.classList) == null ? void 0 : _a.add(ACTIVE_TRIGGER_CLASS);
      } else {
        clearAllAnimationMarkers();
        markItemsForAnimation(p, true);
        setTimeout(() => {
          const markedItems = p.querySelectorAll(":scope > .acc-item[data-acc-animate]");
          dbg("emit acc-close", { id: p.id, markedItems: markedItems.length, totalItems: p.querySelectorAll(":scope > .acc-item").length });
          emitAll("acc-close");
        }, 10);
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
    window._accordionTest = {
      markItems: (panelId) => {
        const panel = document.getElementById(panelId) || root.querySelector(".acc-list");
        if (panel) {
          markItemsForAnimation(panel, true);
          console.log("Marked items in panel:", panel);
        }
      },
      clearMarks: () => {
        clearAllAnimationMarkers();
        console.log("Cleared all marks");
      },
      emitOpen: () => {
        emitAll("acc-open");
        console.log("Emitted acc-open");
      },
      emitClose: () => {
        emitAll("acc-close");
        console.log("Emitted acc-close");
      },
      checkWebflow: () => {
        console.log("Webflow object:", window.Webflow);
        console.log("wfIx:", wfIx);
      },
      getMarkedItems: () => {
        return root.querySelectorAll("[data-acc-animate]");
      }
    };
    console.log("[ACCORDION] Debug functions available at window._accordionTest");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvbW9kdWxlcy9jdXJzb3IuanMiLCAiLi4vc3JjL2FwcC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBFdmVudHMgVXRpbGl0eVxuICogIFB1cnBvc2U6IEVtaXQgYnViYmxpbmcgQ3VzdG9tRXZlbnRzIGNvbXBhdGlibGUgd2l0aCBHU0FQLVVJICh3aW5kb3cgc2NvcGUpXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZW1pdChuYW1lLCB0YXJnZXQgPSB3aW5kb3csIGRldGFpbCA9IHt9KXtcbiAgdHJ5IHsgdGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSwgZGV0YWlsIH0pKTsgfSBjYXRjaCB7fVxuICB0cnkgeyB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQWNjb3JkaW9uIE1vZHVsZVxuICogIFB1cnBvc2U6IEFSSUEsIHNtb290aCB0cmFuc2l0aW9ucywgR1NBUCBldmVudCBob29rc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0QWNjb3JkaW9uKHJvb3RTZWwgPSAnLmFjY29yZGVvbicpe1xuICBjb25zdCByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290U2VsKTtcbiAgaWYgKCFyb290KXsgY29uc29sZS5sb2coJ1tBQ0NPUkRJT05dIFx1Mjc0QyByb290IG5vdCBmb3VuZCBmb3Igc2VsZWN0b3I6Jywgcm9vdFNlbCk7IHJldHVybjsgfVxuICBjb25zb2xlLmxvZygnW0FDQ09SRElPTl0gXHUyNzA1IEluaXRpYWxpemluZyBhY2NvcmRpb24gb246Jywgcm9vdFNlbCk7XG4gIFxuICAvLyBTdG9yZSByZWZlcmVuY2UgZ2xvYmFsbHkgZm9yIGRlYnVnZ2luZ1xuICB3aW5kb3cuX2FjY29yZGlvblJvb3QgPSByb290O1xuICB3aW5kb3cuX2FjY29yZGlvbkRlYnVnID0gdHJ1ZTtcblxuICBjb25zdCBwYW5lbE9mID0gaXRlbSA9PiBpdGVtPy5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLWxpc3QnKTtcbiAgY29uc3QgZ3JvdXBPZiA9IGl0ZW0gPT4ge1xuICAgIGNvbnN0IHBhcmVudCA9IGl0ZW0ucGFyZW50RWxlbWVudDtcbiAgICByZXR1cm4gcGFyZW50Py5jbGFzc0xpc3QuY29udGFpbnMoJ2FjYy1saXN0JykgPyBwYXJlbnQgOiByb290O1xuICB9O1xuICBjb25zdCBkYmcgPSAoLi4uYXJncykgPT4geyB0cnkgeyBjb25zb2xlLmxvZygnW0FDQ09SRElPTl0nLCAuLi5hcmdzKTsgfSBjYXRjaChfKSB7fSB9O1xuICBjb25zdCBpdGVtS2luZCA9IChlbCkgPT4gZWw/LmNsYXNzTGlzdD8uY29udGFpbnMoJ2FjYy1zZWN0aW9uJykgPyAnc2VjdGlvbicgOiAnaXRlbSc7XG4gIGNvbnN0IGxhYmVsT2YgPSAoZWwpID0+IHtcbiAgICBjb25zdCB0ID0gZWw/LnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2MtdHJpZ2dlcicpO1xuICAgIHJldHVybiAodD8udGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csJyAnKS5zbGljZSgwLDgwKTtcbiAgfTtcbiAgY29uc3QgQUNUSVZFX1RSSUdHRVJfQ0xBU1MgPSAnYWNjLXRyaWdnZXItLWFjdGl2ZSc7XG4gIFxuICAvLyBJbnN0ZWFkIG9mIHVzaW5nIGEgY2xhc3MsIHdlJ2xsIHVzZSBkYXRhIGF0dHJpYnV0ZXMgb24gdGhlIGl0ZW1zIHRoZW1zZWx2ZXNcbiAgZnVuY3Rpb24gbWFya0l0ZW1zRm9yQW5pbWF0aW9uKHBhbmVsLCBzaG93ID0gdHJ1ZSkge1xuICAgIC8vIE1hcmsgZGlyZWN0IGNoaWxkIGl0ZW1zIG9mIHRoaXMgcGFuZWwgZm9yIGFuaW1hdGlvblxuICAgIGNvbnN0IGl0ZW1zID0gcGFuZWwucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gLmFjYy1pdGVtJyk7XG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgIGlmIChzaG93KSB7XG4gICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdkYXRhLWFjYy1hbmltYXRlJywgJ3RydWUnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW0ucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWFjYy1hbmltYXRlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGJnKGBNYXJrZWQgJHtpdGVtcy5sZW5ndGh9IGl0ZW1zIGZvciAke3Nob3cgPyAnc2hvdycgOiAnaGlkZSd9IGFuaW1hdGlvbiBpbiBwYW5lbCAke3BhbmVsLmlkfWApO1xuICAgIFxuICAgIC8vIERlYnVnOiBMb2cgd2hhdCBlbGVtZW50cyBoYXZlIHRoZSBhdHRyaWJ1dGUgbm93XG4gICAgY29uc3QgYWxsTWFya2VkID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1hY2MtYW5pbWF0ZV0nKTtcbiAgICBkYmcoYFRvdGFsIGVsZW1lbnRzIHdpdGggZGF0YS1hY2MtYW5pbWF0ZSBpbiBET006ICR7YWxsTWFya2VkLmxlbmd0aH1gKTtcbiAgICBhbGxNYXJrZWQuZm9yRWFjaChlbCA9PiB7XG4gICAgICBkYmcoYCAgLSAke2VsLmNsYXNzTmFtZX0gfCBUZXh0OiAkeyhlbC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnNsaWNlKDAsIDUwKX1gKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gY2xlYXJBbGxBbmltYXRpb25NYXJrZXJzKCkge1xuICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtYWNjLWFuaW1hdGVdJykuZm9yRWFjaChlbCA9PiB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtYWNjLWFuaW1hdGUnKTtcbiAgICB9KTtcbiAgfVxuICAvLyBXZWJmbG93IElYIChpeDMgcHJlZmVycmVkLCBmYWxsYmFjayBpeDIpLiBJZiBub3QgcHJlc2VudCwgd2Ugc3RpbGwgZGlzcGF0Y2ggd2luZG93IEN1c3RvbUV2ZW50XG4gIGNvbnN0IHdmSXggPSAod2luZG93LldlYmZsb3cgJiYgd2luZG93LldlYmZsb3cucmVxdWlyZSlcbiAgICA/ICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSlcbiAgICA6IG51bGw7XG4gIGRiZygnV2ViZmxvdyBJWCBhdmFpbGFibGU6JywgISF3Zkl4KTtcbiAgZnVuY3Rpb24gZW1pdEl4KG5hbWUpe1xuICAgIHRyeSB7XG4gICAgICBpZiAod2ZJeCAmJiB0eXBlb2Ygd2ZJeC5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGRiZyhgXHVEODNDXHVERkFGIEVNSVRUSU5HIHZpYSB3Zkl4LmVtaXQ6IFwiJHtuYW1lfVwiYCk7XG4gICAgICAgIHdmSXguZW1pdChuYW1lKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEFsc28gY2hlY2sgd2hhdCBlbGVtZW50cyBjdXJyZW50bHkgaGF2ZSB0aGUgYXR0cmlidXRlXG4gICAgICAgIGNvbnN0IG1hcmtlZCA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtYWNjLWFuaW1hdGU9XCJ0cnVlXCJdJyk7XG4gICAgICAgIGRiZyhgICBcdTIxOTIgJHttYXJrZWQubGVuZ3RofSBlbGVtZW50cyBoYXZlIGRhdGEtYWNjLWFuaW1hdGUgd2hlbiBcIiR7bmFtZX1cIiBmaXJlc2ApO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSBjYXRjaChlcnIpIHtcbiAgICAgIGRiZygnd2ZJeC5lbWl0IGVycm9yJywgZXJyICYmIGVyci5tZXNzYWdlKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIC8vIEZhbGxiYWNrOiBidWJibGUgYSBDdXN0b21FdmVudCBvbiB3aW5kb3cgZm9yIGFueSBsaXN0ZW5lcnNcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lKSk7XG4gICAgICBkYmcoYFx1RDgzRFx1RENFMiBFTUlUVElORyB2aWEgd2luZG93LmRpc3BhdGNoRXZlbnQ6IFwiJHtuYW1lfVwiYCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBjYXRjaChfKSB7IHJldHVybiBmYWxzZTsgfVxuICB9XG5cbiAgLy8gRW1pdCBwcmltYXJ5IGV2ZW50IHBsdXMgbGVnYWN5IGFsaWFzZXMgKHdpdGhvdXQgZ2xvYmFsIHRvZ2dsZSkgc28gZXhpc3RpbmcgV2ViZmxvdyB0aW1lbGluZXMga2VlcCB3b3JraW5nXG4gIGZ1bmN0aW9uIGVtaXRBbGwocHJpbWFyeSl7XG4gICAgY29uc3QgYWxpYXNlcyA9IFtdO1xuICAgIGlmIChwcmltYXJ5ID09PSAnYWNjLW9wZW4nKSBhbGlhc2VzLnB1c2goJ2FjY29yZGVvbi1vcGVuJyk7XG4gICAgaWYgKHByaW1hcnkgPT09ICdhY2MtY2xvc2UnKSBhbGlhc2VzLnB1c2goJ2FjY29yZGVvbi1jbG9zZScpO1xuICAgIFtwcmltYXJ5LCAuLi5hbGlhc2VzXS5mb3JFYWNoKGV2ID0+IGVtaXRJeChldikpO1xuICB9XG5cbiAgLy8gQVJJQSBib290c3RyYXBcbiAgY29uc3QgdHJpZ2dlcnMgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtdHJpZ2dlcicpO1xuICB0cmlnZ2Vycy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjYy1zZWN0aW9uLCAuYWNjLWl0ZW0nKTtcbiAgICBjb25zdCBwID0gcGFuZWxPZihpdGVtKTtcbiAgICBpZiAocCl7XG4gICAgICBjb25zdCBwaWQgPSBwLmlkIHx8IGBhY2MtcGFuZWwtJHtpfWA7XG4gICAgICBwLmlkID0gcGlkO1xuICAgICAgdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCBwaWQpO1xuICAgICAgdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB9XG4gIH0pO1xuICBkYmcoJ2Jvb3RzdHJhcHBlZCcsIHRyaWdnZXJzLmxlbmd0aCwgJ3RyaWdnZXJzJyk7XG5cbiAgZnVuY3Rpb24gZXhwYW5kKHApe1xuICAgIGRiZygnZXhwYW5kIHN0YXJ0JywgeyBpZDogcC5pZCwgY2hpbGRyZW46IHAuY2hpbGRyZW4/Lmxlbmd0aCwgaDogcC5zY3JvbGxIZWlnaHQgfSk7XG4gICAgcC5jbGFzc0xpc3QuYWRkKCdpcy1hY3RpdmUnKTtcbiAgICAvLyBFbnN1cmUgZGlyZWN0IGNoaWxkIHJvd3MgYXJlIG5vdCBzdHVjayBoaWRkZW4gYnkgYW55IGdsb2JhbCBHU0FQIGluaXRpYWwgc3RhdGVcbiAgICBBcnJheS5mcm9tKHAucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gLmFjYy1pdGVtJykpLmZvckVhY2goKHJvdykgPT4ge1xuICAgICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCdvcGFjaXR5Jyk7XG4gICAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3Zpc2liaWxpdHknKTtcbiAgICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndHJhbnNmb3JtJyk7XG4gICAgfSk7XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSBwLnNjcm9sbEhlaWdodCArICdweCc7XG4gICAgcC5kYXRhc2V0LnN0YXRlID0gJ29wZW5pbmcnO1xuICAgIGNvbnN0IG9uRW5kID0gKGUpID0+IHtcbiAgICAgIGlmIChlLnByb3BlcnR5TmFtZSAhPT0gJ21heC1oZWlnaHQnKSByZXR1cm47XG4gICAgICBwLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpe1xuICAgICAgICBwLnN0eWxlLm1heEhlaWdodCA9ICdub25lJztcbiAgICAgICAgcC5kYXRhc2V0LnN0YXRlID0gJ29wZW4nO1xuICAgICAgICBkYmcoJ2V4cGFuZGVkJywgeyBpZDogcC5pZCB9KTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKHApe1xuICAgIGNvbnN0IGggPSBwLnN0eWxlLm1heEhlaWdodCA9PT0gJ25vbmUnID8gcC5zY3JvbGxIZWlnaHQgOiBwYXJzZUZsb2F0KHAuc3R5bGUubWF4SGVpZ2h0IHx8IDApO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gKGggfHwgcC5zY3JvbGxIZWlnaHQpICsgJ3B4JztcbiAgICBwLm9mZnNldEhlaWdodDsgLy8gcmVmbG93XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY2xvc2luZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnO1xuICAgICAgcC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1hY3RpdmUnKTtcbiAgICAgIC8vIENsZWFyIGFuaW1hdGlvbiBtYXJrZXJzIHdoZW4gY29sbGFwc2UgY29tcGxldGVzXG4gICAgICBtYXJrSXRlbXNGb3JBbmltYXRpb24ocCwgZmFsc2UpO1xuICAgICAgZGJnKCdjb2xsYXBzZWQnLCB7IGlkOiBwLmlkIH0pO1xuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VTaWJsaW5ncyhpdGVtKXtcbiAgICBjb25zdCBncm91cCA9IGdyb3VwT2YoaXRlbSk7XG4gICAgaWYgKCFncm91cCkgcmV0dXJuO1xuICAgIGNvbnN0IHdhbnQgPSBpdGVtLm1hdGNoZXMoJy5hY2Mtc2VjdGlvbicpID8gJ2FjYy1zZWN0aW9uJyA6ICdhY2MtaXRlbSc7XG4gICAgQXJyYXkuZnJvbShncm91cC5jaGlsZHJlbikuZm9yRWFjaChzaWIgPT4ge1xuICAgICAgaWYgKHNpYiA9PT0gaXRlbSB8fCAhc2liLmNsYXNzTGlzdC5jb250YWlucyh3YW50KSkgcmV0dXJuO1xuICAgICAgY29uc3QgcCA9IHBhbmVsT2Yoc2liKTtcbiAgICAgIGlmIChwICYmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJykpe1xuICAgICAgICBkYmcoJ2Nsb3NlIHNpYmxpbmcnLCB7IGtpbmQ6IHdhbnQsIGxhYmVsOiBsYWJlbE9mKHNpYiksIGlkOiBwLmlkIH0pO1xuICAgICAgICAvLyBDbGVhciBhbGwgbWFya2VycyBmaXJzdCwgdGhlbiBtYXJrIG9ubHkgdGhlIGNsb3NpbmcgcGFuZWwncyBpdGVtc1xuICAgICAgICBjbGVhckFsbEFuaW1hdGlvbk1hcmtlcnMoKTtcbiAgICAgICAgbWFya0l0ZW1zRm9yQW5pbWF0aW9uKHAsIHRydWUpOyAvLyBNYXJrIGZvciBoaWRlIGFuaW1hdGlvblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGVtaXRBbGwoJ2FjYy1jbG9zZScpLCAxMCk7XG4gICAgICAgIGNvbGxhcHNlKHApO1xuICAgICAgICBjb25zdCB0cmlnID0gc2liLnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2MtdHJpZ2dlcicpO1xuICAgICAgICB0cmlnPy5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICAgICAgdHJpZz8uY2xhc3NMaXN0Py5yZW1vdmUoQUNUSVZFX1RSSUdHRVJfQ0xBU1MpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXRBbGxMMlVuZGVyKGNvbnRhaW5lcil7XG4gICAgY29uc3Qgc2NvcGUgPSBjb250YWluZXIgfHwgcm9vdDtcbiAgICBzY29wZS5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLWl0ZW0gPiAuYWNjLWxpc3QnKS5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nIHx8IHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXtcbiAgICAgICAgY29sbGFwc2UocCk7XG4gICAgICAgIGNvbnN0IGl0ID0gcC5jbG9zZXN0KCcuYWNjLWl0ZW0nKTtcbiAgICAgICAgY29uc3QgdCA9IGl0Py5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLXRyaWdnZXInKTtcbiAgICAgICAgdD8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgIHQ/LmNsYXNzTGlzdD8ucmVtb3ZlKEFDVElWRV9UUklHR0VSX0NMQVNTKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIE5vIGV4cGxpY2l0IGxldmVsIHJlc2V0IG5lZWRlZCB3aXRoIHVuaXZlcnNhbCBncm91cGluZ1xuXG4gIGZ1bmN0aW9uIHRvZ2dsZShpdGVtKXtcbiAgICBjb25zdCBwID0gcGFuZWxPZihpdGVtKTtcbiAgICBpZiAoIXApIHJldHVybjtcbiAgICBjb25zdCB0cmlnID0gaXRlbS5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLXRyaWdnZXInKTtcbiAgICBjb25zdCBvcGVuaW5nID0gIShwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyk7XG4gICAgZGJnKCd0b2dnbGUnLCB7IGtpbmQ6IGl0ZW1LaW5kKGl0ZW0pLCBvcGVuaW5nLCBsYWJlbDogbGFiZWxPZihpdGVtKSwgaWQ6IHAuaWQgfSk7XG4gICAgXG4gICAgaWYgKG9wZW5pbmcpIGNsb3NlU2libGluZ3MoaXRlbSk7XG5cbiAgICAvLyBSZXNldCBhbGwgbmVzdGVkIGxldmVsXHUyMDExMiBwYW5lbHMgd2hlbiBhIHNlY3Rpb24gb3BlbnMgb3IgY2xvc2VzXG4gICAgaWYgKGl0ZW1LaW5kKGl0ZW0pID09PSAnc2VjdGlvbicpe1xuICAgICAgaWYgKG9wZW5pbmcpIHJlc2V0QWxsTDJVbmRlcihyb290KTtcbiAgICAgIGVsc2UgcmVzZXRBbGxMMlVuZGVyKGl0ZW0pO1xuICAgIH1cblxuICAgIGlmIChvcGVuaW5nKXtcbiAgICAgIC8vIENsZWFyIGFsbCBtYXJrZXJzIGZpcnN0LCB0aGVuIG1hcmsgb25seSB0aGlzIHBhbmVsJ3MgaXRlbXNcbiAgICAgIGNsZWFyQWxsQW5pbWF0aW9uTWFya2VycygpO1xuICAgICAgbWFya0l0ZW1zRm9yQW5pbWF0aW9uKHAsIHRydWUpO1xuICAgICAgLy8gU21hbGwgZGVsYXkgdG8gZW5zdXJlIERPTSB1cGRhdGVzIGJlZm9yZSBHU0FQIHJlYWRzIGl0XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3QgbWFya2VkSXRlbXMgPSBwLnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbVtkYXRhLWFjYy1hbmltYXRlXScpO1xuICAgICAgICBkYmcoJ2VtaXQgYWNjLW9wZW4nLCB7IGlkOiBwLmlkLCBtYXJrZWRJdGVtczogbWFya2VkSXRlbXMubGVuZ3RoLCB0b3RhbEl0ZW1zOiBwLnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbScpLmxlbmd0aCB9KTtcbiAgICAgICAgZW1pdEFsbCgnYWNjLW9wZW4nKTtcbiAgICAgIH0sIDEwKTtcbiAgICAgIGV4cGFuZChwKTtcbiAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICB0cmlnPy5jbGFzc0xpc3Q/LmFkZChBQ1RJVkVfVFJJR0dFUl9DTEFTUyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENsZWFyIGFsbCBtYXJrZXJzIGZpcnN0LCB0aGVuIG1hcmsgb25seSB0aGlzIHBhbmVsJ3MgaXRlbXNcbiAgICAgIGNsZWFyQWxsQW5pbWF0aW9uTWFya2VycygpO1xuICAgICAgbWFya0l0ZW1zRm9yQW5pbWF0aW9uKHAsIHRydWUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1hcmtlZEl0ZW1zID0gcC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiAuYWNjLWl0ZW1bZGF0YS1hY2MtYW5pbWF0ZV0nKTtcbiAgICAgICAgZGJnKCdlbWl0IGFjYy1jbG9zZScsIHsgaWQ6IHAuaWQsIG1hcmtlZEl0ZW1zOiBtYXJrZWRJdGVtcy5sZW5ndGgsIHRvdGFsSXRlbXM6IHAucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gLmFjYy1pdGVtJykubGVuZ3RoIH0pO1xuICAgICAgICBlbWl0QWxsKCdhY2MtY2xvc2UnKTtcbiAgICAgIH0sIDEwKTtcbiAgICAgIGNvbGxhcHNlKHApO1xuICAgICAgdHJpZz8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICB0cmlnPy5jbGFzc0xpc3Q/LnJlbW92ZShBQ1RJVkVfVFJJR0dFUl9DTEFTUyk7XG4gICAgfVxuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdqcy1wcmVwJyk7XG4gIC8vIENvbGxhcHNlIGFsbCBwYW5lbHM7IHRvcC1sZXZlbCBpdGVtcyByZW1haW4gdmlzaWJsZSAobm90IGluc2lkZSBwYW5lbHMpXG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjYy1saXN0JykuZm9yRWFjaChwID0+IHsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JzsgcC5kYXRhc2V0LnN0YXRlID0gJ2NvbGxhcHNlZCc7IH0pO1xuICAvLyBTYWZldHk6IGVuc3VyZSB0b3AtbGV2ZWwgcm93cyBhcmUgdmlzaWJsZSBldmVuIGlmIGEgR1NBUCB0aW1lbGluZSBzZXQgaW5saW5lIHN0eWxlcyBnbG9iYWxseVxuICBBcnJheS5mcm9tKHJvb3QucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gLmFjYy1pdGVtJykpLmZvckVhY2goKHJvdykgPT4ge1xuICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnb3BhY2l0eScpO1xuICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndmlzaWJpbGl0eScpO1xuICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndHJhbnNmb3JtJyk7XG4gIH0pO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdqcy1wcmVwJykpO1xuXG4gIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjYy10cmlnZ2VyJyk7XG4gICAgaWYgKCF0IHx8ICFyb290LmNvbnRhaW5zKHQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2Mtc2VjdGlvbiwgLmFjYy1pdGVtJyk7XG4gICAgZGJnKCdjbGljaycsIHsgbGFiZWw6ICh0LnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCcgJykuc2xpY2UoMCw4MCkgfSk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjYy10cmlnZ2VyJyk7XG4gICAgaWYgKCF0IHx8ICFyb290LmNvbnRhaW5zKHQpKSByZXR1cm47XG4gICAgaWYgKGUua2V5ICE9PSAnRW50ZXInICYmIGUua2V5ICE9PSAnICcpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjYy1zZWN0aW9uLCAuYWNjLWl0ZW0nKTtcbiAgICBkYmcoJ2tleWRvd24nLCB7IGtleTogZS5rZXksIGxhYmVsOiAodC50ZXh0Q29udGVudCB8fCAnJykudHJpbSgpLnJlcGxhY2UoL1xccysvZywnICcpLnNsaWNlKDAsODApIH0pO1xuICAgIGl0ZW0gJiYgdG9nZ2xlKGl0ZW0pO1xuICB9KTtcblxuICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcbiAgICBlbnRyaWVzLmZvckVhY2goKHsgdGFyZ2V0OiBwIH0pID0+IHtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyl7IHAuc3R5bGUubWF4SGVpZ2h0ID0gJ25vbmUnOyB9XG4gICAgICBlbHNlIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7IHAuc3R5bGUubWF4SGVpZ2h0ID0gcC5zY3JvbGxIZWlnaHQgKyAncHgnOyB9XG4gICAgfSk7XG4gIH0pO1xuICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtbGlzdCcpLmZvckVhY2gocCA9PiByby5vYnNlcnZlKHApKTtcbiAgXG4gIC8vIEV4cG9zZSBkZWJ1Z2dpbmcgZnVuY3Rpb25zIGdsb2JhbGx5XG4gIHdpbmRvdy5fYWNjb3JkaW9uVGVzdCA9IHtcbiAgICBtYXJrSXRlbXM6IChwYW5lbElkKSA9PiB7XG4gICAgICBjb25zdCBwYW5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhbmVsSWQpIHx8IHJvb3QucXVlcnlTZWxlY3RvcignLmFjYy1saXN0Jyk7XG4gICAgICBpZiAocGFuZWwpIHtcbiAgICAgICAgbWFya0l0ZW1zRm9yQW5pbWF0aW9uKHBhbmVsLCB0cnVlKTtcbiAgICAgICAgY29uc29sZS5sb2coJ01hcmtlZCBpdGVtcyBpbiBwYW5lbDonLCBwYW5lbCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBjbGVhck1hcmtzOiAoKSA9PiB7XG4gICAgICBjbGVhckFsbEFuaW1hdGlvbk1hcmtlcnMoKTtcbiAgICAgIGNvbnNvbGUubG9nKCdDbGVhcmVkIGFsbCBtYXJrcycpO1xuICAgIH0sXG4gICAgZW1pdE9wZW46ICgpID0+IHtcbiAgICAgIGVtaXRBbGwoJ2FjYy1vcGVuJyk7XG4gICAgICBjb25zb2xlLmxvZygnRW1pdHRlZCBhY2Mtb3BlbicpO1xuICAgIH0sXG4gICAgZW1pdENsb3NlOiAoKSA9PiB7XG4gICAgICBlbWl0QWxsKCdhY2MtY2xvc2UnKTtcbiAgICAgIGNvbnNvbGUubG9nKCdFbWl0dGVkIGFjYy1jbG9zZScpO1xuICAgIH0sXG4gICAgY2hlY2tXZWJmbG93OiAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnV2ViZmxvdyBvYmplY3Q6Jywgd2luZG93LldlYmZsb3cpO1xuICAgICAgY29uc29sZS5sb2coJ3dmSXg6Jywgd2ZJeCk7XG4gICAgfSxcbiAgICBnZXRNYXJrZWRJdGVtczogKCkgPT4ge1xuICAgICAgcmV0dXJuIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtYWNjLWFuaW1hdGVdJyk7XG4gICAgfVxuICB9O1xuICBcbiAgY29uc29sZS5sb2coJ1tBQ0NPUkRJT05dIERlYnVnIGZ1bmN0aW9ucyBhdmFpbGFibGUgYXQgd2luZG93Ll9hY2NvcmRpb25UZXN0Jyk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgU2Nyb2xsIExvY2sgKEh5YnJpZCwgaU9TLXNhZmUpXG4gKiAgUHVycG9zZTogUmVsaWFibGUgcGFnZSBzY3JvbGwgbG9ja2luZyB3aXRoIGV4YWN0IHJlc3RvcmVcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmxldCBsb2NrcyA9IDA7XG5sZXQgc2F2ZWRZID0gMDtcbmxldCBwcmV2U2Nyb2xsQmVoYXZpb3IgPSAnJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2tTY3JvbGwoKXtcbiAgaWYgKGxvY2tzKyspIHJldHVybjtcbiAgY29uc3QgZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIHByZXZTY3JvbGxCZWhhdmlvciA9IGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yO1xuICBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvciA9ICdhdXRvJztcbiAgc2F2ZWRZID0gd2luZG93LnNjcm9sbFkgfHwgZGUuc2Nyb2xsVG9wIHx8IDA7XG5cbiAgLy8gRml4ZWQtYm9keSArIG1vZGFsLW9wZW4gY2xhc3MgZm9yIENTUyBob29rc1xuICBPYmplY3QuYXNzaWduKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICB0b3A6IGAtJHtzYXZlZFl9cHhgLFxuICAgIGxlZnQ6ICcwJyxcbiAgICByaWdodDogJzAnLFxuICAgIHdpZHRoOiAnMTAwJScsXG4gICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgIG92ZXJzY3JvbGxCZWhhdmlvcjogJ25vbmUnXG4gIH0pO1xuICB0cnkgeyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLW9wZW4nKTsgfSBjYXRjaCB7fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5sb2NrU2Nyb2xsKHsgZGVsYXlNcyA9IDAgfSA9IHt9KXtcbiAgY29uc3QgcnVuID0gKCkgPT4ge1xuICAgIGlmICgtLWxvY2tzID4gMCkgcmV0dXJuO1xuICAgIGNvbnN0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuYm9keS5zdHlsZSwge1xuICAgICAgcG9zaXRpb246ICcnLCB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCB3aWR0aDogJycsIG92ZXJmbG93OiAnJywgb3ZlcnNjcm9sbEJlaGF2aW9yOiAnJ1xuICAgIH0pO1xuICAgIHRyeSB7IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtb3BlbicpOyB9IGNhdGNoIHt9XG4gICAgZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSBwcmV2U2Nyb2xsQmVoYXZpb3IgfHwgJyc7XG4gICAgd2luZG93LnNjcm9sbFRvKDAsIHNhdmVkWSk7XG4gIH07XG4gIGRlbGF5TXMgPyBzZXRUaW1lb3V0KHJ1biwgZGVsYXlNcykgOiBydW4oKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBWaW1lbyBIZWxwZXJcbiAqICBQdXJwb3NlOiBNb3VudC9yZXBsYWNlIFZpbWVvIGlmcmFtZSB3aXRoIHByaXZhY3kgb3B0aW9uc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tWSU1FT10gbW9kdWxlIGxvYWRlZCcpO1xuXG5mdW5jdGlvbiBwYXJzZVZpbWVvSWQoaW5wdXQpe1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG4gIGNvbnN0IHN0ciA9IFN0cmluZyhpbnB1dCkudHJpbSgpO1xuICAvLyBBY2NlcHQgYmFyZSBJRHNcbiAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkgcmV0dXJuIHN0cjtcbiAgLy8gRXh0cmFjdCBmcm9tIGtub3duIFVSTCBmb3Jtc1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKHN0ciwgJ2h0dHBzOi8vZXhhbXBsZS5jb20nKTtcbiAgICBjb25zdCBob3N0ID0gdS5ob3N0bmFtZSB8fCAnJztcbiAgICBpZiAoaG9zdC5pbmNsdWRlcygndmltZW8uY29tJykpe1xuICAgICAgLy8gL3ZpZGVvL3tpZH0gb3IgL3tpZH1cbiAgICAgIGNvbnN0IHBhcnRzID0gdS5wYXRobmFtZS5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIGNvbnN0IGxhc3QgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICAgIGNvbnN0IGlkID0gbGFzdC5tYXRjaCgvXFxkKy8pPy5bMF0gfHwgJyc7XG4gICAgICByZXR1cm4gaWQgfHwgJyc7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50VmltZW8oY29udGFpbmVyLCBpbnB1dElkLCBwYXJhbXMgPSB7fSl7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm47XG4gIGNvbnN0IGlkID0gcGFyc2VWaW1lb0lkKGlucHV0SWQpO1xuICBpZiAoIWlkKXsgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOyByZXR1cm47IH1cbiAgY29uc3QgcXVlcnkgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgZG50OiAxLCAuLi5wYXJhbXMgfSkudG9TdHJpbmcoKTtcbiAgY29uc3Qgc3JjID0gYGh0dHBzOi8vcGxheWVyLnZpbWVvLmNvbS92aWRlby8ke2lkfT8ke3F1ZXJ5fWA7XG4gIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuc3JjID0gc3JjO1xuICAvLyBNaW5pbWFsIGFsbG93LWxpc3QgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluIERlc2lnbmVyXG4gIGlmcmFtZS5hbGxvdyA9ICdhdXRvcGxheTsgZnVsbHNjcmVlbjsgcGljdHVyZS1pbi1waWN0dXJlOyBlbmNyeXB0ZWQtbWVkaWEnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZWJvcmRlcicsICcwJyk7XG4gIGlmcmFtZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBMaWdodGJveCBNb2R1bGVcbiAqICBQdXJwb3NlOiBGb2N1cyB0cmFwLCBvdXRzaWRlLWNsaWNrLCBpbmVydC9hcmlhIGZhbGxiYWNrLCByZS1lbnRyYW5jeVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmltcG9ydCB7IGxvY2tTY3JvbGwsIHVubG9ja1Njcm9sbCB9IGZyb20gJy4uL2NvcmUvc2Nyb2xsbG9jay5qcyc7XG5pbXBvcnQgeyBtb3VudFZpbWVvIH0gZnJvbSAnLi92aW1lby5qcyc7XG5jb25zb2xlLmxvZygnW0xJR0hUQk9YXSBtb2R1bGUgbG9hZGVkJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0TGlnaHRib3goeyByb290ID0gJyNwcm9qZWN0LWxpZ2h0Ym94JywgY2xvc2VEZWxheU1zID0gMTAwMCB9ID0ge30pe1xuICBjb25zdCBsYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdCk7XG4gIGlmICghbGIpeyBjb25zb2xlLmxvZygnW0xJR0hUQk9YXSBub3QgZm91bmQnKTsgcmV0dXJuOyB9XG5cbiAgLy8gRW5zdXJlIGJhc2VsaW5lIGRpYWxvZyBhMTF5IGF0dHJpYnV0ZXNcbiAgbGIuc2V0QXR0cmlidXRlKCdyb2xlJywgbGIuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHwgJ2RpYWxvZycpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnKSB8fCAndHJ1ZScpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgbGIuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpIHx8ICd0cnVlJyk7XG5cbiAgY29uc3QgaW5uZXIgPSBsYi5xdWVyeVNlbGVjdG9yKCcucHJvamVjdC1saWdodGJveF9faW5uZXInKTtcbiAgY29uc3QgdmlkZW9BcmVhID0gbGIucXVlcnlTZWxlY3RvcignLnZpZGVvLWFyZWEnKTtcbiAgY29uc3Qgc2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJyk7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuXG4gIGxldCBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgbGV0IGxhc3RGb2N1cyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gc2V0UGFnZUluZXJ0KG9uKXtcbiAgICBjb25zdCBzaWJsaW5ncyA9IEFycmF5LmZyb20oZG9jdW1lbnQuYm9keS5jaGlsZHJlbikuZmlsdGVyKG4gPT4gbiAhPT0gbGIpO1xuICAgIHNpYmxpbmdzLmZvckVhY2gobiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoJ2luZXJ0JyBpbiBuKSBuLmluZXJ0ID0gISFvbjtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGlmIChvbikgbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIGVsc2Ugbi5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFwRm9jdXMoZSl7XG4gICAgaWYgKGUua2V5ICE9PSAnVGFiJykgcmV0dXJuO1xuICAgIGNvbnN0IGZvY3VzYWJsZXMgPSBsYi5xdWVyeVNlbGVjdG9yQWxsKFtcbiAgICAgICdhW2hyZWZdJywnYnV0dG9uJywnaW5wdXQnLCdzZWxlY3QnLCd0ZXh0YXJlYScsXG4gICAgICAnW3RhYmluZGV4XTpub3QoW3RhYmluZGV4PVwiLTFcIl0pJ1xuICAgIF0uam9pbignLCcpKTtcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuZnJvbShmb2N1c2FibGVzKS5maWx0ZXIoZWwgPT4gIWVsLmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSAmJiAhZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDApeyBlLnByZXZlbnREZWZhdWx0KCk7IChpbm5lciB8fCBsYikuZm9jdXMoKTsgcmV0dXJuOyB9XG4gICAgY29uc3QgZmlyc3QgPSBsaXN0WzBdO1xuICAgIGNvbnN0IGxhc3QgPSBsaXN0W2xpc3QubGVuZ3RoIC0gMV07XG4gICAgaWYgKGUuc2hpZnRLZXkgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZmlyc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGxhc3QuZm9jdXMoKTsgfVxuICAgIGVsc2UgaWYgKCFlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGxhc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGZpcnN0LmZvY3VzKCk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5Gcm9tU2xpZGUoc2xpZGUpe1xuICAgIGlmIChvcGVuR3VhcmQpIHJldHVybjtcbiAgICBvcGVuR3VhcmQgPSB0cnVlO1xuICAgIGxhc3RGb2N1cyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgOiBudWxsO1xuXG4gICAgY29uc3QgdmlkZW8gPSBzbGlkZT8uZGF0YXNldD8udmlkZW8gfHwgJyc7XG4gICAgY29uc3QgdGl0bGUgPSBzbGlkZT8uZGF0YXNldD8udGl0bGUgfHwgJyc7XG4gICAgY29uc3QgdGV4dCAgPSBzbGlkZT8uZGF0YXNldD8udGV4dCAgfHwgJyc7XG5cbiAgICBjb25zdCBpc0Rlc2lnbmVyID0gL1xcLndlYmZsb3dcXC5jb20kLy50ZXN0KGxvY2F0aW9uLmhvc3RuYW1lKSB8fCAvY2FudmFzXFwud2ViZmxvd1xcLmNvbSQvLnRlc3QobG9jYXRpb24uaG9zdG5hbWUpO1xuICAgIGNvbnN0IGF1dG9wbGF5ID0gaXNEZXNpZ25lciA/IDAgOiAxOyAvLyBhdm9pZCBhdXRvcGxheSB3YXJuaW5ncyBpbnNpZGUgV2ViZmxvdyBEZXNpZ25lclxuICAgIGlmICh2aWRlb0FyZWEpIG1vdW50VmltZW8odmlkZW9BcmVhLCB2aWRlbywgeyBhdXRvcGxheSwgbXV0ZWQ6IDEsIGNvbnRyb2xzOiAwLCBiYWNrZ3JvdW5kOiAxLCBwbGF5c2lubGluZTogMSwgZG50OiAxIH0pO1xuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3BlbicsICd0cnVlJyk7XG4gICAgc2V0UGFnZUluZXJ0KHRydWUpO1xuICAgIGxvY2tTY3JvbGwoKTtcblxuICAgIGxiLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAoaW5uZXIgfHwgbGIpLmZvY3VzKCk7XG5cbiAgICBlbWl0KCdMSUdIVEJPWF9PUEVOJywgbGIsIHsgdmlkZW8sIHRpdGxlLCB0ZXh0IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVxdWVzdENsb3NlKCl7XG4gICAgaWYgKCFvcGVuR3VhcmQpIHJldHVybjtcbiAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRScsIGxiKTtcbiAgICBpZiAocHJlZmVyc1JlZHVjZWQpe1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogMCB9KTtcbiAgICAgIGVtaXQoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgbGIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmxvY2tTY3JvbGwoeyBkZWxheU1zOiBjbG9zZURlbGF5TXMgfSk7XG4gICAgfVxuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGxiLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1vcGVuJyk7XG4gICAgc2V0UGFnZUluZXJ0KGZhbHNlKTtcbiAgICBpZiAodmlkZW9BcmVhKSB2aWRlb0FyZWEuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGxhc3RGb2N1cyAmJiBkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGxhc3RGb2N1cykpIGxhc3RGb2N1cy5mb2N1cygpO1xuICAgIG9wZW5HdWFyZCA9IGZhbHNlO1xuICB9XG5cbiAgc2xpZGVzLmZvckVhY2goc2xpZGUgPT4gc2xpZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBvcGVuRnJvbVNsaWRlKHNsaWRlKSkpO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgaWYgKGlubmVyICYmICFlLnRhcmdldC5jbG9zZXN0KCcucHJvamVjdC1saWdodGJveF9faW5uZXInKSkgcmVxdWVzdENsb3NlKCk7XG4gICAgZWxzZSBpZiAoIWlubmVyICYmIGUudGFyZ2V0ID09PSBsYikgcmVxdWVzdENsb3NlKCk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBpZiAobGIuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nKSA9PT0gJ3RydWUnKXtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHJlcXVlc3RDbG9zZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSAnVGFiJykgdHJhcEZvY3VzKGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgbGIuYWRkRXZlbnRMaXN0ZW5lcignTElHSFRCT1hfQ0xPU0VEX0RPTkUnLCAoKSA9PiB1bmxvY2tTY3JvbGwoKSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgV2ViZmxvdyBTY3JvbGxUcmlnZ2VyIEJyaWRnZVxuICogIFB1cnBvc2U6IFRyaWdnZXIgV2ViZmxvdyBJWCBpbnRlcmFjdGlvbnMgdmlhIEdTQVAgU2Nyb2xsVHJpZ2dlclxuICogIERhdGU6IDIwMjUtMTAtMzBcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tXRUJGTE9XXSBtb2R1bGUgbG9hZGVkJyk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVggYnJpZGdlLlxuICpcbiAqIEJlaGF2aW9yOlxuICogIDEuIE9uIGxvYWQ6IGVtaXQgbG9nby1ncm93IHRvIGFuaW1hdGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcgKGVuc3VyZXMgbG9nbyBzdGFydHMgaW4gYmlnIHN0YXRlKVxuICogIDIuIFNjcm9sbCBkb3duIHBhc3QgZmlyc3Qgc2xpZGU6IGVtaXQgbG9nby1zaHJpbmsgKGJpZyBcdTIxOTIgc21hbGwpXG4gKiAgMy4gU3RhcnQgc2Nyb2xsaW5nIHVwIChtaWRkbGUgc2VjdGlvbik6IGVtaXQgbG9nby1ncm93IGltbWVkaWF0ZWx5IChzbWFsbCBcdTIxOTIgYmlnKVxuICogIDQuIFJlYWNoIGxhc3Qgc2xpZGU6IGVtaXQgbG9nby1ncm93IChzbWFsbCBcdTIxOTIgYmlnLCBsb2dvIGdyb3dzIGF0IGJvdHRvbSlcbiAqICA1LiBTY3JvbGwgdXAgZnJvbSBsYXN0IHNsaWRlOiBlbWl0IGxvZ28tc2hyaW5rIChiaWcgXHUyMTkyIHNtYWxsKVxuICogIDYuIFJldHVybiB0byB0b3A6IGVtaXQgbG9nby1zdGFydCAoanVtcCB0byAwcywgYmFjayB0byBiaWcgc3RhdGljIHN0YXRlKVxuICpcbiAqIFJlcXVpcmVtZW50cyBpbiBXZWJmbG93OlxuICogIC0gbG9nby1zdGFydDogVXNlcyB0aGUgc2FtZSB0aW1lbGluZSBhcyBsb2dvLXNocmluay4gQ29udHJvbCBcdTIxOTIgSnVtcCB0byAwcywgdGhlbiBTdG9wLlxuICogICAgICAgICAgICAgICBVc2VkIHdoZW4gcmV0dXJuaW5nIHRvIHRvcCAob25FbnRlckJhY2spOyB3b3JrcyBiZWNhdXNlIHRpbWVsaW5lIGlzIGluaXRpYWxpemVkIGJ5IHRoZW4uXG4gKiAgICAgICAgICAgICAgIElmIG9taXR0ZWQsIGV2ZW50IGlzIHN0aWxsIGVtaXR0ZWQgYnV0IHNhZmVseSBpZ25vcmVkIGlmIG5vdCBjb25maWd1cmVkLlxuICogIC0gbG9nby1zaHJpbms6IENvbnRyb2wgXHUyMTkyIFBsYXkgZnJvbSBzdGFydCAoYmlnIFx1MjE5MiBzbWFsbCBhbmltYXRpb24pXG4gKiAgLSBsb2dvLWdyb3c6IENvbnRyb2wgXHUyMTkyIFBsYXkgZnJvbSBzdGFydCAoc21hbGwgXHUyMTkyIGJpZyBhbmltYXRpb24pXG4gKiAgICAgICAgICAgICAgIFRoaXMgaXMgdHJpZ2dlcmVkIG9uIGluaXRpYWwgcGFnZSBsb2FkIHRvIGFuaW1hdGUgbG9nbyBmcm9tIHNtYWxsIFx1MjE5MiBiaWcuXG4gKiAgICAgICAgICAgICAgIEVuc3VyZSB5b3VyIGxvZ28gQ1NTIHNob3dzIGl0IGluIHRoZSBcInNtYWxsXCIgc3RhdGUgaW5pdGlhbGx5IChtYXRjaGluZyB0aGUgZW5kIHN0YXRlXG4gKiAgICAgICAgICAgICAgIG9mIHNocmluayBvciBzdGFydCBzdGF0ZSBvZiBncm93KSwgc28gdGhlIGdyb3cgYW5pbWF0aW9uIGhhcyBzb21ld2hlcmUgdG8gYW5pbWF0ZSBmcm9tLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2Nyb2xsZXJTZWxlY3Rvcj0nLnBlcnNwZWN0aXZlLXdyYXBwZXInXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmRyaXZlclNlbGVjdG9yXSAtIERlZmF1bHRzIHRvIGZpcnN0IC5zbGlkZSBpbiBzY3JvbGxlclxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmluaXRFdmVudE5hbWU9J2xvZ28tc3RhcnQnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNocmlua0V2ZW50TmFtZT0nbG9nby1zaHJpbmsnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmdyb3dFdmVudE5hbWU9J2xvZ28tZ3JvdyddXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm1hcmtlcnM9ZmFsc2VdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IHNjcm9sbGVyU2VsZWN0b3IgPSBvcHRpb25zLnNjcm9sbGVyU2VsZWN0b3IgfHwgJy5wZXJzcGVjdGl2ZS13cmFwcGVyJztcbiAgY29uc3QgaW5pdEV2ZW50TmFtZSA9IG9wdGlvbnMuaW5pdEV2ZW50TmFtZSB8fCAnbG9nby1zdGFydCc7XG4gIGNvbnN0IHNocmlua0V2ZW50TmFtZSA9IG9wdGlvbnMuc2hyaW5rRXZlbnROYW1lIHx8IG9wdGlvbnMucGxheUV2ZW50TmFtZSB8fCAnbG9nby1zaHJpbmsnO1xuICBjb25zdCBncm93RXZlbnROYW1lID0gb3B0aW9ucy5ncm93RXZlbnROYW1lIHx8ICdsb2dvLWdyb3cnO1xuICBjb25zdCBtYXJrZXJzID0gISFvcHRpb25zLm1hcmtlcnM7XG5cbiAgZnVuY3Rpb24gb25XaW5kb3dMb2FkKGNiKXtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykgeyBzZXRUaW1lb3V0KGNiLCAwKTsgcmV0dXJuOyB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBjYiwgeyBvbmNlOiB0cnVlIH0pO1xuICB9XG5cbiAgb25XaW5kb3dMb2FkKGZ1bmN0aW9uKCl7XG4gICAgY29uc3QgV2ViZmxvdyA9IHdpbmRvdy5XZWJmbG93IHx8IFtdO1xuICAgIFxuICAgIFdlYmZsb3cucHVzaChmdW5jdGlvbigpe1xuICAgICAgLy8gR2V0IFdlYmZsb3cgSVggQVBJICh0cnkgaXgzIGZpcnN0LCBmYWxsYmFjayB0byBpeDIpXG4gICAgICBjb25zdCB3Zkl4ID0gKHdpbmRvdy5XZWJmbG93ICYmIHdpbmRvdy5XZWJmbG93LnJlcXVpcmUpIFxuICAgICAgICA/ICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSlcbiAgICAgICAgOiBudWxsO1xuICAgICAgY29uc3QgU2Nyb2xsVHJpZ2dlciA9IHdpbmRvdy5TY3JvbGxUcmlnZ2VyO1xuICAgICAgXG4gICAgICBpZiAoIXdmSXggfHwgIVNjcm9sbFRyaWdnZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IHNjcm9sbGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzY3JvbGxlclNlbGVjdG9yKTtcbiAgICAgIGlmICghc2Nyb2xsZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIEZpbmQgZmlyc3QgLnNsaWRlIGluc2lkZSB0aGUgc2Nyb2xsZXIgKGZvciB0b3AgZGV0ZWN0aW9uKVxuICAgICAgY29uc3QgZHJpdmVyID0gc2Nyb2xsZXIucXVlcnlTZWxlY3RvcignLnNsaWRlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNsaWRlJyk7XG4gICAgICBpZiAoIWRyaXZlcikgeyBcbiAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIERyaXZlciBzbGlkZSBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuOyBcbiAgICAgIH1cblxuICAgICAgLy8gRmluZCBsYXN0IC5zbGlkZSBpbnNpZGUgdGhlIHNjcm9sbGVyIChmb3IgYm90dG9tIGRldGVjdGlvbilcbiAgICAgIGNvbnN0IHNsaWRlcyA9IEFycmF5LmZyb20oc2Nyb2xsZXIucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJykpO1xuICAgICAgY29uc3QgbGFzdFNsaWRlID0gc2xpZGVzLmxlbmd0aCA+IDAgPyBzbGlkZXNbc2xpZGVzLmxlbmd0aCAtIDFdIDogbnVsbDtcbiAgICAgIGlmICghbGFzdFNsaWRlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW1dFQkZMT1ddIE5vIHNsaWRlcyBmb3VuZCwgbGFzdCBzbGlkZSBkZXRlY3Rpb24gZGlzYWJsZWQnKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTZXR1cCBjb21wbGV0ZTonLCB7IFxuICAgICAgICBzY3JvbGxlcjogISFzY3JvbGxlciwgXG4gICAgICAgIGRyaXZlcjogISFkcml2ZXIsXG4gICAgICAgIGxhc3RTbGlkZTogISFsYXN0U2xpZGUsXG4gICAgICAgIHRvdGFsU2xpZGVzOiBzbGlkZXMubGVuZ3RoLFxuICAgICAgICB3Zkl4OiAhIXdmSXgsIFxuICAgICAgICBTY3JvbGxUcmlnZ2VyOiAhIVNjcm9sbFRyaWdnZXIsXG4gICAgICAgIGluaXRFdmVudDogaW5pdEV2ZW50TmFtZSxcbiAgICAgICAgc2hyaW5rRXZlbnQ6IHNocmlua0V2ZW50TmFtZSxcbiAgICAgICAgZ3Jvd0V2ZW50OiBncm93RXZlbnROYW1lXG4gICAgICB9KTtcblxuICAgICAgLy8gVHJhY2sgc2Nyb2xsIHN0YXRlOiBhcmUgd2UgYmVsb3cgdGhlIHRvcCB6b25lPyBkaWQgd2Ugc2hyaW5rIGFscmVhZHk/IGRpZCB3ZSBncm93IGFscmVhZHk/XG4gICAgICAvLyBBbHNvIHRyYWNrIGxhc3Qgc2xpZGUgc3RhdGVcbiAgICAgIGxldCBpc0JlbG93VG9wID0gZmFsc2U7XG4gICAgICBsZXQgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICBsZXQgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgIGxldCBpc0F0TGFzdFNsaWRlID0gZmFsc2U7XG4gICAgICBsZXQgaGFzR3Jvd25BdExhc3QgPSBmYWxzZTtcblxuICAgICAgLy8gTWFpbiBTY3JvbGxUcmlnZ2VyOiB3YXRjaGVzIHdoZW4gZmlyc3Qgc2xpZGUgbGVhdmVzL2VudGVycyB0b3Agem9uZVxuICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICB0cmlnZ2VyOiBkcml2ZXIsXG4gICAgICAgIHNjcm9sbGVyOiBzY3JvbGxlcixcbiAgICAgICAgc3RhcnQ6ICd0b3AgdG9wJyxcbiAgICAgICAgZW5kOiAndG9wIC0xMCUnLCAvLyBTaG9ydCByYW5nZSBmb3IgaW1tZWRpYXRlIHRyaWdnZXJcbiAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgXG4gICAgICAgIG9uTGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHBhc3QgdG9wIFx1MjE5MiBzaHJpbmsgb25jZSAob25seSB3aGVuIGxlYXZpbmcsIG5vdCB3aGVuIGFscmVhZHkgYmVsb3cpXG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgb25seSBmaXJlIHdoZW4gY3Jvc3NpbmcgZnJvbSBcImF0IHRvcFwiIHRvIFwiYmVsb3cgdG9wXCJcbiAgICAgICAgICBpZiAoIWlzQmVsb3dUb3AgJiYgIWhhc1NocnVuaykge1xuICAgICAgICAgICAgaXNCZWxvd1RvcCA9IHRydWU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc2hyaW5rIChzY3JvbGxlZCBkb3duIHBhc3QgZmlyc3Qgc2xpZGUpOicsIHNocmlua0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChzaHJpbmtFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBoYXNTaHJ1bmsgPSB0cnVlO1xuICAgICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlOyAvLyBSZXNldCBncm93IGZsYWcgd2hlbiB3ZSBzaHJpbmtcbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBvbkVudGVyQmFjazogKCkgPT4ge1xuICAgICAgICAgIC8vIFNjcm9sbGVkIGJhY2sgdXAgdG8gdG9wIFx1MjE5MiBqdW1wIHNocmluayB0aW1lbGluZSB0byAwcyAoYmlnIHN0YXRlKSBhbmQgc3RvcFxuICAgICAgICAgIGlzQmVsb3dUb3AgPSBmYWxzZTtcbiAgICAgICAgICBoYXNTaHJ1bmsgPSBmYWxzZTtcbiAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgIGlzQXRMYXN0U2xpZGUgPSBmYWxzZTtcbiAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgc3RhcnQgKHJldHVybiB0byB0b3ApOicsIGluaXRFdmVudE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSB3Zkl4IGF2YWlsYWJsZTonLCAhIXdmSXgsICdlbWl0IGF2YWlsYWJsZTonLCB0eXBlb2Ygd2ZJeD8uZW1pdCk7XG4gICAgICAgICAgICBpZiAod2ZJeCAmJiB0eXBlb2Ygd2ZJeC5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChpbml0RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSByZXR1cm4tdG8tdG9wIGV2ZW50IGVtaXR0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gQ2Fubm90IGVtaXQgcmV0dXJuLXRvLXRvcDogd2ZJeC5lbWl0IG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIEVycm9yIGVtaXR0aW5nIHJldHVybi10by10b3A6JywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBMYXN0IHNsaWRlIFNjcm9sbFRyaWdnZXI6IHdhdGNoZXMgd2hlbiBsYXN0IHNsaWRlIGVudGVycy9sZWF2ZXMgdmlld3BvcnRcbiAgICAgIGlmIChsYXN0U2xpZGUpIHtcbiAgICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICAgIHRyaWdnZXI6IGxhc3RTbGlkZSxcbiAgICAgICAgICBzY3JvbGxlcjogc2Nyb2xsZXIsXG4gICAgICAgICAgc3RhcnQ6ICd0b3AgYm90dG9tJywgLy8gTGFzdCBzbGlkZSBlbnRlcnMgZnJvbSBib3R0b20gb2Ygdmlld3BvcnRcbiAgICAgICAgICBlbmQ6ICdib3R0b20gdG9wJywgLy8gTGFzdCBzbGlkZSBsZWF2ZXMgdG9wIG9mIHZpZXdwb3J0XG4gICAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgICBcbiAgICAgICAgICBvbkVudGVyOiAoKSA9PiB7XG4gICAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHRvIGxhc3Qgc2xpZGUgXHUyMTkyIGdyb3cgb25jZSAob25seSB3aGVuIGVudGVyaW5nLCBub3Qgd2hlbiBhbHJlYWR5IHRoZXJlKVxuICAgICAgICAgICAgaWYgKCFpc0F0TGFzdFNsaWRlICYmICFoYXNHcm93bkF0TGFzdCkge1xuICAgICAgICAgICAgICBpc0F0TGFzdFNsaWRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAocmVhY2hlZCBsYXN0IHNsaWRlKTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgICAgaGFzR3Jvd25BdExhc3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pZGRsZSBzZWN0aW9uIGZsYWdzIHNpbmNlIHdlJ3JlIGF0IHRoZSBsYXN0IHNsaWRlXG4gICAgICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgXG4gICAgICAgICAgb25MZWF2ZUJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgIC8vIFNjcm9sbGVkIFVQIGZyb20gbGFzdCBzbGlkZSAobGVhdmluZyBiYWNrd2FyZCkgXHUyMTkyIHNocmluayBvbmNlXG4gICAgICAgICAgICBpZiAoaXNBdExhc3RTbGlkZSAmJiBoYXNHcm93bkF0TGFzdCkge1xuICAgICAgICAgICAgICBpc0F0TGFzdFNsaWRlID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IHNocmluayAoc2Nyb2xsaW5nIHVwIGZyb20gbGFzdCBzbGlkZSk6Jywgc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICBoYXNHcm93bkF0TGFzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGhhc1NocnVuayA9IHRydWU7IC8vIFdlJ3JlIG5vdyBpbiB0aGUgbWlkZGxlIHNlY3Rpb24gd2l0aCBsb2dvIHNtYWxsXG4gICAgICAgICAgICAgICAgaGFzR3Jvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgfSBjYXRjaChfKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbXBsZSBzY3JvbGwgZGlyZWN0aW9uIHdhdGNoZXIgZm9yIGltbWVkaWF0ZSBncm93IG9uIHVwd2FyZCBzY3JvbGxcbiAgICAgIC8vIE9ubHkgdHJpZ2dlcnMgZ3JvdyB3aGVuOlxuICAgICAgLy8gLSBXZSdyZSBiZWxvdyB0aGUgdG9wIHpvbmUgKGlzQmVsb3dUb3ApXG4gICAgICAvLyAtIFdlJ3ZlIHNocnVuayAoaGFzU2hydW5rKVxuICAgICAgLy8gLSBXZSdyZSBzY3JvbGxpbmcgdXAgKGRpcmVjdGlvbiA9PT0gLTEpXG4gICAgICAvLyAtIFdlIGp1c3Qgc3RhcnRlZCBzY3JvbGxpbmcgdXAgKGxhc3REaXJlY3Rpb24gIT09IC0xLCBtZWFuaW5nIHdlIHdlcmVuJ3QgYWxyZWFkeSBzY3JvbGxpbmcgdXApXG4gICAgICAvLyAtIFdlIGhhdmVuJ3QgYWxyZWFkeSBncm93biAoaGFzR3Jvd24pXG4gICAgICBsZXQgbGFzdFNjcm9sbFRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcDtcbiAgICAgIGxldCBsYXN0RGlyZWN0aW9uID0gMDsgLy8gLTEgPSB1cCwgMSA9IGRvd24sIDAgPSB1bmtub3duXG4gICAgICBcbiAgICAgIFNjcm9sbFRyaWdnZXIuY3JlYXRlKHtcbiAgICAgICAgc2Nyb2xsZXI6IHNjcm9sbGVyLFxuICAgICAgICBzdGFydDogMCxcbiAgICAgICAgZW5kOiAoKSA9PiBTY3JvbGxUcmlnZ2VyLm1heFNjcm9sbChzY3JvbGxlciksXG4gICAgICAgIG9uVXBkYXRlOiAoc2VsZikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY3JvbGxUb3AgPSBzY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gY3VycmVudFNjcm9sbFRvcCA+IGxhc3RTY3JvbGxUb3AgPyAxIDogY3VycmVudFNjcm9sbFRvcCA8IGxhc3RTY3JvbGxUb3AgPyAtMSA6IGxhc3REaXJlY3Rpb247XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gR3JvdyBvbmx5IHdoZW4gc2Nyb2xsaW5nIHVwIGZyb20gYmVsb3cgdG9wIChtaWRkbGUgc2VjdGlvbiksIGFuZCB3ZSd2ZSBzaHJ1bmssIGFuZCB3ZSBoYXZlbid0IGdyb3duIHlldFxuICAgICAgICAgIC8vIERvbid0IHRyaWdnZXIgaWYgd2UncmUgYXQgdGhlIGxhc3Qgc2xpZGUgKHRoYXQncyBoYW5kbGVkIHNlcGFyYXRlbHkpXG4gICAgICAgICAgaWYgKGlzQmVsb3dUb3AgJiYgIWlzQXRMYXN0U2xpZGUgJiYgaGFzU2hydW5rICYmICFoYXNHcm93biAmJiBkaXJlY3Rpb24gPT09IC0xICYmIGxhc3REaXJlY3Rpb24gIT09IC0xKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAoc2Nyb2xsIHVwIGluIG1pZGRsZSBzZWN0aW9uKTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KGdyb3dFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBoYXNHcm93biA9IHRydWU7IC8vIFNldCBmbGFnIHNvIHdlIGRvbid0IGdyb3cgYWdhaW4gdW50aWwgd2Ugc2hyaW5rXG4gICAgICAgICAgICAgIGhhc1NocnVuayA9IGZhbHNlOyAvLyBSZXNldCBzaHJpbmsgZmxhZyBhZnRlciBncm93aW5nXG4gICAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFJlc2V0IGdyb3cgZmxhZyBpZiB3ZSBzdGFydCBzY3JvbGxpbmcgZG93biBhZ2FpbiAoYnV0IG9ubHkgaWYgd2UncmUgc3RpbGwgYmVsb3cgdG9wIGFuZCBub3QgYXQgbGFzdCBzbGlkZSlcbiAgICAgICAgICBpZiAoaXNCZWxvd1RvcCAmJiAhaXNBdExhc3RTbGlkZSAmJiBoYXNHcm93biAmJiBkaXJlY3Rpb24gPT09IDEgJiYgbGFzdERpcmVjdGlvbiAhPT0gMSkge1xuICAgICAgICAgICAgLy8gVXNlciBzdGFydGVkIHNjcm9sbGluZyBkb3duIGFnYWluIC0gcmVzZXQgc28gd2UgY2FuIHNocmluayBhZ2FpblxuICAgICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgICBoYXNHcm93biA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBSZXNldCBmbGFncyAtIHJlYWR5IHRvIHNocmluayBhZ2FpbicpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBsYXN0U2Nyb2xsVG9wID0gY3VycmVudFNjcm9sbFRvcDtcbiAgICAgICAgICBsYXN0RGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTY3JvbGxUcmlnZ2VyIGluaXRpYWxpemVkJyk7XG4gICAgICBcbiAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCBldmVudHMgZXhpc3QgaW4gV2ViZmxvdyBieSBjaGVja2luZyBpZiBlbWl0IHN1Y2NlZWRzXG4gICAgICAvLyBOb3RlOiBXZWJmbG93IGVtaXQgZG9lc24ndCB0aHJvdyBlcnJvcnMgZm9yIG1pc3NpbmcgZXZlbnRzLCBidXQgd2UgY2FuIGxvZyBhdHRlbXB0c1xuICAgICAgY29uc3QgdmVyaWZ5QW5kRW1pdCA9IChldmVudE5hbWUsIGRlc2NyaXB0aW9uKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAke2Rlc2NyaXB0aW9ufTpgLCBldmVudE5hbWUpO1xuICAgICAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHdmSXguZW1pdChldmVudE5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSBcdTI3MTMgRW1pdHRlZCAke2V2ZW50TmFtZX0gLSBJZiBub3RoaW5nIGhhcHBlbnMsIGNoZWNrIFdlYmZsb3cgY29uZmlnOmApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDEuIEV2ZW50IG5hbWUgbXVzdCBiZSBleGFjdGx5OiBcIiR7ZXZlbnROYW1lfVwiYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMi4gQ29udHJvbCBtdXN0IE5PVCBiZSBcIk5vIEFjdGlvblwiYCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW1dFQkZMT1ddICAgMy4gTXVzdCB0YXJnZXQgdGhlIGxvZ28gZWxlbWVudGApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDQuIFRpbWVsaW5lIG11c3QgYmUgc2V0IGNvcnJlY3RseWApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXRUJGTE9XXSBcdTI3MTcgd2ZJeC5lbWl0IG5vdCBhdmFpbGFibGVgKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW1dFQkZMT1ddIFx1MjcxNyBFcnJvciBlbWl0dGluZyAke2V2ZW50TmFtZX06YCwgZXJyKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBcbiAgICAgIC8vIFdhaXQgZm9yIFNjcm9sbFRyaWdnZXIgdG8gcmVmcmVzaCwgdGhlbiB0cmlnZ2VyIGxvZ28tZ3JvdyBvbiBpbml0aWFsIGxvYWRcbiAgICAgIC8vIFRoaXMgYW5pbWF0ZXMgdGhlIGxvZ28gZnJvbSBzbWFsbCBcdTIxOTIgYmlnIG9uIHBhZ2UgbG9hZCwgZW5zdXJpbmcgaXQgc3RhcnRzIGluIHRoZSBiaWcgc3RhdGVcbiAgICAgIC8vIFdlIG9ubHkgZW1pdCBvbmNlIC0gdXNlIGEgZmxhZyB0byBwcmV2ZW50IG11bHRpcGxlIGluaXRpYWwgZW1pdHNcbiAgICAgIGxldCBpbml0aWFsR3Jvd0VtaXR0ZWQgPSBmYWxzZTtcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICAgIFNjcm9sbFRyaWdnZXIucmVmcmVzaCgpO1xuICAgICAgICBcbiAgICAgICAgLy8gRW1pdCBsb2dvLWdyb3cgb24gaW5pdGlhbCBsb2FkIChhbmltYXRlcyBsb2dvIHRvIGJpZyBzdGF0ZSlcbiAgICAgICAgLy8gT25seSBlbWl0IG9uY2UsIHdpdGggYSBzaW5nbGUgZGVsYXllZCBhdHRlbXB0IHRvIGNhdGNoIFdlYmZsb3cgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFpbml0aWFsR3Jvd0VtaXR0ZWQpIHtcbiAgICAgICAgICAgIHZlcmlmeUFuZEVtaXQoZ3Jvd0V2ZW50TmFtZSwgJ0luaXRpYWwgbG9hZCAtIGdyb3cnKTtcbiAgICAgICAgICAgIGluaXRpYWxHcm93RW1pdHRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAyMDApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQ3VzdG9tIEN1cnNvclxuICogIFB1cnBvc2U6IFJlcGxhY2Ugc3lzdGVtIGN1cnNvciB3aXRoIGRhcmstYmx1ZSBjaXJjbGU7IHNuYXBweSBzY2FsZSBvbiBjbGlja2FibGVcbiAqICBEYXRlOiAyMDI1LTExLTA0XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q3VzdG9tQ3Vyc29yKG9wdGlvbnMgPSB7fSl7XG4gIC8vIEVuYWJsZSBvbmx5IG9uIGZpbmUgcG9pbnRlcnMgKG1vdXNlLCB0cmFja3BhZCkuIFNraXAgdG91Y2gtb25seSBkZXZpY2VzLlxuICBjb25zdCBoYXNGaW5lUG9pbnRlciA9IHR5cGVvZiB3aW5kb3cubWF0Y2hNZWRpYSA9PT0gJ2Z1bmN0aW9uJyBcbiAgICA/IHdpbmRvdy5tYXRjaE1lZGlhKCcocG9pbnRlcjogZmluZSknKS5tYXRjaGVzXG4gICAgOiB0cnVlO1xuICBpZiAoIWhhc0ZpbmVQb2ludGVyKSByZXR1cm47XG5cbiAgLy8gUHJldmVudCBkdXBsaWNhdGUgaW5pdGlhbGl6YXRpb25cbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtY2Nhbm4tY3VzdG9tLWN1cnNvcicpKSByZXR1cm47XG5cbiAgLy8gT25seSB0cmVhdCBhbmNob3JzIGFzIHNjYWxlLXVwIHRhcmdldHMgcGVyIHNwZWNcbiAgY29uc3QgY2xpY2thYmxlU2VsZWN0b3IgPSBvcHRpb25zLmNsaWNrYWJsZVNlbGVjdG9yIHx8ICdhW2hyZWZdJztcblxuICAvLyBJbmplY3QgbWluaW1hbCBDU1NcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICBzdHlsZS5pZCA9ICdtY2Nhbm4tY3VzdG9tLWN1cnNvci1zdHlsZSc7XG4gIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgIC8qIEhpZGUgbmF0aXZlIGN1cnNvciBldmVyeXdoZXJlLCBpbmNsdWRpbmcgcHNldWRvIGVsZW1lbnRzICovXG4gICAgLmhhcy1jdXN0b20tY3Vyc29yLFxuICAgIC5oYXMtY3VzdG9tLWN1cnNvciAqIHsgY3Vyc29yOiBub25lICFpbXBvcnRhbnQ7IH1cbiAgICAuaGFzLWN1c3RvbS1jdXJzb3IgKjo6YmVmb3JlLFxuICAgIC5oYXMtY3VzdG9tLWN1cnNvciAqOjphZnRlciB7IGN1cnNvcjogbm9uZSAhaW1wb3J0YW50OyB9XG5cbiAgICAuY3VzdG9tLWN1cnNvciB7XG4gICAgICBwb3NpdGlvbjogZml4ZWQ7XG4gICAgICBsZWZ0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgICAgd2lkdGg6IDE4cHg7XG4gICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgICBiYWNrZ3JvdW5kOiAjMGEzZDkxOyAvKiBkYXJrIGJsdWUgKi9cbiAgICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICAgICAgei1pbmRleDogMjE0NzQ4MzY0NztcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTk5OTlweCwgLTk5OTlweCwgMCkgdHJhbnNsYXRlKC01MCUsIC01MCUpIHNjYWxlKDAuMyk7XG4gICAgICBvcGFjaXR5OiAwO1xuICAgICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDEyMG1zIGN1YmljLWJlemllcigwLjIsIDAuOSwgMC4yLCAxKSwgb3BhY2l0eSA4MG1zIGxpbmVhcjtcbiAgICAgIHdpbGwtY2hhbmdlOiB0cmFuc2Zvcm0sIG9wYWNpdHk7XG4gICAgfVxuXG4gICAgLmN1c3RvbS1jdXJzb3IuaXMtdmlzaWJsZSB7IG9wYWNpdHk6IDE7IH1cblxuICAgIEBtZWRpYSAocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKSB7XG4gICAgICAuY3VzdG9tLWN1cnNvciB7IHRyYW5zaXRpb246IG5vbmU7IH1cbiAgICB9XG4gIGA7XG4gIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoYXMtY3VzdG9tLWN1cnNvcicpO1xuXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGVsLmlkID0gJ21jY2Fubi1jdXN0b20tY3Vyc29yJztcbiAgZWwuY2xhc3NOYW1lID0gJ2N1c3RvbS1jdXJzb3InO1xuICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XG5cbiAgbGV0IG1vdXNlWCA9IDA7XG4gIGxldCBtb3VzZVkgPSAwO1xuICBsZXQgaXNBY3RpdmUgPSBmYWxzZTtcbiAgbGV0IHJhZklkID0gMDtcbiAgbGV0IG5lZWRzUmVuZGVyID0gZmFsc2U7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gdHlwZW9mIHdpbmRvdy5tYXRjaE1lZGlhID09PSAnZnVuY3Rpb24nIFxuICAgID8gd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpJykubWF0Y2hlc1xuICAgIDogZmFsc2U7XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCl7XG4gICAgcmFmSWQgPSAwO1xuICAgIGlmICghbmVlZHNSZW5kZXIpIHJldHVybjtcbiAgICBuZWVkc1JlbmRlciA9IGZhbHNlO1xuICAgIGNvbnN0IHNjYWxlID0gaXNBY3RpdmUgPyAxIDogMC4zO1xuICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUzZCgke21vdXNlWH1weCwgJHttb3VzZVl9cHgsIDApIHRyYW5zbGF0ZSgtNTAlLCAtNTAlKSBzY2FsZSgke3NjYWxlfSlgO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NoZWR1bGUoKXtcbiAgICBpZiAoIXJhZklkKSByYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0VmlzaWJsZSh2KXtcbiAgICBpZiAodikgZWwuY2xhc3NMaXN0LmFkZCgnaXMtdmlzaWJsZScpO1xuICAgIGVsc2UgZWwuY2xhc3NMaXN0LnJlbW92ZSgnaXMtdmlzaWJsZScpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlQWN0aXZlKHRhcmdldCl7XG4gICAgY29uc3QgbWF0Y2ggPSB0YXJnZXQgJiYgdGFyZ2V0LmNsb3Nlc3QgPyB0YXJnZXQuY2xvc2VzdChjbGlja2FibGVTZWxlY3RvcikgOiBudWxsO1xuICAgIGNvbnN0IG5leHQgPSAhIW1hdGNoO1xuICAgIGlmIChuZXh0ICE9PSBpc0FjdGl2ZSkge1xuICAgICAgaWYgKCFwcmVmZXJzUmVkdWNlZCkge1xuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIC8vIEdyb3c6IDQ1bXMgd2l0aCBhIGJvdW5jZS9vdmVyc2hvb3QgZmVlbFxuICAgICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDQ1bXMgY3ViaWMtYmV6aWVyKDAuMzQsIDEuNTYsIDAuNjQsIDEpLCBvcGFjaXR5IDgwbXMgbGluZWFyJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBTaHJpbms6IHNuYXBweSBidXQgc2xpZ2h0bHkgbG9uZ2VyIHRvIGZlZWwgbmF0dXJhbFxuICAgICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSAndHJhbnNmb3JtIDEyMG1zIGN1YmljLWJlemllcigwLjIsIDAuOSwgMC4yLCAxKSwgb3BhY2l0eSA4MG1zIGxpbmVhcic7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlzQWN0aXZlID0gbmV4dDtcbiAgICAgIG5lZWRzUmVuZGVyID0gdHJ1ZTtcbiAgICAgIHNjaGVkdWxlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25Qb2ludGVyTW92ZShlKXtcbiAgICBtb3VzZVggPSBlLmNsaWVudFg7XG4gICAgbW91c2VZID0gZS5jbGllbnRZO1xuICAgIHVwZGF0ZUFjdGl2ZShlLnRhcmdldCk7XG4gICAgc2V0VmlzaWJsZSh0cnVlKTtcbiAgICBuZWVkc1JlbmRlciA9IHRydWU7XG4gICAgc2NoZWR1bGUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTW91c2VPdXQoZSl7XG4gICAgaWYgKGUucmVsYXRlZFRhcmdldCA9PSBudWxsKSBzZXRWaXNpYmxlKGZhbHNlKTtcbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIG9uUG9pbnRlck1vdmUsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0Jywgb25Nb3VzZU91dCwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsICgpID0+IHNldFZpc2libGUoZmFsc2UpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4gc2V0VmlzaWJsZSh0cnVlKSk7XG5cbiAgLy8gUmV0dXJuIGNsZWFudXAgaGFuZGxlXG4gIHJldHVybiBmdW5jdGlvbiBkZXN0cm95KCl7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgb25Qb2ludGVyTW92ZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1jdXN0b20tY3Vyc29yJyk7XG4gICAgdHJ5IHsgZWwucmVtb3ZlKCk7IH0gY2F0Y2goXykge31cbiAgICB0cnkgeyBzdHlsZS5yZW1vdmUoKTsgfSBjYXRjaChfKSB7fVxuICB9O1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEFwcCBFbnRyeVxuICogIFB1cnBvc2U6IFdpcmUgbW9kdWxlcyBhbmQgZXhwb3NlIG1pbmltYWwgZmFjYWRlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBpbml0QWNjb3JkaW9uIH0gZnJvbSAnLi9tb2R1bGVzL2FjY29yZGlvbi5qcyc7XG5pbXBvcnQgeyBpbml0TGlnaHRib3ggfSBmcm9tICcuL21vZHVsZXMvbGlnaHRib3guanMnO1xuaW1wb3J0IHsgaW5pdFdlYmZsb3dTY3JvbGxUcmlnZ2VycyB9IGZyb20gJy4vbW9kdWxlcy93ZWJmbG93LXNjcm9sbHRyaWdnZXIuanMnO1xuaW1wb3J0IHsgaW5pdEN1c3RvbUN1cnNvciB9IGZyb20gJy4vbW9kdWxlcy9jdXJzb3IuanMnO1xuXG5mdW5jdGlvbiBwYXRjaFlvdVR1YmVBbGxvd1Rva2Vucygpe1xuICAvLyBNaW5pbWFsIHNldCB0byByZWR1Y2UgcGVybWlzc2lvbiBwb2xpY3kgd2FybmluZ3MgaW5zaWRlIERlc2lnbmVyXG4gIGNvbnN0IHRva2VucyA9IFsnYXV0b3BsYXknLCdlbmNyeXB0ZWQtbWVkaWEnLCdwaWN0dXJlLWluLXBpY3R1cmUnXTtcbiAgY29uc3Qgc2VsID0gW1xuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tXCJdJyxcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dS5iZVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHViZS1ub2Nvb2tpZS5jb21cIl0nLFxuICBdLmpvaW4oJywnKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWwpLmZvckVhY2goKGlmcikgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gKGlmci5nZXRBdHRyaWJ1dGUoJ2FsbG93JykgfHwgJycpLnNwbGl0KCc7JykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBtZXJnZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLmV4aXN0aW5nLCAuLi50b2tlbnNdKSkuam9pbignOyAnKTtcbiAgICBpZnIuc2V0QXR0cmlidXRlKCdhbGxvdycsIG1lcmdlZCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0KG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IGxpZ2h0Ym94Um9vdCA9IG9wdGlvbnMubGlnaHRib3hSb290IHx8ICcjcHJvamVjdC1saWdodGJveCc7XG4gIGluaXRBY2NvcmRpb24oJy5hY2NvcmRlb24nKTtcbiAgaW5pdExpZ2h0Ym94KHsgcm9vdDogbGlnaHRib3hSb290LCBjbG9zZURlbGF5TXM6IDEwMDAgfSk7XG4gIC8vIFJlbHkgb24gQ1NTIHNjcm9sbC1zbmFwIGluIGAucGVyc3BlY3RpdmUtd3JhcHBlcmA7IGRvIG5vdCBhdHRhY2ggSlMgcGFnaW5nXG5cbiAgLy8gQ3VzdG9tIGRhcmstYmx1ZSBjdXJzb3Igd2l0aCBzbmFwcHkgc2NhbGUgb24gY2xpY2thYmxlIHRhcmdldHNcbiAgdHJ5IHsgaW5pdEN1c3RvbUN1cnNvcigpOyB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gQnJpZGdlIEdTQVAgU2Nyb2xsVHJpZ2dlciBcdTIxOTIgV2ViZmxvdyBJWFxuICB0cnkge1xuICAgIGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMoe1xuICAgICAgc2Nyb2xsZXJTZWxlY3RvcjogJy5wZXJzcGVjdGl2ZS13cmFwcGVyJyxcbiAgICAgIGluaXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JyxcbiAgICAgIHNocmlua0V2ZW50TmFtZTogJ2xvZ28tc2hyaW5rJyxcbiAgICAgIGdyb3dFdmVudE5hbWU6ICdsb2dvLWdyb3cnXG4gICAgfSk7XG4gIH0gY2F0Y2goXykge31cblxuICAvLyBOb3RlOiBubyBKUyBzbGlkZSBzbmFwcGluZzsgcmVseSBvbiBDU1Mgc2Nyb2xsLXNuYXAgaW4gYC5wZXJzcGVjdGl2ZS13cmFwcGVyYFxufVxuXG4vLyBFeHBvc2UgYSB0aW55IGdsb2JhbCBmb3IgV2ViZmxvdy9EZXNpZ25lciBob29rc1xuLy8gKEludGVybmFscyByZW1haW4gcHJpdmF0ZSBpbnNpZGUgdGhlIElJRkUgYnVuZGxlKVxuaWYgKCF3aW5kb3cuQXBwKSB3aW5kb3cuQXBwID0ge307XG53aW5kb3cuQXBwLmluaXQgPSBpbml0O1xuXG4vLyBBdXRvLWluaXQgb24gRE9NIHJlYWR5IChzYWZlIGlmIGVsZW1lbnRzIGFyZSBtaXNzaW5nKVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdHJ5IHsgcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKTsgaW5pdCgpOyB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcignW0FwcF0gaW5pdCBlcnJvcicsIGVycik7IH1cbn0pO1xuXG5cbiJdLAog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
