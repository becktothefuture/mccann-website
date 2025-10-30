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
    const driverSelector = options.driverSelector || ".slides .slide, .slide";
    const initEventName = options.initEventName || "logo-start";
    const playEventName = options.playEventName || "logo-shrink";
    const resetEventName = options.resetEventName || initEventName || "logo-start";
    const growEventName = options.growEventName || options.reverseEventName || "logo-grow";
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
        let driver = document.querySelector(driverSelector) || document.querySelector(".slide") || document.querySelector(".parallax-group:first-child");
        if (!scroller || !driver) {
          return;
        }
        try {
          if (initEventName) {
            console.log("[WEBFLOW] emit init:", initEventName);
            wfIx.emit(initEventName);
          }
        } catch (_) {
        }
        let fired = false;
        let growArmed = false;
        const st = ScrollTrigger.create({
          trigger: driver,
          scroller,
          start: "top top",
          end: "top -10%",
          markers,
          onLeave: () => {
            if (!fired) {
              try {
                if (playEventName) {
                  console.log("[WEBFLOW] emit play/onLeave:", playEventName);
                  wfIx.emit(playEventName);
                }
              } catch (_) {
              }
              fired = true;
              growArmed = true;
            }
          },
          onEnterBack: () => {
            if (!growArmed) return;
            fired = false;
            try {
              if (growEventName) {
                console.log("[WEBFLOW] emit grow/onEnterBack:", growEventName);
                wfIx.emit(growEventName);
              }
            } catch (_) {
            }
            growArmed = false;
          }
        });
        try {
          console.log("[WEBFLOW] ScrollTrigger created", { trigger: driver, driverSelector, scroller, start: "top top", end: "top -10%" });
        } catch (_) {
        }
        ScrollTrigger.create({
          scroller,
          start: 0,
          end: () => ScrollTrigger.maxScroll(scroller),
          onUpdate: (s) => {
            if (growArmed && s.direction < 0) {
              try {
                if (growEventName) {
                  console.log("[WEBFLOW] emit grow/onUpdate:", growEventName);
                  wfIx.emit(growEventName);
                }
              } catch (_) {
              }
              growArmed = false;
              fired = false;
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
      initWebflowScrollTriggers({
        scrollerSelector: ".perspective-wrapper",
        // driverSelector defaults to first .slide; override not needed
        initEventName: "logo-start",
        // pause at start on load
        playEventName: "logo-shrink",
        // play as soon as user starts scrolling down
        resetEventName: "logo-start",
        // optional restart state
        growEventName: "logo-grow"
        // play forward grow on scroll up
        // threshold not used in minimal version
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvYXBwLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEV2ZW50cyBVdGlsaXR5XG4gKiAgUHVycG9zZTogRW1pdCBidWJibGluZyBDdXN0b21FdmVudHMgY29tcGF0aWJsZSB3aXRoIEdTQVAtVUkgKHdpbmRvdyBzY29wZSlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0KG5hbWUsIHRhcmdldCA9IHdpbmRvdywgZGV0YWlsID0ge30pe1xuICB0cnkgeyB0YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG4gIHRyeSB7IHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCB7IGRldGFpbCB9KSk7IH0gY2F0Y2gge31cbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBY2NvcmRpb24gTW9kdWxlXG4gKiAgUHVycG9zZTogQVJJQSwgc21vb3RoIHRyYW5zaXRpb25zLCBSTyBpbWFnZSBzYWZldHlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGVtaXQgfSBmcm9tICcuLi9jb3JlL2V2ZW50cy5qcyc7XG5jb25zb2xlLmxvZygnW0FDQ09SRElPTl0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFjY29yZGlvbihyb290U2VsID0gJy5hY2NvcmRlb24nKXtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbCk7XG4gIGlmICghcm9vdCl7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSByb290IG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICBjb25zdCBpc0wxID0gZWwgPT4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyk7XG4gIGNvbnN0IGlzTDIgPSBlbCA9PiBlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgY29uc3QgcGFuZWxPZiA9IGl0ZW0gPT4gaXRlbT8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjY29yZGVvbl9fbGlzdCcpO1xuICBjb25zdCBncm91cE9mID0gaXRlbSA9PiBpc0wxKGl0ZW0pID8gcm9vdCA6IGl0ZW0uY2xvc2VzdCgnLmFjY29yZGVvbl9fbGlzdCcpO1xuXG4gIC8vIEFSSUEgYm9vdHN0cmFwXG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICB0LnNldEF0dHJpYnV0ZSgncm9sZScsICdidXR0b24nKTtcbiAgICB0LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2NvcmRlb24taXRlbS0tbGV2ZWwxLCAuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMicpO1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pO1xuICAgIGlmIChwKXtcbiAgICAgIGNvbnN0IHBpZCA9IHAuaWQgfHwgYGFjYy1wYW5lbC0ke2l9YDtcbiAgICAgIHAuaWQgPSBwaWQ7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHBpZCk7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gZXhwYW5kKHApe1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gcC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXtcbiAgICAgICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuJztcbiAgICAgIH1cbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKHApe1xuICAgIGNvbnN0IGggPSBwLnN0eWxlLm1heEhlaWdodCA9PT0gJ25vbmUnID8gcC5zY3JvbGxIZWlnaHQgOiBwYXJzZUZsb2F0KHAuc3R5bGUubWF4SGVpZ2h0IHx8IDApO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gKGggfHwgcC5zY3JvbGxIZWlnaHQpICsgJ3B4JztcbiAgICBwLm9mZnNldEhlaWdodDsgLy8gcmVmbG93XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY2xvc2luZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnO1xuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VTaWJsaW5ncyhpdGVtKXtcbiAgICBjb25zdCBncm91cCA9IGdyb3VwT2YoaXRlbSk7IGlmICghZ3JvdXApIHJldHVybjtcbiAgICBjb25zdCB3YW50ID0gaXNMMShpdGVtKSA/ICdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyA6ICdhY2NvcmRlb24taXRlbS0tbGV2ZWwyJztcbiAgICBBcnJheS5mcm9tKGdyb3VwLmNoaWxkcmVuKS5mb3JFYWNoKHNpYiA9PiB7XG4gICAgICBpZiAoc2liID09PSBpdGVtIHx8ICFzaWIuY2xhc3NMaXN0Py5jb250YWlucyh3YW50KSkgcmV0dXJuO1xuICAgICAgY29uc3QgcCA9IHBhbmVsT2Yoc2liKTtcbiAgICAgIGlmIChwICYmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJykpe1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgdHJpZyA9IHNpYi5xdWVyeVNlbGVjdG9yKCcuYWNjb3JkZW9uX190cmlnZ2VyJyk7XG4gICAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX0NMT1NFJyA6ICdBQ0NfTDJfQ0xPU0UnLCBzaWIsIHsgc291cmNlOiAnc2libGluZycgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldEFsbEwyKCl7XG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMiAuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIGNvbGxhcHNlKHApO1xuICAgICAgICBjb25zdCBpdCA9IHAuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICAgICAgaXQ/LnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKT8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgIGVtaXQoJ0FDQ19MMl9DTE9TRScsIGl0LCB7IHNvdXJjZTogJ3Jlc2V0LWFsbCcgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoaXRlbSl7XG4gICAgY29uc3QgcCA9IHBhbmVsT2YoaXRlbSk7IGlmICghcCkgcmV0dXJuO1xuICAgIGNvbnN0IHRyaWcgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKTtcbiAgICBjb25zdCBvcGVuaW5nID0gIShwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyk7XG4gICAgY2xvc2VTaWJsaW5ncyhpdGVtKTtcbiAgICBpZiAob3BlbmluZyAmJiBpc0wxKGl0ZW0pKSByZXNldEFsbEwyKCk7XG5cbiAgICBpZiAob3BlbmluZyl7XG4gICAgICBleHBhbmQocCk7IHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX09QRU4nIDogJ0FDQ19MMl9PUEVOJywgaXRlbSwgeyBvcGVuaW5nOiB0cnVlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsYXBzZShwKTsgdHJpZz8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICBpZiAoaXNMMShpdGVtKSkgcmVzZXRBbGxMMigpO1xuICAgICAgZW1pdChpc0wxKGl0ZW0pID8gJ0FDQ19MMV9DTE9TRScgOiAnQUNDX0wyX0NMT1NFJywgaXRlbSwgeyBvcGVuaW5nOiBmYWxzZSB9KTtcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2pzLXByZXAnKTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JzsgcC5kYXRhc2V0LnN0YXRlID0gJ2NvbGxhcHNlZCc7IH0pO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdqcy1wcmVwJykpO1xuXG4gIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpOyBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDEsIC5hY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpOyBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBpZiAoZS5rZXkgIT09ICdFbnRlcicgJiYgZS5rZXkgIT09ICcgJykgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMSwgLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICBpdGVtICYmIHRvZ2dsZShpdGVtKTtcbiAgfSk7XG5cbiAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgZW50cmllcy5mb3JFYWNoKCh7IHRhcmdldDogcCB9KSA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicpeyBwLnN0eWxlLm1heEhlaWdodCA9ICdub25lJzsgfVxuICAgICAgZWxzZSBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpeyBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JzsgfVxuICAgIH0pO1xuICB9KTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHJvLm9ic2VydmUocCkpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFNjcm9sbCBMb2NrIChIeWJyaWQsIGlPUy1zYWZlKVxuICogIFB1cnBvc2U6IFJlbGlhYmxlIHBhZ2Ugc2Nyb2xsIGxvY2tpbmcgd2l0aCBleGFjdCByZXN0b3JlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5sZXQgbG9ja3MgPSAwO1xubGV0IHNhdmVkWSA9IDA7XG5sZXQgcHJldlNjcm9sbEJlaGF2aW9yID0gJyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrU2Nyb2xsKCl7XG4gIGlmIChsb2NrcysrKSByZXR1cm47XG4gIGNvbnN0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBwcmV2U2Nyb2xsQmVoYXZpb3IgPSBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvcjtcbiAgZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSAnYXV0byc7XG4gIHNhdmVkWSA9IHdpbmRvdy5zY3JvbGxZIHx8IGRlLnNjcm9sbFRvcCB8fCAwO1xuXG4gIC8vIEZpeGVkLWJvZHkgKyBtb2RhbC1vcGVuIGNsYXNzIGZvciBDU1MgaG9va3NcbiAgT2JqZWN0LmFzc2lnbihkb2N1bWVudC5ib2R5LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgdG9wOiBgLSR7c2F2ZWRZfXB4YCxcbiAgICBsZWZ0OiAnMCcsXG4gICAgcmlnaHQ6ICcwJyxcbiAgICB3aWR0aDogJzEwMCUnLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICBvdmVyc2Nyb2xsQmVoYXZpb3I6ICdub25lJ1xuICB9KTtcbiAgdHJ5IHsgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1vcGVuJyk7IH0gY2F0Y2gge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVubG9ja1Njcm9sbCh7IGRlbGF5TXMgPSAwIH0gPSB7fSl7XG4gIGNvbnN0IHJ1biA9ICgpID0+IHtcbiAgICBpZiAoLS1sb2NrcyA+IDApIHJldHVybjtcbiAgICBjb25zdCBkZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBPYmplY3QuYXNzaWduKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnJywgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgd2lkdGg6ICcnLCBvdmVyZmxvdzogJycsIG92ZXJzY3JvbGxCZWhhdmlvcjogJydcbiAgICB9KTtcbiAgICB0cnkgeyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLW9wZW4nKTsgfSBjYXRjaCB7fVxuICAgIGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gcHJldlNjcm9sbEJlaGF2aW9yIHx8ICcnO1xuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBzYXZlZFkpO1xuICB9O1xuICBkZWxheU1zID8gc2V0VGltZW91dChydW4sIGRlbGF5TXMpIDogcnVuKCk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgVmltZW8gSGVscGVyXG4gKiAgUHVycG9zZTogTW91bnQvcmVwbGFjZSBWaW1lbyBpZnJhbWUgd2l0aCBwcml2YWN5IG9wdGlvbnNcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnNvbGUubG9nKCdbVklNRU9dIG1vZHVsZSBsb2FkZWQnKTtcblxuZnVuY3Rpb24gcGFyc2VWaW1lb0lkKGlucHV0KXtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xuICBjb25zdCBzdHIgPSBTdHJpbmcoaW5wdXQpLnRyaW0oKTtcbiAgLy8gQWNjZXB0IGJhcmUgSURzXG4gIGlmICgvXlxcZCskLy50ZXN0KHN0cikpIHJldHVybiBzdHI7XG4gIC8vIEV4dHJhY3QgZnJvbSBrbm93biBVUkwgZm9ybXNcbiAgdHJ5IHtcbiAgICBjb25zdCB1ID0gbmV3IFVSTChzdHIsICdodHRwczovL2V4YW1wbGUuY29tJyk7XG4gICAgY29uc3QgaG9zdCA9IHUuaG9zdG5hbWUgfHwgJyc7XG4gICAgaWYgKGhvc3QuaW5jbHVkZXMoJ3ZpbWVvLmNvbScpKXtcbiAgICAgIC8vIC92aWRlby97aWR9IG9yIC97aWR9XG4gICAgICBjb25zdCBwYXJ0cyA9IHUucGF0aG5hbWUuc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICBjb25zdCBsYXN0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgJyc7XG4gICAgICBjb25zdCBpZCA9IGxhc3QubWF0Y2goL1xcZCsvKT8uWzBdIHx8ICcnO1xuICAgICAgcmV0dXJuIGlkIHx8ICcnO1xuICAgIH1cbiAgfSBjYXRjaCB7fVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3VudFZpbWVvKGNvbnRhaW5lciwgaW5wdXRJZCwgcGFyYW1zID0ge30pe1xuICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuICBjb25zdCBpZCA9IHBhcnNlVmltZW9JZChpbnB1dElkKTtcbiAgaWYgKCFpZCl7IGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJzsgcmV0dXJuOyB9XG4gIGNvbnN0IHF1ZXJ5ID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh7IGRudDogMSwgLi4ucGFyYW1zIH0pLnRvU3RyaW5nKCk7XG4gIGNvbnN0IHNyYyA9IGBodHRwczovL3BsYXllci52aW1lby5jb20vdmlkZW8vJHtpZH0/JHtxdWVyeX1gO1xuICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLnNyYyA9IHNyYztcbiAgLy8gTWluaW1hbCBhbGxvdy1saXN0IHRvIHJlZHVjZSBwZXJtaXNzaW9uIHBvbGljeSB3YXJuaW5ncyBpbiBEZXNpZ25lclxuICBpZnJhbWUuYWxsb3cgPSAnYXV0b3BsYXk7IGZ1bGxzY3JlZW47IHBpY3R1cmUtaW4tcGljdHVyZTsgZW5jcnlwdGVkLW1lZGlhJztcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnZnJhbWVib3JkZXInLCAnMCcpO1xuICBpZnJhbWUuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGlmcmFtZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgTGlnaHRib3ggTW9kdWxlXG4gKiAgUHVycG9zZTogRm9jdXMgdHJhcCwgb3V0c2lkZS1jbGljaywgaW5lcnQvYXJpYSBmYWxsYmFjaywgcmUtZW50cmFuY3lcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGVtaXQgfSBmcm9tICcuLi9jb3JlL2V2ZW50cy5qcyc7XG5pbXBvcnQgeyBsb2NrU2Nyb2xsLCB1bmxvY2tTY3JvbGwgfSBmcm9tICcuLi9jb3JlL3Njcm9sbGxvY2suanMnO1xuaW1wb3J0IHsgbW91bnRWaW1lbyB9IGZyb20gJy4vdmltZW8uanMnO1xuY29uc29sZS5sb2coJ1tMSUdIVEJPWF0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdExpZ2h0Ym94KHsgcm9vdCA9ICcjcHJvamVjdC1saWdodGJveCcsIGNsb3NlRGVsYXlNcyA9IDEwMDAgfSA9IHt9KXtcbiAgY29uc3QgbGIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHJvb3QpO1xuICBpZiAoIWxiKXsgY29uc29sZS5sb2coJ1tMSUdIVEJPWF0gbm90IGZvdW5kJyk7IHJldHVybjsgfVxuXG4gIC8vIEVuc3VyZSBiYXNlbGluZSBkaWFsb2cgYTExeSBhdHRyaWJ1dGVzXG4gIGxiLnNldEF0dHJpYnV0ZSgncm9sZScsIGxiLmdldEF0dHJpYnV0ZSgncm9sZScpIHx8ICdkaWFsb2cnKTtcbiAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLW1vZGFsJywgbGIuZ2V0QXR0cmlidXRlKCdhcmlhLW1vZGFsJykgfHwgJ3RydWUnKTtcbiAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIGxiLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSB8fCAndHJ1ZScpO1xuXG4gIGNvbnN0IGlubmVyID0gbGIucXVlcnlTZWxlY3RvcignLnByb2plY3QtbGlnaHRib3hfX2lubmVyJyk7XG4gIGNvbnN0IHZpZGVvQXJlYSA9IGxiLnF1ZXJ5U2VsZWN0b3IoJy52aWRlby1hcmVhJyk7XG4gIGNvbnN0IHNsaWRlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGlkZScpO1xuICBjb25zdCBwcmVmZXJzUmVkdWNlZCA9IG1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpJykubWF0Y2hlcztcblxuICBsZXQgb3Blbkd1YXJkID0gZmFsc2U7XG4gIGxldCBsYXN0Rm9jdXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHNldFBhZ2VJbmVydChvbil7XG4gICAgY29uc3Qgc2libGluZ3MgPSBBcnJheS5mcm9tKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pLmZpbHRlcihuID0+IG4gIT09IGxiKTtcbiAgICBzaWJsaW5ncy5mb3JFYWNoKG4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCdpbmVydCcgaW4gbikgbi5pbmVydCA9ICEhb247XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBpZiAob24pIG4uc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBlbHNlIG4ucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhcEZvY3VzKGUpe1xuICAgIGlmIChlLmtleSAhPT0gJ1RhYicpIHJldHVybjtcbiAgICBjb25zdCBmb2N1c2FibGVzID0gbGIucXVlcnlTZWxlY3RvckFsbChbXG4gICAgICAnYVtocmVmXScsJ2J1dHRvbicsJ2lucHV0Jywnc2VsZWN0JywndGV4dGFyZWEnLFxuICAgICAgJ1t0YWJpbmRleF06bm90KFt0YWJpbmRleD1cIi0xXCJdKSdcbiAgICBdLmpvaW4oJywnKSk7XG4gICAgY29uc3QgbGlzdCA9IEFycmF5LmZyb20oZm9jdXNhYmxlcykuZmlsdGVyKGVsID0+ICFlbC5oYXNBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgJiYgIWVsLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSk7XG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKXsgZS5wcmV2ZW50RGVmYXVsdCgpOyAoaW5uZXIgfHwgbGIpLmZvY3VzKCk7IHJldHVybjsgfVxuICAgIGNvbnN0IGZpcnN0ID0gbGlzdFswXTtcbiAgICBjb25zdCBsYXN0ID0gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdO1xuICAgIGlmIChlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGZpcnN0KXsgZS5wcmV2ZW50RGVmYXVsdCgpOyBsYXN0LmZvY3VzKCk7IH1cbiAgICBlbHNlIGlmICghZS5zaGlmdEtleSAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBsYXN0KXsgZS5wcmV2ZW50RGVmYXVsdCgpOyBmaXJzdC5mb2N1cygpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBvcGVuRnJvbVNsaWRlKHNsaWRlKXtcbiAgICBpZiAob3Blbkd1YXJkKSByZXR1cm47XG4gICAgb3Blbkd1YXJkID0gdHJ1ZTtcbiAgICBsYXN0Rm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IDogbnVsbDtcblxuICAgIGNvbnN0IHZpZGVvID0gc2xpZGU/LmRhdGFzZXQ/LnZpZGVvIHx8ICcnO1xuICAgIGNvbnN0IHRpdGxlID0gc2xpZGU/LmRhdGFzZXQ/LnRpdGxlIHx8ICcnO1xuICAgIGNvbnN0IHRleHQgID0gc2xpZGU/LmRhdGFzZXQ/LnRleHQgIHx8ICcnO1xuXG4gICAgY29uc3QgaXNEZXNpZ25lciA9IC9cXC53ZWJmbG93XFwuY29tJC8udGVzdChsb2NhdGlvbi5ob3N0bmFtZSkgfHwgL2NhbnZhc1xcLndlYmZsb3dcXC5jb20kLy50ZXN0KGxvY2F0aW9uLmhvc3RuYW1lKTtcbiAgICBjb25zdCBhdXRvcGxheSA9IGlzRGVzaWduZXIgPyAwIDogMTsgLy8gYXZvaWQgYXV0b3BsYXkgd2FybmluZ3MgaW5zaWRlIFdlYmZsb3cgRGVzaWduZXJcbiAgICBpZiAodmlkZW9BcmVhKSBtb3VudFZpbWVvKHZpZGVvQXJlYSwgdmlkZW8sIHsgYXV0b3BsYXksIG11dGVkOiAxLCBjb250cm9sczogMCwgYmFja2dyb3VuZDogMSwgcGxheXNpbmxpbmU6IDEsIGRudDogMSB9KTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgbGIuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nLCAndHJ1ZScpO1xuICAgIHNldFBhZ2VJbmVydCh0cnVlKTtcbiAgICBsb2NrU2Nyb2xsKCk7XG5cbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgKGlubmVyIHx8IGxiKS5mb2N1cygpO1xuXG4gICAgZW1pdCgnTElHSFRCT1hfT1BFTicsIGxiLCB7IHZpZGVvLCB0aXRsZSwgdGV4dCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcXVlc3RDbG9zZSgpe1xuICAgIGlmICghb3Blbkd1YXJkKSByZXR1cm47XG4gICAgZW1pdCgnTElHSFRCT1hfQ0xPU0UnLCBsYik7XG4gICAgaWYgKHByZWZlcnNSZWR1Y2VkKXtcbiAgICAgIHVubG9ja1Njcm9sbCh7IGRlbGF5TXM6IDAgfSk7XG4gICAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRURfRE9ORScsIGxiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogY2xvc2VEZWxheU1zIH0pO1xuICAgIH1cbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBsYi5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtb3BlbicpO1xuICAgIHNldFBhZ2VJbmVydChmYWxzZSk7XG4gICAgaWYgKHZpZGVvQXJlYSkgdmlkZW9BcmVhLmlubmVySFRNTCA9ICcnO1xuICAgIGlmIChsYXN0Rm9jdXMgJiYgZG9jdW1lbnQuYm9keS5jb250YWlucyhsYXN0Rm9jdXMpKSBsYXN0Rm9jdXMuZm9jdXMoKTtcbiAgICBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgfVxuXG4gIHNsaWRlcy5mb3JFYWNoKHNsaWRlID0+IHNsaWRlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gb3BlbkZyb21TbGlkZShzbGlkZSkpKTtcblxuICBsYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgIGlmIChpbm5lciAmJiAhZS50YXJnZXQuY2xvc2VzdCgnLnByb2plY3QtbGlnaHRib3hfX2lubmVyJykpIHJlcXVlc3RDbG9zZSgpO1xuICAgIGVsc2UgaWYgKCFpbm5lciAmJiBlLnRhcmdldCA9PT0gbGIpIHJlcXVlc3RDbG9zZSgpO1xuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgaWYgKGxiLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuJykgPT09ICd0cnVlJyl7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSByZXF1ZXN0Q2xvc2UoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gJ1RhYicpIHRyYXBGb2N1cyhlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgKCkgPT4gdW5sb2NrU2Nyb2xsKCkpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFdlYmZsb3cgU2Nyb2xsVHJpZ2dlciBCcmlkZ2VcbiAqICBQdXJwb3NlOiBUcmlnZ2VyIFdlYmZsb3cgSVggaW50ZXJhY3Rpb25zIHZpYSBHU0FQIFNjcm9sbFRyaWdnZXJcbiAqICBEYXRlOiAyMDI1LTEwLTMwXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnNvbGUubG9nKCdbV0VCRkxPV10gbW9kdWxlIGxvYWRlZCcpO1xuXG4vKipcbiAqIEluaXRpYWxpemUgR1NBUCBTY3JvbGxUcmlnZ2VyIFx1MjE5MiBXZWJmbG93IElYMiBicmlkZ2UuXG4gKlxuICogRGVmYXVsdHMgYXJlIGFsaWduZWQgdG8gdGhlIHByb3ZpZGVkIFdlYmZsb3cgc3RydWN0dXJlOlxuICogIC0gc2Nyb2xsZXI6IGAucGVyc3BlY3RpdmUtd3JhcHBlcmBcbiAqICAtIGRyaXZlciBzbGlkZTogYC5zbGlkZS0tc2Nyb2xsLWRyaXZlcmAgKGluc2lkZSBgLnNsaWRlc2ApXG4gKiAgLSBpbnRlcmFjdGlvbjogYGxvZ28tc2hyaW5rYCBvbiBsZWF2ZSBhbmQgZW50ZXItYmFja1xuICpcbiAqIFRoaXMgc2FmZWx5IG5vLW9wcyB3aGVuIFdlYmZsb3cvR1NBUC9TY3JvbGxUcmlnZ2VyIG9yIHRhcmdldCBlbGVtZW50c1xuICogYXJlIHVuYXZhaWxhYmxlLiBSdW5zIGFmdGVyIHdpbmRvdyAnbG9hZCcgYW5kIGluc2lkZSBXZWJmbG93LnB1c2guXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY3JvbGxlclNlbGVjdG9yPScucGVyc3BlY3RpdmUtd3JhcHBlciddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZHJpdmVyU2VsZWN0b3I9Jy5zbGlkZS0tc2Nyb2xsLWRyaXZlciddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW50ZXJhY3Rpb25PbkxlYXZlPSdsb2dvLXNocmluayddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW50ZXJhY3Rpb25PbkVudGVyQmFjaz0nbG9nby1zaHJpbmsnXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0YXJ0PSd0b3AgdG9wJ11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5lbmQ9J2JvdHRvbSB0b3AnXVxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5tYXJrZXJzPWZhbHNlXVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFdlYmZsb3dTY3JvbGxUcmlnZ2VycyhvcHRpb25zID0ge30pe1xuICBjb25zdCBzY3JvbGxlclNlbGVjdG9yID0gb3B0aW9ucy5zY3JvbGxlclNlbGVjdG9yIHx8ICcucGVyc3BlY3RpdmUtd3JhcHBlcic7XG4gIC8vIFVzZSB0aGUgZmlyc3QgYC5zbGlkZWAgaW4gdGhlIGRvY3VtZW50IChwcmVmZXIgd2l0aGluIGAuc2xpZGVzYClcbiAgY29uc3QgZHJpdmVyU2VsZWN0b3IgPSBvcHRpb25zLmRyaXZlclNlbGVjdG9yIHx8ICcuc2xpZGVzIC5zbGlkZSwgLnNsaWRlJztcbiAgLy8gRXZlbnRzOiBpbml0IHBhdXNlcy9zZXRzIHN0YXJ0IG9uIGxvYWQ7IHBsYXkgZmlyZXMgb24gZmlyc3Qgc2Nyb2xsOyByZXNldCBwYXVzZXMgb24gc2Nyb2xsIGJhY2tcbiAgY29uc3QgaW5pdEV2ZW50TmFtZSA9IG9wdGlvbnMuaW5pdEV2ZW50TmFtZSB8fCAnbG9nby1zdGFydCc7XG4gIGNvbnN0IHBsYXlFdmVudE5hbWUgPSBvcHRpb25zLnBsYXlFdmVudE5hbWUgfHwgJ2xvZ28tc2hyaW5rJztcbiAgY29uc3QgcmVzZXRFdmVudE5hbWUgPSBvcHRpb25zLnJlc2V0RXZlbnROYW1lIHx8IGluaXRFdmVudE5hbWUgfHwgJ2xvZ28tc3RhcnQnO1xuICAvLyBGb3J3YXJkIGdyb3cgYW5pbWF0aW9uIHdoZW4gc2Nyb2xsaW5nIHVwOyBrZWVwIGJhY2t3YXJkcy1jb21wYXRpYmxlIGFsaWFzXG4gIGNvbnN0IGdyb3dFdmVudE5hbWUgPSBvcHRpb25zLmdyb3dFdmVudE5hbWUgfHwgb3B0aW9ucy5yZXZlcnNlRXZlbnROYW1lIHx8ICdsb2dvLWdyb3cnO1xuICBjb25zdCBzdGFydCA9IG9wdGlvbnMuc3RhcnQgfHwgJ3RvcCB0b3AnO1xuICBjb25zdCBlbmQgPSBvcHRpb25zLmVuZCB8fCAnYm90dG9tIHRvcCc7XG4gIGNvbnN0IG1hcmtlcnMgPSAhIW9wdGlvbnMubWFya2VycztcbiAgY29uc3QgcGxheVRocmVzaG9sZCA9IHR5cGVvZiBvcHRpb25zLnBsYXlUaHJlc2hvbGQgPT09ICdudW1iZXInID8gb3B0aW9ucy5wbGF5VGhyZXNob2xkIDogMC4wMjsgLy8gZmlyZSBhcyBzb29uIGFzIHNjcm9sbCBzdGFydHNcblxuICBmdW5jdGlvbiBvbldpbmRvd0xvYWQoY2Ipe1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7IHNldFRpbWVvdXQoY2IsIDApOyByZXR1cm47IH1cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCB7IG9uY2U6IHRydWUgfSk7XG4gIH1cblxuICBvbldpbmRvd0xvYWQoZnVuY3Rpb24oKXtcbiAgICBjb25zdCBXZWJmbG93ID0gd2luZG93LldlYmZsb3cgfHwgW107XG4gICAgY29uc3QgZ2V0SXggPSAoKSA9PiB7XG4gICAgICB0cnkgeyByZXR1cm4gd2luZG93LldlYmZsb3cgJiYgd2luZG93LldlYmZsb3cucmVxdWlyZSAmJiAod2luZG93LldlYmZsb3cucmVxdWlyZSgnaXgzJykgfHwgd2luZG93LldlYmZsb3cucmVxdWlyZSgnaXgyJykpOyB9XG4gICAgICBjYXRjaChfKSB7IHRyeSB7IHJldHVybiB3aW5kb3cuV2ViZmxvdyAmJiB3aW5kb3cuV2ViZmxvdy5yZXF1aXJlICYmIHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MicpOyB9IGNhdGNoKF9fKSB7IHJldHVybiBudWxsOyB9IH1cbiAgICB9O1xuXG4gICAgY29uc3QgbW91bnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCB3Zkl4ID0gZ2V0SXgoKTtcbiAgICAgIGNvbnN0IFNjcm9sbFRyaWdnZXIgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93LlNjcm9sbFRyaWdnZXIgOiBudWxsO1xuICAgICAgaWYgKCF3Zkl4IHx8ICFTY3JvbGxUcmlnZ2VyKSB7IHJldHVybjsgfVxuXG4gICAgICBjb25zdCBzY3JvbGxlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2Nyb2xsZXJTZWxlY3Rvcik7XG4gICAgICBsZXQgZHJpdmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihkcml2ZXJTZWxlY3RvcikgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNsaWRlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhcmFsbGF4LWdyb3VwOmZpcnN0LWNoaWxkJyk7XG4gICAgICBpZiAoIXNjcm9sbGVyIHx8ICFkcml2ZXIpIHsgcmV0dXJuOyB9XG5cbiAgICAgIC8vIEVuc3VyZSB0aGUgYW5pbWF0aW9uIGlzIGF0IGl0cyBzdGFydCBhbmQgcGF1c2VkIG9uIGxvYWRcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChpbml0RXZlbnROYW1lKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IGluaXQ6JywgaW5pdEV2ZW50TmFtZSk7XG4gICAgICAgICAgd2ZJeC5lbWl0KGluaXRFdmVudE5hbWUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKF8pIHt9XG5cbiAgICAgIGxldCBmaXJlZCA9IGZhbHNlO1xuICAgICAgbGV0IGdyb3dBcm1lZCA9IGZhbHNlO1xuXG4gICAgICBjb25zdCBzdCA9IFNjcm9sbFRyaWdnZXIuY3JlYXRlKHtcbiAgICAgICAgdHJpZ2dlcjogZHJpdmVyLFxuICAgICAgICBzY3JvbGxlcjogc2Nyb2xsZXIsXG4gICAgICAgIHN0YXJ0OiAndG9wIHRvcCcsXG4gICAgICAgIGVuZDogJ3RvcCAtMTAlJyxcbiAgICAgICAgbWFya2VyczogbWFya2VycyxcbiAgICAgICAgb25MZWF2ZTogKCkgPT4ge1xuICAgICAgICAgIGlmICghZmlyZWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGlmIChwbGF5RXZlbnROYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IHBsYXkvb25MZWF2ZTonLCBwbGF5RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQocGxheUV2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGdyb3dBcm1lZCA9IHRydWU7IC8vIGFybSBpbW1lZGlhdGUgZ3JvdyBvbiB1cHdhcmQgZGlyZWN0aW9uXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkVudGVyQmFjazogKCkgPT4ge1xuICAgICAgICAgIC8vIEZhbGxiYWNrOiBvbmx5IGVtaXQgaWYgZGlyZWN0aW9uIHdhdGNoZXIgZGlkbid0IGFscmVhZHkgZmlyZVxuICAgICAgICAgIGlmICghZ3Jvd0FybWVkKSByZXR1cm47XG4gICAgICAgICAgZmlyZWQgPSBmYWxzZTsgLy8gYWxsb3cgbmV4dCBkb3dud2FyZCBwYXNzIHRvIGZpcmUgYWdhaW5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGdyb3dFdmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBlbWl0IGdyb3cvb25FbnRlckJhY2s6JywgZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIHdmSXguZW1pdChncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgZ3Jvd0FybWVkID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHRyeSB7IGNvbnNvbGUubG9nKCdbV0VCRkxPV10gU2Nyb2xsVHJpZ2dlciBjcmVhdGVkJywgeyB0cmlnZ2VyOiBkcml2ZXIsIGRyaXZlclNlbGVjdG9yLCBzY3JvbGxlciwgc3RhcnQ6ICd0b3AgdG9wJywgZW5kOiAndG9wIC0xMCUnIH0pOyB9IGNhdGNoKF8pIHt9XG5cbiAgICAgIC8vIERpcmVjdGlvbiB3YXRjaGVyOiBmaXJlIGdyb3cgYXMgc29vbiBhcyB1c2VyIHN0YXJ0cyBzY3JvbGxpbmcgdXAgYWZ0ZXIgc2hyaW5rXG4gICAgICBTY3JvbGxUcmlnZ2VyLmNyZWF0ZSh7XG4gICAgICAgIHNjcm9sbGVyOiBzY3JvbGxlcixcbiAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgIGVuZDogKCkgPT4gU2Nyb2xsVHJpZ2dlci5tYXhTY3JvbGwoc2Nyb2xsZXIpLFxuICAgICAgICBvblVwZGF0ZTogKHMpID0+IHtcbiAgICAgICAgICBpZiAoZ3Jvd0FybWVkICYmIHMuZGlyZWN0aW9uIDwgMCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaWYgKGdyb3dFdmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIGVtaXQgZ3Jvdy9vblVwZGF0ZTonLCBncm93RXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICAgIGdyb3dBcm1lZCA9IGZhbHNlO1xuICAgICAgICAgICAgZmlyZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0cnkgeyBXZWJmbG93LnB1c2gobW91bnQpOyB9XG4gICAgY2F0Y2goXykgeyBtb3VudCgpOyB9XG4gIH0pO1xufVxuXG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgQXBwIEVudHJ5XG4gKiAgUHVycG9zZTogV2lyZSBtb2R1bGVzIGFuZCBleHBvc2UgbWluaW1hbCBmYWNhZGVcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGluaXRBY2NvcmRpb24gfSBmcm9tICcuL21vZHVsZXMvYWNjb3JkaW9uLmpzJztcbmltcG9ydCB7IGluaXRMaWdodGJveCB9IGZyb20gJy4vbW9kdWxlcy9saWdodGJveC5qcyc7XG5pbXBvcnQgeyBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzIH0gZnJvbSAnLi9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyc7XG5cbmZ1bmN0aW9uIHBhdGNoWW91VHViZUFsbG93VG9rZW5zKCl7XG4gIC8vIE1pbmltYWwgc2V0IHRvIHJlZHVjZSBwZXJtaXNzaW9uIHBvbGljeSB3YXJuaW5ncyBpbnNpZGUgRGVzaWduZXJcbiAgY29uc3QgdG9rZW5zID0gWydhdXRvcGxheScsJ2VuY3J5cHRlZC1tZWRpYScsJ3BpY3R1cmUtaW4tcGljdHVyZSddO1xuICBjb25zdCBzZWwgPSBbXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHViZS5jb21cIl0nLFxuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1LmJlXCJdJyxcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLW5vY29va2llLmNvbVwiXScsXG4gIF0uam9pbignLCcpO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbCkuZm9yRWFjaCgoaWZyKSA9PiB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSAoaWZyLmdldEF0dHJpYnV0ZSgnYWxsb3cnKSB8fCAnJykuc3BsaXQoJzsnKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGNvbnN0IG1lcmdlZCA9IEFycmF5LmZyb20obmV3IFNldChbLi4uZXhpc3RpbmcsIC4uLnRva2Vuc10pKS5qb2luKCc7ICcpO1xuICAgIGlmci5zZXRBdHRyaWJ1dGUoJ2FsbG93JywgbWVyZ2VkKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXQob3B0aW9ucyA9IHt9KXtcbiAgY29uc3QgbGlnaHRib3hSb290ID0gb3B0aW9ucy5saWdodGJveFJvb3QgfHwgJyNwcm9qZWN0LWxpZ2h0Ym94JztcbiAgaW5pdEFjY29yZGlvbignLmFjY29yZGVvbicpO1xuICBpbml0TGlnaHRib3goeyByb290OiBsaWdodGJveFJvb3QsIGNsb3NlRGVsYXlNczogMTAwMCB9KTtcbiAgLy8gUmVseSBvbiBDU1Mgc2Nyb2xsLXNuYXAgaW4gYC5wZXJzcGVjdGl2ZS13cmFwcGVyYDsgZG8gbm90IGF0dGFjaCBKUyBwYWdpbmdcblxuICAvLyBCcmlkZ2UgR1NBUCBTY3JvbGxUcmlnZ2VyIFx1MjE5MiBXZWJmbG93IElYIHVzaW5nIHRoZSBwcm92aWRlZCBzdHJ1Y3R1cmVcbiAgdHJ5IHtcbiAgICBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKHtcbiAgICAgIHNjcm9sbGVyU2VsZWN0b3I6ICcucGVyc3BlY3RpdmUtd3JhcHBlcicsXG4gICAgICAvLyBkcml2ZXJTZWxlY3RvciBkZWZhdWx0cyB0byBmaXJzdCAuc2xpZGU7IG92ZXJyaWRlIG5vdCBuZWVkZWRcbiAgICAgIGluaXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JywgICAgIC8vIHBhdXNlIGF0IHN0YXJ0IG9uIGxvYWRcbiAgICAgIHBsYXlFdmVudE5hbWU6ICdsb2dvLXNocmluaycsICAgIC8vIHBsYXkgYXMgc29vbiBhcyB1c2VyIHN0YXJ0cyBzY3JvbGxpbmcgZG93blxuICAgICAgcmVzZXRFdmVudE5hbWU6ICdsb2dvLXN0YXJ0JywgICAgLy8gb3B0aW9uYWwgcmVzdGFydCBzdGF0ZVxuICAgICAgZ3Jvd0V2ZW50TmFtZTogJ2xvZ28tZ3JvdycsICAgICAgLy8gcGxheSBmb3J3YXJkIGdyb3cgb24gc2Nyb2xsIHVwXG4gICAgICAvLyB0aHJlc2hvbGQgbm90IHVzZWQgaW4gbWluaW1hbCB2ZXJzaW9uXG4gICAgfSk7XG4gIH0gY2F0Y2goXykge31cblxuICAvLyBOb3RlOiBubyBKUyBzbGlkZSBzbmFwcGluZzsgcmVseSBvbiBDU1Mgc2Nyb2xsLXNuYXAgaW4gYC5wZXJzcGVjdGl2ZS13cmFwcGVyYFxufVxuXG4vLyBFeHBvc2UgYSB0aW55IGdsb2JhbCBmb3IgV2ViZmxvdy9EZXNpZ25lciBob29rc1xuLy8gKEludGVybmFscyByZW1haW4gcHJpdmF0ZSBpbnNpZGUgdGhlIElJRkUgYnVuZGxlKVxuaWYgKCF3aW5kb3cuQXBwKSB3aW5kb3cuQXBwID0ge307XG53aW5kb3cuQXBwLmluaXQgPSBpbml0O1xuXG4vLyBBdXRvLWluaXQgb24gRE9NIHJlYWR5IChzYWZlIGlmIGVsZW1lbnRzIGFyZSBtaXNzaW5nKVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcbiAgdHJ5IHsgcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKTsgaW5pdCgpOyB9IGNhdGNoIChlcnIpIHsgY29uc29sZS5lcnJvcignW0FwcF0gaW5pdCBlcnJvcicsIGVycik7IH1cbn0pO1xuXG5cbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBUU8sV0FBUyxLQUFLLE1BQU0sU0FBUyxRQUFRLFNBQVMsQ0FBQyxHQUFFO0FBQ3RELFFBQUk7QUFBRSxhQUFPLGNBQWMsSUFBSSxZQUFZLE1BQU0sRUFBRSxTQUFTLE1BQU0sWUFBWSxNQUFNLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUN6RyxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBQSxJQUFHLFFBQVE7QUFBQSxJQUFDO0FBQUEsRUFDMUU7OztBQ0ZBLFVBQVEsSUFBSSwyQkFBMkI7QUFFaEMsV0FBUyxjQUFjLFVBQVUsY0FBYTtBQUNuRCxVQUFNLE9BQU8sU0FBUyxjQUFjLE9BQU87QUFDM0MsUUFBSSxDQUFDLE1BQUs7QUFBRSxjQUFRLElBQUksNEJBQTRCO0FBQUc7QUFBQSxJQUFRO0FBRS9ELFVBQU0sT0FBTyxRQUFNLEdBQUcsVUFBVSxTQUFTLHdCQUF3QjtBQUNqRSxVQUFNLE9BQU8sUUFBTSxHQUFHLFVBQVUsU0FBUyx3QkFBd0I7QUFDakUsVUFBTSxVQUFVLFVBQVEsNkJBQU0s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
