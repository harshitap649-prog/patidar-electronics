/* =============================================================================
 * Patidar Electronics - shared Wishlist store (wishlist.js)
 * -----------------------------------------------------------------------------
 * Single source of truth for the "Liked Products" heart system used by
 * index.html, mobiles.html, category.html and wishlist.html.
 *
 *   Storage : localStorage key "user_wishlist" -> JSON array of product IDs.
 *   IDs     : mobiles use "<slug>-<specs-nospace>-<price>"
 *             (e.g. "nothing-phone-3a-lite-8128GB-27999");
 *             showroom items use catalog-data.js `id`
 *             (e.g. "lg-tv-ua65u8300hulxl").
 *   Sync    : every mutation writes localStorage, refreshes all header badges
 *             ([data-wishlist-count]), repaints every heart button
 *             ([data-wishlist-id]) and fires a same-tab
 *             "patidar:wishlist-changed" CustomEvent. Cross-tab sync arrives
 *             via the native "storage" event.
 *   No-JS   : hearts are plain buttons; without JS nothing breaks.
 * ========================================================================== */

(function (global) {
  "use strict";

  var KEY = "user_wishlist";
  var EVENT = "patidar:wishlist-changed";

  function read() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      var seen = {};
      return arr.filter(function (id) {
        if (typeof id !== "string" || !id || seen[id]) return false;
        seen[id] = true;
        return true;
      });
    } catch (err) { return []; }
  }

  function write(ids) {
    try {
      global.localStorage.setItem(KEY, JSON.stringify(ids));
    } catch (err) { /* private mode: state still works for this view */ }
    render();
    try {
      var evt;
      if (typeof global.CustomEvent === "function") {
        evt = new global.CustomEvent(EVENT, { detail: { ids: ids.slice() } });
      } else if (global.document && global.document.createEvent) {
        evt = global.document.createEvent("CustomEvent");
        evt.initCustomEvent(EVENT, false, false, { ids: ids.slice() });
      }
      if (evt) global.dispatchEvent(evt);
    } catch (err) { /* ignore */ }
  }

  function has(id) {
    return read().indexOf(String(id)) !== -1;
  }

  /** Toggle one id. Returns true when the item is now liked. */
  function toggle(id) {
    id = String(id);
    var ids = read();
    var i = ids.indexOf(id);
    var on = i === -1;
    if (on) ids.push(id);
    else ids.splice(i, 1);
    write(ids);
    return on;
  }

  function add(id) {
    id = String(id);
    var ids = read();
    if (ids.indexOf(id) === -1) { ids.push(id); write(ids); }
    return true;
  }

  function remove(id) {
    id = String(id);
    var ids = read();
    var i = ids.indexOf(id);
    if (i !== -1) { ids.splice(i, 1); write(ids); }
    return false;
  }

  /** Paint one heart button from its liked state. */
  function paintButton(btn, on) {
    try {
      btn.classList.toggle("active", on);
      var icon = btn.querySelector("i");
      var id = btn.getAttribute("data-wishlist-id") || "item";
      if (icon) icon.className = on ? "fa-solid fa-heart" : "fa-regular fa-heart";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", (on ? "Remove " : "Add ") + id + (on ? " from" : " to") + " wishlist");
    } catch (err) { /* ignore */ }
  }

  /** Refresh badges + every heart on the page. Called after any mutation,
   *  on DOM ready, and on cross-tab storage events. */
  function render() {
    var ids = read();
    var lookup = {};
    for (var k = 0; k < ids.length; k++) lookup[ids[k]] = true;
    try {
      var badges = global.document.querySelectorAll("[data-wishlist-count]");
      for (var b = 0; b < badges.length; b++) {
        badges[b].textContent = String(ids.length);
        var wrap = badges[b].closest ? badges[b].closest("[data-wishlist-badge]") : null;
        if (wrap) wrap.style.display = ids.length ? "" : "none";
        else badges[b].style.display = ids.length ? "" : "none";
      }
      var menuLabels = global.document.querySelectorAll("[data-wishlist-menu-label]");
      for (var m = 0; m < menuLabels.length; m++) {
        menuLabels[m].textContent = "Wishlist (" + ids.length + ")";
      }
      var btns = global.document.querySelectorAll("[data-wishlist-id]");
      for (var i = 0; i < btns.length; i++) {
        paintButton(btns[i], !!lookup[btns[i].getAttribute("data-wishlist-id")]);
      }
    } catch (err) { /* DOM not ready: boot() retries */ }
  }

  /** One delegated click handler so hearts added by later re-renders work. */
  function bindOnce() {
    var doc = global.document;
    if (!doc || doc.__patidarWishlistBound) return;
    doc.__patidarWishlistBound = true;
    doc.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-wishlist-id]") : null;
      if (!t) return;
      e.preventDefault();
      toggle(t.getAttribute("data-wishlist-id"));
    });
    global.addEventListener("storage", function (e) {
      if (e && e.key === KEY) render();
    });
    global.addEventListener(EVENT, render);
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", render);
    } else {
      render();
    }
  }

  global.PatidarWishlist = {
    KEY: KEY, EVENT: EVENT,
    all: read, has: has, toggle: toggle, add: add, remove: remove,
    render: render, paintButton: paintButton
  };

  bindOnce();
})(window);
