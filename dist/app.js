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
        console.log("[WEBFLOW] Setup complete:", {
          scroller: !!scroller,
          driver: !!driver,
          wfIx: !!wfIx,
          ScrollTrigger: !!ScrollTrigger,
          initEvent: initEventName,
          shrinkEvent: shrinkEventName,
          growEvent: growEventName
        });
        let isBelowTop = false;
        let hasShrunk = false;
        ScrollTrigger.create({
          trigger: driver,
          scroller,
          start: "top top",
          end: "top -10%",
          // Short range for immediate trigger
          markers,
          onLeave: () => {
            isBelowTop = true;
            if (!hasShrunk) {
              try {
                console.log("[WEBFLOW] emit shrink:", shrinkEventName);
                wfIx.emit(shrinkEventName);
                hasShrunk = true;
              } catch (_) {
              }
            }
          },
          onEnterBack: () => {
            isBelowTop = false;
            hasShrunk = false;
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
        let lastScrollTop = scroller.scrollTop;
        let lastDirection = 0;
        ScrollTrigger.create({
          scroller,
          start: 0,
          end: () => ScrollTrigger.maxScroll(scroller),
          onUpdate: (self) => {
            const currentScrollTop = scroller.scrollTop;
            const direction = currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : lastDirection;
            if (isBelowTop && hasShrunk && direction === -1 && lastDirection !== -1) {
              try {
                console.log("[WEBFLOW] emit grow (scroll up):", growEventName);
                wfIx.emit(growEventName);
                hasShrunk = false;
              } catch (_) {
              }
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
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          setTimeout(() => verifyAndEmit(growEventName, "Initial load - grow"), 100);
          setTimeout(() => verifyAndEmit(growEventName, "Initial load - grow (delayed)"), 800);
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
    initAccordion(".accordeon");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9tb2R1bGVzL3dlYmZsb3ctc2Nyb2xsdHJpZ2dlci5qcyIsICIuLi9zcmMvYXBwLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEV2ZW50cyBVdGlsaXR5XG4gKiAgUHVycG9zZTogRW1pdCBidWJibGluZyBDdXN0b21FdmVudHMgY29tcGF0aWJsZSB3aXRoIEdTQVAtVUkgKHdpbmRvdyBzY29wZSlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0KG5hbWUsIHRhcmdldCA9IHdpbmRvdywgZGV0YWlsID0ge30pe1xuICB0cnkgeyB0YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQobmFtZSwgeyBidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlLCBkZXRhaWwgfSkpOyB9IGNhdGNoIHt9XG4gIHRyeSB7IHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCB7IGRldGFpbCB9KSk7IH0gY2F0Y2gge31cbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBY2NvcmRpb24gTW9kdWxlXG4gKiAgUHVycG9zZTogQVJJQSwgc21vb3RoIHRyYW5zaXRpb25zLCBSTyBpbWFnZSBzYWZldHlcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGVtaXQgfSBmcm9tICcuLi9jb3JlL2V2ZW50cy5qcyc7XG5jb25zb2xlLmxvZygnW0FDQ09SRElPTl0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdEFjY29yZGlvbihyb290U2VsID0gJy5hY2NvcmRlb24nKXtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdFNlbCk7XG4gIGlmICghcm9vdCl7IGNvbnNvbGUubG9nKCdbQUNDT1JESU9OXSByb290IG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICBjb25zdCBpc0wxID0gZWwgPT4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyk7XG4gIGNvbnN0IGlzTDIgPSBlbCA9PiBlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgY29uc3QgcGFuZWxPZiA9IGl0ZW0gPT4gaXRlbT8ucXVlcnlTZWxlY3RvcignOnNjb3BlID4gLmFjY29yZGVvbl9fbGlzdCcpO1xuICBjb25zdCBncm91cE9mID0gaXRlbSA9PiBpc0wxKGl0ZW0pID8gcm9vdCA6IGl0ZW0uY2xvc2VzdCgnLmFjY29yZGVvbl9fbGlzdCcpO1xuXG4gIC8vIEFSSUEgYm9vdHN0cmFwXG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICB0LnNldEF0dHJpYnV0ZSgncm9sZScsICdidXR0b24nKTtcbiAgICB0LnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2NvcmRlb24taXRlbS0tbGV2ZWwxLCAuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMicpO1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pO1xuICAgIGlmIChwKXtcbiAgICAgIGNvbnN0IHBpZCA9IHAuaWQgfHwgYGFjYy1wYW5lbC0ke2l9YDtcbiAgICAgIHAuaWQgPSBwaWQ7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1jb250cm9scycsIHBpZCk7XG4gICAgICB0LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gZXhwYW5kKHApe1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gcC5zY3JvbGxIZWlnaHQgKyAncHgnO1xuICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuaW5nJztcbiAgICBjb25zdCBvbkVuZCA9IChlKSA9PiB7XG4gICAgICBpZiAoZS5wcm9wZXJ0eU5hbWUgIT09ICdtYXgtaGVpZ2h0JykgcmV0dXJuO1xuICAgICAgcC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXtcbiAgICAgICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdvcGVuJztcbiAgICAgIH1cbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbGxhcHNlKHApe1xuICAgIGNvbnN0IGggPSBwLnN0eWxlLm1heEhlaWdodCA9PT0gJ25vbmUnID8gcC5zY3JvbGxIZWlnaHQgOiBwYXJzZUZsb2F0KHAuc3R5bGUubWF4SGVpZ2h0IHx8IDApO1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gKGggfHwgcC5zY3JvbGxIZWlnaHQpICsgJ3B4JztcbiAgICBwLm9mZnNldEhlaWdodDsgLy8gcmVmbG93XG4gICAgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY2xvc2luZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnO1xuICAgIH07XG4gICAgcC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgb25FbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xvc2VTaWJsaW5ncyhpdGVtKXtcbiAgICBjb25zdCBncm91cCA9IGdyb3VwT2YoaXRlbSk7IGlmICghZ3JvdXApIHJldHVybjtcbiAgICBjb25zdCB3YW50ID0gaXNMMShpdGVtKSA/ICdhY2NvcmRlb24taXRlbS0tbGV2ZWwxJyA6ICdhY2NvcmRlb24taXRlbS0tbGV2ZWwyJztcbiAgICBBcnJheS5mcm9tKGdyb3VwLmNoaWxkcmVuKS5mb3JFYWNoKHNpYiA9PiB7XG4gICAgICBpZiAoc2liID09PSBpdGVtIHx8ICFzaWIuY2xhc3NMaXN0Py5jb250YWlucyh3YW50KSkgcmV0dXJuO1xuICAgICAgY29uc3QgcCA9IHBhbmVsT2Yoc2liKTtcbiAgICAgIGlmIChwICYmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJykpe1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgdHJpZyA9IHNpYi5xdWVyeVNlbGVjdG9yKCcuYWNjb3JkZW9uX190cmlnZ2VyJyk7XG4gICAgICAgIHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX0NMT1NFJyA6ICdBQ0NfTDJfQ0xPU0UnLCBzaWIsIHsgc291cmNlOiAnc2libGluZycgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldEFsbEwyKCl7XG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMiAuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIGNvbGxhcHNlKHApO1xuICAgICAgICBjb25zdCBpdCA9IHAuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICAgICAgaXQ/LnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKT8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgIGVtaXQoJ0FDQ19MMl9DTE9TRScsIGl0LCB7IHNvdXJjZTogJ3Jlc2V0LWFsbCcgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoaXRlbSl7XG4gICAgY29uc3QgcCA9IHBhbmVsT2YoaXRlbSk7IGlmICghcCkgcmV0dXJuO1xuICAgIGNvbnN0IHRyaWcgPSBpdGVtLnF1ZXJ5U2VsZWN0b3IoJy5hY2NvcmRlb25fX3RyaWdnZXInKTtcbiAgICBjb25zdCBvcGVuaW5nID0gIShwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuJyB8fCBwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyk7XG4gICAgY2xvc2VTaWJsaW5ncyhpdGVtKTtcbiAgICBpZiAob3BlbmluZyAmJiBpc0wxKGl0ZW0pKSByZXNldEFsbEwyKCk7XG5cbiAgICBpZiAob3BlbmluZyl7XG4gICAgICBleHBhbmQocCk7IHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgICBlbWl0KGlzTDEoaXRlbSkgPyAnQUNDX0wxX09QRU4nIDogJ0FDQ19MMl9PUEVOJywgaXRlbSwgeyBvcGVuaW5nOiB0cnVlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsYXBzZShwKTsgdHJpZz8uc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgICBpZiAoaXNMMShpdGVtKSkgcmVzZXRBbGxMMigpO1xuICAgICAgZW1pdChpc0wxKGl0ZW0pID8gJ0FDQ19MMV9DTE9TRScgOiAnQUNDX0wyX0NMT1NFJywgaXRlbSwgeyBvcGVuaW5nOiBmYWxzZSB9KTtcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2pzLXByZXAnKTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnMHB4JzsgcC5kYXRhc2V0LnN0YXRlID0gJ2NvbGxhcHNlZCc7IH0pO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdqcy1wcmVwJykpO1xuXG4gIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpOyBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDEsIC5hY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+IHtcbiAgICBjb25zdCB0ID0gZS50YXJnZXQuY2xvc2VzdCgnLmFjY29yZGVvbl9fdHJpZ2dlcicpOyBpZiAoIXQgfHwgIXJvb3QuY29udGFpbnModCkpIHJldHVybjtcbiAgICBpZiAoZS5rZXkgIT09ICdFbnRlcicgJiYgZS5rZXkgIT09ICcgJykgcmV0dXJuO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMSwgLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICBpdGVtICYmIHRvZ2dsZShpdGVtKTtcbiAgfSk7XG5cbiAgY29uc3Qgcm8gPSBuZXcgUmVzaXplT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgZW50cmllcy5mb3JFYWNoKCh7IHRhcmdldDogcCB9KSA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicpeyBwLnN0eWxlLm1heEhlaWdodCA9ICdub25lJzsgfVxuICAgICAgZWxzZSBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpeyBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JzsgfVxuICAgIH0pO1xuICB9KTtcbiAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuYWNjb3JkZW9uX19saXN0JykuZm9yRWFjaChwID0+IHJvLm9ic2VydmUocCkpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFNjcm9sbCBMb2NrIChIeWJyaWQsIGlPUy1zYWZlKVxuICogIFB1cnBvc2U6IFJlbGlhYmxlIHBhZ2Ugc2Nyb2xsIGxvY2tpbmcgd2l0aCBleGFjdCByZXN0b3JlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5sZXQgbG9ja3MgPSAwO1xubGV0IHNhdmVkWSA9IDA7XG5sZXQgcHJldlNjcm9sbEJlaGF2aW9yID0gJyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrU2Nyb2xsKCl7XG4gIGlmIChsb2NrcysrKSByZXR1cm47XG4gIGNvbnN0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICBwcmV2U2Nyb2xsQmVoYXZpb3IgPSBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvcjtcbiAgZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3IgPSAnYXV0byc7XG4gIHNhdmVkWSA9IHdpbmRvdy5zY3JvbGxZIHx8IGRlLnNjcm9sbFRvcCB8fCAwO1xuXG4gIC8vIEZpeGVkLWJvZHkgKyBtb2RhbC1vcGVuIGNsYXNzIGZvciBDU1MgaG9va3NcbiAgT2JqZWN0LmFzc2lnbihkb2N1bWVudC5ib2R5LnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdmaXhlZCcsXG4gICAgdG9wOiBgLSR7c2F2ZWRZfXB4YCxcbiAgICBsZWZ0OiAnMCcsXG4gICAgcmlnaHQ6ICcwJyxcbiAgICB3aWR0aDogJzEwMCUnLFxuICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICBvdmVyc2Nyb2xsQmVoYXZpb3I6ICdub25lJ1xuICB9KTtcbiAgdHJ5IHsgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdtb2RhbC1vcGVuJyk7IH0gY2F0Y2gge31cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVubG9ja1Njcm9sbCh7IGRlbGF5TXMgPSAwIH0gPSB7fSl7XG4gIGNvbnN0IHJ1biA9ICgpID0+IHtcbiAgICBpZiAoLS1sb2NrcyA+IDApIHJldHVybjtcbiAgICBjb25zdCBkZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICBPYmplY3QuYXNzaWduKGRvY3VtZW50LmJvZHkuc3R5bGUsIHtcbiAgICAgIHBvc2l0aW9uOiAnJywgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgd2lkdGg6ICcnLCBvdmVyZmxvdzogJycsIG92ZXJzY3JvbGxCZWhhdmlvcjogJydcbiAgICB9KTtcbiAgICB0cnkgeyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLW9wZW4nKTsgfSBjYXRjaCB7fVxuICAgIGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gcHJldlNjcm9sbEJlaGF2aW9yIHx8ICcnO1xuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBzYXZlZFkpO1xuICB9O1xuICBkZWxheU1zID8gc2V0VGltZW91dChydW4sIGRlbGF5TXMpIDogcnVuKCk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgVmltZW8gSGVscGVyXG4gKiAgUHVycG9zZTogTW91bnQvcmVwbGFjZSBWaW1lbyBpZnJhbWUgd2l0aCBwcml2YWN5IG9wdGlvbnNcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnNvbGUubG9nKCdbVklNRU9dIG1vZHVsZSBsb2FkZWQnKTtcblxuZnVuY3Rpb24gcGFyc2VWaW1lb0lkKGlucHV0KXtcbiAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xuICBjb25zdCBzdHIgPSBTdHJpbmcoaW5wdXQpLnRyaW0oKTtcbiAgLy8gQWNjZXB0IGJhcmUgSURzXG4gIGlmICgvXlxcZCskLy50ZXN0KHN0cikpIHJldHVybiBzdHI7XG4gIC8vIEV4dHJhY3QgZnJvbSBrbm93biBVUkwgZm9ybXNcbiAgdHJ5IHtcbiAgICBjb25zdCB1ID0gbmV3IFVSTChzdHIsICdodHRwczovL2V4YW1wbGUuY29tJyk7XG4gICAgY29uc3QgaG9zdCA9IHUuaG9zdG5hbWUgfHwgJyc7XG4gICAgaWYgKGhvc3QuaW5jbHVkZXMoJ3ZpbWVvLmNvbScpKXtcbiAgICAgIC8vIC92aWRlby97aWR9IG9yIC97aWR9XG4gICAgICBjb25zdCBwYXJ0cyA9IHUucGF0aG5hbWUuc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICBjb25zdCBsYXN0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgJyc7XG4gICAgICBjb25zdCBpZCA9IGxhc3QubWF0Y2goL1xcZCsvKT8uWzBdIHx8ICcnO1xuICAgICAgcmV0dXJuIGlkIHx8ICcnO1xuICAgIH1cbiAgfSBjYXRjaCB7fVxuICByZXR1cm4gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb3VudFZpbWVvKGNvbnRhaW5lciwgaW5wdXRJZCwgcGFyYW1zID0ge30pe1xuICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuO1xuICBjb25zdCBpZCA9IHBhcnNlVmltZW9JZChpbnB1dElkKTtcbiAgaWYgKCFpZCl7IGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJzsgcmV0dXJuOyB9XG4gIGNvbnN0IHF1ZXJ5ID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh7IGRudDogMSwgLi4ucGFyYW1zIH0pLnRvU3RyaW5nKCk7XG4gIGNvbnN0IHNyYyA9IGBodHRwczovL3BsYXllci52aW1lby5jb20vdmlkZW8vJHtpZH0/JHtxdWVyeX1gO1xuICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgaWZyYW1lLnNyYyA9IHNyYztcbiAgLy8gTWluaW1hbCBhbGxvdy1saXN0IHRvIHJlZHVjZSBwZXJtaXNzaW9uIHBvbGljeSB3YXJuaW5ncyBpbiBEZXNpZ25lclxuICBpZnJhbWUuYWxsb3cgPSAnYXV0b3BsYXk7IGZ1bGxzY3JlZW47IHBpY3R1cmUtaW4tcGljdHVyZTsgZW5jcnlwdGVkLW1lZGlhJztcbiAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnZnJhbWVib3JkZXInLCAnMCcpO1xuICBpZnJhbWUuc3R5bGUud2lkdGggPSAnMTAwJSc7XG4gIGlmcmFtZS5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGlmcmFtZSk7XG59XG5cblxuIiwgIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgTGlnaHRib3ggTW9kdWxlXG4gKiAgUHVycG9zZTogRm9jdXMgdHJhcCwgb3V0c2lkZS1jbGljaywgaW5lcnQvYXJpYSBmYWxsYmFjaywgcmUtZW50cmFuY3lcbiAqICBEYXRlOiAyMDI1LTEwLTI4XG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmltcG9ydCB7IGVtaXQgfSBmcm9tICcuLi9jb3JlL2V2ZW50cy5qcyc7XG5pbXBvcnQgeyBsb2NrU2Nyb2xsLCB1bmxvY2tTY3JvbGwgfSBmcm9tICcuLi9jb3JlL3Njcm9sbGxvY2suanMnO1xuaW1wb3J0IHsgbW91bnRWaW1lbyB9IGZyb20gJy4vdmltZW8uanMnO1xuY29uc29sZS5sb2coJ1tMSUdIVEJPWF0gbW9kdWxlIGxvYWRlZCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5pdExpZ2h0Ym94KHsgcm9vdCA9ICcjcHJvamVjdC1saWdodGJveCcsIGNsb3NlRGVsYXlNcyA9IDEwMDAgfSA9IHt9KXtcbiAgY29uc3QgbGIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHJvb3QpO1xuICBpZiAoIWxiKXsgY29uc29sZS5sb2coJ1tMSUdIVEJPWF0gbm90IGZvdW5kJyk7IHJldHVybjsgfVxuXG4gIC8vIEVuc3VyZSBiYXNlbGluZSBkaWFsb2cgYTExeSBhdHRyaWJ1dGVzXG4gIGxiLnNldEF0dHJpYnV0ZSgncm9sZScsIGxiLmdldEF0dHJpYnV0ZSgncm9sZScpIHx8ICdkaWFsb2cnKTtcbiAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLW1vZGFsJywgbGIuZ2V0QXR0cmlidXRlKCdhcmlhLW1vZGFsJykgfHwgJ3RydWUnKTtcbiAgbGIuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsIGxiLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSB8fCAndHJ1ZScpO1xuXG4gIGNvbnN0IGlubmVyID0gbGIucXVlcnlTZWxlY3RvcignLnByb2plY3QtbGlnaHRib3hfX2lubmVyJyk7XG4gIGNvbnN0IHZpZGVvQXJlYSA9IGxiLnF1ZXJ5U2VsZWN0b3IoJy52aWRlby1hcmVhJyk7XG4gIGNvbnN0IHNsaWRlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zbGlkZScpO1xuICBjb25zdCBwcmVmZXJzUmVkdWNlZCA9IG1hdGNoTWVkaWEoJyhwcmVmZXJzLXJlZHVjZWQtbW90aW9uOiByZWR1Y2UpJykubWF0Y2hlcztcblxuICBsZXQgb3Blbkd1YXJkID0gZmFsc2U7XG4gIGxldCBsYXN0Rm9jdXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHNldFBhZ2VJbmVydChvbil7XG4gICAgY29uc3Qgc2libGluZ3MgPSBBcnJheS5mcm9tKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pLmZpbHRlcihuID0+IG4gIT09IGxiKTtcbiAgICBzaWJsaW5ncy5mb3JFYWNoKG4gPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCdpbmVydCcgaW4gbikgbi5pbmVydCA9ICEhb247XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBpZiAob24pIG4uc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICBlbHNlIG4ucmVtb3ZlQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhcEZvY3VzKGUpe1xuICAgIGlmIChlLmtleSAhPT0gJ1RhYicpIHJldHVybjtcbiAgICBjb25zdCBmb2N1c2FibGVzID0gbGIucXVlcnlTZWxlY3RvckFsbChbXG4gICAgICAnYVtocmVmXScsJ2J1dHRvbicsJ2lucHV0Jywnc2VsZWN0JywndGV4dGFyZWEnLFxuICAgICAgJ1t0YWJpbmRleF06bm90KFt0YWJpbmRleD1cIi0xXCJdKSdcbiAgICBdLmpvaW4oJywnKSk7XG4gICAgY29uc3QgbGlzdCA9IEFycmF5LmZyb20oZm9jdXNhYmxlcykuZmlsdGVyKGVsID0+ICFlbC5oYXNBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgJiYgIWVsLmdldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSk7XG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKXsgZS5wcmV2ZW50RGVmYXVsdCgpOyAoaW5uZXIgfHwgbGIpLmZvY3VzKCk7IHJldHVybjsgfVxuICAgIGNvbnN0IGZpcnN0ID0gbGlzdFswXTtcbiAgICBjb25zdCBsYXN0ID0gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdO1xuICAgIGlmIChlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGZpcnN0KXsgZS5wcmV2ZW50RGVmYXVsdCgpOyBsYXN0LmZvY3VzKCk7IH1cbiAgICBlbHNlIGlmICghZS5zaGlmdEtleSAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBsYXN0KXsgZS5wcmV2ZW50RGVmYXVsdCgpOyBmaXJzdC5mb2N1cygpOyB9XG4gIH1cblxuICBmdW5jdGlvbiBvcGVuRnJvbVNsaWRlKHNsaWRlKXtcbiAgICBpZiAob3Blbkd1YXJkKSByZXR1cm47XG4gICAgb3Blbkd1YXJkID0gdHJ1ZTtcbiAgICBsYXN0Rm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IDogbnVsbDtcblxuICAgIGNvbnN0IHZpZGVvID0gc2xpZGU/LmRhdGFzZXQ/LnZpZGVvIHx8ICcnO1xuICAgIGNvbnN0IHRpdGxlID0gc2xpZGU/LmRhdGFzZXQ/LnRpdGxlIHx8ICcnO1xuICAgIGNvbnN0IHRleHQgID0gc2xpZGU/LmRhdGFzZXQ/LnRleHQgIHx8ICcnO1xuXG4gICAgY29uc3QgaXNEZXNpZ25lciA9IC9cXC53ZWJmbG93XFwuY29tJC8udGVzdChsb2NhdGlvbi5ob3N0bmFtZSkgfHwgL2NhbnZhc1xcLndlYmZsb3dcXC5jb20kLy50ZXN0KGxvY2F0aW9uLmhvc3RuYW1lKTtcbiAgICBjb25zdCBhdXRvcGxheSA9IGlzRGVzaWduZXIgPyAwIDogMTsgLy8gYXZvaWQgYXV0b3BsYXkgd2FybmluZ3MgaW5zaWRlIFdlYmZsb3cgRGVzaWduZXJcbiAgICBpZiAodmlkZW9BcmVhKSBtb3VudFZpbWVvKHZpZGVvQXJlYSwgdmlkZW8sIHsgYXV0b3BsYXksIG11dGVkOiAxLCBjb250cm9sczogMCwgYmFja2dyb3VuZDogMSwgcGxheXNpbmxpbmU6IDEsIGRudDogMSB9KTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgbGIuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nLCAndHJ1ZScpO1xuICAgIHNldFBhZ2VJbmVydCh0cnVlKTtcbiAgICBsb2NrU2Nyb2xsKCk7XG5cbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgKGlubmVyIHx8IGxiKS5mb2N1cygpO1xuXG4gICAgZW1pdCgnTElHSFRCT1hfT1BFTicsIGxiLCB7IHZpZGVvLCB0aXRsZSwgdGV4dCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcXVlc3RDbG9zZSgpe1xuICAgIGlmICghb3Blbkd1YXJkKSByZXR1cm47XG4gICAgZW1pdCgnTElHSFRCT1hfQ0xPU0UnLCBsYik7XG4gICAgaWYgKHByZWZlcnNSZWR1Y2VkKXtcbiAgICAgIHVubG9ja1Njcm9sbCh7IGRlbGF5TXM6IDAgfSk7XG4gICAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRURfRE9ORScsIGxiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogY2xvc2VEZWxheU1zIH0pO1xuICAgIH1cbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBsYi5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtb3BlbicpO1xuICAgIHNldFBhZ2VJbmVydChmYWxzZSk7XG4gICAgaWYgKHZpZGVvQXJlYSkgdmlkZW9BcmVhLmlubmVySFRNTCA9ICcnO1xuICAgIGlmIChsYXN0Rm9jdXMgJiYgZG9jdW1lbnQuYm9keS5jb250YWlucyhsYXN0Rm9jdXMpKSBsYXN0Rm9jdXMuZm9jdXMoKTtcbiAgICBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgfVxuXG4gIHNsaWRlcy5mb3JFYWNoKHNsaWRlID0+IHNsaWRlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gb3BlbkZyb21TbGlkZShzbGlkZSkpKTtcblxuICBsYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgIGlmIChpbm5lciAmJiAhZS50YXJnZXQuY2xvc2VzdCgnLnByb2plY3QtbGlnaHRib3hfX2lubmVyJykpIHJlcXVlc3RDbG9zZSgpO1xuICAgIGVsc2UgaWYgKCFpbm5lciAmJiBlLnRhcmdldCA9PT0gbGIpIHJlcXVlc3RDbG9zZSgpO1xuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgaWYgKGxiLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuJykgPT09ICd0cnVlJyl7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSByZXF1ZXN0Q2xvc2UoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gJ1RhYicpIHRyYXBGb2N1cyhlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgKCkgPT4gdW5sb2NrU2Nyb2xsKCkpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFdlYmZsb3cgU2Nyb2xsVHJpZ2dlciBCcmlkZ2VcbiAqICBQdXJwb3NlOiBUcmlnZ2VyIFdlYmZsb3cgSVggaW50ZXJhY3Rpb25zIHZpYSBHU0FQIFNjcm9sbFRyaWdnZXJcbiAqICBEYXRlOiAyMDI1LTEwLTMwXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnNvbGUubG9nKCdbV0VCRkxPV10gbW9kdWxlIGxvYWRlZCcpO1xuXG4vKipcbiAqIEluaXRpYWxpemUgR1NBUCBTY3JvbGxUcmlnZ2VyIFx1MjE5MiBXZWJmbG93IElYIGJyaWRnZS5cbiAqXG4gKiBCZWhhdmlvcjpcbiAqICAxLiBPbiBsb2FkOiBlbWl0IGxvZ28tZ3JvdyB0byBhbmltYXRlIGxvZ28gZnJvbSBzbWFsbCBcdTIxOTIgYmlnIChlbnN1cmVzIGxvZ28gc3RhcnRzIGluIGJpZyBzdGF0ZSlcbiAqICAyLiBTY3JvbGwgZG93biBwYXN0IGZpcnN0IHNsaWRlOiBlbWl0IGxvZ28tc2hyaW5rIChiaWcgXHUyMTkyIHNtYWxsKVxuICogIDMuIFN0YXJ0IHNjcm9sbGluZyB1cDogZW1pdCBsb2dvLWdyb3cgaW1tZWRpYXRlbHkgKHNtYWxsIFx1MjE5MiBiaWcpXG4gKiAgNC4gUmV0dXJuIHRvIHRvcDogZW1pdCBsb2dvLXN0YXJ0IChqdW1wIHRvIDBzLCBiYWNrIHRvIGJpZyBzdGF0aWMgc3RhdGUpXG4gKlxuICogUmVxdWlyZW1lbnRzIGluIFdlYmZsb3c6XG4gKiAgLSBsb2dvLXN0YXJ0OiBVc2VzIHRoZSBzYW1lIHRpbWVsaW5lIGFzIGxvZ28tc2hyaW5rLiBDb250cm9sIFx1MjE5MiBKdW1wIHRvIDBzLCB0aGVuIFN0b3AuXG4gKiAgICAgICAgICAgICAgIFVzZWQgd2hlbiByZXR1cm5pbmcgdG8gdG9wIChvbkVudGVyQmFjayk7IHdvcmtzIGJlY2F1c2UgdGltZWxpbmUgaXMgaW5pdGlhbGl6ZWQgYnkgdGhlbi5cbiAqICAgICAgICAgICAgICAgSWYgb21pdHRlZCwgZXZlbnQgaXMgc3RpbGwgZW1pdHRlZCBidXQgc2FmZWx5IGlnbm9yZWQgaWYgbm90IGNvbmZpZ3VyZWQuXG4gKiAgLSBsb2dvLXNocmluazogQ29udHJvbCBcdTIxOTIgUGxheSBmcm9tIHN0YXJ0IChiaWcgXHUyMTkyIHNtYWxsIGFuaW1hdGlvbilcbiAqICAtIGxvZ28tZ3JvdzogQ29udHJvbCBcdTIxOTIgUGxheSBmcm9tIHN0YXJ0IChzbWFsbCBcdTIxOTIgYmlnIGFuaW1hdGlvbilcbiAqICAgICAgICAgICAgICAgVGhpcyBpcyB0cmlnZ2VyZWQgb24gaW5pdGlhbCBwYWdlIGxvYWQgdG8gYW5pbWF0ZSBsb2dvIGZyb20gc21hbGwgXHUyMTkyIGJpZy5cbiAqICAgICAgICAgICAgICAgRW5zdXJlIHlvdXIgbG9nbyBDU1Mgc2hvd3MgaXQgaW4gdGhlIFwic21hbGxcIiBzdGF0ZSBpbml0aWFsbHkgKG1hdGNoaW5nIHRoZSBlbmQgc3RhdGVcbiAqICAgICAgICAgICAgICAgb2Ygc2hyaW5rIG9yIHN0YXJ0IHN0YXRlIG9mIGdyb3cpLCBzbyB0aGUgZ3JvdyBhbmltYXRpb24gaGFzIHNvbWV3aGVyZSB0byBhbmltYXRlIGZyb20uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zY3JvbGxlclNlbGVjdG9yPScucGVyc3BlY3RpdmUtd3JhcHBlciddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZHJpdmVyU2VsZWN0b3JdIC0gRGVmYXVsdHMgdG8gZmlyc3QgLnNsaWRlIGluIHNjcm9sbGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuaW5pdEV2ZW50TmFtZT0nbG9nby1zdGFydCddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc2hyaW5rRXZlbnROYW1lPSdsb2dvLXNocmluayddXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuZ3Jvd0V2ZW50TmFtZT0nbG9nby1ncm93J11cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubWFya2Vycz1mYWxzZV1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMob3B0aW9ucyA9IHt9KXtcbiAgY29uc3Qgc2Nyb2xsZXJTZWxlY3RvciA9IG9wdGlvbnMuc2Nyb2xsZXJTZWxlY3RvciB8fCAnLnBlcnNwZWN0aXZlLXdyYXBwZXInO1xuICBjb25zdCBpbml0RXZlbnROYW1lID0gb3B0aW9ucy5pbml0RXZlbnROYW1lIHx8ICdsb2dvLXN0YXJ0JztcbiAgY29uc3Qgc2hyaW5rRXZlbnROYW1lID0gb3B0aW9ucy5zaHJpbmtFdmVudE5hbWUgfHwgb3B0aW9ucy5wbGF5RXZlbnROYW1lIHx8ICdsb2dvLXNocmluayc7XG4gIGNvbnN0IGdyb3dFdmVudE5hbWUgPSBvcHRpb25zLmdyb3dFdmVudE5hbWUgfHwgJ2xvZ28tZ3Jvdyc7XG4gIGNvbnN0IG1hcmtlcnMgPSAhIW9wdGlvbnMubWFya2VycztcblxuICBmdW5jdGlvbiBvbldpbmRvd0xvYWQoY2Ipe1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7IHNldFRpbWVvdXQoY2IsIDApOyByZXR1cm47IH1cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGNiLCB7IG9uY2U6IHRydWUgfSk7XG4gIH1cblxuICBvbldpbmRvd0xvYWQoZnVuY3Rpb24oKXtcbiAgICBjb25zdCBXZWJmbG93ID0gd2luZG93LldlYmZsb3cgfHwgW107XG4gICAgXG4gICAgV2ViZmxvdy5wdXNoKGZ1bmN0aW9uKCl7XG4gICAgICAvLyBHZXQgV2ViZmxvdyBJWCBBUEkgKHRyeSBpeDMgZmlyc3QsIGZhbGxiYWNrIHRvIGl4MilcbiAgICAgIGNvbnN0IHdmSXggPSAod2luZG93LldlYmZsb3cgJiYgd2luZG93LldlYmZsb3cucmVxdWlyZSkgXG4gICAgICAgID8gKHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MycpIHx8IHdpbmRvdy5XZWJmbG93LnJlcXVpcmUoJ2l4MicpKVxuICAgICAgICA6IG51bGw7XG4gICAgICBjb25zdCBTY3JvbGxUcmlnZ2VyID0gd2luZG93LlNjcm9sbFRyaWdnZXI7XG4gICAgICBcbiAgICAgIGlmICghd2ZJeCB8fCAhU2Nyb2xsVHJpZ2dlcikgeyByZXR1cm47IH1cblxuICAgICAgY29uc3Qgc2Nyb2xsZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNjcm9sbGVyU2VsZWN0b3IpO1xuICAgICAgaWYgKCFzY3JvbGxlcikgeyByZXR1cm47IH1cblxuICAgICAgLy8gRmluZCBmaXJzdCAuc2xpZGUgaW5zaWRlIHRoZSBzY3JvbGxlclxuICAgICAgY29uc3QgZHJpdmVyID0gc2Nyb2xsZXIucXVlcnlTZWxlY3RvcignLnNsaWRlJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNsaWRlJyk7XG4gICAgICBpZiAoIWRyaXZlcikgeyBcbiAgICAgICAgY29uc29sZS5lcnJvcignW1dFQkZMT1ddIERyaXZlciBzbGlkZSBub3QgZm91bmQnKTtcbiAgICAgICAgcmV0dXJuOyBcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1tXRUJGTE9XXSBTZXR1cCBjb21wbGV0ZTonLCB7IFxuICAgICAgICBzY3JvbGxlcjogISFzY3JvbGxlciwgXG4gICAgICAgIGRyaXZlcjogISFkcml2ZXIsIFxuICAgICAgICB3Zkl4OiAhIXdmSXgsIFxuICAgICAgICBTY3JvbGxUcmlnZ2VyOiAhIVNjcm9sbFRyaWdnZXIsXG4gICAgICAgIGluaXRFdmVudDogaW5pdEV2ZW50TmFtZSxcbiAgICAgICAgc2hyaW5rRXZlbnQ6IHNocmlua0V2ZW50TmFtZSxcbiAgICAgICAgZ3Jvd0V2ZW50OiBncm93RXZlbnROYW1lXG4gICAgICB9KTtcblxuICAgICAgLy8gVHJhY2sgc2Nyb2xsIHN0YXRlOiBhcmUgd2UgYmVsb3cgdGhlIHRvcCB6b25lPyBkaWQgd2Ugc2hyaW5rIGFscmVhZHk/XG4gICAgICBsZXQgaXNCZWxvd1RvcCA9IGZhbHNlO1xuICAgICAgbGV0IGhhc1NocnVuayA9IGZhbHNlO1xuXG4gICAgICAvLyBNYWluIFNjcm9sbFRyaWdnZXI6IHdhdGNoZXMgd2hlbiBmaXJzdCBzbGlkZSBsZWF2ZXMvZW50ZXJzIHRvcCB6b25lXG4gICAgICBTY3JvbGxUcmlnZ2VyLmNyZWF0ZSh7XG4gICAgICAgIHRyaWdnZXI6IGRyaXZlcixcbiAgICAgICAgc2Nyb2xsZXI6IHNjcm9sbGVyLFxuICAgICAgICBzdGFydDogJ3RvcCB0b3AnLFxuICAgICAgICBlbmQ6ICd0b3AgLTEwJScsIC8vIFNob3J0IHJhbmdlIGZvciBpbW1lZGlhdGUgdHJpZ2dlclxuICAgICAgICBtYXJrZXJzOiBtYXJrZXJzLFxuICAgICAgICBcbiAgICAgICAgb25MZWF2ZTogKCkgPT4ge1xuICAgICAgICAgIC8vIFNjcm9sbGVkIGRvd24gcGFzdCB0b3AgXHUyMTkyIHNocmluayBvbmNlXG4gICAgICAgICAgaXNCZWxvd1RvcCA9IHRydWU7XG4gICAgICAgICAgaWYgKCFoYXNTaHJ1bmspIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBzaHJpbms6Jywgc2hyaW5rRXZlbnROYW1lKTtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KHNocmlua0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIGhhc1NocnVuayA9IHRydWU7XG4gICAgICAgICAgICB9IGNhdGNoKF8pIHt9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgb25FbnRlckJhY2s6ICgpID0+IHtcbiAgICAgICAgICAvLyBTY3JvbGxlZCBiYWNrIHVwIHRvIHRvcCBcdTIxOTIganVtcCBzaHJpbmsgdGltZWxpbmUgdG8gMHMgKGJpZyBzdGF0ZSkgYW5kIHN0b3BcbiAgICAgICAgICBpc0JlbG93VG9wID0gZmFsc2U7XG4gICAgICAgICAgaGFzU2hydW5rID0gZmFsc2U7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBzdGFydCAocmV0dXJuIHRvIHRvcCk6JywgaW5pdEV2ZW50TmFtZSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIHdmSXggYXZhaWxhYmxlOicsICEhd2ZJeCwgJ2VtaXQgYXZhaWxhYmxlOicsIHR5cGVvZiB3Zkl4Py5lbWl0KTtcbiAgICAgICAgICAgIGlmICh3Zkl4ICYmIHR5cGVvZiB3Zkl4LmVtaXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgd2ZJeC5lbWl0KGluaXRFdmVudE5hbWUpO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1dFQkZMT1ddIHJldHVybi10by10b3AgZXZlbnQgZW1pdHRlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tXRUJGTE9XXSBDYW5ub3QgZW1pdCByZXR1cm4tdG8tdG9wOiB3Zkl4LmVtaXQgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbV0VCRkxPV10gRXJyb3IgZW1pdHRpbmcgcmV0dXJuLXRvLXRvcDonLCBlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFNpbXBsZSBzY3JvbGwgZGlyZWN0aW9uIHdhdGNoZXIgZm9yIGltbWVkaWF0ZSBncm93IG9uIHVwd2FyZCBzY3JvbGxcbiAgICAgIC8vIE9ubHkgbmVlZGVkIGJlY2F1c2Ugb25FbnRlckJhY2sgb25seSBmaXJlcyBhdCB0b3A7IHVzZXIgd2FudHMgZ3JvdyBtaWQtc2Nyb2xsXG4gICAgICBsZXQgbGFzdFNjcm9sbFRvcCA9IHNjcm9sbGVyLnNjcm9sbFRvcDtcbiAgICAgIGxldCBsYXN0RGlyZWN0aW9uID0gMDsgLy8gLTEgPSB1cCwgMSA9IGRvd24sIDAgPSB1bmtub3duXG4gICAgICBcbiAgICAgIFNjcm9sbFRyaWdnZXIuY3JlYXRlKHtcbiAgICAgICAgc2Nyb2xsZXI6IHNjcm9sbGVyLFxuICAgICAgICBzdGFydDogMCxcbiAgICAgICAgZW5kOiAoKSA9PiBTY3JvbGxUcmlnZ2VyLm1heFNjcm9sbChzY3JvbGxlciksXG4gICAgICAgIG9uVXBkYXRlOiAoc2VsZikgPT4ge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRTY3JvbGxUb3AgPSBzY3JvbGxlci5zY3JvbGxUb3A7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gY3VycmVudFNjcm9sbFRvcCA+IGxhc3RTY3JvbGxUb3AgPyAxIDogY3VycmVudFNjcm9sbFRvcCA8IGxhc3RTY3JvbGxUb3AgPyAtMSA6IGxhc3REaXJlY3Rpb247XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gRmlyc3QgdXB3YXJkIHRpY2sgYWZ0ZXIgc2hyaW5raW5nIFx1MjE5MiBncm93IGltbWVkaWF0ZWx5XG4gICAgICAgICAgaWYgKGlzQmVsb3dUb3AgJiYgaGFzU2hydW5rICYmIGRpcmVjdGlvbiA9PT0gLTEgJiYgbGFzdERpcmVjdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gZW1pdCBncm93IChzY3JvbGwgdXApOicsIGdyb3dFdmVudE5hbWUpO1xuICAgICAgICAgICAgICB3Zkl4LmVtaXQoZ3Jvd0V2ZW50TmFtZSk7XG4gICAgICAgICAgICAgIGhhc1NocnVuayA9IGZhbHNlOyAvLyBSZXNldCBzbyB3ZSBjYW4gc2hyaW5rIGFnYWluIG9uIG5leHQgZG93biBzY3JvbGxcbiAgICAgICAgICAgIH0gY2F0Y2goXykge31cbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgbGFzdFNjcm9sbFRvcCA9IGN1cnJlbnRTY3JvbGxUb3A7XG4gICAgICAgICAgbGFzdERpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCdbV0VCRkxPV10gU2Nyb2xsVHJpZ2dlciBpbml0aWFsaXplZCcpO1xuICAgICAgXG4gICAgICAvLyBWZXJpZnkgdGhhdCBhbGwgZXZlbnRzIGV4aXN0IGluIFdlYmZsb3cgYnkgY2hlY2tpbmcgaWYgZW1pdCBzdWNjZWVkc1xuICAgICAgLy8gTm90ZTogV2ViZmxvdyBlbWl0IGRvZXNuJ3QgdGhyb3cgZXJyb3JzIGZvciBtaXNzaW5nIGV2ZW50cywgYnV0IHdlIGNhbiBsb2cgYXR0ZW1wdHNcbiAgICAgIGNvbnN0IHZlcmlmeUFuZEVtaXQgPSAoZXZlbnROYW1lLCBkZXNjcmlwdGlvbikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbV0VCRkxPV10gJHtkZXNjcmlwdGlvbn06YCwgZXZlbnROYW1lKTtcbiAgICAgICAgICBpZiAod2ZJeCAmJiB0eXBlb2Ygd2ZJeC5lbWl0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB3Zkl4LmVtaXQoZXZlbnROYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbV0VCRkxPV10gXHUyNzEzIEVtaXR0ZWQgJHtldmVudE5hbWV9IC0gSWYgbm90aGluZyBoYXBwZW5zLCBjaGVjayBXZWJmbG93IGNvbmZpZzpgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbV0VCRkxPV10gICAxLiBFdmVudCBuYW1lIG11c3QgYmUgZXhhY3RseTogXCIke2V2ZW50TmFtZX1cImApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDIuIENvbnRyb2wgbXVzdCBOT1QgYmUgXCJObyBBY3Rpb25cImApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtXRUJGTE9XXSAgIDMuIE11c3QgdGFyZ2V0IHRoZSBsb2dvIGVsZW1lbnRgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbV0VCRkxPV10gICA0LiBUaW1lbGluZSBtdXN0IGJlIHNldCBjb3JyZWN0bHlgKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbV0VCRkxPV10gXHUyNzE3IHdmSXguZW1pdCBub3QgYXZhaWxhYmxlYCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXRUJGTE9XXSBcdTI3MTcgRXJyb3IgZW1pdHRpbmcgJHtldmVudE5hbWV9OmAsIGVycik7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXG4gICAgICAvLyBXYWl0IGZvciBTY3JvbGxUcmlnZ2VyIHRvIHJlZnJlc2gsIHRoZW4gdHJpZ2dlciBsb2dvLWdyb3cgb24gaW5pdGlhbCBsb2FkXG4gICAgICAvLyBUaGlzIGFuaW1hdGVzIHRoZSBsb2dvIGZyb20gc21hbGwgXHUyMTkyIGJpZyBvbiBwYWdlIGxvYWQsIGVuc3VyaW5nIGl0IHN0YXJ0cyBpbiB0aGUgYmlnIHN0YXRlXG4gICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgICBTY3JvbGxUcmlnZ2VyLnJlZnJlc2goKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEVtaXQgbG9nby1ncm93IG9uIGluaXRpYWwgbG9hZCAoYW5pbWF0ZXMgbG9nbyB0byBiaWcgc3RhdGUpXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdmVyaWZ5QW5kRW1pdChncm93RXZlbnROYW1lLCAnSW5pdGlhbCBsb2FkIC0gZ3JvdycpLCAxMDApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHZlcmlmeUFuZEVtaXQoZ3Jvd0V2ZW50TmFtZSwgJ0luaXRpYWwgbG9hZCAtIGdyb3cgKGRlbGF5ZWQpJyksIDgwMCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBBcHAgRW50cnlcbiAqICBQdXJwb3NlOiBXaXJlIG1vZHVsZXMgYW5kIGV4cG9zZSBtaW5pbWFsIGZhY2FkZVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgaW5pdEFjY29yZGlvbiB9IGZyb20gJy4vbW9kdWxlcy9hY2NvcmRpb24uanMnO1xuaW1wb3J0IHsgaW5pdExpZ2h0Ym94IH0gZnJvbSAnLi9tb2R1bGVzL2xpZ2h0Ym94LmpzJztcbmltcG9ydCB7IGluaXRXZWJmbG93U2Nyb2xsVHJpZ2dlcnMgfSBmcm9tICcuL21vZHVsZXMvd2ViZmxvdy1zY3JvbGx0cmlnZ2VyLmpzJztcblxuZnVuY3Rpb24gcGF0Y2hZb3VUdWJlQWxsb3dUb2tlbnMoKXtcbiAgLy8gTWluaW1hbCBzZXQgdG8gcmVkdWNlIHBlcm1pc3Npb24gcG9saWN5IHdhcm5pbmdzIGluc2lkZSBEZXNpZ25lclxuICBjb25zdCB0b2tlbnMgPSBbJ2F1dG9wbGF5JywnZW5jcnlwdGVkLW1lZGlhJywncGljdHVyZS1pbi1waWN0dXJlJ107XG4gIGNvbnN0IHNlbCA9IFtcbiAgICAnaWZyYW1lW3NyYyo9XCJ5b3V0dWJlLmNvbVwiXScsXG4gICAgJ2lmcmFtZVtzcmMqPVwieW91dHUuYmVcIl0nLFxuICAgICdpZnJhbWVbc3JjKj1cInlvdXR1YmUtbm9jb29raWUuY29tXCJdJyxcbiAgXS5qb2luKCcsJyk7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsKS5mb3JFYWNoKChpZnIpID0+IHtcbiAgICBjb25zdCBleGlzdGluZyA9IChpZnIuZ2V0QXR0cmlidXRlKCdhbGxvdycpIHx8ICcnKS5zcGxpdCgnOycpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgY29uc3QgbWVyZ2VkID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5leGlzdGluZywgLi4udG9rZW5zXSkpLmpvaW4oJzsgJyk7XG4gICAgaWZyLnNldEF0dHJpYnV0ZSgnYWxsb3cnLCBtZXJnZWQpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdChvcHRpb25zID0ge30pe1xuICBjb25zdCBsaWdodGJveFJvb3QgPSBvcHRpb25zLmxpZ2h0Ym94Um9vdCB8fCAnI3Byb2plY3QtbGlnaHRib3gnO1xuICBpbml0QWNjb3JkaW9uKCcuYWNjb3JkZW9uJyk7XG4gIGluaXRMaWdodGJveCh7IHJvb3Q6IGxpZ2h0Ym94Um9vdCwgY2xvc2VEZWxheU1zOiAxMDAwIH0pO1xuICAvLyBSZWx5IG9uIENTUyBzY3JvbGwtc25hcCBpbiBgLnBlcnNwZWN0aXZlLXdyYXBwZXJgOyBkbyBub3QgYXR0YWNoIEpTIHBhZ2luZ1xuXG4gIC8vIEJyaWRnZSBHU0FQIFNjcm9sbFRyaWdnZXIgXHUyMTkyIFdlYmZsb3cgSVhcbiAgdHJ5IHtcbiAgICBpbml0V2ViZmxvd1Njcm9sbFRyaWdnZXJzKHtcbiAgICAgIHNjcm9sbGVyU2VsZWN0b3I6ICcucGVyc3BlY3RpdmUtd3JhcHBlcicsXG4gICAgICBpbml0RXZlbnROYW1lOiAnbG9nby1zdGFydCcsXG4gICAgICBzaHJpbmtFdmVudE5hbWU6ICdsb2dvLXNocmluaycsXG4gICAgICBncm93RXZlbnROYW1lOiAnbG9nby1ncm93J1xuICAgIH0pO1xuICB9IGNhdGNoKF8pIHt9XG5cbiAgLy8gTm90ZTogbm8gSlMgc2xpZGUgc25hcHBpbmc7IHJlbHkgb24gQ1NTIHNjcm9sbC1zbmFwIGluIGAucGVyc3BlY3RpdmUtd3JhcHBlcmBcbn1cblxuLy8gRXhwb3NlIGEgdGlueSBnbG9iYWwgZm9yIFdlYmZsb3cvRGVzaWduZXIgaG9va3Ncbi8vIChJbnRlcm5hbHMgcmVtYWluIHByaXZhdGUgaW5zaWRlIHRoZSBJSUZFIGJ1bmRsZSlcbmlmICghd2luZG93LkFwcCkgd2luZG93LkFwcCA9IHt9O1xud2luZG93LkFwcC5pbml0ID0gaW5pdDtcblxuLy8gQXV0by1pbml0IG9uIERPTSByZWFkeSAoc2FmZSBpZiBlbGVtZW50cyBhcmUgbWlzc2luZylcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG4gIHRyeSB7IHBhdGNoWW91VHViZUFsbG93VG9rZW5zKCk7IGluaXQoKTsgfSBjYXRjaCAoZXJyKSB7IGNvbnNvbGUuZXJyb3IoJ1tBcHBdIGluaXQgZXJyb3InLCBlcnIpOyB9XG59KTtcblxuXG4iXSwKICAibWFwcGluZ3MiOiAiOztBQVFPLFdBQVMsS0FBSyxNQUFNLFNBQVMsUUFBUSxTQUFTLENBQUMsR0FBRTtBQUN0RCxRQUFJO0FBQUUsYUFBTyxjQUFjLElBQUksWUFBWSxNQUFNLEVBQUUsU0FBUyxNQUFNLFlBQVksTUFBTSxPQUFPLENBQUMsQ0FBQztBQUFBLElBQUcsUUFBUTtBQUFBLElBQUM7QUFDekcsUUFBSTtBQUFFLGFBQU8sY0FBYyxJQUFJLFlBQVksTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFBRyxRQUFRO0FBQUEsSUFBQztBQUFBLEVBQzFFOzs7QUNGQSxVQUFRLElBQUksMkJBQTJCO0FBRWhDLFdBQVMsY0FBYyxVQUFVLGNBQWE7QUFDbkQsVUFBTSxPQUFPLFNBQVMsY0FBYyxPQUFPO0FBQzNDLFFBQUksQ0FBQyxNQUFLO0FBQUUsY0FBUSxJQUFJLDRCQUE0QjtBQUFHO0FBQUEsSUFBUTtBQUUvRCxVQUFNLE9BQU8sUUFBTSxHQUFHLFVBQVUsU0FBUyx3QkFBd0I7QUFDakUsVUFBTSxPQUFPLFFBQU0sR0FBRyxVQUFVLFNBQVMsd0JBQXdCO0FBQ2pFLFVBQU0sVUFBVSxVQUFRLDZCQUFNLGNBQWM7QUFDNUMsVUFBTSxVQUFVLFVBQVEsS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLFFBQVEsa0JBQWtCO0FBRzNFLFNBQUssaUJBQWlCLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxHQUFHLE1BQU07QUFDN0QsUUFBRSxhQUFhLFFBQVEsUUFBUTtBQUMvQixRQUFFLGFBQWEsWUFBWSxHQUFHO0FBQzlCLFlBQU0sT0FBTyxFQUFFLFFBQVEsa0RBQWtEO0FBQ3pFLFlBQU0sSUFBSSxRQUFRLElBQUk7QUFDdEIsVUFBSSxHQUFFO0FBQ0osY0FBTSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDbEMsVUFBRSxLQUFLO0FBQ1AsVUFB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
