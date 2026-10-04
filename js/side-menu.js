/* =============================================================================
 * Patidar Electronics - shared site menu drawer (side-menu.js)
 * -----------------------------------------------------------------------------
 * The top-header Wishlist link was duplicated on all four pages and crowded the
 * nav bar next to Location. It now lives in this slide-out drawer instead, and
 * this file owns the open/close behaviour for index.html, mobiles.html,
 * category.html and wishlist.html so the four cannot drift apart.
 *
 * Markup contract (identical on every page):
 *   <button class="menu-trigger" data-menu-open aria-controls="sideMenu">
 *   <div class="side-menu" id="sideMenu" hidden>
 *     ... <a class="side-menu-item side-menu-item-wishlist"
 *             href="wishlist.html">
 *            <i class="fa-regular fa-heart"></i>
 *            <span class="side-menu-item-label">My Wishlist</span>
 *            <span class="wishlist-badge" data-wishlist-badge>
 *              <span data-wishlist-count>0</span></span>
 *          </a>
 *   <div class="side-menu-overlay" data-menu-close hidden></div>
 *
 * Only the .is-open class and [hidden] are toggled; every visual state lives in
 * style.css so the animation stays declarative.
 *
 * Progressive enhancement: the drawer ships [hidden], so with JS disabled the
 * trigger stays hidden too and the header keeps its plain Wishlist link. The
 * pages hide that link via the .js-menu-ready class this file adds below.
 * ========================================================================== */

(function (global) {
  "use strict";

  var doc = global.document;
  var FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

  var menu = null;
  var overlay = null;
  var triggers = [];
  var lastFocused = null;

  function isOpen() {
    return !!(menu && menu.classList.contains("is-open"));
  }

  /** Open the drawer and remember what had focus so it can be restored. */
  function open(trigger) {
    if (!menu || isOpen()) return;
    lastFocused = trigger || null;

    menu.hidden = false;
    if (overlay) overlay.hidden = false;
    // Force a reflow so the browser treats the first .is-open as a transition
    // start rather than collapsing the slide-in.
    void menu.offsetWidth;
    menu.classList.add("is-open");
    if (overlay) overlay.classList.add("is-open");

    // A second flush, this time AFTER .is-open: focus() on an element the
    // browser still considers visibility:hidden is a silent no-op, so the
    // panel would open without receiving keyboard focus.
    void menu.offsetWidth;

    for (var i = 0; i < triggers.length; i++) {
      triggers[i].setAttribute("aria-expanded", "true");
    }

    // Page behind the panel must not scroll under the shopper's finger.
    doc.documentElement.style.overflow = "hidden";

    // Focus the panel for keyboard and screen-reader users.
    //
    // This has to wait a task. `visibility` is itself transitioned, and at t=0
    // the computed value is still the `hidden` start value, so a focus() issued
    // synchronously here lands on a visibility:hidden element and is silently
    // dropped. A zero-delay timer runs after that first style recalc. (A timer
    // rather than requestAnimationFrame on purpose: rAF is not guaranteed to
    // run in a background or headless tab, which would strand keyboard users.)
    // The isOpen() guard covers an immediate re-close.
    var first = menu.querySelector(FOCUSABLE);
    if (first) {
      global.setTimeout(function () {
        if (isOpen() && typeof first.focus === "function") first.focus();
      }, 0);
    }
  }

  function close() {
    if (!menu || !isOpen()) return;

    menu.classList.remove("is-open");
    if (overlay) overlay.classList.remove("is-open");

    // Wait for the 0.28s slide-out before hiding, or it would snap shut.
    global.setTimeout(function () {
      if (isOpen()) return; // reopened mid-animation
      menu.hidden = true;
      if (overlay) overlay.hidden = true;
    }, 280);

    for (var i = 0; i < triggers.length; i++) {
      triggers[i].setAttribute("aria-expanded", "false");
    }

    doc.documentElement.style.overflow = "";

    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    lastFocused = null;
  }

  function bind() {
    if (!doc || !doc.querySelector) return;

    menu = doc.getElementById("sideMenu");
    if (!menu) return; // page has no drawer markup
    overlay = doc.querySelector(".side-menu-overlay");
    triggers = Array.prototype.slice.call(doc.querySelectorAll("[data-menu-open]"));

    for (var i = 0; i < triggers.length; i++) {
      (function (t) {
        t.setAttribute("aria-expanded", "false");
        t.addEventListener("click", function () {
          if (isOpen()) close(); else open(t);
        });
      })(triggers[i]);
    }

    var closes = doc.querySelectorAll("[data-menu-close]");
    for (var c = 0; c < closes.length; c++) {
      closes[c].addEventListener("click", close);
    }

    // Escape closes. Tab is trapped inside the panel so focus cannot wander
    // behind it while the page scroll is locked.
    doc.addEventListener("keydown", function (e) {
      if (!isOpen()) return;

      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      var items = menu.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];

      if (e.shiftKey && (doc.activeElement === first || !menu.contains(doc.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && doc.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // Marks the document as drawer-capable so CSS can drop the header
    // Wishlist link. Done here (not in the markup) so no-JS keeps it.
    doc.documentElement.classList.add("js-menu-ready");

    // Deep link safety: wishlist.html# or ?# wishlist opens the drawer.
    if (/#wishlist$/.test(global.location.hash)) open(null);
  }

  global.PatidarMenu = { open: open, close: close, isOpen: isOpen };

  if (!doc) return;
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})(window);