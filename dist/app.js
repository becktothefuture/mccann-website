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
    const isL1 = (el) => el.classList.contains("accordeon-item--level1");
    const isL2 = (el) => el.classList.contains("accordeon-item--level2");
    const panelOf = (item) => item == null ? void 0 : item.querySelector(":scope > .accordeon__list");
    const groupOf = (item) => isL1(item) ? root : item.closest(".accordeon__list");
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
        emit(isL1(item) ? "ACC_L1_OPEN" : "ACC_L2_OPEN", item, { opening: true });
      } else {
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
    iframe.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; clipboard-write; web-share";
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
      if (videoArea) mountVimeo(videoArea, video, { autoplay: 1, muted: 1, controls: 0, background: 1, playsinline: 1, dnt: 1 });
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

  // src/modules/slide-pager.js
  function initSlidePager(options = {}) {
    const {
      selector = ".slide",
      duration = 0.5,
      ease = "expo.out",
      anchorRatio = 0.5,
      cooldownMs = 420
    } = options;
    const prefersReduced = typeof window !== "undefined" && "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const gsapGlobal = typeof window !== "undefined" && (window.gsap || window.GSAP) || (typeof gsap !== "undefined" ? gsap : null);
    if (!gsapGlobal) return;
    let slides = [];
    let positions = [];
    let tween = null;
    let lastJumpTs = 0;
    function collect() {
      slides = Array.from(document.querySelectorAll(selector));
      positions = slides.map((s) => Math.round(s.offsetTop));
    }
    function getCurrentIndex() {
      var _a;
      const anchor = window.scrollY + window.innerHeight * (isFinite(anchorRatio) ? anchorRatio : 0.5);
      let nearest = 0;
      let best = Math.abs(((_a = positions[0]) != null ? _a : 0) - anchor);
      for (let i = 1; i < positions.length; i++) {
        const d = Math.abs(positions[i] - anchor);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      return nearest;
    }
    function jumpToIndex(index) {
      if (index < 0 || index >= positions.length) return;
      const now = performance.now();
      if (now - lastJumpTs < cooldownMs) return;
      lastJumpTs = now;
      const target = positions[index];
      if (tween && tween.kill) tween.kill();
      const hasScrollToPlugin = !!window.ScrollToPlugin;
      if (hasScrollToPlugin && gsapGlobal.registerPlugin) {
        try {
          gsapGlobal.registerPlugin(window.ScrollToPlugin);
        } catch (_) {
        }
      }
      try {
        if (hasScrollToPlugin) {
          tween = gsapGlobal.to(window, {
            scrollTo: { y: target, autoKill: true },
            duration,
            ease,
            overwrite: "auto",
            onComplete: () => {
              tween = null;
            }
          });
          return;
        }
      } catch (_) {
      }
      try {
        window.scrollTo({ top: target, behavior: "smooth" });
        tween = { kill() {
          tween = null;
        } };
        setTimeout(() => {
          tween = null;
        }, Math.max(250, duration * 1e3));
      } catch (_) {
        window.scrollTo(0, target);
        tween = null;
      }
    }
    function onWheel(e) {
      if (!slides.length) return;
      if (tween) {
        e.preventDefault();
        return;
      }
      const dy = e.deltaY || 0;
      if (Math.abs(dy) < 2) return;
      e.preventDefault();
      const idx = getCurrentIndex();
      jumpToIndex(dy > 0 ? idx + 1 : idx - 1);
    }
    let touchStartY = 0;
    function onTouchStart(e) {
      const t = e.touches && e.touches[0];
      touchStartY = t ? t.clientY : 0;
    }
    function onTouchEnd(e) {
      if (!slides.length) return;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dy = touchStartY - t.clientY;
      if (Math.abs(dy) < 20) return;
      const idx = getCurrentIndex();
      jumpToIndex(dy > 0 ? idx + 1 : idx - 1);
    }
    function shouldIgnoreKey() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = (el.tagName || "").toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    }
    function onKeyDown(e) {
      if (shouldIgnoreKey()) return;
      let dir = 0;
      switch (e.code) {
        case "ArrowDown":
        case "PageDown":
        case "Space":
          dir = 1;
          break;
        case "ArrowUp":
        case "PageUp":
          dir = -1;
          break;
        case "Home":
          jumpToIndex(0);
          e.preventDefault();
          return;
        case "End":
          jumpToIndex(slides.length - 1);
          e.preventDefault();
          return;
        default:
          return;
      }
      e.preventDefault();
      const idx = getCurrentIndex();
      jumpToIndex(idx + dir);
    }
    function attach() {
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("keydown", onKeyDown, { passive: false });
      window.addEventListener("resize", handleResize);
      window.addEventListener("orientationchange", handleResize);
    }
    function detach() {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    }
    function handleResize() {
      collect();
    }
    collect();
    if (slides.length === 0) return;
    attach();
    return function destroySlidePager() {
      if (tween && tween.kill) tween.kill();
      detach();
    };
  }

  // src/modules/webflow-scrolltrigger.js
  console.log("[WF-IX] module loaded");
  function initWebflowScrollTriggers(options = {}) {
    const scrollerSelector = options.scrollerSelector || ".perspective-wrapper";
    const driverSelector = options.driverSelector || ".slide--scroll-driver";
    const initEventName = options.initEventName || "logo-start";
    const playEventName = options.playEventName || "logo-shrink";
    const resetEventName = options.resetEventName || initEventName || "logo-start";
    const start = options.start || "top top";
    const end = options.end || "bottom top";
    const markers = !!options.markers;
    const playThreshold = typeof options.playThreshold === "number" ? options.playThreshold : 0.02;
    function onWindowLoad(cb) {
      if (document.readyState === "complete") {
        setTimeout(cb, 0);
        return;
      }
      window.addEventListener("load", cb, { once: true });
    }
    onWindowLoad(function() {
      const Webflow = window.Webflow || [];
      const getIx = () => {
        try {
          return window.Webflow && window.Webflow.require && (window.Webflow.require("ix3") || window.Webflow.require("ix2"));
        } catch (_) {
          try {
            return window.Webflow && window.Webflow.require && window.Webflow.require("ix2");
          } catch (__) {
            return null;
          }
        }
      };
      const mount = () => {
        const wfIx = getIx();
        const ScrollTrigger = typeof window !== "undefined" ? window.ScrollTrigger : null;
        if (!wfIx || !ScrollTrigger) {
          return;
        }
        const scroller = document.querySelector(scrollerSelector);
        const driver = document.querySelector(driverSelector);
        if (!scroller || !driver) {
          return;
        }
        try {
          initEventName && wfIx.emit(initEventName);
        } catch (_) {
        }
        let hasPlayed = false;
        let hasReset = false;
        ScrollTrigger.create({
          trigger: driver,
          scroller,
          start,
          end,
          markers,
          onUpdate: (self) => {
            if (!hasPlayed && self.direction > 0 && self.progress > playThreshold) {
              try {
                playEventName && wfIx.emit(playEventName);
              } catch (_) {
              }
              hasPlayed = true;
              hasReset = false;
            }
          },
          onEnterBack: () => {
            if (!hasReset) {
              try {
                resetEventName && wfIx.emit(resetEventName);
              } catch (_) {
              }
              hasReset = true;
              hasPlayed = false;
            }
          }
        });
      };
      try {
        Webflow.push(mount);
      } catch (_) {
        mount();
      }
    });
  }

  // src/app.js
  function patchYouTubeAllowTokens() {
    const tokens = ["accelerometer", "autoplay", "clipboard-write", "encrypted-media", "gyroscope", "picture-in-picture", "web-share"];
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
      const customScroller = document.querySelector(".perspective-wrapper");
      const hasCustomScroll = !!customScroller && (function(el) {
        const cs = getComputedStyle(el);
        const oy = cs.overflowY;
        return (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight;
      })(customScroller);
      if (!hasCustomScroll) {
        initSlidePager({ selector: ".slide", duration: 0.5, ease: "expo.out", anchorRatio: 0.5, cooldownMs: 420 });
      }
    } catch (_) {
    }
    try {
      initWebflowScrollTriggers({
        scrollerSelector: ".perspective-wrapper",
        driverSelector: ".slide--scroll-driver",
        initEventName: "logo-start",
        // pause at start on load
        playEventName: "logo-shrink",
        // play as soon as user starts scrolling down
        resetEventName: "logo-start",
        // reset/pause when scrolling back above the driver
        playThreshold: 0.02
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3NsaWRlLXBhZ2VyLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvYXBwLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEV2ZW50cyBVdGlsaXR5XG4gKiAgUHVycG9zZTogRW1pdCBidWJibGluZyBDdXN0b21FdmVudHMgY29tcGF0aWJsZSB3aXRoIEdTQVAtVUkgKHdpbmRvdyBzY29wZSlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0KG5hbWUsIHRhcmdldCA9IHdpbmRvdywgZGV0YWlsID0ge30pe1xuICB0cnkgeyB0YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG4gIHRyeSB7IHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCB7IGRldGFpbCB9KSk7IH0gY2F0Y2gge31cbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBY2NvcmRpb24gTW9kdWxlXG4gKiAgUHVycG9zZTogQVJJQSwgc21vb3RoIHRyYW5zaXRpb25zLCBSTyBpbWFnZSBzYWZldHlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGVtaXQgfSBmcm9tICcuLi9jb3JlL2V2ZW50cy5qcyc7XG5jb25zb2xlLmxvZygnW0FDQ09SRElPTl0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFjY29yZGlvbihyb290U2VsID0gJy5hY2NvcmRlb24nKXtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbCk7XG4gIGlmICghcm9vdCl7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSByb290IG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICBjb25zdCBpc0wxID0gZWwgPT4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyk7XG4gIGNvbnN0IGlzTDIgPSBlbCA9PiBlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgY29uc3QgcGFuZWxPZiA9IGl0ZW0gPT4gaXRlbT8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjY29yZGVvbl9fbGlzdCcpO1xuICBjb25zdCBncm91cE9mID0gaXRlbSA9PiBpc0wxKGl0ZW0pID8gcm9vdCA6IGl0ZW0uY2xvc2VzdCgnLmFjY29yZGVvbl9fbGlzdCcpO1xuXG4gIC8vIEFSSUEgYm9vdHN0cmFwXG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICB0LnNldEF0dHJpYnV0ZSgncm9sZScsICdidXR0b24nKTtcbiAgICB0LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2NvcmRlb24taXRlbS0tbGV2ZWwxLCAuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMicpO1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pO1xuICAgIGlmIChwKXtcbiAgICAgIGNvbnN0IHBpZCA9IHAuaWQgfHwgYGFjYy1wYW5lbC0ke2l9YDtcbiAgICAgIHAuaWQgPSBwaWQ7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHBpZCk7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gZXhwYW5kKHApe1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gcC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXtcbiAgICAgICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuJztcbiAgICAgIH1cbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKHApe1xuICAgIGNvbnN0IGggPSBwLnN0eWxlLm1heEhlaWdodCA9PT0gJ25vbmUnID8gcC5zY3JvbGxIZWlnaHQgOiBwYXJzZUZsb2F0KHAuc3R5bGUubWF4SGVpZ2h0IHx8IDApO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gKGggfHwgcC5zY3JvbGxIZWlnaHQpICsgJ3B4JztcbiAgICBwLm9mZnNldEhlaWdodDsgLy8gcmVmbG93XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY2xvc2luZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnO1xuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VTaWJsaW5ncyhpdGVtKXtcbiAgICBjb25zdCBncm91cCA9IGdyb3VwT2YoaXRlbSk7IGlmICghZ3JvdXApIHJldHVybjtcbiAgICBjb25zdCB3YW50ID0gaXNMMShpdGVtKSA/ICdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyA6ICdhY2NvcmRlb24taXRlbS0tbGV2ZWwyJztcbiAgICBBcnJheS5mcm9tKGdyb3VwLmNoaWxkcmVuKS5mb3JFYWNoKHNpYiA9PiB7XG4gICAgICBpZiAoc2liID09PSBpdGVtIHx8ICFzaWIuY2xhc3NMaXN0Py5jb250YWlucyh3YW50KSkgcmV0dXJuO1xuICAgICAgY29uc3QgcCA9IHBhbmVsT2Yoc2liKTtcbiAgICAgIGlmIChwICYmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJykpe1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgdHJpZyA9IHNpYi5xdWVyeVNlbGVjdG9yKCcuYWNjb3JkZW9uX190cmlnZ2VyJyk7XG4gICAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX0NMT1NFJyA6ICdBQ0NfTDJfQ0xPU0UnLCBzaWIsIHsgc291cmNlOiAnc2libGluZycgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldEFsbEwyKCl7XG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMiAuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIGNvbGxhcHNlKHApO1xuICAgICAgICBjb25zdCBpdCA9IHAuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICAgICAgaXQ/LnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKT8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgIGVtaXQoJ0FDQ19MMl9DTE9TRScsIGl0LCB7IHNvdXJjZTogJ3Jlc2V0LWFsbCcgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoaXRlbSl7XG4gICAgY29uc3QgcCA9IHBhbmVsT2YoaXRlbSk7IGlmICghcCkgcmV0dXJuO1xuICAgIGNvbnN0IHRyaWcgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKTtcbiAgICBjb25zdCBvcGVuaW5nID0gIShwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyk7XG4gICAgY2xvc2VTaWJsaW5ncyhpdGVtKTtcbiAgICBpZiAob3BlbmluZyAmJiBpc0wxKGl0ZW0pKSByZXNldEFsbEwyKCk7XG5cbiAgICBpZiAob3BlbmluZyl7XG4gICAgICBleHBhbmQocCk7IHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX09QRU4nIDogJ0FDQ19MMl9PUEVOJywgaXRlbSwgeyBvcGVuaW5nOiB0cnVlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsYXBzZShwKTsgdHJpZz8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICBpZiAoaXNMMShpdGVtKSkgcmVzZXRBbGxMMigpO1xuICAgICAgZW1pdChpc0wxKGl0ZW0pID8gJ0FDQ19MMV9DTE9TRScgOiAnQUNDX0wyX0NMT1NFJywgaXRlbSwgeyBvcGVuaW5nOiBmYWxzZSB9KTtcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2pzLXByZXAnKTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JzsgcC5kYXRhc2V0LnN0YXRlID0gJ2NvbGxhcHNlZCc7IH0pO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdqcy1wcmVwJykpO1xuXG4gIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpOyBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDEsIC5hY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpOyBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBpZiAoZS5rZXkgIT09ICdFbnRlcicgJiYgZS5rZXkgIT09ICcgJykgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMSwgLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICBpdGVtICYmIHRvZ2dsZShpdGVtKTtcbiAgfSk7XG5cbiAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgZW50cmllcy5mb3JFYWNoKCh7IHRhcmdldDogcCB9KSA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicpeyBwLnN0eWxlLm1heEhlaWdodCA9ICdub25lJzsgfVxuICAgICAgZWxzZSBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpeyBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JzsgfVxuICAgIH0pO1xuICB9KTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHJvLm9ic2VydmUocCkpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFNjcm9sbCBMb2NrIChIeWJyaWQsIGlPUy1zYWZlKVxuICogIFB1cnBvc2U6IFJlbGlhYmxlIHBhZ2Ugc2Nyb2xsIGxvY2tpbmcgd2l0aCBleGFjdCByZXN0b3JlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5sZXQgbG9ja3MgPSAwO1xubGV0IHNhdmVkWSA9IDA7XG5sZXQgcHJldlNjcm9sbEJlaGF2aW9yID0gJyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrU2Nyb2xsKCl7XG4gIGlmIChsb2NrcysrKSByZXR1cm47XG4gIGNvbnN0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBwcmV2U2Nyb2xsQmVoYXZpb3IgPSBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvcjtcbiAgZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSAnYXV0byc7XG4gIHNhdmVkWSA9IHdpbmRvdy5zY3JvbGxZIHx8IGRlLnNjcm9sbFRvcCB8fCAwO1xuXG4gIC8vIEZpeGVkLWJvZHkgKyBtb2RhbC1vcGVuIGNsYXNzIGZvciBDU1MgaG9va3NcbiAgT2JqZWN0LmFzc2lnbihkb2N1bWVudC5ib2R5LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgdG9wOiBgLSR7c2F2ZWRZfXB4YCxcbiAgICBsZWZ0OiAnMCcsXG4gICAgcmlnaHQ6ICcwJyxcbiAgICB3aWR0aDogJzEwMCUnLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICBvdmVyc2Nyb2xsQmVoYXZpb3I6ICdub25lJ1xuICB9KTtcbiAgdHJ5IHsgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1vcGVuJyk7IH0gY2F0Y2gge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVubG9ja1Njcm9sbCh7IGRlbGF5TXMgPSAwIH0gPSB7fSl7XG4gIGNvbnN0IHJ1biA9ICgpID0+IHtcbiAgICBpZiAoLS1sb2NrcyA+IDApIHJldHVybjtcbiAgICBjb25zdCBkZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBPYmplY3QuYXNzaWduKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnJywgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgd2lkdGg6ICcnLCBvdmVyZmxvdzogJycsIG92ZXJzY3JvbGxCZWhhdmlvcjogJydcbiAgICB9KTtcbiAgICB0cnkgeyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLW9wZW4nKTsgfSBjYXRjaCB7fVxuICAgIGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gcHJldlNjcm9sbEJlaGF2aW9yIHx8ICcnO1xuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBzYXZlZFkpO1xuICB9O1xuICBkZWxheU1zID8gc2V0VGltZW91dChydW4sIGRlbGF5TXMpIDogcnVuKCk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgVmltZW8gSGVscGVyXG4gKiAgUHVycG9zZTogTW91bnQvcmVwbGFjZSBWaW1lbyBpZnJhbWUgd2l0aCBwcml2YWN5IG9wdGlvbnNcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnNvbGUubG9nKCdbVklNRU9dIG1vZHVsZSBsb2FkZWQnKTtcblxuZnVuY3Rpb24gcGFyc2VWaW1lb0lkKGlucHV0KXtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xuICBjb25zdCBzdHIgPSBTdHJpbmcoaW5wdXQpLnRyaW0oKTtcbiAgLy8gQWNjZXB0IGJhcmUgSURzXG4gIGlmICgvXlxcZCskLy50ZXN0KHN0cikpIHJldHVybiBzdHI7XG4gIC8vIEV4dHJhY3QgZnJvbSBrbm93biBVUkwgZm9ybXNcbiAgdHJ5IHtcbiAgICBjb25zdCB1ID0gbmV3IFVSTChzdHIsICdodHRwczovL2V4YW1wbGUuY29tJyk7XG4gICAgY29uc3QgaG9zdCA9IHUuaG9zdG5hbWUgfHwgJyc7XG4gICAgaWYgKGhvc3QuaW5jbHVkZXMoJ3ZpbWVvLmNvbScpKXtcbiAgICAgIC8vIC92aWRlby97aWR9IG9yIC97aWR9XG4gICAgICBjb25zdCBwYXJ0cyA9IHUucGF0aG5hbWUuc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICBjb25zdCBsYXN0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgJyc7XG4gICAgICBjb25zdCBpZCA9IGxhc3QubWF0Y2goL1xcZCsvKT8uWzBdIHx8ICcnO1xuICAgICAgcmV0dXJuIGlkIHx8ICcnO1xuICAgIH1cbiAgfSBjYXRjaCB7fVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3VudFZpbWVvKGNvbnRhaW5lciwgaW5wdXRJZCwgcGFyYW1zID0ge30pe1xuICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuICBjb25zdCBpZCA9IHBhcnNlVmltZW9JZChpbnB1dElkKTtcbiAgaWYgKCFpZCl7IGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJzsgcmV0dXJuOyB9XG4gIGNvbnN0IHF1ZXJ5ID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh7IGRudDogMSwgLi4ucGFyYW1zIH0pLnRvU3RyaW5nKCk7XG4gIGNvbnN0IHNyYyA9IGBodHRwczovL3BsYXllci52aW1lby5jb20vdmlkZW8vJHtpZH0/JHtxdWVyeX1gO1xuICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLnNyYyA9IHNyYztcbiAgaWZyYW1lLmFsbG93ID0gJ2F1dG9wbGF5OyBmdWxsc2NyZWVuOyBwaWN0dXJlLWluLXBpY3R1cmU7IGVuY3J5cHRlZC1tZWRpYTsgYWNjZWxlcm9tZXRlcjsgZ3lyb3Njb3BlOyBjbGlwYm9hcmQtd3JpdGU7IHdlYi1zaGFyZSc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lYm9yZGVyJywgJzAnKTtcbiAgaWZyYW1lLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IExpZ2h0Ym94IE1vZHVsZVxuICogIFB1cnBvc2U6IEZvY3VzIHRyYXAsIG91dHNpZGUtY2xpY2ssIGluZXJ0L2FyaWEgZmFsbGJhY2ssIHJlLWVudHJhbmN5XG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBlbWl0IH0gZnJvbSAnLi4vY29yZS9ldmVudHMuanMnO1xuaW1wb3J0IHsgbG9ja1Njcm9sbCwgdW5sb2NrU2Nyb2xsIH0gZnJvbSAnLi4vY29yZS9zY3JvbGxsb2NrLmpzJztcbmltcG9ydCB7IG1vdW50VmltZW8gfSBmcm9tICcuL3ZpbWVvLmpzJztcbmNvbnNvbGUubG9nKCdbTElHSFRCT1hdIG1vZHVsZSBsb2FkZWQnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRMaWdodGJveCh7IHJvb3QgPSAnI3Byb2plY3QtbGlnaHRib3gnLCBjbG9zZURlbGF5TXMgPSAxMDAwIH0gPSB7fSl7XG4gIGNvbnN0IGxiID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290KTtcbiAgaWYgKCFsYil7IGNvbnNvbGUubG9nKCdbTElHSFRCT1hdIG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICAvLyBFbnN1cmUgYmFzZWxpbmUgZGlhbG9nIGExMXkgYXR0cmlidXRlc1xuICBsYi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCBsYi5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSB8fCAnZGlhbG9nJyk7XG4gIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1tb2RhbCcsIGxiLmdldEF0dHJpYnV0ZSgnYXJpYS1tb2RhbCcpIHx8ICd0cnVlJyk7XG4gIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykgfHwgJ3RydWUnKTtcblxuICBjb25zdCBpbm5lciA9IGxiLnF1ZXJ5U2VsZWN0b3IoJy5wcm9qZWN0LWxpZ2h0Ym94X19pbm5lcicpO1xuICBjb25zdCB2aWRlb0FyZWEgPSBsYi5xdWVyeVNlbGVjdG9yKCcudmlkZW8tYXJlYScpO1xuICBjb25zdCBzbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc2xpZGUnKTtcbiAgY29uc3QgcHJlZmVyc1JlZHVjZWQgPSBtYXRjaE1lZGlhKCcocHJlZmVycy1yZWR1Y2VkLW1vdGlvbjogcmVkdWNlKScpLm1hdGNoZXM7XG5cbiAgbGV0IG9wZW5HdWFyZCA9IGZhbHNlO1xuICBsZXQgbGFzdEZvY3VzID0gbnVsbDtcblxuICBmdW5jdGlvbiBzZXRQYWdlSW5lcnQob24pe1xuICAgIGNvbnN0IHNpYmxpbmdzID0gQXJyYXkuZnJvbShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKS5maWx0ZXIobiA9PiBuICE9PSBsYik7XG4gICAgc2libGluZ3MuZm9yRWFjaChuID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICgnaW5lcnQnIGluIG4pIG4uaW5lcnQgPSAhIW9uO1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgaWYgKG9uKSBuLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgZWxzZSBuLnJlbW92ZUF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYXBGb2N1cyhlKXtcbiAgICBpZiAoZS5rZXkgIT09ICdUYWInKSByZXR1cm47XG4gICAgY29uc3QgZm9jdXNhYmxlcyA9IGxiLnF1ZXJ5U2VsZWN0b3JBbGwoW1xuICAgICAgJ2FbaHJlZl0nLCdidXR0b24nLCdpbnB1dCcsJ3NlbGVjdCcsJ3RleHRhcmVhJyxcbiAgICAgICdbdGFiaW5kZXhdOm5vdChbdGFiaW5kZXg9XCItMVwiXSknXG4gICAgXS5qb2luKCcsJykpO1xuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5mcm9tKGZvY3VzYWJsZXMpLmZpbHRlcihlbCA9PiAhZWwuaGFzQXR0cmlidXRlKCdkaXNhYmxlZCcpICYmICFlbC5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykpO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCl7IGUucHJldmVudERlZmF1bHQoKTsgKGlubmVyIHx8IGxiKS5mb2N1cygpOyByZXR1cm47IH1cbiAgICBjb25zdCBmaXJzdCA9IGxpc3RbMF07XG4gICAgY29uc3QgbGFzdCA9IGxpc3RbbGlzdC5sZW5ndGggLSAxXTtcbiAgICBpZiAoZS5zaGlmdEtleSAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBmaXJzdCl7IGUucHJldmVudERlZmF1bHQoKTsgbGFzdC5mb2N1cygpOyB9XG4gICAgZWxzZSBpZiAoIWUuc2hpZnRLZXkgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gbGFzdCl7IGUucHJldmVudERlZmF1bHQoKTsgZmlyc3QuZm9jdXMoKTsgfVxuICB9XG5cbiAgZnVuY3Rpb24gb3BlbkZyb21TbGlkZShzbGlkZSl7XG4gICAgaWYgKG9wZW5HdWFyZCkgcmV0dXJuO1xuICAgIG9wZW5HdWFyZCA9IHRydWU7XG4gICAgbGFzdEZvY3VzID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA6IG51bGw7XG5cbiAgICBjb25zdCB2aWRlbyA9IHNsaWRlPy5kYXRhc2V0Py52aWRlbyB8fCAnJztcbiAgICBjb25zdCB0aXRsZSA9IHNsaWRlPy5kYXRhc2V0Py50aXRsZSB8fCAnJztcbiAgICBjb25zdCB0ZXh0ICA9IHNsaWRlPy5kYXRhc2V0Py50ZXh0ICB8fCAnJztcblxuICAgIGlmICh2aWRlb0FyZWEpIG1vdW50VmltZW8odmlkZW9BcmVhLCB2aWRlbywgeyBhdXRvcGxheTogMSwgbXV0ZWQ6IDEsIGNvbnRyb2xzOiAwLCBiYWNrZ3JvdW5kOiAxLCBwbGF5c2lubGluZTogMSwgZG50OiAxIH0pO1xuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2RhdGEtb3BlbicsICd0cnVlJyk7XG4gICAgc2V0UGFnZUluZXJ0KHRydWUpO1xuICAgIGxvY2tTY3JvbGwoKTtcblxuICAgIGxiLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAoaW5uZXIgfHwgbGIpLmZvY3VzKCk7XG5cbiAgICBlbWl0KCdMSUdIVEJPWF9PUEVOJywgbGIsIHsgdmlkZW8sIHRpdGxlLCB0ZXh0IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVxdWVzdENsb3NlKCl7XG4gICAgaWYgKCFvcGVuR3VhcmQpIHJldHVybjtcbiAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRScsIGxiKTtcbiAgICBpZiAocHJlZmVyc1JlZHVjZWQpe1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogMCB9KTtcbiAgICAgIGVtaXQoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgbGIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1bmxvY2tTY3JvbGwoeyBkZWxheU1zOiBjbG9zZURlbGF5TXMgfSk7XG4gICAgfVxuICAgIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgIGxiLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1vcGVuJyk7XG4gICAgc2V0UGFnZUluZXJ0KGZhbHNlKTtcbiAgICBpZiAodmlkZW9BcmVhKSB2aWRlb0FyZWEuaW5uZXJIVE1MID0gJyc7XG4gICAgaWYgKGxhc3RGb2N1cyAmJiBkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGxhc3RGb2N1cykpIGxhc3RGb2N1cy5mb2N1cygpO1xuICAgIG9wZW5HdWFyZCA9IGZhbHNlO1xuICB9XG5cbiAgc2xpZGVzLmZvckVhY2goc2xpZGUgPT4gc2xpZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBvcGVuRnJvbVNsaWRlKHNsaWRlKSkpO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgaWYgKGlubmVyICYmICFlLnRhcmdldC5jbG9zZXN0KCcucHJvamVjdC1saWdodGJveF9faW5uZXInKSkgcmVxdWVzdENsb3NlKCk7XG4gICAgZWxzZSBpZiAoIWlubmVyICYmIGUudGFyZ2V0ID09PSBsYikgcmVxdWVzdENsb3NlKCk7XG4gIH0pO1xuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBpZiAobGIuZ2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nKSA9PT0gJ3RydWUnKXtcbiAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHJlcXVlc3RDbG9zZSgpO1xuICAgICAgaWYgKGUua2V5ID09PSAnVGFiJykgdHJhcEZvY3VzKGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgbGIuYWRkRXZlbnRMaXN0ZW5lcignTElHSFRCT1hfQ0xPU0VEX0RPTkUnLCAoKSA9PiB1bmxvY2tTY3JvbGwoKSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgU2xpZGUgUGFnZXIgTW9kdWxlXG4gKiAgUHVycG9zZTogRW5mb3JjZSBwYWdlLWJ5LXBhZ2UgbmF2aWdhdGlvbiBiZXR3ZWVuIGAuc2xpZGVgIHNlY3Rpb25zXG4gKiAgU3RyYXRlZ3k6IEludGVyY2VwdCB3aGVlbC90b3VjaC9rZXlzIGFuZCBhbmltYXRlIHdpbmRvdyBzY3JvbGwgdG8gdGhlXG4gKiAgICAgICAgICAgIG5leHQvcHJldmlvdXMgc2xpZGUgdG9wLiBLZWVwcyBTY3JvbGxUcmlnZ2VyIHRpbWVsaW5lcyBpbnRhY3QuXG4gKiAgRGF0ZTogMjAyNS0xMC0yOVxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG4vKipcbiAqIEluaXRpYWxpemUgZGlzY3JldGUgc2xpZGUgcGFnaW5nLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2VsZWN0b3I9Jy5zbGlkZSddIC0gU2xpZGUgc2VsZWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5kdXJhdGlvbj0wLjVdIC0gU2Nyb2xsIGFuaW1hdGlvbiBkdXJhdGlvbiAocylcbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5lYXNlPSdleHBvLm91dCddIC0gRWFzaW5nIG5hbWUgZm9yIEdTQVBcbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5hbmNob3JSYXRpbz0wLjVdIC0gVmlld3BvcnQgYW5jaG9yIDAuLjEgZm9yIGluZGV4XG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuY29vbGRvd25Ncz00MjBdIC0gTWluIHRpbWUgYmV0d2VlbiBwYWdlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNsaWRlUGFnZXIob3B0aW9ucyA9IHt9KXtcbiAgY29uc3Qge1xuICAgIHNlbGVjdG9yID0gJy5zbGlkZScsXG4gICAgZHVyYXRpb24gPSAwLjUsXG4gICAgZWFzZSA9ICdleHBvLm91dCcsXG4gICAgYW5jaG9yUmF0aW8gPSAwLjUsXG4gICAgY29vbGRvd25NcyA9IDQyMCxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgLy8gUmVzcGVjdCByZWR1Y2VkIG1vdGlvbjogZG8gbm90IG92ZXJyaWRlIG5hdHVyYWwgc2Nyb2xsaW5nXG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAnbWF0Y2hNZWRpYScgaW4gd2luZG93ICYmXG4gICAgd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpJykubWF0Y2hlcztcbiAgaWYgKHByZWZlcnNSZWR1Y2VkKSByZXR1cm47XG5cbiAgY29uc3QgZ3NhcEdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiAod2luZG93LmdzYXAgfHwgd2luZG93LkdTQVApKSB8fCAodHlwZW9mIGdzYXAgIT09ICd1bmRlZmluZWQnID8gZ3NhcCA6IG51bGwpO1xuICBpZiAoIWdzYXBHbG9iYWwpIHJldHVybjtcblxuICBsZXQgc2xpZGVzID0gW107XG4gIGxldCBwb3NpdGlvbnMgPSBbXTtcbiAgbGV0IHR3ZWVuID0gbnVsbDtcbiAgbGV0IGxhc3RKdW1wVHMgPSAwO1xuXG4gIGZ1bmN0aW9uIGNvbGxlY3QoKXtcbiAgICBzbGlkZXMgPSBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKTtcbiAgICBwb3NpdGlvbnMgPSBzbGlkZXMubWFwKHMgPT4gTWF0aC5yb3VuZChzLm9mZnNldFRvcCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q3VycmVudEluZGV4KCl7XG4gICAgY29uc3QgYW5jaG9yID0gd2luZG93LnNjcm9sbFkgKyB3aW5kb3cuaW5uZXJIZWlnaHQgKiAoaXNGaW5pdGUoYW5jaG9yUmF0aW8pID8gYW5jaG9yUmF0aW8gOiAwLjUpO1xuICAgIGxldCBuZWFyZXN0ID0gMDtcbiAgICBsZXQgYmVzdCA9IE1hdGguYWJzKChwb3NpdGlvbnNbMF0gPz8gMCkgLSBhbmNob3IpO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKXtcbiAgICAgIGNvbnN0IGQgPSBNYXRoLmFicyhwb3NpdGlvbnNbaV0gLSBhbmNob3IpO1xuICAgICAgaWYgKGQgPCBiZXN0KXsgYmVzdCA9IGQ7IG5lYXJlc3QgPSBpOyB9XG4gICAgfVxuICAgIHJldHVybiBuZWFyZXN0O1xuICB9XG5cbiAgZnVuY3Rpb24ganVtcFRvSW5kZXgoaW5kZXgpe1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gcG9zaXRpb25zLmxlbmd0aCkgcmV0dXJuO1xuICAgIGNvbnN0IG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0SnVtcFRzIDwgY29vbGRvd25NcykgcmV0dXJuO1xuICAgIGxhc3RKdW1wVHMgPSBub3c7XG5cbiAgICBjb25zdCB0YXJnZXQgPSBwb3NpdGlvbnNbaW5kZXhdO1xuICAgIGlmICh0d2VlbiAmJiB0d2Vlbi5raWxsKSB0d2Vlbi5raWxsKCk7XG5cbiAgICAvLyBQcmVmZXIgR1NBUCBTY3JvbGxUb1BsdWdpbiB3aGVuIGF2YWlsYWJsZSAobW9zdCBwZXJmb3JtYW50KSwgZWxzZSBuYXRpdmUgc21vb3RoXG4gICAgY29uc3QgaGFzU2Nyb2xsVG9QbHVnaW4gPSAhISh3aW5kb3cuU2Nyb2xsVG9QbHVnaW4pO1xuICAgIGlmIChoYXNTY3JvbGxUb1BsdWdpbiAmJiBnc2FwR2xvYmFsLnJlZ2lzdGVyUGx1Z2luKXtcbiAgICAgIHRyeSB7IGdzYXBHbG9iYWwucmVnaXN0ZXJQbHVnaW4od2luZG93LlNjcm9sbFRvUGx1Z2luKTsgfSBjYXRjaChfKSB7fVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgaWYgKGhhc1Njcm9sbFRvUGx1Z2luKSB7XG4gICAgICAgIHR3ZWVuID0gZ3NhcEdsb2JhbC50byh3aW5kb3csIHtcbiAgICAgICAgICBzY3JvbGxUbzogeyB5OiB0YXJnZXQsIGF1dG9LaWxsOiB0cnVlIH0sXG4gICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgZWFzZSxcbiAgICAgICAgICBvdmVyd3JpdGU6ICdhdXRvJyxcbiAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7IHR3ZWVuID0gbnVsbDsgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGNhdGNoKF8pIHsgLyogZmFsbCB0aHJvdWdoIHRvIG5hdGl2ZSAqLyB9XG5cbiAgICAvLyBGYWxsYmFjazogbmF0aXZlIHNtb290aCBzY3JvbGwgKGJyb3dzZXItb3B0aW1pemVkKVxuICAgIHRyeSB7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oeyB0b3A6IHRhcmdldCwgYmVoYXZpb3I6ICdzbW9vdGgnIH0pO1xuICAgICAgLy8gZW11bGF0ZSBhbiBhbmltYXRpb24gbG9jayB3aW5kb3cgZHVyaW5nIG5hdGl2ZSBzbW9vdGhcbiAgICAgIHR3ZWVuID0geyBraWxsKCl7IHR3ZWVuID0gbnVsbDsgfSB9O1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHR3ZWVuID0gbnVsbDsgfSwgTWF0aC5tYXgoMjUwLCBkdXJhdGlvbiAqIDEwMDApKTtcbiAgICB9IGNhdGNoKF8pIHtcbiAgICAgIC8vIExhc3QgcmVzb3J0OiBqdW1wIGluc3RhbnRseVxuICAgICAgd2luZG93LnNjcm9sbFRvKDAsIHRhcmdldCk7XG4gICAgICB0d2VlbiA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25XaGVlbChlKXtcbiAgICBpZiAoIXNsaWRlcy5sZW5ndGgpIHJldHVybjtcbiAgICBpZiAodHdlZW4pIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyByZXR1cm47IH1cbiAgICBjb25zdCBkeSA9IGUuZGVsdGFZIHx8IDA7XG4gICAgaWYgKE1hdGguYWJzKGR5KSA8IDIpIHJldHVybjsgLy8gaWdub3JlIG1pY3JvIG5vaXNlXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGlkeCA9IGdldEN1cnJlbnRJbmRleCgpO1xuICAgIGp1bXBUb0luZGV4KGR5ID4gMCA/IGlkeCArIDEgOiBpZHggLSAxKTtcbiAgfVxuXG4gIC8vIEJhc2ljIHRvdWNoIGhhbmRsaW5nXG4gIGxldCB0b3VjaFN0YXJ0WSA9IDA7XG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKXtcbiAgICBjb25zdCB0ID0gZS50b3VjaGVzICYmIGUudG91Y2hlc1swXTtcbiAgICB0b3VjaFN0YXJ0WSA9IHQgPyB0LmNsaWVudFkgOiAwO1xuICB9XG4gIC8vIFJlbW92ZWQgaGVhdnkgdG91Y2htb3ZlIHByZXZlbnREZWZhdWx0IHRvIGF2b2lkIG1haW4tdGhyZWFkIGphbmtcbiAgZnVuY3Rpb24gb25Ub3VjaEVuZChlKXtcbiAgICBpZiAoIXNsaWRlcy5sZW5ndGgpIHJldHVybjtcbiAgICBjb25zdCB0ID0gZS5jaGFuZ2VkVG91Y2hlcyAmJiBlLmNoYW5nZWRUb3VjaGVzWzBdO1xuICAgIGlmICghdCkgcmV0dXJuO1xuICAgIGNvbnN0IGR5ID0gdG91Y2hTdGFydFkgLSB0LmNsaWVudFk7XG4gICAgaWYgKE1hdGguYWJzKGR5KSA8IDIwKSByZXR1cm47IC8vIHJlcXVpcmUgYW4gaW50ZW50aW9uYWwgc3dpcGVcbiAgICBjb25zdCBpZHggPSBnZXRDdXJyZW50SW5kZXgoKTtcbiAgICBqdW1wVG9JbmRleChkeSA+IDAgPyBpZHggKyAxIDogaWR4IC0gMSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRJZ25vcmVLZXkoKXtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IHRhZyA9IChlbC50YWdOYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHJldHVybiB0YWcgPT09ICdpbnB1dCcgfHwgdGFnID09PSAndGV4dGFyZWEnIHx8IGVsLmlzQ29udGVudEVkaXRhYmxlO1xuICB9XG5cbiAgZnVuY3Rpb24gb25LZXlEb3duKGUpe1xuICAgIGlmIChzaG91bGRJZ25vcmVLZXkoKSkgcmV0dXJuO1xuICAgIGxldCBkaXIgPSAwO1xuICAgIHN3aXRjaCAoZS5jb2RlKXtcbiAgICAgIGNhc2UgJ0Fycm93RG93bic6XG4gICAgICBjYXNlICdQYWdlRG93bic6XG4gICAgICBjYXNlICdTcGFjZSc6XG4gICAgICAgIGRpciA9IDE7IGJyZWFrO1xuICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICBjYXNlICdQYWdlVXAnOlxuICAgICAgICBkaXIgPSAtMTsgYnJlYWs7XG4gICAgICBjYXNlICdIb21lJzpcbiAgICAgICAganVtcFRvSW5kZXgoMCk7IGUucHJldmVudERlZmF1bHQoKTsgcmV0dXJuO1xuICAgICAgY2FzZSAnRW5kJzpcbiAgICAgICAganVtcFRvSW5kZXgoc2xpZGVzLmxlbmd0aCAtIDEpOyBlLnByZXZlbnREZWZhdWx0KCk7IHJldHVybjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGlkeCA9IGdldEN1cnJlbnRJbmRleCgpO1xuICAgIGp1bXBUb0luZGV4KGlkeCArIGRpcik7XG4gIH1cblxuICBmdW5jdGlvbiBhdHRhY2goKXtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBvbldoZWVsLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0LCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gICAgLy8gTm8gdG91Y2htb3ZlIGxpc3RlbmVyIHRvIGtlZXAgc2Nyb2xsaW5nIHBpcGVsaW5lIGZhc3RcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24sIHsgcGFzc2l2ZTogZmFsc2UgfSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgaGFuZGxlUmVzaXplKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRldGFjaCgpe1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd3aGVlbCcsIG9uV2hlZWwpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgICAvLyBubyB0b3VjaG1vdmUgbGlzdGVuZXIgdG8gcmVtb3ZlXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24pO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBoYW5kbGVSZXNpemUpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIGhhbmRsZVJlc2l6ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVSZXNpemUoKXtcbiAgICBjb2xsZWN0KCk7XG4gIH1cblxuICAvLyBpbml0XG4gIGNvbGxlY3QoKTtcbiAgaWYgKHNsaWRlcy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgYXR0YWNoKCk7XG5cbiAgLy8gRXhwb3NlIHRpbnkgZGlzcG9zZXJcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlc3Ryb3lTbGlkZVBhZ2VyKCl7XG4gICAgaWYgKHR3ZWVuICYmIHR3ZWVuLmtpbGwpIHR3ZWVuLmtpbGwoKTtcbiAgICBkZXRhY2goKTtcbiAgfTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBXZWJmbG93IFNjcm9sbFRyaWdnZXIgQnJpZGdlXG4gKiAgUHVycG9zZTogVHJpZ2dlciBXZWJmbG93IElYIGludGVyYWN0aW9ucyB2aWEgR1NBUCBTY3JvbGxUcmlnZ2VyXG4gKiAgRGF0ZTogMjAyNS0xMC0zMFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5jb25zb2xlLmxvZygnW1dGLUlYXSBtb2R1bGUgbG9hZGVkJyk7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVgyIGJyaWRnZS5cbiAqXG4gKiBEZWZhdWx0cyBhcmUgYWxpZ25lZCB0byB0aGUgcHJvdmlkZWQgV2ViZmxvdyBzdHJ1Y3R1cmU6XG4gKiAgLSBzY3JvbGxlcjogYC5wZXJzcGVjdGl2ZS13cmFwcGVyYFxuICogIC0gZHJpdmVyIHNsaWRlOiBgLnNsaWRlLS1zY3JvbGwtZHJpdmVyYCAoaW5zaWRlIGAuc2xpZGVzYClcbiAqICAtIGludGVyYWN0aW9uOiBgbG9nby1zaHJpbmtgIG9uIGxlYXZlIGFuZCBlbnRlci1iYWNrXG4gKlxuICogVGhpcyBzYWZlbHkgbm8tb3BzIHdoZW4gV2ViZmxvdy9HU0FQL1Njcm9sbFRyaWdnZXIgb3IgdGFyZ2V0IGVsZW1lbnRzXG4gKiBhcmUgdW5hdmFpbGFibGUuIFJ1bnMgYWZ0ZXIgd2luZG93ICdsb2FkJyBhbmQgaW5zaWRlIFdlYmZsb3cucHVzaC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnNjcm9sbGVyU2VsZWN0b3I9Jy5wZXJzcGVjdGl2ZS13cmFwcGVyJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5kcml2ZXJTZWxlY3Rvcj0nLnNsaWRlLS1zY3JvbGwtZHJpdmVyJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pbnRlcmFjdGlvbk9uTGVhdmU9J2xvZ28tc2hyaW5rJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5pbnRlcmFjdGlvbk9uRW50ZXJCYWNrPSdsb2dvLXNocmluayddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RhcnQ9J3RvcCB0b3AnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmVuZD0nYm90dG9tIHRvcCddXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm1hcmtlcnM9ZmFsc2VdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IHNjcm9sbGVyU2VsZWN0b3IgPSBvcHRpb25zLnNjcm9sbGVyU2VsZWN0b3IgfHwgJy5wZXJzcGVjdGl2ZS13cmFwcGVyJztcbiAgY29uc3QgZHJpdmVyU2VsZWN0b3IgPSBvcHRpb25zLmRyaXZlclNlbGVjdG9yIHx8ICcuc2xpZGUtLXNjcm9sbC1kcml2ZXInO1xuICAvLyBFdmVudHM6IGluaXQgcGF1c2VzL3NldHMgc3RhcnQgb24gbG9hZDsgcGxheSBmaXJlcyBvbiBmaXJzdCBzY3JvbGw7IHJlc2V0IHBhdXNlcyBvbiBzY3JvbGwgYmFja1xuICBjb25zdCBpbml0RXZlbnROYW1lID0gb3B0aW9ucy5pbml0RXZlbnROYW1lIHx8ICdsb2dvLXN0YXJ0JztcbiAgY29uc3QgcGxheUV2ZW50TmFtZSA9IG9wdGlvbnMucGxheUV2ZW50TmFtZSB8fCAnbG9nby1zaHJpbmsnO1xuICBjb25zdCByZXNldEV2ZW50TmFtZSA9IG9wdGlvbnMucmVzZXRFdmVudE5hbWUgfHwgaW5pdEV2ZW50TmFtZSB8fCAnbG9nby1zdGFydCc7XG4gIGNvbnN0IHN0YXJ0ID0gb3B0aW9ucy5zdGFydCB8fCAndG9wIHRvcCc7XG4gIGNvbnN0IGVuZCA9IG9wdGlvbnMuZW5kIHx8ICdib3R0b20gdG9wJztcbiAgY29uc3QgbWFya2VycyA9ICEhb3B0aW9ucy5tYXJrZXJzO1xuICBjb25zdCBwbGF5VGhyZXNob2xkID0gdHlwZW9mIG9wdGlvbnMucGxheVRocmVzaG9sZCA9PT0gJ251bWJlcicgPyBvcHRpb25zLnBsYXlUaHJlc2hvbGQgOiAwLjAyOyAvLyBmaXJlIGFzIHNvb24gYXMgc2Nyb2xsIHN0YXJ0c1xuXG4gIGZ1bmN0aW9uIG9uV2luZG93TG9hZChjYil7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHsgc2V0VGltZW91dChjYiwgMCk7IHJldHVybjsgfVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgY2IsIHsgb25jZTogdHJ1ZSB9KTtcbiAgfVxuXG4gIG9uV2luZG93TG9hZChmdW5jdGlvbigpe1xuICAgIGNvbnN0IFdlYmZsb3cgPSB3aW5kb3cuV2ViZmxvdyB8fCBbXTtcbiAgICBjb25zdCBnZXRJeCA9ICgpID0+IHtcbiAgICAgIHRyeSB7IHJldHVybiB3aW5kb3cuV2ViZmxvdyAmJiB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlICYmICh3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDMnKSB8fCB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlKCdpeDInKSk7IH1cbiAgICAgIGNhdGNoKF8pIHsgdHJ5IHsgcmV0dXJuIHdpbmRvdy5XZWJmbG93ICYmIHdpbmRvdy5XZWJmbG93LnJlcXVpcmUgJiYgd2luZG93LldlYmZsb3cucmVxdWlyZSgnaXgyJyk7IH0gY2F0Y2goX18pIHsgcmV0dXJuIG51bGw7IH0gfVxuICAgIH07XG5cbiAgICBjb25zdCBtb3VudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHdmSXggPSBnZXRJeCgpO1xuICAgICAgY29uc3QgU2Nyb2xsVHJpZ2dlciA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cuU2Nyb2xsVHJpZ2dlciA6IG51bGw7XG4gICAgICBpZiAoIXdmSXggfHwgIVNjcm9sbFRyaWdnZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIGNvbnN0IHNjcm9sbGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzY3JvbGxlclNlbGVjdG9yKTtcbiAgICAgIGNvbnN0IGRyaXZlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZHJpdmVyU2VsZWN0b3IpO1xuICAgICAgaWYgKCFzY3JvbGxlciB8fCAhZHJpdmVyKSB7IHJldHVybjsgfVxuXG4gICAgICAvLyBFbnN1cmUgdGhlIGFuaW1hdGlvbiBpcyBhdCBpdHMgc3RhcnQgYW5kIHBhdXNlZCBvbiBsb2FkXG4gICAgICB0cnkgeyBpbml0RXZlbnROYW1lICYmIHdmSXguZW1pdChpbml0RXZlbnROYW1lKTsgfSBjYXRjaChfKSB7fVxuXG4gICAgICBsZXQgaGFzUGxheWVkID0gZmFsc2U7XG4gICAgICBsZXQgaGFzUmVzZXQgPSBmYWxzZTtcblxuICAgICAgU2Nyb2xsVHJpZ2dlci5jcmVhdGUoe1xuICAgICAgICB0cmlnZ2VyOiBkcml2ZXIsXG4gICAgICAgIHNjcm9sbGVyOiBzY3JvbGxlcixcbiAgICAgICAgc3RhcnQ6IHN0YXJ0LFxuICAgICAgICBlbmQ6IGVuZCxcbiAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgb25VcGRhdGU6IChzZWxmKSA9PiB7XG4gICAgICAgICAgLy8gUGxheSBhcyBzb29uIGFzIHVzZXIgc3RhcnRzIHNjcm9sbGluZyBkb3duIGZyb20gdGhlIHRvcFxuICAgICAgICAgIGlmICghaGFzUGxheWVkICYmIHNlbGYuZGlyZWN0aW9uID4gMCAmJiBzZWxmLnByb2dyZXNzID4gcGxheVRocmVzaG9sZCkge1xuICAgICAgICAgICAgdHJ5IHsgcGxheUV2ZW50TmFtZSAmJiB3Zkl4LmVtaXQocGxheUV2ZW50TmFtZSk7IH0gY2F0Y2goXykge31cbiAgICAgICAgICAgIGhhc1BsYXllZCA9IHRydWU7XG4gICAgICAgICAgICBoYXNSZXNldCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25FbnRlckJhY2s6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxpbmcgYmFjayBhYm92ZSB0aGUgZHJpdmVyIHNsaWRlIFx1MjE5MiByZXNldCB0byBzdGFydC9wYXVzZWRcbiAgICAgICAgICBpZiAoIWhhc1Jlc2V0KSB7XG4gICAgICAgICAgICB0cnkgeyByZXNldEV2ZW50TmFtZSAmJiB3Zkl4LmVtaXQocmVzZXRFdmVudE5hbWUpOyB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgICBoYXNSZXNldCA9IHRydWU7XG4gICAgICAgICAgICBoYXNQbGF5ZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgdHJ5IHsgV2ViZmxvdy5wdXNoKG1vdW50KTsgfVxuICAgIGNhdGNoKF8pIHsgbW91bnQoKTsgfVxuICB9KTtcbn1cblxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEFwcCBFbnRyeVxuICogIFB1cnBvc2U6IFdpcmUgbW9kdWxlcyBhbmQgZXhwb3NlIG1pbmltYWwgZmFjYWRlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBpbml0QWNjb3JkaW9uIH0gZnJvbSAnLi9tb2R1bGVzL2FjY29yZGlvbi5qcyc7XG5pbXBvcnQgeyBpbml0TGlnaHRib3ggfSBmcm9tICcuL21vZHVsZXMvbGlnaHRib3guanMnO1xuaW1wb3J0IHsgaW5pdFNsaWRlc1NuYXAgfSBmcm9tICcuL21vZHVsZXMvc2xpZGVzLmpzJztcbmltcG9ydCB7IGluaXRTbGlkZVBhZ2VyIH0gZnJvbSAnLi9tb2R1bGVzL3NsaWRlLXBhZ2VyLmpzJztcbmltcG9ydCB7IGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMgfSBmcm9tICcuL21vZHVsZXMvd2ViZmxvdy1zY3JvbGx0cmlnZ2VyLmpzJztcblxuZnVuY3Rpb24gcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKXtcbiAgY29uc3QgdG9rZW5zID0gWydhY2NlbGVyb21ldGVyJywnYXV0b3BsYXknLCdjbGlwYm9hcmQtd3JpdGUnLCdlbmNyeXB0ZWQtbWVkaWEnLCdneXJvc2NvcGUnLCdwaWN0dXJlLWluLXBpY3R1cmUnLCd3ZWItc2hhcmUnXTtcbiAgY29uc3Qgc2VsID0gW1xuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUuY29tXCJdJyxcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dS5iZVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHViZS1ub2Nvb2tpZS5jb21cIl0nLFxuICBdLmpvaW4oJywnKTtcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWwpLmZvckVhY2goKGlmcikgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gKGlmci5nZXRBdHRyaWJ1dGUoJ2FsbG93JykgfHwgJycpLnNwbGl0KCc7JykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICBjb25zdCBtZXJnZWQgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLmV4aXN0aW5nLCAuLi50b2tlbnNdKSkuam9pbignOyAnKTtcbiAgICBpZnIuc2V0QXR0cmlidXRlKCdhbGxvdycsIG1lcmdlZCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0KG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IGxpZ2h0Ym94Um9vdCA9IG9wdGlvbnMubGlnaHRib3hSb290IHx8ICcjcHJvamVjdC1saWdodGJveCc7XG4gIGluaXRBY2NvcmRpb24oJy5hY2NvcmRlb24nKTtcbiAgaW5pdExpZ2h0Ym94KHsgcm9vdDogbGlnaHRib3hSb290LCBjbG9zZURlbGF5TXM6IDEwMDAgfSk7XG4gIC8vIElmIGEgY3VzdG9tIHNjcm9sbGVyIGV4aXN0cyAoZS5nLiwgLnBlcnNwZWN0aXZlLXdyYXBwZXIpLCBhdm9pZCBwYWdpbmcgd2luZG93IHRvIHByZXZlbnQgY29uZmxpY3RzXG4gIHRyeSB7XG4gICAgY29uc3QgY3VzdG9tU2Nyb2xsZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGVyc3BlY3RpdmUtd3JhcHBlcicpO1xuICAgIGNvbnN0IGhhc0N1c3RvbVNjcm9sbCA9ICEhY3VzdG9tU2Nyb2xsZXIgJiYgKGZ1bmN0aW9uKGVsKXtcbiAgICAgIGNvbnN0IGNzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gICAgICBjb25zdCBveSA9IGNzLm92ZXJmbG93WTtcbiAgICAgIHJldHVybiAob3kgPT09ICdhdXRvJyB8fCBveSA9PT0gJ3Njcm9sbCcpICYmIGVsLnNjcm9sbEhlaWdodCA+IGVsLmNsaWVudEhlaWdodDtcbiAgICB9KShjdXN0b21TY3JvbGxlcik7XG4gICAgaWYgKCFoYXNDdXN0b21TY3JvbGwpe1xuICAgICAgLy8gRW5mb3JjZSBwYWdlLWJ5LXBhZ2UgbmF2aWdhdGlvbiBmb3IgYC5zbGlkZWAgc2VjdGlvbnMgd2hlbiB1c2luZyB3aW5kb3cgc2Nyb2xsXG4gICAgICBpbml0U2xpZGVQYWdlcih7IHNlbGVjdG9yOiAnLnNsaWRlJywgZHVyYXRpb246IDAuNSwgZWFzZTogJ2V4cG8ub3V0JywgYW5jaG9yUmF0aW86IDAuNSwgY29vbGRvd25NczogNDIwIH0pO1xuICAgIH1cbiAgfSBjYXRjaChfKSB7fVxuXG4gIC8vIEJyaWRnZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVggdXNpbmcgdGhlIHByb3ZpZGVkIHN0cnVjdHVyZVxuICB0cnkge1xuICAgIGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMoe1xuICAgICAgc2Nyb2xsZXJTZWxlY3RvcjogJy5wZXJzcGVjdGl2ZS13cmFwcGVyJyxcbiAgICAgIGRyaXZlclNlbGVjdG9yOiAnLnNsaWRlLS1zY3JvbGwtZHJpdmVyJyxcbiAgICAgIGluaXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JywgICAgIC8vIHBhdXNlIGF0IHN0YXJ0IG9uIGxvYWRcbiAgICAgIHBsYXlFdmVudE5hbWU6ICdsb2dvLXNocmluaycsICAgIC8vIHBsYXkgYXMgc29vbiBhcyB1c2VyIHN0YXJ0cyBzY3JvbGxpbmcgZG93blxuICAgICAgcmVzZXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JywgICAgLy8gcmVzZXQvcGF1c2Ugd2hlbiBzY3JvbGxpbmcgYmFjayBhYm92ZSB0aGUgZHJpdmVyXG4gICAgICBwbGF5VGhyZXNob2xkOiAwLjAyLFxuICAgIH0pO1xuICB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gT3B0aW9uYWw6IHJldGFpbiBhIHN1YnRsZSBzbmFwIGFzIGEgc2FmZXR5IG5ldCBpZiBwYWdpbmcgaXMgZGlzYWJsZWRcbiAgLy8gRGlzYWJsZWQgaGVyZSB0byBhdm9pZCBkb3VibGUgbW92ZW1lbnRcbiAgLy8gdHJ5IHsgaW5pdFNsaWRlc1NuYXAoeyBzZWxlY3RvcjogJy5zbGlkZScsIGR1cmF0aW9uOiAwLjIyLCBlYXNlOiAncG93ZXI0Lm91dCcsIGFuY2hvclJhdGlvOiAwLjU1LCBkZWxheTogMCwgZGlyZWN0aW9uYWw6IHRydWUgfSk7IH0gY2F0Y2goXykge31cbn1cblxuLy8gRXhwb3NlIGEgdGlueSBnbG9iYWwgZm9yIFdlYmZsb3cvRGVzaWduZXIgaG9va3Ncbi8vIChJbnRlcm5hbHMgcmVtYWluIHByaXZhdGUgaW5zaWRlIHRoZSBJSUZFIGJ1bmRsZSlcbmlmICghd2luZG93LkFwcCkgd2luZG93LkFwcCA9IHt9O1xud2luZG93LkFwcC5pbml0ID0gaW5pdDtcblxuLy8gQXV0by1pbml0IG9uIERPTSByZWFkeSAoc2FmZSBpZiBlbGVtZW50cyBhcmUgbWlzc2luZylcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIHRyeSB7IHBhdGNoWW91VHViZUFsbG93VG9rZW5zKCk7IGluaXQoKTsgfSBjYXRjaCAoZXJyKSB7IGNvbnNvbGUuZXJyb3IoJ1tBcHBdIGluaXQgZXJyb3InLCBlcnIpOyB9XG59KTtcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiOztBQVFPLFdBQVMsS0FBSyxNQUFNLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBRTtBQUN0RCxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsU0FBUyxNQUFNLFlBQVksTUFBTSxPQUFPLENBQUMsQ0FBQztBQUFBLElBQUcsUUFBUTtBQUFBLElBQUM7QUFDekcsUUFBSTtBQUFFLGFBQU8sY0FBYyxJQUFJLFlBQVksTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUFBLEVBQzFFOzs7QUNGQSxVQUFRLElBQUksMkJBQTJCO0FBRWhDLFdBQVMsY0FBYyxVQUFVLGNBQWE7QUFDbkQsVUFBTSxPQUFPLFNBQVMsY0FBYyxPQUFPO0FBQzNDLFFBQUksQ0FBQyxNQUFLO0FBQUUsY0FBUSxJQUFJLDRCQUE0QjtBQUFHO0FBQUEsSUFBUTtBQUUvRCxVQUFNLE9BQU8sUUFBTSxHQUFHLFVBQVUsU0FBUyx3QkFBd0I7QUFDakUsVUFBTSxPQUFPLFFBQU0sR0FBRyxVQUFVLFNBQVMsd0JBQXdCO0FBQ2pFLFVBQU0sVUFBVSxVQUFRLDZCQUFNLGNBQWM7QUFDNUMsVUFBTSxVQUFVLFVBQVEsS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLFFBQVEsa0JBQWtCO0FBRzNFLFNBQUssaUJBQWlCLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxHQUFHLE1BQU07QUFDN0QsUUFBRSxhQUFhLFFBQVEsUUFBUTtBQUMvQixRQUFFLGFBQWEsWUFBWSxHQUFHO0FBQzlCLFlBQU0sT0FBTyxFQUFFLFFBQVEsa0RBQWtEO0FBQ3pFLFlBQU0sSUFBSSxRQUFRLElBQUk7QUFDdEIsVUFBSSxHQUFFO0FBQ0osY0FBTSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDbEMsVUFBRSxLQUFLO0FBQ1AsVUFBRSxhQUFhLGlCQUFpQixHQUFHO0FBQ25DLFVBQUUsYUFBYSxpQkFBaUIsT0FBTztBQUFBLE1BQ3pDO0FBQUEsSUFDRixDQUFDO0FBRUQsYUFBUyxPQUFPLEdBQUU7QUFDaEIsUUFBRSxNQUFNLFlBQVksRUFBRSxlQUFlO0FBQ3JDLFFBQUUsUUFBUSxRQUFRO0FBQ2xCLFlBQU0sUUFBUSxDQUFDLE1BQU07QUFDbkIsWUFBSSxFQUFFLGlCQUFpQixhQUFjO0FBQ3JDLFVBQUUsb0JBQW9CLGlCQUFpQixLQUFLO0FBQzVDLFlBQUksRUFBRSxRQUFRLFVBQVUsV0FBVTtBQUNoQyxZQUFFLE1BQU0sWUFBWTtBQUNwQixZQUFFLFFBQVEsUUFBUTtBQUFBLFFBQ3BCO0FBQUEsTUFDRjtBQUNBLFFBQUUsaUJBQWlCLGlCQUFpQixLQUFLO0FBQUEsSUFDM0M7QUFFQSxhQUFTLFNBQVMsR0FBRTtBQUNsQixZQUFNLElBQUksRUFBRSxNQUFNLGNBQWMsU0FBUyxFQUFFLGVBQWUsV0FBVyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzNGLFFBQUUsTUFBTSxhQUFhLEtBQUssRUFBRSxnQkFBZ0I7QUFDNUMsUUFBRTtBQUNGLFFBQUUsTUFBTSxZQUFZO0FBQ3BCLFFBQUUsUUFBUSxRQUFRO0FBQ2xCLFlBQU0sUUFBUSxDQUFDLE1BQU07QUFDbkIsWUFBSSxFQUFFLGlCQUFpQixhQUFjO0FBQ3JDLFVBQUUsb0JBQW9CLGlCQUFpQixLQUFLO0FBQzVDLFVBQUUsUUFBUSxRQUFRO0FBQUEsTUFDcEI7QUFDQSxRQUFFLGlCQUFpQixpQkFBaUIsS0FBSztBQUFBLElBQzNDO0FBRUEsYUFBUyxjQUFjLE1BQUs7QUFDMUIsWUFBTSxRQUFRLFFBQVEsSUFBSTtBQUFHLFVBQUksQ0FBQyxNQUFPO0FBQ3pDLFlBQU0sT0FBTyxLQUFLLElBQUksSUFBSSwyQkFBMkI7QUFDckQsWUFBTSxLQUFLLE1BQU0sUUFBUSxFQUFFLFFBQVEsU0FBTztBQWpFOUM7QUFrRU0sWUFBSSxRQUFRLFFBQVEsR0FBQyxTQUFJLGNBQUosbUJBQWUsU0FBUyxPQUFPO0FBQ3BELGNBQU0sSUFBSSxRQUFRLEdBQUc7QUFDckIsWUFBSSxNQUFNLEVBQUUsUUFBUSxVQUFVLFVBQVUsRUFBRSxRQUFRLFVBQVUsWUFBVztBQUNyRSxtQkFBUyxDQUFDO0FBQ1YsZ0JBQU0sT0FBTyxJQUFJLGNBQWMscUJBQXFCO0FBQ3BELHVDQUFNLGFBQWEsaUJBQWlCO0FBQ3BDLGVBQUssS0FBSyxJQUFJLElBQUksaUJBQWlCLGdCQUFnQixLQUFLLEVBQUUsUUFBUSxVQUFVLENBQUM7QUFBQSxRQUMvRTtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFFQSxhQUFTLGFBQVk7QUFDbkIsV0FBSyxpQkFBaUIsMENBQTBDLEVBQUUsUUFBUSxPQUFLO0FBOUVuRjtBQStFTSxZQUFJLEVBQUUsUUFBUSxVQUFVLFVBQVUsRUFBRSxRQUFRLFVBQVUsV0FBVTtBQUM5RCxtQkFBUyxDQUFDO0FBQ1YsZ0JBQU0sS0FBSyxFQUFFLFFBQVEseUJBQXlCO0FBQzlDLHlDQUFJLGNBQWMsMkJBQWxCLG1CQUEwQyxhQUFhLGlCQUFpQjtBQUN4RSxlQUFLLGdCQUFnQixJQUFJLEVBQUUsUUFBUSxZQUFZLENBQUM7QUFBQSxRQUNsRDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFFQSxhQUFTLE9BQU8sTUFBSztBQUNuQixZQUFNLElBQUksUUFBUSxJQUFJO0FBQUcsVUFBSSxDQUFDLEVBQUc7QUFDakMsWUFBTSxPQUFPLEtBQUssY0FBYyxxQkFBcUI7QUFDckQsWUFBTSxVQUFVLEVBQUUsRUFBRSxRQUFRLFVBQVUsVUFBVSxFQUFFLFFBQVEsVUFBVTtBQUNwRSxvQkFBYyxJQUFJO0FBQ2xCLFVBQUksV0FBVyxLQUFLLElBQUksRUFBRyxZQUFXO0FBRXRDLFVBQUksU0FBUTtBQUNWLGVBQU8sQ0FBQztBQUFHLHFDQUFNLGFBQWEsaUJBQWlCO0FBQy9DLGFBQUssS0FBSyxJQUFJLElBQUksZ0JBQWdCLGVBQWUsTUFBTSxFQUFFLFNBQVMsS0FBSyxDQUFDO0FBQUEsTUFDMUUsT0FBTztBQUNMLGlCQUFTLENBQUM7QUFBRyxxQ0FBTSxhQUFhLGlCQUFpQjtBQUNqRCxZQUFJLEtBQUssSUFBSSxFQUFHLFlBQVc7QUFDM0IsYUFBSyxLQUFLLElBQUksSUFBSSxpQkFBaUIsZ0JBQWdCLE1BQU0sRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUFBLE1BQzdFO0FBQUEsSUFDRjtBQUVBLGFBQVMsS0FBSyxVQUFVLElBQUksU0FBUztBQUNyQyxTQUFLLGlCQUFpQixrQkFBa0IsRUFBRSxRQUFRLE9BQUs7QUFBRSxRQUFFLE1BQU0sWUFBWTtBQUFPLFFBQUUsUUFBUSxRQUFRO0FBQUEsSUFBYSxDQUFDO0FBQ3BILDBCQUFzQixNQUFNLFNBQVMsS0FBSyxVQUFVLE9BQU8sU0FBUyxDQUFDO0FBRXJFLFNBQUssaUJBQWlCLFNBQVMsT0FBSztBQUNsQyxZQUFNLElBQUksRUFBRSxPQUFPLFFBQVEscUJBQXFCO0FBQUcsVUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLFNBQVMsQ0FBQyxFQUFHO0FBQ2hGLFFBQUUsZUFBZTtBQUNqQixZQUFNLE9BQU8sRUFBRSxRQUFRLGtEQUFrRDtBQUN6RSxjQUFRLE9BQU8sSUFBSTtBQUFBLElBQ3JCLENBQUM7QUFDRCxTQUFLLGlCQUFpQixXQUFXLE9BQUs7QUFDcEMsWUFBTSxJQUFJLEVBQUUsT0FBTyxRQUFRLHFCQUFxQjtBQUFHLFVBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLENBQUMsRUFBRztBQUNoRixVQUFJLEVBQUUsUUFBUSxXQUFXLEVBQUUsUUFBUSxJQUFLO0FBQ3hDLFFBQUUsZUFBZTtBQUNqQixZQUFNLE9BQU8sRUFBRSxRQUFRLGtEQUFrRDtBQUN6RSxjQUFRLE9BQU8sSUFBSTtBQUFBLElBQ3JCLENBQUM7QUFFRCxVQUFNLEtBQUssSUFBSSxlQUFlLGFBQVc7QUFDdkMsY0FBUSxRQUFRLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTTtBQUNqQyxZQUFJLEVBQUUsUUFBUSxVQUFVLFFBQU87QUFBRSxZQUFFLE1BQU0sWUFBWTtBQUFBLFFBQVEsV0FDcEQsRUFBRSxRQUFRLFVBQVUsV0FBVTtBQUFFLFlBQUUsTUFBTSxZQUFZLEVBQUUsZUFBZTtBQUFBLFFBQU07QUFBQSxNQUN0RixDQUFDO0FBQUEsSUFDSCxDQUFDO0FBQ0QsU0FBSyxpQkFBaUIsa0JBQWtCLEVBQUUsUUFBUSxPQUFLLEdBQUcsUUFBUSxDQUFDLENBQUM7QUFBQSxFQUN0RTs7O0FDMUhBLE1BQUksUUFBUTtBQUNaLE1BQUksU0FBUztBQUNiLE1BQUkscUJBQXFCO0FBRWxCLFdBQVMsYUFBWTtBQUMxQixRQUFJLFFBQVM7QUFDYixVQUFNLEtBQUssU0FBUztBQUNwQix5QkFBcUIsR0FBRyxNQUFNO0FBQzlCLE9BQUcsTUFBTSxpQkFBaUI7QUFDMUIsYUFBUyxPQUFPLFdBQVcsR0FBRyxhQUFhO0FBRzNDLFdBQU8sT0FBTyxTQUFTLEtBQUssT0FBTztBQUFBLE1BQ2pDLFVBQVU7QUFBQSxNQUNWLEtBQUssSUFBSSxNQUFNO0FBQUEsTUFDZixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsTUFDUCxPQUFPO0FBQUEsTUFDUCxVQUFVO0FBQUEsTUFDVixvQkFBb0I7QUFBQSxJQUN0QixDQUFDO0FBQ0QsUUFBSTtBQUFFLGVBQVMsS0FBSyxVQUFVLElBQUksWUFBWTtBQUFBLElBQUcsUUFBUTtBQUFBLElBQUM7QUFBQSxFQUM1RDtBQUVPLFdBQVMsYUFBYSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRTtBQUNoRCxVQUFNLE1BQU0sTUFBTTtBQUNoQixVQUFJLEVBQUUsUUFBUSxFQUFHO0FBQ2pCLFlBQU0sS0FBSyxTQUFTO0FBQ3BCLGFBQU8sT0FBTyxTQUFTLEtBQUssT0FBTztBQUFBLFFBQ2pDLFVBQVU7QUFBQSxRQUFJLEtBQUs7QUFBQSxRQUFJLE1BQU07QUFBQSxRQUFJLE9BQU87QUFBQSxRQUFJLE9BQU87QUFBQSxRQUFJLFVBQVU7QUFBQSxRQUFJLG9CQUFvQjtBQUFBLE1BQzNGLENBQUM7QUFDRCxVQUFJO0FBQUUsaUJBQVMsS0FBSyxVQUFVLE9BQU8sWUFBWTtBQUFBLE1BQUcsUUFBUTtBQUFBLE1BQUM7QUFDN0QsU0FBRyxNQUFNLGlCQUFpQixzQkFBc0I7QUFDaEQsYUFBTyxTQUFTLEdBQUcsTUFBTTtBQUFBLElBQzNCO0FBQ0EsY0FBVSxXQUFXLEtBQUssT0FBTyxJQUFJLElBQUk7QUFBQSxFQUMzQzs7O0FDcENBLFVBQVEsSUFBSSx1QkFBdUI7QUFFbkMsV0FBUyxhQUFhLE9BQU07QUFWNUI7QUFXRSxRQUFJLENBQUMsTUFBTyxRQUFPO0FBQ25CLFVBQU0sTUFBTSxPQUFPLEtBQUssRUFBRSxLQUFLO0FBRS9CLFFBQUksUUFBUSxLQUFLLEdBQUcsRUFBRyxRQUFPO0FBRTlCLFFBQUk7QUFDRixZQUFNLElBQUksSUFBSSxJQUFJLEtBQUsscUJBQXFCO0FBQzVDLFlBQU0sT0FBTyxFQUFFLFlBQVk7QUFDM0IsVUFBSSxLQUFLLFNBQVMsV0FBVyxHQUFFO0FBRTdCLGNBQU0sUUFBUSxFQUFFLFNBQVMsTUFBTSxHQUFHLEVBQUUsT0FBTyxPQUFPO0FBQ2xELGNBQU0sT0FBTyxNQUFNLE1BQU0sU0FBUyxDQUFDLEtBQUs7QUFDeEMsY0FBTSxPQUFLLFVBQUssTUFBTSxLQUFLLE1BQWhCLG1CQUFvQixPQUFNO0FBQ3JDLGVBQU8sTUFBTTtBQUFBLE1BQ2Y7QUFBQSxJQUNGLFFBQVE7QUFBQSxJQUFDO0FBQ1QsV0FBTztBQUFBLEVBQ1Q7QUFFTyxXQUFTLFdBQVcsV0FBVyxTQUFTLFNBQVMsQ0FBQyxHQUFFO0FBQ3pELFFBQUksQ0FBQyxVQUFXO0FBQ2hCLFVBQU0sS0FBSyxhQUFhLE9BQU87QUFDL0IsUUFBSSxDQUFDLElBQUc7QUFBRSxnQkFBVSxZQUFZO0FBQUk7QUFBQSxJQUFRO0FBQzVDLFVBQU0sUUFBUSxJQUFJLGdCQUFnQixFQUFFLEtBQUssR0FBRyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFNBQVM7QUFDbEUsVUFBTSxNQUFNLGtDQUFrQyxFQUFFLElBQUksS0FBSztBQUN6RCxVQUFNLFNBQVMsU0FBUyxjQUFjLFFBQVE7QUFDOUMsV0FBTyxNQUFNO0FBQ2IsV0FBTyxRQUFRO0FBQ2YsV0FBTyxhQUFhLGVBQWUsR0FBRztBQUN0QyxXQUFPLE1BQU0sUUFBUTtBQUNyQixXQUFPLE1BQU0sU0FBUztBQUN0QixjQUFVLFlBQVk7QUFDdEIsY0FBVSxZQUFZLE1BQU07QUFBQSxFQUM5Qjs7O0FDakNBLFVBQVEsSUFBSSwwQkFBMEI7QUFFL0IsV0FBUyxhQUFhLEVBQUUsT0FBTyxxQkFBcUIsZUFBZSxJQUFLLElBQUksQ0FBQyxHQUFFO0FBQ3BGLFVBQU0sS0FBSyxTQUFTLGNBQWMsSUFBSTtBQUN0QyxRQUFJLENBQUMsSUFBRztBQUFFLGNBQVEsSUFBSSxzQkFBc0I7QUFBRztBQUFBLElBQVE7QUFHdkQsT0FBRyxhQUFhLFFBQVEsR0FBRyxhQUFhLE1BQU0sS0FBSyxRQUFRO0FBQzNELE9BQUcsYUFBYSxjQUFjLEdBQUcsYUFBYSxZQUFZLEtBQUssTUFBTTtBQUNyRSxPQUFHLGFBQWEsZUFBZSxHQUFHLGFBQWEsYUFBYSxLQUFLLE1BQU07QUFFdkUsVUFBTSxRQUFRLEdBQUcsY0FBYywwQkFBMEI7QUFDekQsVUFBTSxZQUFZLEdBQUcsY0FBYyxhQUFhO0FBQ2hELFVBQU0sU0FBUyxTQUFTLGlCQUFpQixRQUFRO0FBQ2pELFVBQU0saUJBQWlCLFdBQVcsa0NBQWtDLEVBQUU7QUFFdEUsUUFBSSxZQUFZO0FBQ2hCLFFBQUksWUFBWTtBQUVoQixhQUFTLGFBQWEsSUFBRztBQUN2QixZQUFNLFdBQVcsTUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRLEVBQUUsT0FBTyxPQUFLLE1BQU0sRUFBRTtBQUN4RSxlQUFTLFFBQVEsT0FBSztBQUNwQixZQUFJO0FBQ0YsY0FBSSxXQUFXLEVBQUcsR0FBRSxRQUFRLENBQUMsQ0FBQztBQUFBLFFBQ2hDLFFBQVE7QUFBQSxRQUFDO0FBQ1QsWUFBSSxHQUFJLEdBQUUsYUFBYSxlQUFlLE1BQU07QUFBQSxZQUN2QyxHQUFFLGdCQUFnQixhQUFhO0FBQUEsTUFDdEMsQ0FBQztBQUFBLElBQ0g7QUFFQSxhQUFTLFVBQVUsR0FBRTtBQUNuQixVQUFJLEVBQUUsUUFBUSxNQUFPO0FBQ3JCLFlBQU0sYUFBYSxHQUFHLGlCQUFpQjtBQUFBLFFBQ3JDO0FBQUEsUUFBVTtBQUFBLFFBQVM7QUFBQSxRQUFRO0FBQUEsUUFBUztBQUFBLFFBQ3BDO0FBQUEsTUFDRixFQUFFLEtBQUssR0FBRyxDQUFDO0FBQ1gsWUFBTSxPQUFPLE1BQU0sS0FBSyxVQUFVLEVBQUUsT0FBTyxRQUFNLENBQUMsR0FBRyxhQUFhLFVBQVUsS0FBSyxDQUFDLEdBQUcsYUFBYSxhQUFhLENBQUM7QUFDaEgsVUFBSSxLQUFLLFdBQVcsR0FBRTtBQUFFLFVBQUUsZUFBZTtBQUFHLFNBQUMsU0FBUyxJQUFJLE1BQU07QUFBRztBQUFBLE1BQVE7QUFDM0UsWUFBTSxRQUFRLEtBQUssQ0FBQztBQUNwQixZQUFNLE9BQU8sS0FBSyxLQUFLLFNBQVMsQ0FBQztBQUNqQyxVQUFJLEVBQUUsWUFBWSxTQUFTLGtCQUFrQixPQUFNO0FBQUUsVUFBRSxlQUFlO0FBQUcsYUFBSyxNQUFNO0FBQUEsTUFBRyxXQUM5RSxDQUFDLEVBQUUsWUFBWSxTQUFTLGtCQUFrQixNQUFLO0FBQUUsVUFBRSxlQUFlO0FBQUcsY0FBTSxNQUFNO0FBQUEsTUFBRztBQUFBLElBQy9GO0FBRUEsYUFBUyxjQUFjLE9BQU07QUF2RC9CO0FBd0RJLFVBQUksVUFBVztBQUNmLGtCQUFZO0FBQ1osa0JBQVksU0FBUyx5QkFBeUIsY0FBYyxTQUFTLGdCQUFnQjtBQUVyRixZQUFNLFVBQVEsb0NBQU8sWUFBUCxtQkFBZ0IsVUFBUztBQUN2QyxZQUFNLFVBQVEsb0NBQU8sWUFBUCxtQkFBZ0IsVUFBUztBQUN2QyxZQUFNLFNBQVEsb0NBQU8sWUFBUCxtQkFBZ0IsU0FBUztBQUV2QyxVQUFJLFVBQVcsWUFBVyxXQUFXLE9BQU8sRUFBRSxVQUFVLEdBQUcsT0FBTyxHQUFHLFVBQVUsR0FBRyxZQUFZLEdBQUcsYUFBYSxHQUFHLEtBQUssRUFBRSxDQUFDO0FBQ3pILFNBQUcsYUFBYSxlQUFlLE9BQU87QUFDdEMsU0FBRyxhQUFhLGFBQWEsTUFBTTtBQUNuQyxtQkFBYSxJQUFJO0FBQ2pCLGlCQUFXO0FBRVgsU0FBRyxhQUFhLFlBQVksSUFBSTtBQUNoQyxPQUFDLFNBQVMsSUFBSSxNQUFNO0FBRXBCLFdBQUssaUJBQWlCLElBQUksRUFBRSxPQUFPLE9BQU8sS0FBSyxDQUFDO0FBQUEsSUFDbEQ7QUFFQSxhQUFTLGVBQWM7QUFDckIsVUFBSSxDQUFDLFVBQVc7QUFDaEIsV0FBSyxrQkFBa0IsRUFBRTtBQUN6QixVQUFJLGdCQUFlO0FBQ2pCLHFCQUFhLEVBQUUsU0FBUyxFQUFFLENBQUM7QUFDM0IsYUFBSyx3QkFBd0IsRUFBRTtBQUFBLE1BQ2pDLE9BQU87QUFDTCxxQkFBYSxFQUFFLFNBQVMsYUFBYSxDQUFDO0FBQUEsTUFDeEM7QUFDQSxTQUFHLGFBQWEsZUFBZSxNQUFNO0FBQ3JDLFNBQUcsZ0JBQWdCLFdBQVc7QUFDOUIsbUJBQWEsS0FBSztBQUNsQixVQUFJLFVBQVcsV0FBVSxZQUFZO0FBQ3JDLFVBQUksYUFBYSxTQUFTLEtBQUssU0FBUyxTQUFTLEVBQUcsV0FBVSxNQUFNO0FBQ3BFLGtCQUFZO0FBQUEsSUFDZDtBQUVBLFdBQU8sUUFBUSxXQUFTLE1BQU0saUJBQWlCLFNBQVMsTUFBTSxjQUFjLEtBQUssQ0FBQyxDQUFDO0FBRW5GLE9BQUcsaUJBQWlCLFNBQVMsT0FBSztBQUNoQyxVQUFJLFNBQVMsQ0FBQyxFQUFFLE9BQU8sUUFBUSwwQkFBMEIsRUFBRyxjQUFhO0FBQUEsZUFDaEUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxHQUFJLGNBQWE7QUFBQSxJQUNuRCxDQUFDO0FBRUQsYUFBUyxpQkFBaUIsV0FBVyxPQUFLO0FBQ3hDLFVBQUksR0FBRyxhQUFhLFdBQVcsTUFBTSxRQUFPO0FBQzFDLFlBQUksRUFBRSxRQUFRLFNBQVUsY0FBYTtBQUNyQyxZQUFJLEVBQUUsUUFBUSxNQUFPLFdBQVUsQ0FBQztBQUFBLE1BQ2xDO0FBQUEsSUFDRixDQUFDO0FBRUQsT0FBRyxpQkFBaUIsd0JBQXdCLE1BQU0sYUFBYSxDQUFDO0FBQUEsRUFDbEU7OztBQ3hGTyxXQUFTLGVBQWUsVUFBVSxDQUFDLEdBQUU7QUFDMUMsVUFBTTtBQUFBLE1BQ0osV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsY0FBYztBQUFBLE1BQ2QsYUFBYTtBQUFBLElBQ2YsSUFBSTtBQUdKLFVBQU0saUJBQWlCLE9BQU8sV0FBVyxlQUN2QyxnQkFBZ0IsVUFDaEIsT0FBTyxXQUFXLGtDQUFrQyxFQUFFO0FBQ3hELFFBQUksZUFBZ0I7QUFFcEIsVUFBTSxhQUFjLE9BQU8sV0FBVyxnQkFBZ0IsT0FBTyxRQUFRLE9BQU8sVUFBVyxPQUFPLFNBQVMsY0FBYyxPQUFPO0FBQzVILFFBQUksQ0FBQyxXQUFZO0FBRWpCLFFBQUksU0FBUyxDQUFDO0FBQ2QsUUFBSSxZQUFZLENBQUM7QUFDakIsUUFBSSxRQUFRO0FBQ1osUUFBSSxhQUFhO0FBRWpCLGFBQVMsVUFBUztBQUNoQixlQUFTLE1BQU0sS0FBSyxTQUFTLGlCQUFpQixRQUFRLENBQUM7QUFDdkQsa0JBQVksT0FBTyxJQUFJLE9BQUssS0FBSyxNQUFNLEVBQUUsU0FBUyxDQUFDO0FBQUEsSUFDckQ7QUFFQSxhQUFTLGtCQUFpQjtBQWhENUI7QUFpREksWUFBTSxTQUFTLE9BQU8sVUFBVSxPQUFPLGVBQWUsU0FBUyxXQUFXLElBQUksY0FBYztBQUM1RixVQUFJLFVBQVU7QUFDZCxVQUFJLE9BQU8sS0FBSyxNQUFLLGVBQVUsQ0FBQyxNQUFYLFlBQWdCLEtBQUssTUFBTTtBQUNoRCxlQUFTLElBQUksR0FBRyxJQUFJLFVBQVUsUUFBUSxLQUFJO0FBQ3hDLGNBQU0sSUFBSSxLQUFLLElBQUksVUFBVSxDQUFDLElBQUksTUFBTTtBQUN4QyxZQUFJLElBQUksTUFBSztBQUFFLGlCQUFPO0FBQUcsb0JBQVU7QUFBQSxRQUFHO0FBQUEsTUFDeEM7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUVBLGFBQVMsWUFBWSxPQUFNO0FBQ3pCLFVBQUksUUFBUSxLQUFLLFNBQVMsVUFBVSxPQUFRO0FBQzVDLFlBQU0sTUFBTSxZQUFZLElBQUk7QUFDNUIsVUFBSSxNQUFNLGFBQWEsV0FBWTtBQUNuQyxtQkFBYTtBQUViLFlBQU0sU0FBUyxVQUFVLEtBQUs7QUFDOUIsVUFBSSxTQUFTLE1BQU0sS0FBTSxPQUFNLEtBQUs7QUFHcEMsWUFBTSxvQkFBb0IsQ0FBQyxDQUFFLE9BQU87QUFDcEMsVUFBSSxxQkFBcUIsV0FBVyxnQkFBZTtBQUNqRCxZQUFJO0FBQUUscUJBQVcsZUFBZSxPQUFPLGNBQWM7QUFBQSxRQUFHLFNBQVEsR0FBRztBQUFBLFFBQUM7QUFBQSxNQUN0RTtBQUNBLFVBQUk7QUFDRixZQUFJLG1CQUFtQjtBQUNyQixrQkFBUSxXQUFXLEdBQUcsUUFBUTtBQUFBLFlBQzVCLFVBQVUsRUFBRSxHQUFHLFFBQVEsVUFBVSxLQUFLO0FBQUEsWUFDdEM7QUFBQSxZQUNBO0FBQUEsWUFDQSxXQUFXO0FBQUEsWUFDWCxZQUFZLE1BQU07QUFBRSxzQkFBUTtBQUFBLFlBQU07QUFBQSxVQUNwQyxDQUFDO0FBQ0Q7QUFBQSxRQUNGO0FBQUEsTUFDRixTQUFRLEdBQUc7QUFBQSxNQUErQjtBQUcxQyxVQUFJO0FBQ0YsZUFBTyxTQUFTLEVBQUUsS0FBSyxRQUFRLFVBQVUsU0FBUyxDQUFDO0FBRW5ELGdCQUFRLEVBQUUsT0FBTTtBQUFFLGtCQUFRO0FBQUEsUUFBTSxFQUFFO0FBQ2xDLG1CQUFXLE1BQU07QUFBRSxrQkFBUTtBQUFBLFFBQU0sR0FBRyxLQUFLLElBQUksS0FBSyxXQUFXLEdBQUksQ0FBQztBQUFBLE1BQ3BFLFNBQVEsR0FBRztBQUVULGVBQU8sU0FBUyxHQUFHLE1BQU07QUFDekIsZ0JBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUVBLGFBQVMsUUFBUSxHQUFFO0FBQ2pCLFVBQUksQ0FBQyxPQUFPLE9BQVE7QUFDcEIsVUFBSSxPQUFPO0FBQUUsVUFBRSxlQUFlO0FBQUc7QUFBQSxNQUFRO0FBQ3pDLFlBQU0sS0FBSyxFQUFFLFVBQVU7QUFDdkIsVUFBSSxLQUFLLElBQUksRUFBRSxJQUFJLEVBQUc7QUFDdEIsUUFBRSxlQUFlO0FBQ2pCLFlBQU0sTUFBTSxnQkFBZ0I7QUFDNUIsa0JBQVksS0FBSyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUM7QUFBQSxJQUN4QztBQUdBLFFBQUksY0FBYztBQUNsQixhQUFTLGFBQWEsR0FBRTtBQUN0QixZQUFNLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDO0FBQ2xDLG9CQUFjLElBQUksRUFBRSxVQUFVO0FBQUEsSUFDaEM7QUFFQSxhQUFTLFdBQVcsR0FBRTtBQUNwQixVQUFJLENBQUMsT0FBTyxPQUFRO0FBQ3BCLFlBQU0sSUFBSSxFQUFFLGtCQUFrQixFQUFFLGVBQWUsQ0FBQztBQUNoRCxVQUFJLENBQUMsRUFBRztBQUNSLFlBQU0sS0FBSyxjQUFjLEVBQUU7QUFDM0IsVUFBSSxLQUFLLElBQUksRUFBRSxJQUFJLEdBQUk7QUFDdkIsWUFBTSxNQUFNLGdCQUFnQjtBQUM1QixrQkFBWSxLQUFLLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQztBQUFBLElBQ3hDO0FBRUEsYUFBUyxrQkFBaUI7QUFDeEIsWUFBTSxLQUFLLFNBQVM7QUFDcEIsVUFBSSxDQUFDLEdBQUksUUFBTztBQUNoQixZQUFNLE9BQU8sR0FBRyxXQUFXLElBQUksWUFBWTtBQUMzQyxhQUFPLFFBQVEsV0FBVyxRQUFRLGNBQWMsR0FBRztBQUFBLElBQ3JEO0FBRUEsYUFBUyxVQUFVLEdBQUU7QUFDbkIsVUFBSSxnQkFBZ0IsRUFBRztBQUN2QixVQUFJLE1BQU07QUFDVixjQUFRLEVBQUUsTUFBSztBQUFBLFFBQ2IsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUNILGdCQUFNO0FBQUc7QUFBQSxRQUNYLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFDSCxnQkFBTTtBQUFJO0FBQUEsUUFDWixLQUFLO0FBQ0gsc0JBQVksQ0FBQztBQUFHLFlBQUUsZUFBZTtBQUFHO0FBQUEsUUFDdEMsS0FBSztBQUNILHNCQUFZLE9BQU8sU0FBUyxDQUFDO0FBQUcsWUFBRSxlQUFlO0FBQUc7QUFBQSxRQUN0RDtBQUNFO0FBQUEsTUFDSjtBQUNBLFFBQUUsZUFBZTtBQUNqQixZQUFNLE1BQU0sZ0JBQWdCO0FBQzVCLGtCQUFZLE1BQU0sR0FBRztBQUFBLElBQ3ZCO0FBRUEsYUFBUyxTQUFRO0FBQ2YsYUFBTyxpQkFBaUIsU0FBUyxTQUFTLEVBQUUsU0FBUyxNQUFNLENBQUM7QUFDNUQsYUFBTyxpQkFBaUIsY0FBYyxjQUFjLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFFckUsYUFBTyxpQkFBaUIsWUFBWSxZQUFZLEVBQUUsU0FBUyxLQUFLLENBQUM7QUFDakUsYUFBTyxpQkFBaUIsV0FBVyxXQUFXLEVBQUUsU0FBUyxNQUFNLENBQUM7QUFDaEUsYUFBTyxpQkFBaUIsVUFBVSxZQUFZO0FBQzlDLGFBQU8saUJBQWlCLHFCQUFxQixZQUFZO0FBQUEsSUFDM0Q7QUFFQSxhQUFTLFNBQVE7QUFDZixhQUFPLG9CQUFvQixTQUFTLE9BQU87QUFDM0MsYUFBTyxvQkFBb0IsY0FBYyxZQUFZO0FBRXJELGFBQU8sb0JBQW9CLFlBQVksVUFBVTtBQUNqRCxhQUFPLG9CQUFvQixXQUFXLFNBQVM7QUFDL0MsYUFBTyxvQkFBb0IsVUFBVSxZQUFZO0FBQ2pELGFBQU8sb0JBQW9CLHFCQUFxQixZQUFZO0FBQUEsSUFDOUQ7QUFFQSxhQUFTLGVBQWM7QUFDckIsY0FBUTtBQUFBLElBQ1Y7QUFHQSxZQUFRO0FBQ1IsUUFBSSxPQUFPLFdBQVcsRUFBRztBQUN6QixXQUFPO0FBR1AsV0FBTyxTQUFTLG9CQUFtQjtBQUNqQyxVQUFJLFNBQVMsTUFBTSxLQUFNLE9BQU0sS0FBSztBQUNwQyxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7OztBQ3RMQSxVQUFRLElBQUksdUJBQXVCO0FBc0I1QixXQUFTLDBCQUEwQixVQUFVLENBQUMsR0FBRTtBQUNyRCxVQUFNLG1CQUFtQixRQUFRLG9CQUFvQjtBQUNyRCxVQUFNLGlCQUFpQixRQUFRLGtCQUFrQjtBQUVqRCxVQUFNLGdCQUFnQixRQUFRLGlCQUFpQjtBQUMvQyxVQUFNLGdCQUFnQixRQUFRLGlCQUFpQjtBQUMvQyxVQUFNLGlCQUFpQixRQUFRLGtCQUFrQixpQkFBaUI7QUFDbEUsVUFBTSxRQUFRLFFBQVEsU0FBUztBQUMvQixVQUFNLE1BQU0sUUFBUSxPQUFPO0FBQzNCLFVBQU0sVUFBVSxDQUFDLENBQUMsUUFBUTtBQUMxQixVQUFNLGdCQUFnQixPQUFPLFFBQVEsa0JBQWtCLFdBQVcsUUFBUSxnQkFBZ0I7QUFFMUYsYUFBUyxhQUFhLElBQUc7QUFDdkIsVUFBSSxTQUFTLGVBQWUsWUFBWTtBQUFFLG1CQUFXLElBQUksQ0FBQztBQUFHO0FBQUEsTUFBUTtBQUNyRSxhQUFPLGlCQUFpQixRQUFRLElBQUksRUFBRSxNQUFNLEtBQUssQ0FBQztBQUFBLElBQ3BEO0FBRUEsaUJBQWEsV0FBVTtBQUNyQixZQUFNLFVBQVUsT0FBTyxXQUFXLENBQUM7QUFDbkMsWUFBTSxRQUFRLE1BQU07QUFDbEIsWUFBSTtBQUFFLGlCQUFPLE9BQU8sV0FBVyxPQUFPLFFBQVEsWUFBWSxPQUFPLFFBQVEsUUFBUSxLQUFLLEtBQUssT0FBTyxRQUFRLFFBQVEsS0FBSztBQUFBLFFBQUksU0FDckgsR0FBRztBQUFFLGNBQUk7QUFBRSxtQkFBTyxPQUFPLFdBQVcsT0FBTyxRQUFRLFdBQVcsT0FBTyxRQUFRLFFBQVEsS0FBSztBQUFBLFVBQUcsU0FBUSxJQUFJO0FBQUUsbUJBQU87QUFBQSxVQUFNO0FBQUEsUUFBRTtBQUFBLE1BQ2xJO0FBRUEsWUFBTSxRQUFRLE1BQU07QUFDbEIsY0FBTSxPQUFPLE1BQU07QUFDbkIsY0FBTSxnQkFBaUIsT0FBTyxXQUFXLGNBQWUsT0FBTyxnQkFBZ0I7QUFDL0UsWUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlO0FBQUU7QUFBQSxRQUFRO0FBRXZDLGNBQU0sV0FBVyxTQUFTLGNBQWMsZ0JBQWdCO0FBQ3hELGNBQU0sU0FBUyxTQUFTLGNBQWMsY0FBYztBQUNwRCxZQUFJLENBQUMsWUFBWSxDQUFDLFFBQVE7QUFBRTtBQUFBLFFBQVE7QUFHcEMsWUFBSTtBQUFFLDJCQUFpQixLQUFLLEtBQUssYUFBYTtBQUFBLFFBQUcsU0FBUSxHQUFHO0FBQUEsUUFBQztBQUU3RCxZQUFJLFlBQVk7QUFDaEIsWUFBSSxXQUFXO0FBRWYsc0JBQWMsT0FBTztBQUFBLFVBQ25CLFNBQVM7QUFBQSxVQUNUO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQSxVQUFVLENBQUMsU0FBUztBQUVsQixnQkFBSSxDQUFDLGFBQWEsS0FBSyxZQUFZLEtBQUssS0FBSyxXQUFXLGVBQWU7QUFDckUsa0JBQUk7QUFBRSxpQ0FBaUIsS0FBSyxLQUFLLGFBQWE7QUFBQSxjQUFHLFNBQVEsR0FBRztBQUFBLGNBQUM7QUFDN0QsMEJBQVk7QUFDWix5QkFBVztBQUFBLFlBQ2I7QUFBQSxVQUNGO0FBQUEsVUFDQSxhQUFhLE1BQU07QUFFakIsZ0JBQUksQ0FBQyxVQUFVO0FBQ2Isa0JBQUk7QUFBRSxrQ0FBa0IsS0FBSyxLQUFLLGNBQWM7QUFBQSxjQUFHLFNBQVEsR0FBRztBQUFBLGNBQUM7QUFDL0QseUJBQVc7QUFDWCwwQkFBWTtBQUFBLFlBQ2Q7QUFBQSxVQUNGO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUVBLFVBQUk7QUFBRSxnQkFBUSxLQUFLLEtBQUs7QUFBQSxNQUFHLFNBQ3JCLEdBQUc7QUFBRSxjQUFNO0FBQUEsTUFBRztBQUFBLElBQ3RCLENBQUM7QUFBQSxFQUNIOzs7QUNuRkEsV0FBUywwQkFBeUI7QUFDaEMsVUFBTSxTQUFTLENBQUMsaUJBQWdCLFlBQVcsbUJBQWtCLG1CQUFrQixhQUFZLHNCQUFxQixXQUFXO0FBQzNILFVBQU0sTUFBTTtBQUFBLE1BQ1Y7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFBRSxLQUFLLEdBQUc7QUFDVixhQUFTLGlCQUFpQixHQUFHLEVBQUUsUUFBUSxDQUFDLFFBQVE7QUFDOUMsWUFBTSxZQUFZLElBQUksYUFBYSxPQUFPLEtBQUssSUFBSSxNQUFNLEdBQUcsRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU87QUFDL0YsWUFBTSxTQUFTLE1BQU0sS0FBSyxvQkFBSSxJQUFJLENBQUMsR0FBRyxVQUFVLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUk7QUFDdEUsVUFBSSxhQUFhLFNBQVMsTUFBTTtBQUFBLElBQ2xDLENBQUM7QUFBQSxFQUNIO0FBRUEsV0FBUyxLQUFLLFVBQVUsQ0FBQyxHQUFFO0FBQ3pCLFVBQU0sZUFBZSxRQUFRLGdCQUFnQjtBQUM3QyxrQkFBYyxZQUFZO0FBQzFCLGlCQUFhLEVBQUUsTUFBTSxjQUFjLGNBQWMsSUFBSyxDQUFDO0FBRXZELFFBQUk7QUFDRixZQUFNLGlCQUFpQixTQUFTLGNBQWMsc0JBQXNCO0FBQ3BFLFlBQU0sa0JBQWtCLENBQUMsQ0FBQyxtQkFBbUIsU0FBUyxJQUFHO0FBQ3ZELGNBQU0sS0FBSyxpQkFBaUIsRUFBRTtBQUM5QixjQUFNLEtBQUssR0FBRztBQUNkLGdCQUFRLE9BQU8sVUFBVSxPQUFPLGFBQWEsR0FBRyxlQUFlLEdBQUc7QUFBQSxNQUNwRSxHQUFHLGNBQWM7QUFDakIsVUFBSSxDQUFDLGlCQUFnQjtBQUVuQix1QkFBZSxFQUFFLFVBQVUsVUFBVSxVQUFVLEtBQUssTUFBTSxZQUFZLGFBQWEsS0FBSyxZQUFZLElBQUksQ0FBQztBQUFBLE1BQzNHO0FBQUEsSUFDRixTQUFRLEdBQUc7QUFBQSxJQUFDO0FBR1osUUFBSTtBQUNGLGdDQUEwQjtBQUFBLFFBQ3hCLGtCQUFrQjtBQUFBLFFBQ2xCLGdCQUFnQjtBQUFBLFFBQ2hCLGVBQWU7QUFBQTtBQUFBLFFBQ2YsZUFBZTtBQUFBO0FBQUEsUUFDZixnQkFBZ0I7QUFBQTtBQUFBLFFBQ2hCLGVBQWU7QUFBQSxNQUNqQixDQUFDO0FBQUEsSUFDSCxTQUFRLEdBQUc7QUFBQSxJQUFDO0FBQUEsRUFLZDtBQUlBLE1BQUksQ0FBQyxPQUFPLElBQUssUUFBTyxNQUFNLENBQUM7QUFDL0IsU0FBTyxJQUFJLE9BQU87QUFHbEIsV0FBUyxpQkFBaUIsb0JBQW9CLE1BQU07QUFDbEQsUUFBSTtBQUFFLDhCQUF3QjtBQUFHLFdBQUs7QUFBQSxJQUFHLFNBQVMsS0FBSztBQUFFLGNBQVEsTUFBTSxvQkFBb0IsR0FBRztBQUFBLElBQUc7QUFBQSxFQUNuRyxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
