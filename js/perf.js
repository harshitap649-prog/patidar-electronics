/* Patidar Electronics - shared front-end performance helpers (perf.js) */

(function (global) {
  "use strict";

  var DOC = global.document;
  var SESSION_PREFIX = "patidar-perf:v1:";
  var PREFETCHED = {};

  function safeSession() {
    try { return global.sessionStorage || null; }
    catch (err) { return null; }
  }

  /* sessionStorage cache: category/tab payloads render from memory. */
  function cacheGet(key) {
    var store = safeSession();
    if (!store) return null;
    try {
      var raw = store.getItem(SESSION_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { return null; }
  }

  function cacheSet(key, value) {
    var store = safeSession();
    if (!store) return false;
    try {
      store.setItem(SESSION_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) { return false; }
  }

  /* Prefetch linked pages on hover/touch so navigation feels instant. */
  function prefetch(url) {
    if (!url || PREFETCHED[url]) return;
    PREFETCHED[url] = true;
    try {
      if (global.navigator && global.navigator.connection &&
          global.navigator.connection.saveData) return;
    } catch (err) {}
    try {
      var link = DOC.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      link.as = "document";
      DOC.head.appendChild(link);
    } catch (err) {}
    if ("fetch" in global) {
      try {
        global.fetch(url, { credentials: "same-origin" }).catch(function () {});
      } catch (err) {}
    }
  }

  function autoPrefetch(selector) {
    if (!DOC || !DOC.querySelectorAll) return;
    var nodes = DOC.querySelectorAll(selector || 'a[href$=".html"]');
    for (var i = 0; i < nodes.length; i++) {
      (function (a) {
        var url = a.getAttribute("href");
        if (!url) return;
        a.addEventListener("mouseenter", function () { prefetch(url); }, { passive: true });
        a.addEventListener("focus", function () { prefetch(url); }, { passive: true });
        a.addEventListener("touchstart", function () { prefetch(url); }, { passive: true });
      })(nodes[i]);
    }
  }

  /* debounce: at most one render per wait ms while typing/filtering. */
  function debounce(fn, wait) {
    var timer = null;
    var delay = typeof wait === "number" ? wait : 160;
    return function () {
      var ctx = this, args = arguments;
      if (timer) global.clearTimeout(timer);
      timer = global.setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /* rafRender: collapse bursts of filter calls into one paint frame. */
  var rafQueued = false;
  var rafFn = null;
  function rafRender(fn) {
    rafFn = fn;
    if (rafQueued) return;
    rafQueued = true;
    var fired = false;
    var run = function () {
      // rAF + watchdog may both fire; only the first drains the queue.
      if (fired) return;
      fired = true;
      rafQueued = false;
      var job = rafFn;
      rafFn = null;
      if (job) job();
    };
    if (typeof global.requestAnimationFrame === "function") global.requestAnimationFrame(run);
    else global.setTimeout(run, 16);
    // Watchdog: a hidden tab or non-painting frame can stall rAF
    // indefinitely; never let a queued render go dark.
    global.setTimeout(run, 100);
  }

  /* One listener on the grid wrapper: wishlist + compare + WhatsApp. */
  function delegateGrid(grid, handlers) {
    if (!grid || !handlers) return;
    grid.addEventListener("click", function (event) {
      var t = event.target;
      var heart = t && t.closest ? t.closest("[data-wishlist-id]") : null;
      if (heart && handlers.wishlist) { handlers.wishlist(heart, event); return; }
      var wa = t && t.closest ? t.closest("a.btn-whatsapp") : null;
      if (wa && handlers.whatsapp) handlers.whatsapp(wa, event);
    });
    grid.addEventListener("change", function (event) {
      var box = event.target;
      if (box && box.matches && box.matches(".compare-checkbox") && handlers.compare) {
        handlers.compare(box, event);
      }
    });
  }

  /* Upgrade data-src placeholders only; native lazy attr does the rest. */
  function lazyImages(root) {
    var scope = root || DOC;
    if (!scope || !scope.querySelectorAll) return;
    var imgs = scope.querySelectorAll("img[data-src]");
    if (!imgs.length) return;
    if ("IntersectionObserver" in global) {
      var io = new global.IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          var img = entries[i].target;
          io.unobserve(img);
          img.src = img.getAttribute("data-src");
          img.removeAttribute("data-src");
        }
      }, { rootMargin: "200px 0px" });
      for (var j = 0; j < imgs.length; j++) io.observe(imgs[j]);
    } else {
      for (var k = 0; k < imgs.length; k++) {
        imgs[k].src = imgs[k].getAttribute("data-src");
        imgs[k].removeAttribute("data-src");
      }
    }
  }

  global.PatidarPerf = {
    cacheGet: cacheGet,
    cacheSet: cacheSet,
    prefetch: prefetch,
    autoPrefetch: autoPrefetch,
    debounce: debounce,
    rafRender: rafRender,
    delegateGrid: delegateGrid,
    lazyImages: lazyImages
  };
})(window);
