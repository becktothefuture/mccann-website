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
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.setAttribute("frameborder", "0");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    container.innerHTML = "";
    container.appendChild(iframe);
  }

  // src/modules/lightbox.js
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
    const slides = document.querySelectorAll(".scroll-wrapper .slide");
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

  // src/app.js
  function init(options = {}) {
    const lightboxRoot = options.lightboxRoot || "#project-lightbox";
    initAccordion(".accordeon");
    initLightbox({ root: lightboxRoot, closeDelayMs: 1e3 });
  }
  if (!window.App) window.App = {};
  window.App.init = init;
  document.addEventListener("DOMContentLoaded", () => {
    try {
      init();
    } catch (err) {
      console.error("[App] init error", err);
    }
  });
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvcmUvZXZlbnRzLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2FjY29yZGlvbi5qcyIsICIuLi9zcmMvY29yZS9zY3JvbGxsb2NrLmpzIiwgIi4uL3NyYy9tb2R1bGVzL3ZpbWVvLmpzIiwgIi4uL3NyYy9tb2R1bGVzL2xpZ2h0Ym94LmpzIiwgIi4uL3NyYy9hcHAuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqICBNY0Nhbm4gV2Vic2l0ZSBcdTIwMTQgRXZlbnRzIFV0aWxpdHlcbiAqICBQdXJwb3NlOiBFbWl0IGJ1YmJsaW5nIEN1c3RvbUV2ZW50cyBjb21wYXRpYmxlIHdpdGggR1NBUC1VSSAod2luZG93IHNjb3BlKVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXQobmFtZSwgdGFyZ2V0ID0gd2luZG93LCBkZXRhaWwgPSB7fSl7XG4gIHRyeSB7IHRhcmdldC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCB7IGJ1YmJsZXM6IHRydWUsIGNhbmNlbGFibGU6IHRydWUsIGRldGFpbCB9KSk7IH0gY2F0Y2gge31cbiAgdHJ5IHsgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KG5hbWUsIHsgZGV0YWlsIH0pKTsgfSBjYXRjaCB7fVxufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEFjY29yZGlvbiBNb2R1bGVcbiAqICBQdXJwb3NlOiBBUklBLCBzbW9vdGggdHJhbnNpdGlvbnMsIFJPIGltYWdlIHNhZmV0eVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0IHsgZW1pdCB9IGZyb20gJy4uL2NvcmUvZXZlbnRzLmpzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRBY2NvcmRpb24ocm9vdFNlbCA9ICcuYWNjb3JkZW9uJyl7XG4gIGNvbnN0IHJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHJvb3RTZWwpO1xuICBpZiAoIXJvb3QpeyBjb25zb2xlLmxvZygnW0FDQ09SRElPTl0gcm9vdCBub3QgZm91bmQnKTsgcmV0dXJuOyB9XG5cbiAgY29uc3QgaXNMMSA9IGVsID0+IGVsLmNsYXNzTGlzdC5jb250YWlucygnYWNjb3JkZW9uLWl0ZW0tLWxldmVsMScpO1xuICBjb25zdCBpc0wyID0gZWwgPT4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdhY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gIGNvbnN0IHBhbmVsT2YgPSBpdGVtID0+IGl0ZW0/LnF1ZXJ5U2VsZWN0b3IoJzpzY29wZSA+IC5hY2NvcmRlb25fX2xpc3QnKTtcbiAgY29uc3QgZ3JvdXBPZiA9IGl0ZW0gPT4gaXNMMShpdGVtKSA/IHJvb3QgOiBpdGVtLmNsb3Nlc3QoJy5hY2NvcmRlb25fX2xpc3QnKTtcblxuICAvLyBBUklBIGJvb3RzdHJhcFxuICByb290LnF1ZXJ5U2VsZWN0b3JBbGwoJy5hY2NvcmRlb25fX3RyaWdnZXInKS5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgdC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnYnV0dG9uJyk7XG4gICAgdC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzAnKTtcbiAgICBjb25zdCBpdGVtID0gdC5jbG9zZXN0KCcuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMSwgLmFjY29yZGVvbi1pdGVtLS1sZXZlbDInKTtcbiAgICBjb25zdCBwID0gcGFuZWxPZihpdGVtKTtcbiAgICBpZiAocCl7XG4gICAgICBjb25zdCBwaWQgPSBwLmlkIHx8IGBhY2MtcGFuZWwtJHtpfWA7XG4gICAgICBwLmlkID0gcGlkO1xuICAgICAgdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCBwaWQpO1xuICAgICAgdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGV4cGFuZChwKXtcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9IHAuc2Nyb2xsSGVpZ2h0ICsgJ3B4JztcbiAgICBwLmRhdGFzZXQuc3RhdGUgPSAnb3BlbmluZyc7XG4gICAgY29uc3Qgb25FbmQgPSAoZSkgPT4ge1xuICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSAnbWF4LWhlaWdodCcpIHJldHVybjtcbiAgICAgIHAucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgICAgIGlmIChwLmRhdGFzZXQuc3RhdGUgPT09ICdvcGVuaW5nJyl7XG4gICAgICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gJ25vbmUnO1xuICAgICAgICBwLmRhdGFzZXQuc3RhdGUgPSAnb3Blbic7XG4gICAgICB9XG4gICAgfTtcbiAgICBwLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gIH1cblxuICBmdW5jdGlvbiBjb2xsYXBzZShwKXtcbiAgICBjb25zdCBoID0gcC5zdHlsZS5tYXhIZWlnaHQgPT09ICdub25lJyA/IHAuc2Nyb2xsSGVpZ2h0IDogcGFyc2VGbG9hdChwLnN0eWxlLm1heEhlaWdodCB8fCAwKTtcbiAgICBwLnN0eWxlLm1heEhlaWdodCA9IChoIHx8IHAuc2Nyb2xsSGVpZ2h0KSArICdweCc7XG4gICAgcC5vZmZzZXRIZWlnaHQ7IC8vIHJlZmxvd1xuICAgIHAuc3R5bGUubWF4SGVpZ2h0ID0gJzBweCc7XG4gICAgcC5kYXRhc2V0LnN0YXRlID0gJ2Nsb3NpbmcnO1xuICAgIGNvbnN0IG9uRW5kID0gKGUpID0+IHtcbiAgICAgIGlmIChlLnByb3BlcnR5TmFtZSAhPT0gJ21heC1oZWlnaHQnKSByZXR1cm47XG4gICAgICBwLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBvbkVuZCk7XG4gICAgICBwLmRhdGFzZXQuc3RhdGUgPSAnY29sbGFwc2VkJztcbiAgICB9O1xuICAgIHAuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIG9uRW5kKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlU2libGluZ3MoaXRlbSl7XG4gICAgY29uc3QgZ3JvdXAgPSBncm91cE9mKGl0ZW0pOyBpZiAoIWdyb3VwKSByZXR1cm47XG4gICAgY29uc3Qgd2FudCA9IGlzTDEoaXRlbSkgPyAnYWNjb3JkZW9uLWl0ZW0tLWxldmVsMScgOiAnYWNjb3JkZW9uLWl0ZW0tLWxldmVsMic7XG4gICAgQXJyYXkuZnJvbShncm91cC5jaGlsZHJlbikuZm9yRWFjaChzaWIgPT4ge1xuICAgICAgaWYgKHNpYiA9PT0gaXRlbSB8fCAhc2liLmNsYXNzTGlzdD8uY29udGFpbnMod2FudCkpIHJldHVybjtcbiAgICAgIGNvbnN0IHAgPSBwYW5lbE9mKHNpYik7XG4gICAgICBpZiAocCAmJiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicgfHwgcC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpKXtcbiAgICAgICAgY29sbGFwc2UocCk7XG4gICAgICAgIGNvbnN0IHRyaWcgPSBzaWIucXVlcnlTZWxlY3RvcignLmFjY29yZGVvbl9fdHJpZ2dlcicpO1xuICAgICAgICB0cmlnPy5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICAgICAgZW1pdChpc0wxKGl0ZW0pID8gJ0FDQ19MMV9DTE9TRScgOiAnQUNDX0wyX0NMT1NFJywgc2liLCB7IHNvdXJjZTogJ3NpYmxpbmcnIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXRBbGxMMigpe1xuICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDIgLmFjY29yZGVvbl9fbGlzdCcpLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicgfHwgcC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpe1xuICAgICAgICBjb2xsYXBzZShwKTtcbiAgICAgICAgY29uc3QgaXQgPSBwLmNsb3Nlc3QoJy5hY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gICAgICAgIGl0Py5xdWVyeVNlbGVjdG9yKCcuYWNjb3JkZW9uX190cmlnZ2VyJyk/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgICBlbWl0KCdBQ0NfTDJfQ0xPU0UnLCBpdCwgeyBzb3VyY2U6ICdyZXNldC1hbGwnIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gdG9nZ2xlKGl0ZW0pe1xuICAgIGNvbnN0IHAgPSBwYW5lbE9mKGl0ZW0pOyBpZiAoIXApIHJldHVybjtcbiAgICBjb25zdCB0cmlnID0gaXRlbS5xdWVyeVNlbGVjdG9yKCcuYWNjb3JkZW9uX190cmlnZ2VyJyk7XG4gICAgY29uc3Qgb3BlbmluZyA9ICEocC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbicgfHwgcC5kYXRhc2V0LnN0YXRlID09PSAnb3BlbmluZycpO1xuICAgIGNsb3NlU2libGluZ3MoaXRlbSk7XG4gICAgaWYgKG9wZW5pbmcgJiYgaXNMMShpdGVtKSkgcmVzZXRBbGxMMigpO1xuXG4gICAgaWYgKG9wZW5pbmcpe1xuICAgICAgZXhwYW5kKHApOyB0cmlnPy5zZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgICAgZW1pdChpc0wxKGl0ZW0pID8gJ0FDQ19MMV9PUEVOJyA6ICdBQ0NfTDJfT1BFTicsIGl0ZW0sIHsgb3BlbmluZzogdHJ1ZSB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29sbGFwc2UocCk7IHRyaWc/LnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgICAgaWYgKGlzTDEoaXRlbSkpIHJlc2V0QWxsTDIoKTtcbiAgICAgIGVtaXQoaXNMMShpdGVtKSA/ICdBQ0NfTDFfQ0xPU0UnIDogJ0FDQ19MMl9DTE9TRScsIGl0ZW0sIHsgb3BlbmluZzogZmFsc2UgfSk7XG4gICAgfVxuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdqcy1wcmVwJyk7XG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fbGlzdCcpLmZvckVhY2gocCA9PiB7IHAuc3R5bGUubWF4SGVpZ2h0ID0gJzBweCc7IHAuZGF0YXNldC5zdGF0ZSA9ICdjb2xsYXBzZWQnOyB9KTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnanMtcHJlcCcpKTtcblxuICByb290LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2NvcmRlb25fX3RyaWdnZXInKTsgaWYgKCF0IHx8ICFyb290LmNvbnRhaW5zKHQpKSByZXR1cm47XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGl0ZW0gPSB0LmNsb3Nlc3QoJy5hY2NvcmRlb24taXRlbS0tbGV2ZWwxLCAuYWNjb3JkZW9uLWl0ZW0tLWxldmVsMicpO1xuICAgIGl0ZW0gJiYgdG9nZ2xlKGl0ZW0pO1xuICB9KTtcbiAgcm9vdC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgY29uc3QgdCA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5hY2NvcmRlb25fX3RyaWdnZXInKTsgaWYgKCF0IHx8ICFyb290LmNvbnRhaW5zKHQpKSByZXR1cm47XG4gICAgaWYgKGUua2V5ICE9PSAnRW50ZXInICYmIGUua2V5ICE9PSAnICcpIHJldHVybjtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgaXRlbSA9IHQuY2xvc2VzdCgnLmFjY29yZGVvbi1pdGVtLS1sZXZlbDEsIC5hY2NvcmRlb24taXRlbS0tbGV2ZWwyJyk7XG4gICAgaXRlbSAmJiB0b2dnbGUoaXRlbSk7XG4gIH0pO1xuXG4gIGNvbnN0IHJvID0gbmV3IFJlc2l6ZU9ic2VydmVyKGVudHJpZXMgPT4ge1xuICAgIGVudHJpZXMuZm9yRWFjaCgoeyB0YXJnZXQ6IHAgfSkgPT4ge1xuICAgICAgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW4nKXsgcC5zdHlsZS5tYXhIZWlnaHQgPSAnbm9uZSc7IH1cbiAgICAgIGVsc2UgaWYgKHAuZGF0YXNldC5zdGF0ZSA9PT0gJ29wZW5pbmcnKXsgcC5zdHlsZS5tYXhIZWlnaHQgPSBwLnNjcm9sbEhlaWdodCArICdweCc7IH1cbiAgICB9KTtcbiAgfSk7XG4gIHJvb3QucXVlcnlTZWxlY3RvckFsbCgnLmFjY29yZGVvbl9fbGlzdCcpLmZvckVhY2gocCA9PiByby5vYnNlcnZlKHApKTtcbn1cblxuXG4iLCAiLyoqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogIE1jQ2FubiBXZWJzaXRlIFx1MjAxNCBTY3JvbGwgTG9jayAoSHlicmlkLCBpT1Mtc2FmZSlcbiAqICBQdXJwb3NlOiBSZWxpYWJsZSBwYWdlIHNjcm9sbCBsb2NraW5nIHdpdGggZXhhY3QgcmVzdG9yZVxuICogIERhdGU6IDIwMjUtMTAtMjhcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxubGV0IGxvY2tzID0gMDtcbmxldCBzYXZlZFkgPSAwO1xubGV0IHByZXZTY3JvbGxCZWhhdmlvciA9ICcnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9ja1Njcm9sbCgpe1xuICBpZiAobG9ja3MrKykgcmV0dXJuO1xuICBjb25zdCBkZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgcHJldlNjcm9sbEJlaGF2aW9yID0gZGUuc3R5bGUuc2Nyb2xsQmVoYXZpb3I7XG4gIGRlLnN0eWxlLnNjcm9sbEJlaGF2aW9yID0gJ2F1dG8nO1xuICBzYXZlZFkgPSB3aW5kb3cuc2Nyb2xsWSB8fCBkZS5zY3JvbGxUb3AgfHwgMDtcblxuICAvLyBGaXhlZC1ib2R5ICsgbW9kYWwtb3BlbiBjbGFzcyBmb3IgQ1NTIGhvb2tzXG4gIE9iamVjdC5hc3NpZ24oZG9jdW1lbnQuYm9keS5zdHlsZSwge1xuICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgIHRvcDogYC0ke3NhdmVkWX1weGAsXG4gICAgbGVmdDogJzAnLFxuICAgIHJpZ2h0OiAnMCcsXG4gICAgd2lkdGg6ICcxMDAlJyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgb3ZlcnNjcm9sbEJlaGF2aW9yOiAnbm9uZSdcbiAgfSk7XG4gIHRyeSB7IGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnbW9kYWwtb3BlbicpOyB9IGNhdGNoIHt9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bmxvY2tTY3JvbGwoeyBkZWxheU1zID0gMCB9ID0ge30pe1xuICBjb25zdCBydW4gPSAoKSA9PiB7XG4gICAgaWYgKC0tbG9ja3MgPiAwKSByZXR1cm47XG4gICAgY29uc3QgZGUgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gICAgT2JqZWN0LmFzc2lnbihkb2N1bWVudC5ib2R5LnN0eWxlLCB7XG4gICAgICBwb3NpdGlvbjogJycsIHRvcDogJycsIGxlZnQ6ICcnLCByaWdodDogJycsIHdpZHRoOiAnJywgb3ZlcmZsb3c6ICcnLCBvdmVyc2Nyb2xsQmVoYXZpb3I6ICcnXG4gICAgfSk7XG4gICAgdHJ5IHsgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1vcGVuJyk7IH0gY2F0Y2gge31cbiAgICBkZS5zdHlsZS5zY3JvbGxCZWhhdmlvciA9IHByZXZTY3JvbGxCZWhhdmlvciB8fCAnJztcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgc2F2ZWRZKTtcbiAgfTtcbiAgZGVsYXlNcyA/IHNldFRpbWVvdXQocnVuLCBkZWxheU1zKSA6IHJ1bigpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IFZpbWVvIEhlbHBlclxuICogIFB1cnBvc2U6IE1vdW50L3JlcGxhY2UgVmltZW8gaWZyYW1lIHdpdGggcHJpdmFjeSBvcHRpb25zXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5mdW5jdGlvbiBwYXJzZVZpbWVvSWQoaW5wdXQpe1xuICBpZiAoIWlucHV0KSByZXR1cm4gJyc7XG4gIGNvbnN0IHN0ciA9IFN0cmluZyhpbnB1dCkudHJpbSgpO1xuICAvLyBBY2NlcHQgYmFyZSBJRHNcbiAgaWYgKC9eXFxkKyQvLnRlc3Qoc3RyKSkgcmV0dXJuIHN0cjtcbiAgLy8gRXh0cmFjdCBmcm9tIGtub3duIFVSTCBmb3Jtc1xuICB0cnkge1xuICAgIGNvbnN0IHUgPSBuZXcgVVJMKHN0ciwgJ2h0dHBzOi8vZXhhbXBsZS5jb20nKTtcbiAgICBjb25zdCBob3N0ID0gdS5ob3N0bmFtZSB8fCAnJztcbiAgICBpZiAoaG9zdC5pbmNsdWRlcygndmltZW8uY29tJykpe1xuICAgICAgLy8gL3ZpZGVvL3tpZH0gb3IgL3tpZH1cbiAgICAgIGNvbnN0IHBhcnRzID0gdS5wYXRobmFtZS5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIGNvbnN0IGxhc3QgPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSB8fCAnJztcbiAgICAgIGNvbnN0IGlkID0gbGFzdC5tYXRjaCgvXFxkKy8pPy5bMF0gfHwgJyc7XG4gICAgICByZXR1cm4gaWQgfHwgJyc7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIHJldHVybiAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1vdW50VmltZW8oY29udGFpbmVyLCBpbnB1dElkLCBwYXJhbXMgPSB7fSl7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm47XG4gIGNvbnN0IGlkID0gcGFyc2VWaW1lb0lkKGlucHV0SWQpO1xuICBpZiAoIWlkKXsgY29udGFpbmVyLmlubmVySFRNTCA9ICcnOyByZXR1cm47IH1cbiAgY29uc3QgcXVlcnkgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgZG50OiAxLCAuLi5wYXJhbXMgfSkudG9TdHJpbmcoKTtcbiAgY29uc3Qgc3JjID0gYGh0dHBzOi8vcGxheWVyLnZpbWVvLmNvbS92aWRlby8ke2lkfT8ke3F1ZXJ5fWA7XG4gIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICBpZnJhbWUuc3JjID0gc3JjO1xuICBpZnJhbWUuYWxsb3cgPSAnYXV0b3BsYXk7IGZ1bGxzY3JlZW47IHBpY3R1cmUtaW4tcGljdHVyZSc7XG4gIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lYm9yZGVyJywgJzAnKTtcbiAgaWZyYW1lLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChpZnJhbWUpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IExpZ2h0Ym94IE1vZHVsZVxuICogIFB1cnBvc2U6IEZvY3VzIHRyYXAsIG91dHNpZGUtY2xpY2ssIGluZXJ0L2FyaWEgZmFsbGJhY2ssIHJlLWVudHJhbmN5XG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBlbWl0IH0gZnJvbSAnLi4vY29yZS9ldmVudHMuanMnO1xuaW1wb3J0IHsgbG9ja1Njcm9sbCwgdW5sb2NrU2Nyb2xsIH0gZnJvbSAnLi4vY29yZS9zY3JvbGxsb2NrLmpzJztcbmltcG9ydCB7IG1vdW50VmltZW8gfSBmcm9tICcuL3ZpbWVvLmpzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRMaWdodGJveCh7IHJvb3QgPSAnI3Byb2plY3QtbGlnaHRib3gnLCBjbG9zZURlbGF5TXMgPSAxMDAwIH0gPSB7fSl7XG4gIGNvbnN0IGxiID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290KTtcbiAgaWYgKCFsYil7IGNvbnNvbGUubG9nKCdbTElHSFRCT1hdIG5vdCBmb3VuZCcpOyByZXR1cm47IH1cblxuICAvLyBFbnN1cmUgYmFzZWxpbmUgZGlhbG9nIGExMXkgYXR0cmlidXRlc1xuICBsYi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCBsYi5nZXRBdHRyaWJ1dGUoJ3JvbGUnKSB8fCAnZGlhbG9nJyk7XG4gIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1tb2RhbCcsIGxiLmdldEF0dHJpYnV0ZSgnYXJpYS1tb2RhbCcpIHx8ICd0cnVlJyk7XG4gIGxiLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCBsYi5nZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykgfHwgJ3RydWUnKTtcblxuICBjb25zdCBpbm5lciA9IGxiLnF1ZXJ5U2VsZWN0b3IoJy5wcm9qZWN0LWxpZ2h0Ym94X19pbm5lcicpO1xuICBjb25zdCB2aWRlb0FyZWEgPSBsYi5xdWVyeVNlbGVjdG9yKCcudmlkZW8tYXJlYScpO1xuICBjb25zdCBzbGlkZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuc2Nyb2xsLXdyYXBwZXIgLnNsaWRlJyk7XG4gIGNvbnN0IHByZWZlcnNSZWR1Y2VkID0gbWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb246IHJlZHVjZSknKS5tYXRjaGVzO1xuXG4gIGxldCBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgbGV0IGxhc3RGb2N1cyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gc2V0UGFnZUluZXJ0KG9uKXtcbiAgICBjb25zdCBzaWJsaW5ncyA9IEFycmF5LmZyb20oZG9jdW1lbnQuYm9keS5jaGlsZHJlbikuZmlsdGVyKG4gPT4gbiAhPT0gbGIpO1xuICAgIHNpYmxpbmdzLmZvckVhY2gobiA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoJ2luZXJ0JyBpbiBuKSBuLmluZXJ0ID0gISFvbjtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGlmIChvbikgbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgIGVsc2Ugbi5yZW1vdmVBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJyk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFwRm9jdXMoZSl7XG4gICAgaWYgKGUua2V5ICE9PSAnVGFiJykgcmV0dXJuO1xuICAgIGNvbnN0IGZvY3VzYWJsZXMgPSBsYi5xdWVyeVNlbGVjdG9yQWxsKFtcbiAgICAgICdhW2hyZWZdJywnYnV0dG9uJywnaW5wdXQnLCdzZWxlY3QnLCd0ZXh0YXJlYScsXG4gICAgICAnW3RhYmluZGV4XTpub3QoW3RhYmluZGV4PVwiLTFcIl0pJ1xuICAgIF0uam9pbignLCcpKTtcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuZnJvbShmb2N1c2FibGVzKS5maWx0ZXIoZWwgPT4gIWVsLmhhc0F0dHJpYnV0ZSgnZGlzYWJsZWQnKSAmJiAhZWwuZ2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKTtcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDApeyBlLnByZXZlbnREZWZhdWx0KCk7IChpbm5lciB8fCBsYikuZm9jdXMoKTsgcmV0dXJuOyB9XG4gICAgY29uc3QgZmlyc3QgPSBsaXN0WzBdO1xuICAgIGNvbnN0IGxhc3QgPSBsaXN0W2xpc3QubGVuZ3RoIC0gMV07XG4gICAgaWYgKGUuc2hpZnRLZXkgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gZmlyc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGxhc3QuZm9jdXMoKTsgfVxuICAgIGVsc2UgaWYgKCFlLnNoaWZ0S2V5ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IGxhc3QpeyBlLnByZXZlbnREZWZhdWx0KCk7IGZpcnN0LmZvY3VzKCk7IH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9wZW5Gcm9tU2xpZGUoc2xpZGUpe1xuICAgIGlmIChvcGVuR3VhcmQpIHJldHVybjtcbiAgICBvcGVuR3VhcmQgPSB0cnVlO1xuICAgIGxhc3RGb2N1cyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgOiBudWxsO1xuXG4gICAgY29uc3QgdmlkZW8gPSBzbGlkZT8uZGF0YXNldD8udmlkZW8gfHwgJyc7XG4gICAgY29uc3QgdGl0bGUgPSBzbGlkZT8uZGF0YXNldD8udGl0bGUgfHwgJyc7XG4gICAgY29uc3QgdGV4dCAgPSBzbGlkZT8uZGF0YXNldD8udGV4dCAgfHwgJyc7XG5cbiAgICBpZiAodmlkZW9BcmVhKSBtb3VudFZpbWVvKHZpZGVvQXJlYSwgdmlkZW8sIHsgYXV0b3BsYXk6IDEsIG11dGVkOiAxLCBjb250cm9sczogMCwgYmFja2dyb3VuZDogMSwgcGxheXNpbmxpbmU6IDEsIGRudDogMSB9KTtcbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgbGIuc2V0QXR0cmlidXRlKCdkYXRhLW9wZW4nLCAndHJ1ZScpO1xuICAgIHNldFBhZ2VJbmVydCh0cnVlKTtcbiAgICBsb2NrU2Nyb2xsKCk7XG5cbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XG4gICAgKGlubmVyIHx8IGxiKS5mb2N1cygpO1xuXG4gICAgZW1pdCgnTElHSFRCT1hfT1BFTicsIGxiLCB7IHZpZGVvLCB0aXRsZSwgdGV4dCB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcXVlc3RDbG9zZSgpe1xuICAgIGlmICghb3Blbkd1YXJkKSByZXR1cm47XG4gICAgZW1pdCgnTElHSFRCT1hfQ0xPU0UnLCBsYik7XG4gICAgaWYgKHByZWZlcnNSZWR1Y2VkKXtcbiAgICAgIHVubG9ja1Njcm9sbCh7IGRlbGF5TXM6IDAgfSk7XG4gICAgICBlbWl0KCdMSUdIVEJPWF9DTE9TRURfRE9ORScsIGxiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdW5sb2NrU2Nyb2xsKHsgZGVsYXlNczogY2xvc2VEZWxheU1zIH0pO1xuICAgIH1cbiAgICBsYi5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICBsYi5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtb3BlbicpO1xuICAgIHNldFBhZ2VJbmVydChmYWxzZSk7XG4gICAgaWYgKHZpZGVvQXJlYSkgdmlkZW9BcmVhLmlubmVySFRNTCA9ICcnO1xuICAgIGlmIChsYXN0Rm9jdXMgJiYgZG9jdW1lbnQuYm9keS5jb250YWlucyhsYXN0Rm9jdXMpKSBsYXN0Rm9jdXMuZm9jdXMoKTtcbiAgICBvcGVuR3VhcmQgPSBmYWxzZTtcbiAgfVxuXG4gIHNsaWRlcy5mb3JFYWNoKHNsaWRlID0+IHNsaWRlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gb3BlbkZyb21TbGlkZShzbGlkZSkpKTtcblxuICBsYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGUgPT4ge1xuICAgIGlmIChpbm5lciAmJiAhZS50YXJnZXQuY2xvc2VzdCgnLnByb2plY3QtbGlnaHRib3hfX2lubmVyJykpIHJlcXVlc3RDbG9zZSgpO1xuICAgIGVsc2UgaWYgKCFpbm5lciAmJiBlLnRhcmdldCA9PT0gbGIpIHJlcXVlc3RDbG9zZSgpO1xuICB9KTtcblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZSA9PiB7XG4gICAgaWYgKGxiLmdldEF0dHJpYnV0ZSgnZGF0YS1vcGVuJykgPT09ICd0cnVlJyl7XG4gICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSByZXF1ZXN0Q2xvc2UoKTtcbiAgICAgIGlmIChlLmtleSA9PT0gJ1RhYicpIHRyYXBGb2N1cyhlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGxiLmFkZEV2ZW50TGlzdGVuZXIoJ0xJR0hUQk9YX0NMT1NFRF9ET05FJywgKCkgPT4gdW5sb2NrU2Nyb2xsKCkpO1xufVxuXG5cbiIsICIvKipcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiAgTWNDYW5uIFdlYnNpdGUgXHUyMDE0IEFwcCBFbnRyeVxuICogIFB1cnBvc2U6IFdpcmUgbW9kdWxlcyBhbmQgZXhwb3NlIG1pbmltYWwgZmFjYWRlXG4gKiAgRGF0ZTogMjAyNS0xMC0yOFxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBpbml0QWNjb3JkaW9uIH0gZnJvbSAnLi9tb2R1bGVzL2FjY29yZGlvbi5qcyc7XG5pbXBvcnQgeyBpbml0TGlnaHRib3ggfSBmcm9tICcuL21vZHVsZXMvbGlnaHRib3guanMnO1xuXG5mdW5jdGlvbiBpbml0KG9wdGlvbnMgPSB7fSl7XG4gIGNvbnN0IGxpZ2h0Ym94Um9vdCA9IG9wdGlvbnMubGlnaHRib3hSb290IHx8ICcjcHJvamVjdC1saWdodGJveCc7XG4gIGluaXRBY2NvcmRpb24oJy5hY2NvcmRlb24nKTtcbiAgaW5pdExpZ2h0Ym94KHsgcm9vdDogbGlnaHRib3hSb290LCBjbG9zZURlbGF5TXM6IDEwMDAgfSk7XG59XG5cbi8vIEV4cG9zZSBhIHRpbnkgZ2xvYmFsIGZvciBXZWJmbG93L0Rlc2lnbmVyIGhvb2tzXG4vLyAoSW50ZXJuYWxzIHJlbWFpbiBwcml2YXRlIGluc2lkZSB0aGUgSUlGRSBidW5kbGUpXG5pZiAoIXdpbmRvdy5BcHApIHdpbmRvdy5BcHAgPSB7fTtcbndpbmRvdy5BcHAuaW5pdCA9IGluaXQ7XG5cbi8vIEF1dG8taW5pdCBvbiBET00gcmVhZHkgKHNhZmUgaWYgZWxlbWVudHMgYXJlIG1pc3NpbmcpXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICB0cnkgeyBpbml0KCk7IH0gY2F0Y2ggKGVycikgeyBjb25zb2xlLmVycm9yKCdbQXBwXSBpbml0IGVycm9yJywgZXJyKTsgfVxufSk7XG5cblxuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFRTyxXQUFTLEtBQUssTUFBTSxTQUFTLFFBQVEsU0FBUyxDQUFDLEdBQUU7QUFDdEQsUUFBSTtBQUFFLGFBQU8sY0FBYyxJQUFJLFlBQVksTUFBTSxFQUFFLFNBQVMsTUFBTSxZQUFZLE1BQU0sT0FBTyxDQUFDLENBQUM7QUFBQSxJQUFHLFFBQVE7QUFBQSxJQUFDO0FBQ3pHLFFBQUk7QUFBRSxhQUFPLGNBQWMsSUFBSSxZQUFZLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUFBLElBQUcsUUFBUTtBQUFBLElBQUM7QUFBQSxFQUMxRTs7O0FDRE8sV0FBUyxjQUFjLFVBQVUsY0FBYTtBQUNuRCxVQUFNLE9BQU8sU0FBUyxjQUFjLE9BQU87QUFDM0MsUUFBSSxDQUFDLE1BQUs7QUFBRSxjQUFRLElBQUksNEJBQTRCO0FBQUc7QUFBQSxJQUFRO0FBRS9ELFVBQU0sT0FBTyxRQUFNLEdBQUcsVUFBVSxTQUFTLHdCQUF3QjtBQUNqRSxVQUFNLE9BQU8sUUFBTSxHQUFHLFVBQVUsU0FBUyx3QkFBd0I7QUFDakUsVUFBTSxVQUFVLFVBQVEsNkJBQU0sY0FBYztBQUM1QyxVQUFNLFVBQVUsVUFBUSxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssUUFBUSxrQkFBa0I7QUFHM0UsU0FBSyxpQkFBaUIscUJBQXFCLEVBQUUsUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUM3RCxRQUFFLGFBQWEsUUFBUSxRQUFRO0FBQy9CLFFBQUUsYUFBYSxZQUFZLEdBQUc7QUFDOUIsWUFBTSxPQUFPLEVBQUUsUUFBUSxrREFBa0Q7QUFDekUsWUFBTSxJQUFJLFFBQVEsSUFBSTtB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
