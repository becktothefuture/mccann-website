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

  // src/modules/accordion-direct-gsap.js
  var gsap;
  function findGSAP() {
    if (gsap) return gsap;
    let attempts = 0;
    const find = () => {
      const gsapAvailable = window.gsap || window.TweenMax || window.TweenLite;
      if (gsapAvailable) {
        gsap = gsapAvailable.gsap || gsapAvailable;
        console.log("[DIRECT-GSAP] \u2705 GSAP found and cached. Version:", gsap.version || "Legacy");
      } else if (attempts < 20) {
        attempts++;
        setTimeout(find, 250);
      } else {
        console.log("[DIRECT-GSAP] \u274C GSAP not found after 5 seconds, animations disabled");
      }
    };
    find();
  }
  findGSAP();
  function gsapOpenAnimation() {
    if (!gsap) {
      console.log("[DIRECT-GSAP] Open animation skipped: GSAP not available.");
      return;
    }
    const targets = document.querySelectorAll(".acc-animate-target");
    if (targets.length === 0) return;
    console.log(`[DIRECT-GSAP] \u{1F3AC} Animating ${targets.length} items OPEN`);
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
        console.log("[DIRECT-GSAP] \u2705 Open animation complete");
        gsap.set(targets, { clearProps: "all" });
      }
    });
  }
  function gsapCloseAnimation() {
    if (!gsap) {
      console.log("[DIRECT-GSAP] Close animation skipped: GSAP not available.");
      return;
    }
    const targets = document.querySelectorAll(".acc-animate-target");
    if (targets.length === 0) return;
    console.log(`[DIRECT-GSAP] \u{1F3AC} Animating ${targets.length} items CLOSE`);
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
        console.log("[DIRECT-GSAP] \u2705 Close animation complete");
      }
    });
  }
  window.directGSAPTest = {
    testOpen: () => {
      console.log("[DIRECT-GSAP] Manual test: OPEN");
      document.querySelectorAll(".acc-item").forEach((el) => el.classList.add("acc-animate-target"));
      gsapOpenAnimation();
    },
    testClose: () => {
      console.log("[DIRECT-GSAP] Manual test: CLOSE");
      document.querySelectorAll(".acc-item").forEach((el) => el.classList.add("acc-animate-target"));
      gsapCloseAnimation();
    },
    checkGSAP: () => {
      const gsapFound = !!gsap;
      console.log("[DIRECT-GSAP] GSAP available:", gsapFound);
      return gsapFound;
    }
  };

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
          item.classList.add("acc-animate-target");
        } else {
          item.classList.remove("acc-animate-target");
        }
      });
      dbg(`Marked ${items.length} items for ${show ? "show" : "hide"} animation in panel ${panel.id}`);
      const allMarked = root.querySelectorAll(".acc-animate-target");
      dbg(`Total elements with acc-animate-target class in DOM: ${allMarked.length}`);
      allMarked.forEach((el) => {
        dbg(`  - ${el.className} | Text: ${(el.textContent || "").trim().slice(0, 50)}`);
      });
    }
    function clearAllAnimationMarkers() {
      root.querySelectorAll(".acc-animate-target").forEach((el) => {
        el.classList.remove("acc-animate-target");
      });
    }
    const wfIx = window.Webflow && window.Webflow.require ? window.Webflow.require("ix3") || window.Webflow.require("ix2") : null;
    dbg("Webflow IX available:", !!wfIx);
    function emitIx(name) {
      try {
        if (wfIx && typeof wfIx.emit === "function") {
          dbg(`\u{1F3AF} EMITTING via wfIx.emit: "${name}"`);
          wfIx.emit(name);
          const marked = root.querySelectorAll(".acc-animate-target");
          dbg(`  \u2192 ${marked.length} elements have acc-animate-target class when "${name}" fires`);
        }
      } catch (err) {
        dbg("wfIx.emit error", err && err.message);
      }
      try {
        window.dispatchEvent(new CustomEvent(name));
        dbg(`\u{1F4E2} EMITTING via window.dispatchEvent: "${name}"`);
      } catch (err) {
        dbg("window.dispatchEvent error", err && err.message);
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
          const markedItems = p.querySelectorAll(":scope > .acc-item.acc-animate-target");
          dbg("emit acc-open", { id: p.id, markedItems: markedItems.length, totalItems: p.querySelectorAll(":scope > .acc-item").length });
          emitAll("acc-open");
          gsapOpenAnimation();
        }, 10);
        expand(p);
        trig == null ? void 0 : trig.setAttribute("aria-expanded", "true");
        (_a = trig == null ? void 0 : trig.classList) == null ? void 0 : _a.add(ACTIVE_TRIGGER_CLASS);
      } else {
        clearAllAnimationMarkers();
        markItemsForAnimation(p, true);
        setTimeout(() => {
          const markedItems = p.querySelectorAll(":scope > .acc-item.acc-animate-target");
          dbg("emit acc-close", { id: p.id, markedItems: markedItems.length, totalItems: p.querySelectorAll(":scope > .acc-item").length });
          emitAll("acc-close");
          gsapCloseAnimation();
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
        const items = root.querySelectorAll(".acc-animate-target");
        console.log(`Found ${items.length} items with .acc-animate-target class`);
        return items;
      }
    };
    console.log("[ACCORDION] Debug functions available at window._accordionTest");
  }

  // src/core/scrolllock.js
  var isLocked = false;
  var savedY = 0;
  function lockScroll() {
    if (isLocked) return;
    isLocked = true;
    savedY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
  }
  function unlockScroll({ delayMs = 0 } = {}) {
    if (!isLocked) return;
    const unlock = () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
      window.scrollTo(0, savedY);
      isLocked = false;
    };
    delayMs > 0 ? setTimeout(unlock, delayMs) : unlock();
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
  function initLightbox({ root = "#lightbox", closeDelayMs = 1e3 } = {}) {
    const lb = document.querySelector(root);
    if (!lb) {
      console.log("[LIGHTBOX] Element not found");
      return;
    }
    const inner = lb.querySelector(".lightbox__inner");
    const videoArea = lb.querySelector(".video-area");
    const closeBtn = lb.querySelector("#close-btn");
    const slides = document.querySelectorAll(".slide");
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let openGuard = false;
    let lastFocus = null;
    lb.setAttribute("role", lb.getAttribute("role") || "dialog");
    lb.setAttribute("aria-modal", lb.getAttribute("aria-modal") || "true");
    lb.setAttribute("aria-hidden", "true");
    lb.classList.remove("is-open");
    lb.style.setProperty("visibility", "hidden", "important");
    lb.style.setProperty("opacity", "0", "important");
    lb.style.setProperty("pointer-events", "none", "important");
    unlockScroll({ delayMs: 0 });
    function emitWebflowEvent(name) {
      try {
        if (window.Webflow && window.Webflow.require) {
          const wfIx = window.Webflow.require("ix3") || window.Webflow.require("ix2");
          if (wfIx && typeof wfIx.emit === "function") {
            wfIx.emit(name);
          }
        }
      } catch (err) {
        console.log("[LIGHTBOX] Webflow emit failed:", err);
      }
    }
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
      const list = Array.from(focusables).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
      );
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
      if (videoArea && video) {
        mountVimeo(videoArea, video, {
          autoplay,
          muted: 1,
          controls: 0,
          background: 1,
          playsinline: 1,
          dnt: 1
        });
      }
      lb.style.removeProperty("visibility");
      lb.style.removeProperty("opacity");
      lb.style.removeProperty("pointer-events");
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");
      setPageInert(true);
      lockScroll();
      emitWebflowEvent("lb:open");
      lb.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => {
        (inner || lb).focus();
      });
      emit("LIGHTBOX_OPEN", lb, { video, title, text });
    }
    function requestClose() {
      if (!openGuard) return;
      emit("LIGHTBOX_CLOSE", lb);
      emitWebflowEvent("lb:close");
      const hideDelay = prefersReduced ? 0 : closeDelayMs;
      setTimeout(() => {
        lb.setAttribute("aria-hidden", "true");
        lb.classList.remove("is-open");
        setPageInert(false);
        if (videoArea) videoArea.innerHTML = "";
        if (lastFocus && document.body.contains(lastFocus)) {
          lastFocus.focus();
        }
        openGuard = false;
        emit("LIGHTBOX_CLOSED_DONE", lb);
      }, hideDelay);
      unlockScroll({
        delayMs: prefersReduced ? 0 : closeDelayMs
      });
    }
    slides.forEach((slide, index) => {
      slide.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openFromSlide(slide);
      }, { passive: false });
    });
    lb.addEventListener("click", (e) => {
      if (inner && !e.target.closest(".lightbox__inner")) {
        requestClose();
      } else if (!inner && e.target === lb) {
        requestClose();
      }
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (lb.classList.contains("is-open")) {
        if (e.key === "Escape") requestClose();
        if (e.key === "Tab") trapFocus(e);
      }
    });
  }

  // src/modules/webflow-scrolltrigger.js
  console.log("[WEBFLOW] module loaded");
  function initWebflowScrollTriggers(options = {}) {
    const scrollerSelector = options.scrollerSelector || ".perspective-wrapper";
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
        const driver = document.querySelector("#intro-slide");
        if (!driver) {
          console.error("[WEBFLOW] Driver slide (#intro-slide) not found");
          return;
        }
        console.log("[WEBFLOW] Setup complete:", {
          scroller: !!scroller,
          driver: !!driver,
          wfIx: !!wfIx,
          ScrollTrigger: !!ScrollTrigger,
          shrinkEvent: shrinkEventName,
          growEvent: growEventName
        });
        ScrollTrigger.create({
          trigger: driver,
          scroller,
          start: "top top",
          end: "top -10%",
          markers,
          onLeave: () => {
            try {
              console.log("[WEBFLOW] emit shrink (scrolled down):", shrinkEventName);
              wfIx.emit(shrinkEventName);
            } catch (err) {
              console.error("[WEBFLOW] Error emitting shrink:", err);
            }
          },
          onEnterBack: () => {
            try {
              console.log("[WEBFLOW] emit grow (scrolled back up):", growEventName);
              wfIx.emit(growEventName);
            } catch (err) {
              console.error("[WEBFLOW] Error emitting grow:", err);
            }
          }
        });
        console.log("[WEBFLOW] ScrollTrigger initialized");
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          setTimeout(() => {
            try {
              console.log("[WEBFLOW] emit grow (initial load):", growEventName);
              wfIx.emit(growEventName);
            } catch (err) {
              console.error("[WEBFLOW] Error emitting initial grow:", err);
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
    const lightboxRoot = options.lightboxRoot || "#lightbox";
    initAccordion(".accordeon");
    initLightbox({ root: lightboxRoot, closeDelayMs: 1e3 });
    try {
      initWebflowScrollTriggers({
        scrollerSelector: ".perspective-wrapper",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi1kaXJlY3QtZ3NhcC5qcyIsICIuLi9zcmMvbW9kdWxlcy9hY2NvcmRpb24uanMiLCAiLi4vc3JjL2NvcmUvc2Nyb2xsbG9jay5qcyIsICIuLi9zcmMvbW9kdWxlcy92aW1lby5qcyIsICIuLi9zcmMvbW9kdWxlcy9saWdodGJveC5qcyIsICIuLi9zcmMvbW9kdWxlcy93ZWJmbG93LXNjcm9sbHRyaWdnZXIuanMiLCAiLi4vc3JjL2FwcC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBFdmVudHMgVXRpbGl0eVxuICogIFB1cnBvc2U6IEVtaXQgYnViYmxpbmcgQ3VzdG9tRXZlbnRzIGNvbXBhdGlibGUgd2l0aCBHU0FQLVVJICh3aW5kb3cgc2NvcGUpXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZW1pdChuYW1lLCB0YXJnZXQgPSB3aW5kb3csIGRldGFpbCA9IHt9KXtcbiAgdHJ5IHsgdGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIHsgYnViYmxlczogdHJ1ZSwgY2FuY2VsYWJsZTogdHJ1ZSwgZGV0YWlsIH0pKTsgfSBjYXRjaCB7fVxuICB0cnkgeyB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgRGlyZWN0IEdTQVAgQWNjb3JkaW9uIEFuaW1hdGlvbnNcbiAqICBQdXJwb3NlOiBQcm92aWRlIGRpcmVjdCwgY2FsbGFibGUgR1NBUCBhbmltYXRpb24gZnVuY3Rpb25zXG4gKiAgRGF0ZTogMjAyNS0xMS0wNFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5sZXQgZ3NhcDtcblxuZnVuY3Rpb24gZmluZEdTQVAoKSB7XG4gIGlmIChnc2FwKSByZXR1cm4gZ3NhcDsgLy8gUmV0dXJuIGNhY2hlZCBHU0FQXG5cbiAgbGV0IGF0dGVtcHRzID0gMDtcbiAgY29uc3QgZmluZCA9ICgpID0+IHtcbiAgICBjb25zdCBnc2FwQXZhaWxhYmxlID0gd2luZG93LmdzYXAgfHwgd2luZG93LlR3ZWVuTWF4IHx8IHdpbmRvdy5Ud2VlbkxpdGU7XG4gICAgaWYgKGdzYXBBdmFpbGFibGUpIHtcbiAgICAgIGdzYXAgPSBnc2FwQXZhaWxhYmxlLmdzYXAgfHwgZ3NhcEF2YWlsYWJsZTtcbiAgICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIFx1MjcwNSBHU0FQIGZvdW5kIGFuZCBjYWNoZWQuIFZlcnNpb246JywgZ3NhcC52ZXJzaW9uIHx8ICdMZWdhY3knKTtcbiAgICB9IGVsc2UgaWYgKGF0dGVtcHRzIDwgMjApIHtcbiAgICAgIGF0dGVtcHRzKys7XG4gICAgICBzZXRUaW1lb3V0KGZpbmQsIDI1MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIFx1Mjc0QyBHU0FQIG5vdCBmb3VuZCBhZnRlciA1IHNlY29uZHMsIGFuaW1hdGlvbnMgZGlzYWJsZWQnKTtcbiAgICB9XG4gIH07XG4gIGZpbmQoKTtcbn1cblxuLy8gRmluZCBHU0FQIGFzIHNvb24gYXMgdGhlIG1vZHVsZSBsb2Fkc1xuZmluZEdTQVAoKTtcblxuXG5leHBvcnQgZnVuY3Rpb24gZ3NhcE9wZW5BbmltYXRpb24oKSB7XG4gIGlmICghZ3NhcCkge1xuICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIE9wZW4gYW5pbWF0aW9uIHNraXBwZWQ6IEdTQVAgbm90IGF2YWlsYWJsZS4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdGFyZ2V0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtYW5pbWF0ZS10YXJnZXQnKTtcbiAgaWYgKHRhcmdldHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gIFxuICBjb25zb2xlLmxvZyhgW0RJUkVDVC1HU0FQXSBcdUQ4M0NcdURGQUMgQW5pbWF0aW5nICR7dGFyZ2V0cy5sZW5ndGh9IGl0ZW1zIE9QRU5gKTtcbiAgXG4gIGdzYXAua2lsbFR3ZWVuc09mICYmIGdzYXAua2lsbFR3ZWVuc09mKHRhcmdldHMpO1xuICBcbiAgZ3NhcC5zZXQodGFyZ2V0cywgeyBvcGFjaXR5OiAwLCB5OiAzMCwgc2NhbGU6IDAuOTggfSk7XG4gIFxuICBnc2FwLnRvKHRhcmdldHMsIHtcbiAgICBvcGFjaXR5OiAxLFxuICAgIHk6IDAsXG4gICAgc2NhbGU6IDEsXG4gICAgZHVyYXRpb246IDAuNCxcbiAgICBzdGFnZ2VyOiAwLjA4LFxuICAgIGVhc2U6IFwicG93ZXIyLm91dFwiLFxuICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIFx1MjcwNSBPcGVuIGFuaW1hdGlvbiBjb21wbGV0ZScpO1xuICAgICAgZ3NhcC5zZXQodGFyZ2V0cywgeyBjbGVhclByb3BzOiBcImFsbFwiIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnc2FwQ2xvc2VBbmltYXRpb24oKSB7XG4gIGlmICghZ3NhcCkge1xuICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIENsb3NlIGFuaW1hdGlvbiBza2lwcGVkOiBHU0FQIG5vdCBhdmFpbGFibGUuJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHRhcmdldHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLWFuaW1hdGUtdGFyZ2V0Jyk7XG4gIGlmICh0YXJnZXRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICBcbiAgY29uc29sZS5sb2coYFtESVJFQ1QtR1NBUF0gXHVEODNDXHVERkFDIEFuaW1hdGluZyAke3RhcmdldHMubGVuZ3RofSBpdGVtcyBDTE9TRWApO1xuXG4gIGdzYXAua2lsbFR3ZWVuc09mICYmIGdzYXAua2lsbFR3ZWVuc09mKHRhcmdldHMpO1xuICBcbiAgZ3NhcC50byh0YXJnZXRzLCB7XG4gICAgb3BhY2l0eTogMCxcbiAgICB5OiAtMjAsXG4gICAgc2NhbGU6IDAuOTgsXG4gICAgZHVyYXRpb246IDAuMjUsXG4gICAgc3RhZ2dlcjoge1xuICAgICAgZWFjaDogMC4wNCxcbiAgICAgIGZyb206IFwiZW5kXCJcbiAgICB9LFxuICAgIGVhc2U6IFwicG93ZXIyLm91dFwiLFxuICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIFx1MjcwNSBDbG9zZSBhbmltYXRpb24gY29tcGxldGUnKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBFeHBvc2UgdGVzdCBmdW5jdGlvbnNcbndpbmRvdy5kaXJlY3RHU0FQVGVzdCA9IHtcbiAgdGVzdE9wZW46ICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0RJUkVDVC1HU0FQXSBNYW51YWwgdGVzdDogT1BFTicpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtaXRlbScpLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LmFkZCgnYWNjLWFuaW1hdGUtdGFyZ2V0JykpO1xuICAgIGdzYXBPcGVuQW5pbWF0aW9uKCk7XG4gIH0sXG4gIHRlc3RDbG9zZTogKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdbRElSRUNULUdTQVBdIE1hbnVhbCB0ZXN0OiBDTE9TRScpO1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtaXRlbScpLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LmFkZCgnYWNjLWFuaW1hdGUtdGFyZ2V0JykpO1xuICAgIGdzYXBDbG9zZUFuaW1hdGlvbigpO1xuICB9LFxuICBjaGVja0dTQVA6ICgpID0+IHtcbiAgICBjb25zdCBnc2FwRm91bmQgPSAhIWdzYXA7XG4gICAgY29uc29sZS5sb2coJ1tESVJFQ1QtR1NBUF0gR1NBUCBhdmFpbGFibGU6JywgZ3NhcEZvdW5kKTtcbiAgICByZXR1cm4gZ3NhcEZvdW5kO1xuICB9XG59O1xuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQWNjb3JkaW9uIE1vZHVsZVxuICogIFB1cnBvc2U6IEFSSUEsIHNtb290aCB0cmFuc2l0aW9ucywgR1NBUCBldmVudCBob29rc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmltcG9ydCB7IGdzYXBPcGVuQW5pbWF0aW9uLCBnc2FwQ2xvc2VBbmltYXRpb24gfSBmcm9tICcuL2FjY29yZGlvbi1kaXJlY3QtZ3NhcC5qcyc7XG5jb25zb2xlLmxvZygnW0FDQ09SRElPTl0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFjY29yZGlvbihyb290U2VsID0gJy5hY2NvcmRlb24nKXtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbCk7XG4gIGlmICghcm9vdCl7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSBcdTI3NEMgcm9vdCBub3QgZm91bmQgZm9yIHNlbGVjdG9yOicsIHJvb3RTZWwpOyByZXR1cm47IH1cbiAgY29uc29sZS5sb2coJ1tBQ0NPUkRJT05dIFx1MjcwNSBJbml0aWFsaXppbmcgYWNjb3JkaW9uIG9uOicsIHJvb3RTZWwpO1xuICBcbiAgLy8gU3RvcmUgcmVmZXJlbmNlIGdsb2JhbGx5IGZvciBkZWJ1Z2dpbmdcbiAgd2luZG93Ll9hY2NvcmRpb25Sb290ID0gcm9vdDtcbiAgd2luZG93Ll9hY2NvcmRpb25EZWJ1ZyA9IHRydWU7XG5cbiAgY29uc3QgcGFuZWxPZiA9IGl0ZW0gPT4gaXRlbT8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjYy1saXN0Jyk7XG4gIGNvbnN0IGdyb3VwT2YgPSBpdGVtID0+IHtcbiAgICBjb25zdCBwYXJlbnQgPSBpdGVtLnBhcmVudEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudD8uY2xhc3NMaXN0LmNvbnRhaW5zKCdhY2MtbGlzdCcpID8gcGFyZW50IDogcm9vdDtcbiAgfTtcbiAgY29uc3QgZGJnID0gKC4uLmFyZ3MpID0+IHsgdHJ5IHsgY29uc29sZS5sb2coJ1tBQ0NPUkRJT05dJywgLi4uYXJncyk7IH0gY2F0Y2goXykge30gfTtcbiAgY29uc3QgaXRlbUtpbmQgPSAoZWwpID0+IGVsPy5jbGFzc0xpc3Q/LmNvbnRhaW5zKCdhY2Mtc2VjdGlvbicpID8gJ3NlY3Rpb24nIDogJ2l0ZW0nO1xuICBjb25zdCBsYWJlbE9mID0gKGVsKSA9PiB7XG4gICAgY29uc3QgdCA9IGVsPy5xdWVyeVNlbGVjdG9yKCc6c2NvcGUgPiAuYWNjLXRyaWdnZXInKTtcbiAgICByZXR1cm4gKHQ/LnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCcgJykuc2xpY2UoMCw4MCk7XG4gIH07XG4gIGNvbnN0IEFDVElWRV9UUklHR0VSX0NMQVNTID0gJ2FjYy10cmlnZ2VyLS1hY3RpdmUnO1xuICBcbiAgLy8gVXNlIGNsYXNzZXMgZm9yIFdlYmZsb3cgY29tcGF0aWJpbGl0eVxuICBmdW5jdGlvbiBtYXJrSXRlbXNGb3JBbmltYXRpb24ocGFuZWwsIHNob3cgPSB0cnVlKSB7XG4gICAgLy8gTWFyayBkaXJlY3QgY2hpbGQgaXRlbXMgb2YgdGhpcyBwYW5lbCBmb3IgYW5pbWF0aW9uXG4gICAgY29uc3QgaXRlbXMgPSBwYW5lbC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiAuYWNjLWl0ZW0nKTtcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdhY2MtYW5pbWF0ZS10YXJnZXQnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnYWNjLWFuaW1hdGUtdGFyZ2V0Jyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZGJnKGBNYXJrZWQgJHtpdGVtcy5sZW5ndGh9IGl0ZW1zIGZvciAke3Nob3cgPyAnc2hvdycgOiAnaGlkZSd9IGFuaW1hdGlvbiBpbiBwYW5lbCAke3BhbmVsLmlkfWApO1xuICAgIFxuICAgIC8vIERlYnVnOiBMb2cgd2hhdCBlbGVtZW50cyBoYXZlIHRoZSBjbGFzcyBub3dcbiAgICBjb25zdCBhbGxNYXJrZWQgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtYW5pbWF0ZS10YXJnZXQnKTtcbiAgICBkYmcoYFRvdGFsIGVsZW1lbnRzIHdpdGggYWNjLWFuaW1hdGUtdGFyZ2V0IGNsYXNzIGluIERPTTogJHthbGxNYXJrZWQubGVuZ3RofWApO1xuICAgIGFsbE1hcmtlZC5mb3JFYWNoKGVsID0+IHtcbiAgICAgIGRiZyhgICAtICR7ZWwuY2xhc3NOYW1lfSB8IFRleHQ6ICR7KGVsLnRleHRDb250ZW50IHx8ICcnKS50cmltKCkuc2xpY2UoMCwgNTApfWApO1xuICAgIH0pO1xuICB9XG4gIFxuICBmdW5jdGlvbiBjbGVhckFsbEFuaW1hdGlvbk1hcmtlcnMoKSB7XG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLWFuaW1hdGUtdGFyZ2V0JykuZm9yRWFjaChlbCA9PiB7XG4gICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdhY2MtYW5pbWF0ZS10YXJnZXQnKTtcbiAgICB9KTtcbiAgfVxuICAvLyBXZWJmbG93IElYIChpeDMgcHJlZmVycmVkLCBmYWxsYmFjayBpeDIpLiBJZiBub3QgcHJlc2VudCwgd2Ugc3RpbGwgZGlzcGF0Y2ggd2luZG93IEN1c3RvbUV2ZW50XG4gIGNvbnN0IHdmSXggPSAod2luZG93LldlYmZsb3cgJiYgd2luZG93LldlYmZsb3cucmVxdWlyZSlcbiAgICA/ICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSlcbiAgICA6IG51bGw7XG4gIGRiZygnV2ViZmxvdyBJWCBhdmFpbGFibGU6JywgISF3Zkl4KTtcbiAgZnVuY3Rpb24gZW1pdEl4KG5hbWUpe1xuICAgIC8vIEZpcnN0LCBhbHdheXMgdHJ5IFdlYmZsb3cncyBuYXRpdmUgc3lzdGVtIGZvciBhbnkgR1NBUCB0aW1lbGluZXMgc2V0IHVwIHRoZXJlXG4gICAgdHJ5IHtcbiAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZGJnKGBcdUQ4M0NcdURGQUYgRU1JVFRJTkcgdmlhIHdmSXguZW1pdDogXCIke25hbWV9XCJgKTtcbiAgICAgICAgd2ZJeC5lbWl0KG5hbWUpO1xuICAgICAgICBcbiAgICAgICAgLy8gQWxzbyBjaGVjayB3aGF0IGVsZW1lbnRzIGN1cnJlbnRseSBoYXZlIHRoZSBjbGFzc1xuICAgICAgICBjb25zdCBtYXJrZWQgPSByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtYW5pbWF0ZS10YXJnZXQnKTtcbiAgICAgICAgZGJnKGAgIFx1MjE5MiAke21hcmtlZC5sZW5ndGh9IGVsZW1lbnRzIGhhdmUgYWNjLWFuaW1hdGUtdGFyZ2V0IGNsYXNzIHdoZW4gXCIke25hbWV9XCIgZmlyZXNgKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgZGJnKCd3Zkl4LmVtaXQgZXJyb3InLCBlcnIgJiYgZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBTRUNPTkQsIEFMV0FZUyBkaXNwYXRjaCBhIHdpbmRvdyBldmVudCBmb3Igb3VyIGRpcmVjdCBHU0FQIGxpc3RlbmVycyBhcyBhIHJlbGlhYmxlIGZhbGxiYWNrXG4gICAgdHJ5IHtcbiAgICAgIC8vIEZhbGxiYWNrOiBidWJibGUgYSBDdXN0b21FdmVudCBvbiB3aW5kb3cgZm9yIGFueSBsaXN0ZW5lcnNcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lKSk7XG4gICAgICBkYmcoYFx1RDgzRFx1RENFMiBFTUlUVElORyB2aWEgd2luZG93LmRpc3BhdGNoRXZlbnQ6IFwiJHtuYW1lfVwiYCk7XG4gICAgfSBjYXRjaChlcnIpIHsgXG4gICAgICBkYmcoJ3dpbmRvdy5kaXNwYXRjaEV2ZW50IGVycm9yJywgZXJyICYmIGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICAvLyBFbWl0IHByaW1hcnkgZXZlbnQgcGx1cyBsZWdhY3kgYWxpYXNlcyAod2l0aG91dCBnbG9iYWwgdG9nZ2xlKSBzbyBleGlzdGluZyBXZWJmbG93IHRpbWVsaW5lcyBrZWVwIHdvcmtpbmdcbiAgZnVuY3Rpb24gZW1pdEFsbChwcmltYXJ5KXtcbiAgICBjb25zdCBhbGlhc2VzID0gW107XG4gICAgaWYgKHByaW1hcnkgPT09ICdhY2Mtb3BlbicpIGFsaWFzZXMucHVzaCgnYWNjb3JkZW9uLW9wZW4nKTtcbiAgICBpZiAocHJpbWFyeSA9PT0gJ2FjYy1jbG9zZScpIGFsaWFzZXMucHVzaCgnYWNjb3JkZW9uLWNsb3NlJyk7XG4gICAgW3ByaW1hcnksIC4uLmFsaWFzZXNdLmZvckVhY2goZXYgPT4gZW1pdEl4KGV2KSk7XG4gIH1cblxuICAvLyBBUklBIGJvb3RzdHJhcFxuICBjb25zdCB0cmlnZ2VycyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjYy10cmlnZ2VyJyk7XG4gIHRyaWdnZXJzLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjLXNlY3Rpb24sIC5hY2MtaXRlbScpO1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pO1xuICAgIGlmIChwKXtcbiAgICAgIGNvbnN0IHBpZCA9IHAuaWQgfHwgYGFjYy1wYW5lbC0ke2l9YDtcbiAgICAgIHAuaWQgPSBwaWQ7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHBpZCk7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgfSk7XG4gIGRiZygnYm9vdHN0cmFwcGVkJywgdHJpZ2dlcnMubGVuZ3RoLCAndHJpZ2dlcnMnKTtcblxuICBmdW5jdGlvbiBleHBhbmQocCl7XG4gICAgZGJnKCdleHBhbmQgc3RhcnQnLCB7IGlkOiBwLmlkLCBjaGlsZHJlbjogcC5jaGlsZHJlbj8ubGVuZ3RoLCBoOiBwLnNjcm9sbEhlaWdodCB9KTtcbiAgICBwLmNsYXNzTGlzdC5hZGQoJ2lzLWFjdGl2ZScpO1xuICAgIC8vIEVuc3VyZSBkaXJlY3QgY2hpbGQgcm93cyBhcmUgbm90IHN0dWNrIGhpZGRlbiBieSBhbnkgZ2xvYmFsIEdTQVAgaW5pdGlhbCBzdGF0ZVxuICAgIEFycmF5LmZyb20ocC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiAuYWNjLWl0ZW0nKSkuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICByb3cuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcbiAgICAgIHJvdy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndmlzaWJpbGl0eScpO1xuICAgICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd0cmFuc2Zvcm0nKTtcbiAgICB9KTtcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnb3BlbmluZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gJ25vbmUnO1xuICAgICAgICBwLmRhdGFzZXQuc3RhdGUgPSAnb3Blbic7XG4gICAgICAgIGRiZygnZXhwYW5kZWQnLCB7IGlkOiBwLmlkIH0pO1xuICAgICAgfVxuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY29sbGFwc2UocCl7XG4gICAgY29uc3QgaCA9IHAuc3R5bGUubWF4SGVpZ2h0ID09PSAnbm9uZScgPyBwLnNjcm9sbEhlaWdodCA6IHBhcnNlRmxvYXQocC5zdHlsZS5tYXhIZWlnaHQgfHwgMCk7XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAoaCB8fCBwLnNjcm9sbEhlaWdodCkgKyAncHgnO1xuICAgIHAub2Zmc2V0SGVpZ2h0OyAvLyByZWZsb3dcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9ICcwcHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjbG9zaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgcC5kYXRhc2V0LnN0YXRlID0gJ2NvbGxhcHNlZCc7XG4gICAgICBwLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpO1xuICAgICAgLy8gQ2xlYXIgYW5pbWF0aW9uIG1hcmtlcnMgd2hlbiBjb2xsYXBzZSBjb21wbGV0ZXNcbiAgICAgIG1hcmtJdGVtc0ZvckFuaW1hdGlvbihwLCBmYWxzZSk7XG4gICAgICBkYmcoJ2NvbGxhcHNlZCcsIHsgaWQ6IHAuaWQgfSk7XG4gICAgfTtcbiAgICBwLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZVNpYmxpbmdzKGl0ZW0pe1xuICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBPZihpdGVtKTtcbiAgICBpZiAoIWdyb3VwKSByZXR1cm47XG4gICAgY29uc3Qgd2FudCA9IGl0ZW0ubWF0Y2hlcygnLmFjYy1zZWN0aW9uJykgPyAnYWNjLXNlY3Rpb24nIDogJ2FjYy1pdGVtJztcbiAgICBBcnJheS5mcm9tKGdyb3VwLmNoaWxkcmVuKS5mb3JFYWNoKHNpYiA9PiB7XG4gICAgICBpZiAoc2liID09PSBpdGVtIHx8ICFzaWIuY2xhc3NMaXN0LmNvbnRhaW5zKHdhbnQpKSByZXR1cm47XG4gICAgICBjb25zdCBwID0gcGFuZWxPZihzaWIpO1xuICAgICAgaWYgKHAgJiYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nIHx8IHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKSl7XG4gICAgICAgIGRiZygnY2xvc2Ugc2libGluZycsIHsga2luZDogd2FudCwgbGFiZWw6IGxhYmVsT2Yoc2liKSwgaWQ6IHAuaWQgfSk7XG4gICAgICAgIC8vIENsZWFyIGFsbCBtYXJrZXJzIGZpcnN0LCB0aGVuIG1hcmsgb25seSB0aGUgY2xvc2luZyBwYW5lbCdzIGl0ZW1zXG4gICAgICAgIGNsZWFyQWxsQW5pbWF0aW9uTWFya2VycygpO1xuICAgICAgICBtYXJrSXRlbXNGb3JBbmltYXRpb24ocCwgdHJ1ZSk7IC8vIE1hcmsgZm9yIGhpZGUgYW5pbWF0aW9uXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gZW1pdEFsbCgnYWNjLWNsb3NlJyksIDEwKTtcbiAgICAgICAgY29sbGFwc2UocCk7XG4gICAgICAgIGNvbnN0IHRyaWcgPSBzaWIucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjYy10cmlnZ2VyJyk7XG4gICAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICB0cmlnPy5jbGFzc0xpc3Q/LnJlbW92ZShBQ1RJVkVfVFJJR0dFUl9DTEFTUyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldEFsbEwyVW5kZXIoY29udGFpbmVyKXtcbiAgICBjb25zdCBzY29wZSA9IGNvbnRhaW5lciB8fCByb290O1xuICAgIHNjb3BlLnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2MtaXRlbSA+IC5hY2MtbGlzdCcpLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicgfHwgcC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpe1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgaXQgPSBwLmNsb3Nlc3QoJy5hY2MtaXRlbScpO1xuICAgICAgICBjb25zdCB0ID0gaXQ/LnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2MtdHJpZ2dlcicpO1xuICAgICAgICB0Py5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICAgICAgdD8uY2xhc3NMaXN0Py5yZW1vdmUoQUNUSVZFX1RSSUdHRVJfQ0xBU1MpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gTm8gZXhwbGljaXQgbGV2ZWwgcmVzZXQgbmVlZGVkIHdpdGggdW5pdmVyc2FsIGdyb3VwaW5nXG5cbiAgZnVuY3Rpb24gdG9nZ2xlKGl0ZW0pe1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pO1xuICAgIGlmICghcCkgcmV0dXJuO1xuICAgIGNvbnN0IHRyaWcgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2MtdHJpZ2dlcicpO1xuICAgIGNvbnN0IG9wZW5pbmcgPSAhKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nIHx8IHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKTtcbiAgICBkYmcoJ3RvZ2dsZScsIHsga2luZDogaXRlbUtpbmQoaXRlbSksIG9wZW5pbmcsIGxhYmVsOiBsYWJlbE9mKGl0ZW0pLCBpZDogcC5pZCB9KTtcbiAgICBcbiAgICBpZiAob3BlbmluZykgY2xvc2VTaWJsaW5ncyhpdGVtKTtcblxuICAgIC8vIFJlc2V0IGFsbCBuZXN0ZWQgbGV2ZWxcdTIwMTEyIHBhbmVscyB3aGVuIGEgc2VjdGlvbiBvcGVucyBvciBjbG9zZXNcbiAgICBpZiAoaXRlbUtpbmQoaXRlbSkgPT09ICdzZWN0aW9uJyl7XG4gICAgICBpZiAob3BlbmluZykgcmVzZXRBbGxMMlVuZGVyKHJvb3QpO1xuICAgICAgZWxzZSByZXNldEFsbEwyVW5kZXIoaXRlbSk7XG4gICAgfVxuXG4gICAgaWYgKG9wZW5pbmcpe1xuICAgICAgLy8gQ2xlYXIgYWxsIG1hcmtlcnMgZmlyc3QsIHRoZW4gbWFyayBvbmx5IHRoaXMgcGFuZWwncyBpdGVtc1xuICAgICAgY2xlYXJBbGxBbmltYXRpb25NYXJrZXJzKCk7XG4gICAgICBtYXJrSXRlbXNGb3JBbmltYXRpb24ocCwgdHJ1ZSk7XG4gICAgICAvLyBTbWFsbCBkZWxheSB0byBlbnN1cmUgRE9NIHVwZGF0ZXMgYmVmb3JlIEdTQVAgcmVhZHMgaXRcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBjb25zdCBtYXJrZWRJdGVtcyA9IHAucXVlcnlTZWxlY3RvckFsbCgnOnNjb3BlID4gLmFjYy1pdGVtLmFjYy1hbmltYXRlLXRhcmdldCcpO1xuICAgICAgICBkYmcoJ2VtaXQgYWNjLW9wZW4nLCB7IGlkOiBwLmlkLCBtYXJrZWRJdGVtczogbWFya2VkSXRlbXMubGVuZ3RoLCB0b3RhbEl0ZW1zOiBwLnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbScpLmxlbmd0aCB9KTtcbiAgICAgICAgZW1pdEFsbCgnYWNjLW9wZW4nKTsgLy8gRm9yIFdlYmZsb3cgSVhcbiAgICAgICAgZ3NhcE9wZW5BbmltYXRpb24oKTsgLy8gRm9yIGRpcmVjdCBHU0FQIGNvbnRyb2xcbiAgICAgIH0sIDEwKTtcbiAgICAgIGV4cGFuZChwKTtcbiAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICB0cmlnPy5jbGFzc0xpc3Q/LmFkZChBQ1RJVkVfVFJJR0dFUl9DTEFTUyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENsZWFyIGFsbCBtYXJrZXJzIGZpcnN0LCB0aGVuIG1hcmsgb25seSB0aGlzIHBhbmVsJ3MgaXRlbXNcbiAgICAgIGNsZWFyQWxsQW5pbWF0aW9uTWFya2VycygpO1xuICAgICAgbWFya0l0ZW1zRm9yQW5pbWF0aW9uKHAsIHRydWUpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG1hcmtlZEl0ZW1zID0gcC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiAuYWNjLWl0ZW0uYWNjLWFuaW1hdGUtdGFyZ2V0Jyk7XG4gICAgICAgIGRiZygnZW1pdCBhY2MtY2xvc2UnLCB7IGlkOiBwLmlkLCBtYXJrZWRJdGVtczogbWFya2VkSXRlbXMubGVuZ3RoLCB0b3RhbEl0ZW1zOiBwLnF1ZXJ5U2VsZWN0b3JBbGwoJzpzY29wZSA+IC5hY2MtaXRlbScpLmxlbmd0aCB9KTtcbiAgICAgICAgZW1pdEFsbCgnYWNjLWNsb3NlJyk7IC8vIEZvciBXZWJmbG93IElYXG4gICAgICAgIGdzYXBDbG9zZUFuaW1hdGlvbigpOyAvLyBGb3IgZGlyZWN0IEdTQVAgY29udHJvbFxuICAgICAgfSwgMTApO1xuICAgICAgY29sbGFwc2UocCk7XG4gICAgICB0cmlnPy5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICAgIHRyaWc/LmNsYXNzTGlzdD8ucmVtb3ZlKEFDVElWRV9UUklHR0VSX0NMQVNTKTtcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2pzLXByZXAnKTtcbiAgLy8gQ29sbGFwc2UgYWxsIHBhbmVsczsgdG9wLWxldmVsIGl0ZW1zIHJlbWFpbiB2aXNpYmxlIChub3QgaW5zaWRlIHBhbmVscylcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjLWxpc3QnKS5mb3JFYWNoKHAgPT4geyBwLnN0eWxlLm1heEhlaWdodCA9ICcwcHgnOyBwLmRhdGFzZXQuc3RhdGUgPSAnY29sbGFwc2VkJzsgfSk7XG4gIC8vIFNhZmV0eTogZW5zdXJlIHRvcC1sZXZlbCByb3dzIGFyZSB2aXNpYmxlIGV2ZW4gaWYgYSBHU0FQIHRpbWVsaW5lIHNldCBpbmxpbmUgc3R5bGVzIGdsb2JhbGx5XG4gIEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsKCc6c2NvcGUgPiAuYWNjLWl0ZW0nKSkuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCdvcGFjaXR5Jyk7XG4gICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd2aXNpYmlsaXR5Jyk7XG4gICAgcm93LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd0cmFuc2Zvcm0nKTtcbiAgfSk7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2pzLXByZXAnKSk7XG5cbiAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgIGNvbnN0IHQgPSBlLnRhcmdldC5jbG9zZXN0KCcuYWNjLXRyaWdnZXInKTtcbiAgICBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjYy1zZWN0aW9uLCAuYWNjLWl0ZW0nKTtcbiAgICBkYmcoJ2NsaWNrJywgeyBsYWJlbDogKHQudGV4dENvbnRlbnQgfHwgJycpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csJyAnKS5zbGljZSgwLDgwKSB9KTtcbiAgICBpdGVtICYmIHRvZ2dsZShpdGVtKTtcbiAgfSk7XG4gIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGUgPT4ge1xuICAgIGNvbnN0IHQgPSBlLnRhcmdldC5jbG9zZXN0KCcuYWNjLXRyaWdnZXInKTtcbiAgICBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBpZiAoZS5rZXkgIT09ICdFbnRlcicgJiYgZS5rZXkgIT09ICcgJykgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjLXNlY3Rpb24sIC5hY2MtaXRlbScpO1xuICAgIGRiZygna2V5ZG93bicsIHsga2V5OiBlLmtleSwgbGFiZWw6ICh0LnRleHRDb250ZW50IHx8ICcnKS50cmltKCkucmVwbGFjZSgvXFxzKy9nLCcgJykuc2xpY2UoMCw4MCkgfSk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuXG4gIGNvbnN0IHJvID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgIGVudHJpZXMuZm9yRWFjaCgoeyB0YXJnZXQ6IHAgfSkgPT4ge1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nKXsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7IH1cbiAgICAgIGVsc2UgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXsgcC5zdHlsZS5tYXhIZWlnaHQgPSBwLnNjcm9sbEhlaWdodCArICdweCc7IH1cbiAgICB9KTtcbiAgfSk7XG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjYy1saXN0JykuZm9yRWFjaChwID0+IHJvLm9ic2VydmUocCkpO1xuICBcbiAgLy8gRXhwb3NlIGRlYnVnZ2luZyBmdW5jdGlvbnMgZ2xvYmFsbHlcbiAgd2luZG93Ll9hY2NvcmRpb25UZXN0ID0ge1xuICAgIG1hcmtJdGVtczogKHBhbmVsSWQpID0+IHtcbiAgICAgIGNvbnN0IHBhbmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocGFuZWxJZCkgfHwgcm9vdC5xdWVyeVNlbGVjdG9yKCcuYWNjLWxpc3QnKTtcbiAgICAgIGlmIChwYW5lbCkge1xuICAgICAgICBtYXJrSXRlbXNGb3JBbmltYXRpb24ocGFuZWwsIHRydWUpO1xuICAgICAgICBjb25zb2xlLmxvZygnTWFya2VkIGl0ZW1zIGluIHBhbmVsOicsIHBhbmVsKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNsZWFyTWFya3M6ICgpID0+IHtcbiAgICAgIGNsZWFyQWxsQW5pbWF0aW9uTWFya2VycygpO1xuICAgICAgY29uc29sZS5sb2coJ0NsZWFyZWQgYWxsIG1hcmtzJyk7XG4gICAgfSxcbiAgICBlbWl0T3BlbjogKCkgPT4ge1xuICAgICAgZW1pdEFsbCgnYWNjLW9wZW4nKTtcbiAgICAgIGNvbnNvbGUubG9nKCdFbWl0dGVkIGFjYy1vcGVuJyk7XG4gICAgfSxcbiAgICBlbWl0Q2xvc2U6ICgpID0+IHtcbiAgICAgIGVtaXRBbGwoJ2FjYy1jbG9zZScpO1xuICAgICAgY29uc29sZS5sb2coJ0VtaXR0ZWQgYWNjLWNsb3NlJyk7XG4gICAgfSxcbiAgICBjaGVja1dlYmZsb3c6ICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdXZWJmbG93IG9iamVjdDonLCB3aW5kb3cuV2ViZmxvdyk7XG4gICAgICBjb25zb2xlLmxvZygnd2ZJeDonLCB3Zkl4KTtcbiAgICB9LFxuICAgIGdldE1hcmtlZEl0ZW1zOiAoKSA9PiB7XG4gICAgICBjb25zdCBpdGVtcyA9IHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjYy1hbmltYXRlLXRhcmdldCcpO1xuICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7aXRlbXMubGVuZ3RofSBpdGVtcyB3aXRoIC5hY2MtYW5pbWF0ZS10YXJnZXQgY2xhc3NgKTtcbiAgICAgIHJldHVybiBpdGVtcztcbiAgICB9XG4gIH07XG4gIFxuICBjb25zb2xlLmxvZygnW0FDQ09SRElPTl0gRGVidWcgZnVuY3Rpb25zIGF2YWlsYWJsZSBhdCB3aW5kb3cuX2FjY29yZGlvblRlc3QnKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBTY3JvbGwgTG9jayAoU2ltcGxpZmllZClcbiAqICBQdXJwb3NlOiBMb2NrIHBhZ2Ugc2Nyb2xsIHdoZW4gbW9kYWwgaXMgb3BlblxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxubGV0IGlzTG9ja2VkID0gZmFsc2U7XG5sZXQgc2F2ZWRZID0gMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGxvY2tTY3JvbGwoKXtcbiAgaWYgKGlzTG9ja2VkKSByZXR1cm47XG4gIGlzTG9ja2VkID0gdHJ1ZTtcbiAgc2F2ZWRZID0gd2luZG93LnNjcm9sbFkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCAwO1xuICBcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUudG9wID0gYC0ke3NhdmVkWX1weGA7XG4gIGRvY3VtZW50LmJvZHkuc3R5bGUubGVmdCA9ICcwJztcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5yaWdodCA9ICcwJztcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ21vZGFsLW9wZW4nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVubG9ja1Njcm9sbCh7IGRlbGF5TXMgPSAwIH0gPSB7fSl7XG4gIGlmICghaXNMb2NrZWQpIHJldHVybjtcbiAgXG4gIGNvbnN0IHVubG9jayA9ICgpID0+IHtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnBvc2l0aW9uID0gJyc7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS50b3AgPSAnJztcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmxlZnQgPSAnJztcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnJpZ2h0ID0gJyc7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9ICcnO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJztcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLW9wZW4nKTtcbiAgICBcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgc2F2ZWRZKTtcbiAgICBpc0xvY2tlZCA9IGZhbHNlO1xuICB9O1xuICBcbiAgZGVsYXlNcyA+IDAgPyBzZXRUaW1lb3V0KHVubG9jaywgZGVsYXlNcykgOiB1bmxvY2soKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBWaW1lbyBIZWxwZXJcbiAqICBQdXJwb3NlOiBNb3VudC9yZXBsYWNlIFZpbWVvIGlmcmFtZSB3aXRoIHByaXZhY3kgb3B0aW9uc1xuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc29sZS5sb2coJ1tWSU1FT10gbW9kdWxlIGxvYWRlZCcpO1xuXG5mdW5jdGlvbiBwYXJzZVZpbWVvSWQoaW5wdXQpe1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG4gIGNvbnN0IHN0ciA9IFN0cmluZyhpbnB1dCkudHJpbSgpO1xuICAvLyBBY2NlcHQgYmFyZSBJRHNcbiAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkgcmV0dXJuIHN0cjtcbiAgLy8gRXh0cmFjdCBmcm9tIGtub3duIFVSTCBmb3Jtc1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKHN0ciwgJ2h0dHBzOi8vZXhhbXBsZS5jb20nKTtcbiAgICBjb25zdCBob3N0ID0gdS5ob3N0bmFtZSB8fCAnJztcbiAgICBpZiAoaG9zdC5pbmNsdWRlcygndmltZW8uY29tJykpe1xuICAgICAgLy8gL3ZpZGVvL3tpZH0gb3IgL3tpZH1cbiAgICAgIGNvbnN0IHBhcnRzID0gdS5wYXRobmFtZS5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIGNvbnN0IGxhc3QgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICAgIGNvbnN0IGlkID0gbGFzdC5tYXRjaCgvXFxkKy8pPy5bMF0gfHwgJyc7XG4gICAgICByZXR1cm4gaWQgfHwgJyc7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50VmltZW8oY29udGFpbmVyLCBpbnB1dElkLCBwYXJhbXMgPSB7fSl7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm47XG4gIGNvbnN0IGlkID0gcGFyc2VWaW1lb0lkKGlucHV0SWQpO1xuICBpZiAoIWlkKXsgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOyByZXR1cm47IH1cbiAgY29uc3QgcXVlcnkgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgZG50OiAxLCAuLi5wYXJhbXMgfSkudG9TdHJpbmcoKTtcbiAgY29uc3Qgc3JjID0gYGh0dHBzOi8vcGxheWVyLnZpbWVvLmNvbS92aWRlby8ke2lkfT8ke3F1ZXJ5fWA7XG4gIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuc3JjID0gc3JjO1xuICAvLyBNaW5pbWFsIGFsbG93LWxpc3QgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluIERlc2lnbmVyXG4gIGlmcmFtZS5hbGxvdyA9ICdhdXRvcGxheTsgZnVsbHNjcmVlbjsgcGljdHVyZS1pbi1waWN0dXJlOyBlbmNyeXB0ZWQtbWVkaWEnO1xuICBpZnJhbWUuc2V0QXR0cmlidXRlKCdmcmFtZWJvcmRlcicsICcwJyk7XG4gIGlmcmFtZS5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaWZyYW1lLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBMaWdodGJveCBNb2R1bGVcbiAqICBQdXJwb3NlOiBNb2RhbCBsaWdodGJveCB3aXRoIFZpbWVvIHZpZGVvIHN1cHBvcnQgYW5kIEdTQVAgYW5pbWF0aW9uc1xuICogIERhdGU6IDIwMjUtMTEtMDRcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcbmltcG9ydCB7IGxvY2tTY3JvbGwsIHVubG9ja1Njcm9sbCB9IGZyb20gJy4uL2NvcmUvc2Nyb2xsbG9jay5qcyc7XG5pbXBvcnQgeyBtb3VudFZpbWVvIH0gZnJvbSAnLi92aW1lby5qcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0TGlnaHRib3goeyByb290ID0gJyNsaWdodGJveCcsIGNsb3NlRGVsYXlNcyA9IDEwMDAgfSA9IHt9KXtcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIFNFVFVQICYgRE9NIFJFRkVSRU5DRVNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIFxuICBjb25zdCBsYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdCk7XG4gIGlmICghbGIpeyBcbiAgICBjb25zb2xlLmxvZygnW0xJR0hUQk9YXSBFbGVtZW50IG5vdCBmb3VuZCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGlubmVyID0gbGIucXVlcnlTZWxlY3RvcignLmxpZ2h0Ym94X19pbm5lcicpO1xuICBjb25zdCB2aWRlb0FyZWEgPSBsYi5xdWVyeVNlbGVjdG9yKCcudmlkZW8tYXJlYScpO1xuICBjb25zdCBjbG9zZUJ0biA9IGxiLnF1ZXJ5U2VsZWN0b3IoJyNjbG9zZS1idG4nKTtcbiAgY29uc3Qgc2xpZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLnNsaWRlJyk7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBTVEFURVxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgXG4gIGxldCBvcGVuR3VhcmQgPSBmYWxzZTsgIC8vIFByZXZlbnQgcmUtb3BlbmluZyB3aGlsZSBvcGVuXG4gIGxldCBsYXN0Rm9jdXMgPSBudWxsOyAgIC8vIFN0b3JlIGZvY3VzIGZvciByZXN0b3JhdGlvbiBvbiBjbG9zZVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBJTklUSUFMSVpBVElPTlxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgXG4gIC8vIFNldCBhY2Nlc3NpYmlsaXR5IGF0dHJpYnV0ZXNcbiAgbGIuc2V0QXR0cmlidXRlKCdyb2xlJywgbGIuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHwgJ2RpYWxvZycpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtbW9kYWwnKSB8fCAndHJ1ZScpO1xuICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgbGIuY2xhc3NMaXN0LnJlbW92ZSgnaXMtb3BlbicpO1xuICBcbiAgLy8gRm9yY2UgaGlkZGVuIHN0YXRlIChvdmVycmlkZSBXZWJmbG93IGlubGluZSBzdHlsZXMpXG4gIC8vIFVzZSB2aXNpYmlsaXR5L29wYWNpdHkgaW5zdGVhZCBvZiBkaXNwbGF5Om5vbmUgKEdTQVAgbmVlZHMgZWxlbWVudCBpbiBET00pXG4gIGxiLnN0eWxlLnNldFByb3BlcnR5KCd2aXNpYmlsaXR5JywgJ2hpZGRlbicsICdpbXBvcnRhbnQnKTtcbiAgbGIuc3R5bGUuc2V0UHJvcGVydHkoJ29wYWNpdHknLCAnMCcsICdpbXBvcnRhbnQnKTtcbiAgbGIuc3R5bGUuc2V0UHJvcGVydHkoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnLCAnaW1wb3J0YW50Jyk7XG4gIFxuICAvLyBFbnN1cmUgc2Nyb2xsIGlzIHVubG9ja2VkIG9uIHBhZ2UgbG9hZFxuICB1bmxvY2tTY3JvbGwoeyBkZWxheU1zOiAwIH0pO1xuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBIRUxQRVIgRlVOQ1RJT05TXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBcbiAgLyoqXG4gICAqIEVtaXQgY3VzdG9tIGV2ZW50IHZpYSBXZWJmbG93IElYIGZvciBHU0FQIGFuaW1hdGlvbnNcbiAgICovXG4gIGZ1bmN0aW9uIGVtaXRXZWJmbG93RXZlbnQobmFtZSl7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh3aW5kb3cuV2ViZmxvdyAmJiB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKSB7XG4gICAgICAgIGNvbnN0IHdmSXggPSB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKTtcbiAgICAgICAgaWYgKHdmSXggJiYgdHlwZW9mIHdmSXguZW1pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHdmSXguZW1pdChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZygnW0xJR0hUQk9YXSBXZWJmbG93IGVtaXQgZmFpbGVkOicsIGVycik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2UgYWxsIHBhZ2UgY29udGVudCBleGNlcHQgbGlnaHRib3ggaW5lcnQgKGluYWNjZXNzaWJsZSlcbiAgICovXG4gIGZ1bmN0aW9uIHNldFBhZ2VJbmVydChvbil7XG4gICAgY29uc3Qgc2libGluZ3MgPSBBcnJheS5mcm9tKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pLmZpbHRlcihuID0+IG4gIT09IGxiKTtcbiAgICBzaWJsaW5ncy5mb3JFYWNoKG4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCdpbmVydCcgaW4gbikgbi5pbmVydCA9ICEhb247XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBpZiAob24pIG4uc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBlbHNlIG4ucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYXAgZm9jdXMgd2l0aGluIGxpZ2h0Ym94IHdoZW4gVGFiIGlzIHByZXNzZWRcbiAgICovXG4gIGZ1bmN0aW9uIHRyYXBGb2N1cyhlKXtcbiAgICBpZiAoZS5rZXkgIT09ICdUYWInKSByZXR1cm47XG4gICAgXG4gICAgY29uc3QgZm9jdXNhYmxlcyA9IGxiLnF1ZXJ5U2VsZWN0b3JBbGwoW1xuICAgICAgJ2FbaHJlZl0nLCdidXR0b24nLCdpbnB1dCcsJ3NlbGVjdCcsJ3RleHRhcmVhJyxcbiAgICAgICdbdGFiaW5kZXhdOm5vdChbdGFiaW5kZXg9XCItMVwiXSknXG4gICAgXS5qb2luKCcsJykpO1xuICAgIFxuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5mcm9tKGZvY3VzYWJsZXMpLmZpbHRlcihcbiAgICAgIGVsID0+ICFlbC5oYXNBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgJiYgIWVsLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKVxuICAgICk7XG4gICAgXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKXsgXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7IFxuICAgICAgKGlubmVyIHx8IGxiKS5mb2N1cygpOyBcbiAgICAgIHJldHVybjsgXG4gICAgfVxuICAgIFxuICAgIGNvbnN0IGZpcnN0ID0gbGlzdFswXTtcbiAgICBjb25zdCBsYXN0ID0gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdO1xuICAgIFxuICAgIGlmIChlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGZpcnN0KXsgXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7IFxuICAgICAgbGFzdC5mb2N1cygpOyBcbiAgICB9IGVsc2UgaWYgKCFlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGxhc3QpeyBcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTsgXG4gICAgICBmaXJzdC5mb2N1cygpOyBcbiAgICB9XG4gIH1cblxuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gQ09SRSBGVU5DVElPTlNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIFxuICAvKipcbiAgICogT3BlbiBsaWdodGJveCB3aXRoIGNvbnRlbnQgZnJvbSBjbGlja2VkIHNsaWRlXG4gICAqL1xuICBmdW5jdGlvbiBvcGVuRnJvbVNsaWRlKHNsaWRlKXtcbiAgICBpZiAob3Blbkd1YXJkKSByZXR1cm47IC8vIEFscmVhZHkgb3BlblxuICAgIFxuICAgIG9wZW5HdWFyZCA9IHRydWU7XG4gICAgbGFzdEZvY3VzID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA6IG51bGw7XG5cbiAgICAvLyBFeHRyYWN0IGRhdGEgZnJvbSBzbGlkZVxuICAgIGNvbnN0IHZpZGVvID0gc2xpZGU/LmRhdGFzZXQ/LnZpZGVvIHx8ICcnO1xuICAgIGNvbnN0IHRpdGxlID0gc2xpZGU/LmRhdGFzZXQ/LnRpdGxlIHx8ICcnO1xuICAgIGNvbnN0IHRleHQgID0gc2xpZGU/LmRhdGFzZXQ/LnRleHQgIHx8ICcnO1xuXG4gICAgLy8gTW91bnQgVmltZW8gdmlkZW8gKGRpc2FibGUgYXV0b3BsYXkgaW4gV2ViZmxvdyBEZXNpZ25lciB0byBhdm9pZCB3YXJuaW5ncylcbiAgICBjb25zdCBpc0Rlc2lnbmVyID0gL1xcLndlYmZsb3dcXC5jb20kLy50ZXN0KGxvY2F0aW9uLmhvc3RuYW1lKSB8fCAvY2FudmFzXFwud2ViZmxvd1xcLmNvbSQvLnRlc3QobG9jYXRpb24uaG9zdG5hbWUpO1xuICAgIGNvbnN0IGF1dG9wbGF5ID0gaXNEZXNpZ25lciA/IDAgOiAxO1xuICAgIFxuICAgIGlmICh2aWRlb0FyZWEgJiYgdmlkZW8pIHtcbiAgICAgIG1vdW50VmltZW8odmlkZW9BcmVhLCB2aWRlbywgeyBcbiAgICAgICAgYXV0b3BsYXksIFxuICAgICAgICBtdXRlZDogMSwgXG4gICAgICAgIGNvbnRyb2xzOiAwLCBcbiAgICAgICAgYmFja2dyb3VuZDogMSwgXG4gICAgICAgIHBsYXlzaW5saW5lOiAxLCBcbiAgICAgICAgZG50OiAxIFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIE1ha2UgbGlnaHRib3ggdmlzaWJsZVxuICAgIGxiLnN0eWxlLnJlbW92ZVByb3BlcnR5KCd2aXNpYmlsaXR5Jyk7XG4gICAgbGIuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ29wYWNpdHknKTtcbiAgICBsYi5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgncG9pbnRlci1ldmVudHMnKTtcbiAgICBsYi5jbGFzc0xpc3QuYWRkKCdpcy1vcGVuJyk7XG4gICAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgIFxuICAgIC8vIExvY2sgcGFnZSBzY3JvbGwgYW5kIG1ha2UgYmFja2dyb3VuZCBpbmVydFxuICAgIHNldFBhZ2VJbmVydCh0cnVlKTtcbiAgICBsb2NrU2Nyb2xsKCk7XG4gICAgXG4gICAgLy8gVHJpZ2dlciBHU0FQIGFuaW1hdGlvbiB2aWEgV2ViZmxvdyBJWFxuICAgIGVtaXRXZWJmbG93RXZlbnQoJ2xiOm9wZW4nKTtcblxuICAgIC8vIFNldCBmb2N1cyB0byBsaWdodGJveCBmb3Iga2V5Ym9hcmQgbmF2aWdhdGlvblxuICAgIGxiLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgKGlubmVyIHx8IGxiKS5mb2N1cygpO1xuICAgIH0pO1xuXG4gICAgLy8gRW1pdCBldmVudCBmb3IgZXh0ZXJuYWwgbGlzdGVuZXJzXG4gICAgZW1pdCgnTElHSFRCT1hfT1BFTicsIGxiLCB7IHZpZGVvLCB0aXRsZSwgdGV4dCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZSBsaWdodGJveCB3aXRoIGFuaW1hdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdENsb3NlKCl7XG4gICAgaWYgKCFvcGVuR3VhcmQpIHJldHVybjsgLy8gQWxyZWFkeSBjbG9zZWRcbiAgICBcbiAgICAvLyBFbWl0IGV2ZW50IGZvciBleHRlcm5hbCBsaXN0ZW5lcnNcbiAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRScsIGxiKTtcbiAgICBcbiAgICAvLyBUcmlnZ2VyIEdTQVAgY2xvc2UgYW5pbWF0aW9uIHZpYSBXZWJmbG93IElYXG4gICAgZW1pdFdlYmZsb3dFdmVudCgnbGI6Y2xvc2UnKTtcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgZGVsYXkgYmFzZWQgb24gdXNlcidzIG1vdGlvbiBwcmVmZXJlbmNlXG4gICAgY29uc3QgaGlkZURlbGF5ID0gcHJlZmVyc1JlZHVjZWQgPyAwIDogY2xvc2VEZWxheU1zO1xuICAgIFxuICAgIC8vIENsZWFuIHVwIGFmdGVyIGFuaW1hdGlvbiBjb21wbGV0ZXNcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgbGIuY2xhc3NMaXN0LnJlbW92ZSgnaXMtb3BlbicpO1xuICAgICAgc2V0UGFnZUluZXJ0KGZhbHNlKTtcbiAgICAgIFxuICAgICAgLy8gQ2xlYXIgdmlkZW9cbiAgICAgIGlmICh2aWRlb0FyZWEpIHZpZGVvQXJlYS5pbm5lckhUTUwgPSAnJztcbiAgICAgIFxuICAgICAgLy8gUmVzdG9yZSBmb2N1cyB0byBlbGVtZW50IHRoYXQgb3BlbmVkIGxpZ2h0Ym94XG4gICAgICBpZiAobGFzdEZvY3VzICYmIGRvY3VtZW50LmJvZHkuY29udGFpbnMobGFzdEZvY3VzKSkge1xuICAgICAgICBsYXN0Rm9jdXMuZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgb3Blbkd1YXJkID0gZmFsc2U7XG4gICAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRURfRE9ORScsIGxiKTtcbiAgICB9LCBoaWRlRGVsYXkpO1xuICAgIFxuICAgIC8vIFVubG9jayBzY3JvbGxcbiAgICB1bmxvY2tTY3JvbGwoeyBcbiAgICAgIGRlbGF5TXM6IHByZWZlcnNSZWR1Y2VkID8gMCA6IGNsb3NlRGVsYXlNcyBcbiAgICB9KTtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBFVkVOVCBMSVNURU5FUlNcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIFxuICAvLyBPcGVuIGxpZ2h0Ym94IHdoZW4gc2xpZGUgaXMgY2xpY2tlZFxuICBzbGlkZXMuZm9yRWFjaCgoc2xpZGUsIGluZGV4KSA9PiB7XG4gICAgc2xpZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIG9wZW5Gcm9tU2xpZGUoc2xpZGUpO1xuICAgIH0sIHsgcGFzc2l2ZTogZmFsc2UgfSk7XG4gIH0pO1xuXG4gIC8vIENsb3NlIGxpZ2h0Ym94IHdoZW4gY2xpY2tpbmcgb3V0c2lkZSBpbm5lciBjb250ZW50XG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgaWYgKGlubmVyICYmICFlLnRhcmdldC5jbG9zZXN0KCcubGlnaHRib3hfX2lubmVyJykpIHtcbiAgICAgIHJlcXVlc3RDbG9zZSgpO1xuICAgIH0gZWxzZSBpZiAoIWlubmVyICYmIGUudGFyZ2V0ID09PSBsYikge1xuICAgICAgcmVxdWVzdENsb3NlKCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBDbG9zZSBidXR0b25cbiAgaWYgKGNsb3NlQnRuKSB7XG4gICAgY2xvc2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHJlcXVlc3RDbG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gS2V5Ym9hcmQgY29udHJvbHM6IEVzY2FwZSB0byBjbG9zZSwgVGFiIHRvIHRyYXAgZm9jdXNcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGUgPT4ge1xuICAgIGlmIChsYi5jbGFzc0xpc3QuY29udGFpbnMoJ2lzLW9wZW4nKSl7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSByZXF1ZXN0Q2xvc2UoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gJ1RhYicpIHRyYXBGb2N1cyhlKTtcbiAgICB9XG4gIH0pO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFdlYmZsb3cgU2Nyb2xsVHJpZ2dlciBCcmlkZ2VcbiAqICBQdXJwb3NlOiBUcmlnZ2VyIFdlYmZsb3cgSVggaW50ZXJhY3Rpb25zIHZpYSBHU0FQIFNjcm9sbFRyaWdnZXJcbiAqICBEYXRlOiAyMDI1LTEwLTMwXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnNvbGUubG9nKCdbV0VCRkxPV10gbW9kdWxlIGxvYWRlZCcpO1xuXG4vKipcbiAqIEluaXRpYWxpemUgR1NBUCBTY3JvbGxUcmlnZ2VyIFx1MjE5MiBXZWJmbG93IElYIGJyaWRnZS5cbiAqXG4gKiBCZWhhdmlvcjpcbiAqICAxLiBPbiBwYWdlIGxvYWQ6IGVtaXQgbG9nby1ncm93IChzbWFsbCBcdTIxOTIgYmlnKVxuICogIDIuIFNjcm9sbCBkb3duIHBhc3QgI2ludHJvLXNsaWRlOiBlbWl0IGxvZ28tc2hyaW5rIChiaWcgXHUyMTkyIHNtYWxsKVxuICogIDMuIFNjcm9sbCBiYWNrIHVwIHRvICNpbnRyby1zbGlkZTogZW1pdCBsb2dvLWdyb3cgKHNtYWxsIFx1MjE5MiBiaWcpXG4gKlxuICogUmVxdWlyZW1lbnRzIGluIFdlYmZsb3c6XG4gKiAgLSBsb2dvLXNocmluazogQ29udHJvbCBcdTIxOTIgUGxheSBmcm9tIHN0YXJ0IChiaWcgXHUyMTkyIHNtYWxsIGFuaW1hdGlvbilcbiAqICAtIGxvZ28tZ3JvdzogQ29udHJvbCBcdTIxOTIgUGxheSBmcm9tIHN0YXJ0IChzbWFsbCBcdTIxOTIgYmlnIGFuaW1hdGlvbilcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNjcm9sbGVyU2VsZWN0b3I9Jy5wZXJzcGVjdGl2ZS13cmFwcGVyJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zaHJpbmtFdmVudE5hbWU9J2xvZ28tc2hyaW5rJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5ncm93RXZlbnROYW1lPSdsb2dvLWdyb3cnXVxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5tYXJrZXJzPWZhbHNlXVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFdlYmZsb3dTY3JvbGxUcmlnZ2VycyhvcHRpb25zID0ge30pe1xuICBjb25zdCBzY3JvbGxlclNlbGVjdG9yID0gb3B0aW9ucy5zY3JvbGxlclNlbGVjdG9yIHx8ICcucGVyc3BlY3RpdmUtd3JhcHBlcic7XG4gIGNvbnN0IHNocmlua0V2ZW50TmFtZSA9IG9wdGlvbnMuc2hyaW5rRXZlbnROYW1lIHx8IG9wdGlvbnMucGxheUV2ZW50TmFtZSB8fCAnbG9nby1zaHJpbmsnO1xuICBjb25zdCBncm93RXZlbnROYW1lID0gb3B0aW9ucy5ncm93RXZlbnROYW1lIHx8ICdsb2dvLWdyb3cnO1xuICBjb25zdCBtYXJrZXJzID0gISFvcHRpb25zLm1hcmtlcnM7XG5cbiAgZnVuY3Rpb24gb25XaW5kb3dMb2FkKGNiKXtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykgeyBzZXRUaW1lb3V0KGNiLCAwKTsgcmV0dXJuOyB9XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBjYiwgeyBvbmNlOiB0cnVlIH0pO1xuICB9XG5cbiAgb25XaW5kb3dMb2FkKGZ1bmN0aW9uKCl7XG4gICAgY29uc3QgV2ViZmxvdyA9IHdpbmRvdy5XZWJmbG93IHx8IFtdO1xuICAgIFxuICAgIFdlYmZsb3cucHVzaChmdW5jdGlvbigpe1xuICAgICAgLy8gR2V0IFdlYmZsb3cgSVggQVBJICh0cnkgaXgzIGZpcnN0LCBmYWxsYmFjayB0byBpeDIpXG4gICAgICBjb25zdCB3Zkl4ID0gKHdpbmRvdy5XZWJmbG93ICYmIHdpbmRvdy5XZWJmbG93LnJlcXVpcmUpIFxuICAgICAgICA/ICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSlcbiAgICAgICAgOiBudWxsO1xuICAgICAgY29uc3QgU2Nyb2xsVHJpZ2dlciA9IHdpbmRvdy5TY3JvbGxUcmlnZ2VyO1xuICAgICAgXG4gICAgICBpZiAoIXdmSXggfHwgIVNjcm9sbFRyaWdnZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IHNjcm9sbGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzY3JvbGxlclNlbGVjdG9yKTtcbiAgICAgIGlmICghc2Nyb2xsZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIEZpbmQgI2ludHJvLXNsaWRlIGVsZW1lbnQgKHRyaWdnZXIgZm9yIGxvZ28gYW5pbWF0aW9uKVxuICAgICAgY29uc3QgZHJpdmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ludHJvLXNsaWRlJyk7XG4gICAgICBpZiAoIWRyaXZlcikgeyBcbiAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIERyaXZlciBzbGlkZSAoI2ludHJvLXNsaWRlKSBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuOyBcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTZXR1cCBjb21wbGV0ZTonLCB7IFxuICAgICAgICBzY3JvbGxlcjogISFzY3JvbGxlciwgXG4gICAgICAgIGRyaXZlcjogISFkcml2ZXIsXG4gICAgICAgIHdmSXg6ICEhd2ZJeCwgXG4gICAgICAgIFNjcm9sbFRyaWdnZXI6ICEhU2Nyb2xsVHJpZ2dlcixcbiAgICAgICAgc2hyaW5rRXZlbnQ6IHNocmlua0V2ZW50TmFtZSxcbiAgICAgICAgZ3Jvd0V2ZW50OiBncm93RXZlbnROYW1lXG4gICAgICB9KTtcblxuICAgICAgLy8gTWFpbiBTY3JvbGxUcmlnZ2VyOiB3YXRjaGVzIHdoZW4gI2ludHJvLXNsaWRlIGxlYXZlcy9lbnRlcnMgdG9wIHpvbmVcbiAgICAgIFNjcm9sbFRyaWdnZXIuY3JlYXRlKHtcbiAgICAgICAgdHJpZ2dlcjogZHJpdmVyLFxuICAgICAgICBzY3JvbGxlcjogc2Nyb2xsZXIsXG4gICAgICAgIHN0YXJ0OiAndG9wIHRvcCcsXG4gICAgICAgIGVuZDogJ3RvcCAtMTAlJyxcbiAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgXG4gICAgICAgIG9uTGVhdmU6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxlZCBET1dOIHBhc3QgI2ludHJvLXNsaWRlIFx1MjE5MiBzaHJpbmtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IHNocmluayAoc2Nyb2xsZWQgZG93bik6Jywgc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgIHdmSXguZW1pdChzaHJpbmtFdmVudE5hbWUpO1xuICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gRXJyb3IgZW1pdHRpbmcgc2hyaW5rOicsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgb25FbnRlckJhY2s6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxlZCBiYWNrIHVwIHRvICNpbnRyby1zbGlkZSBcdTIxOTIgZ3Jvd1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3JvdyAoc2Nyb2xsZWQgYmFjayB1cCk6JywgZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tXRUJGTE9XXSBFcnJvciBlbWl0dGluZyBncm93OicsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTY3JvbGxUcmlnZ2VyIGluaXRpYWxpemVkJyk7XG4gICAgICBcbiAgICAgIC8vIE9uIHBhZ2UgbG9hZDogdHJpZ2dlciBsb2dvLWdyb3cgdG8gYW5pbWF0ZSBsb2dvIGZyb20gc21hbGwgXHUyMTkyIGJpZ1xuICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgU2Nyb2xsVHJpZ2dlci5yZWZyZXNoKCk7XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IGdyb3cgKGluaXRpYWwgbG9hZCk6JywgZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tXRUJGTE9XXSBFcnJvciBlbWl0dGluZyBpbml0aWFsIGdyb3c6JywgZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBcHAgRW50cnlcbiAqICBQdXJwb3NlOiBXaXJlIG1vZHVsZXMgYW5kIGV4cG9zZSBtaW5pbWFsIGZhY2FkZVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgaW5pdEFjY29yZGlvbiB9IGZyb20gJy4vbW9kdWxlcy9hY2NvcmRpb24uanMnO1xuaW1wb3J0IHsgaW5pdExpZ2h0Ym94IH0gZnJvbSAnLi9tb2R1bGVzL2xpZ2h0Ym94LmpzJztcbmltcG9ydCB7IGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMgfSBmcm9tICcuL21vZHVsZXMvd2ViZmxvdy1zY3JvbGx0cmlnZ2VyLmpzJztcbi8vIE5vIG5lZWQgdG8gaW1wb3J0IHRoZSBnc2FwIGZpbGUgaGVyZSBhbnltb3JlLCBhY2NvcmRpb24uanMgaGFuZGxlcyBpdC5cblxuZnVuY3Rpb24gcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKXtcbiAgLy8gTWluaW1hbCBzZXQgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluc2lkZSBEZXNpZ25lclxuICBjb25zdCB0b2tlbnMgPSBbJ2F1dG9wbGF5JywnZW5jcnlwdGVkLW1lZGlhJywncGljdHVyZS1pbi1waWN0dXJlJ107XG4gIGNvbnN0IHNlbCA9IFtcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHUuYmVcIl0nLFxuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUtbm9jb29raWUuY29tXCJdJyxcbiAgXS5qb2luKCcsJyk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKS5mb3JFYWNoKChpZnIpID0+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IChpZnIuZ2V0QXR0cmlidXRlKCdhbGxvdycpIHx8ICcnKS5zcGxpdCgnOycpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgbWVyZ2VkID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5leGlzdGluZywgLi4udG9rZW5zXSkpLmpvaW4oJzsgJyk7XG4gICAgaWZyLnNldEF0dHJpYnV0ZSgnYWxsb3cnLCBtZXJnZWQpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdChvcHRpb25zID0ge30pe1xuICBjb25zdCBsaWdodGJveFJvb3QgPSBvcHRpb25zLmxpZ2h0Ym94Um9vdCB8fCAnI2xpZ2h0Ym94JztcbiAgaW5pdEFjY29yZGlvbignLmFjY29yZGVvbicpO1xuICBpbml0TGlnaHRib3goeyByb290OiBsaWdodGJveFJvb3QsIGNsb3NlRGVsYXlNczogMTAwMCB9KTtcbiAgLy8gUmVseSBvbiBDU1Mgc2Nyb2xsLXNuYXAgaW4gYC5wZXJzcGVjdGl2ZS13cmFwcGVyYDsgZG8gbm90IGF0dGFjaCBKUyBwYWdpbmdcblxuICAvLyAoQ3VzdG9tIGN1cnNvciByZW1vdmVkKVxuXG4gIC8vIEJyaWRnZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVhcbiAgdHJ5IHtcbiAgICBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKHtcbiAgICAgIHNjcm9sbGVyU2VsZWN0b3I6ICcucGVyc3BlY3RpdmUtd3JhcHBlcicsXG4gICAgICBzaHJpbmtFdmVudE5hbWU6ICdsb2dvLXNocmluaycsXG4gICAgICBncm93RXZlbnROYW1lOiAnbG9nby1ncm93J1xuICAgIH0pO1xuICB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gTm90ZTogbm8gSlMgc2xpZGUgc25hcHBpbmc7IHJlbHkgb24gQ1NTIHNjcm9sbC1zbmFwIGluIGAucGVyc3BlY3RpdmUtd3JhcHBlcmBcbn1cblxuLy8gRXhwb3NlIGEgdGlueSBnbG9iYWwgZm9yIFdlYmZsb3cvRGVzaWduZXIgaG9va3Ncbi8vIChJbnRlcm5hbHMgcmVtYWluIHByaXZhdGUgaW5zaWRlIHRoZSBJSUZFIGJ1bmRsZSlcbmlmICghd2luZG93LkFwcCkgd2luZG93LkFwcCA9IHt9O1xud2luZG93LkFwcC5pbml0ID0gaW5pdDtcblxuLy8gQXV0by1pbml0IG9uIERPTSByZWFkeSAoc2FmZSBpZiBlbGVtZW50cyBhcmUgbWlzc2luZylcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIHRyeSB7IHBhdGNoWW91VHViZUFsbG93VG9rZW5zKCk7IGluaXQoKTsgfSBjYXRjaCAoZXJyKSB7IGNvbnNvbGUuZXJyb3IoJ1tBcHBdIGluaXQgZXJyb3InLCBlcnIpOyB9XG59KTtcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiOztBQVFPLFdBQVMsS0FBSyxNQUFNLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBRTtBQUN0RCxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsU0FBUyxNQUFNLFlBQVksTUFBTSxPQUFPLENBQUMsQ0FBQztBQUFBLElBQUcsUUFBUTtBQUFBLElBQUM7QUFDekcsUUFBSTtBQUFFLGFBQU8sY0FBYyxJQUFJLFlBQVksTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUFBLEVBQzFFOzs7QUNIQSxNQUFJO0FBRUosV0FBUyxXQUFXO0FBQ2xCLFFBQUksS0FBTSxRQUFPO0FBRWpCLFFBQUksV0FBVztBQUNmLFVBQU0sT0FBTyxNQUFNO0FBQ2pCLFlBQU0sZ0JBQWdCLE9BQU8sUUFBUSxPQUFPLFlBQVksT0FBTztBQUMvRCxVQUFJLGVBQWU7QUFDakIsZUFBTyxjQUFjLFFBQVE7QUFDN0IsZ0JBQVEsSUFBSSx3REFBbUQsS0FBSyxXQUFXLFFBQVE7QUFBQSxNQUN6RixXQUFXLFdBQVcsSUFBSTtBQUN4QjtBQUNBLG1CQUFXLE1BQU0sR0FBRztBQUFBLE1BQ3RCLE9BQU87QUFDTCxnQkFBUSxJQUFJLDBFQUFxRTtBQUFBLE1BQ25GO0FBQUEsSUFDRjtBQUNBLFNBQUs7QUFBQSxFQUNQO0FBR0EsV0FBUztBQUdGLFdBQVMsb0JBQW9CO0FBQ2xDLFFBQUksQ0FBQyxNQUFNO0FBQ1QsY0FBUSxJQUFJLDJEQUEyRDtBQUN2RTtBQUFBLElBQ0Y7QUFDQSxVQUFNLFVBQVUsU0FBUyxpQkFBaUIscUJBQXFCO0FBQy9ELFFBQUksUUFBUSxXQUFXLEVBQUc7QUFFMUIsWUFBUSxJQUFJLHFDQUE4QixR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
