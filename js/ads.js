/* =============================================================================
 * Patidar Electronics - shared footer ad loader (ads.js)
 * -----------------------------------------------------------------------------
 * One place that owns "which ad unit does this page get", shared by
 * index.html, mobiles.html, category.html and wishlist.html.
 *
 * Why JS decides instead of CSS alone
 * -----------------------------------
 * The vendor snippet pairs a global `atOptions` object with an invoke.js tag
 * per unit. Two units in one document both execute, both fire network
 * requests, and `atOptions` is a single global that the second assignment
 * clobbers. Hiding the loser with CSS still *loads* it - which double-serves
 * impressions and can void ad-policy compliance. So the breakpoint is
 * resolved here and only the matching unit is ever requested; the CSS
 * visibility rules in style.css are a second line of defence, not the switch.
 *
 * Only one ad per page, placed by the markup at the end of the document, so
 * nothing in the content flow depends on an ad arriving.
 *
 * Markup contract (identical on every page):
 *   <div class="footer-ad-wrapper" data-footer-ad>
 *     <span class="ad-sponsor-label">SPONSORED</span>
 *     <div class="ad-desktop-only" data-ad-slot="desktop"></div>
 *     <div class="ad-mobile-only"  data-ad-slot="mobile"></div>
 *   </div>
 * ========================================================================== */

(function (global) {
  "use strict";

  var doc = global.document;

  var UNITS = {
    desktop: {
      key: "614e3dec83fa1caa7a5cc128dd243077",
      width: 728,
      height: 90
    },
    mobile: {
      key: "2798500f76890875eec91a3cc5e56e06",
      width: 320,
      height: 50
    }
  };

  // Must match the breakpoints in style.css.
  var MOBILE_QUERY = "(max-width: 768px)";

  function isMobile() {
    return !!(global.matchMedia && global.matchMedia(MOBILE_QUERY).matches);
  }

  function slotFor(host, name) {
    return host.querySelector('[data-ad-slot="' + name + '"]');
  }

  /**
   * Request exactly one unit into exactly one slot.
   *
   * atOptions is assigned immediately before its invoke.js tag is appended, so
   * the tag reads the value synchronously rather than inheriting whatever a
   * previous assignment left behind.
   */
  function fill(host, name) {
    var unit = UNITS[name];
    var slot = slotFor(host, name);
    if (!slot) return;

    // Never stack two creatives in one slot (e.g. a re-render after a resize).
    slot.innerHTML = "";

    var opts = doc.createElement("script");
    opts.type = "text/javascript";
    opts.text = "window.atOptions = " + JSON.stringify({
      key: unit.key,
      format: "iframe",
      height: unit.height,
      width: unit.width,
      params: {}
    }) + ";";

    var invoke = doc.createElement("script");
    invoke.type = "text/javascript";
    invoke.async = true;
    invoke.src = "https://www.highrevenueformat.com/" + unit.key + "/invoke.js";

    slot.appendChild(opts);
    slot.appendChild(invoke);
  }

  function render() {
    var host = doc.querySelector("[data-footer-ad]");
    if (!host) return;

    var name = isMobile() ? "mobile" : "desktop";

    // Clear the unit we are not using so only one creative exists in the DOM.
    var other = name === "mobile" ? "desktop" : "mobile";
    var otherSlot = slotFor(host, other);
    if (otherSlot) otherSlot.innerHTML = "";

    if (host.getAttribute("data-ad-active") === name) return;
    host.setAttribute("data-ad-active", name);

    fill(host, name);
  }

  function init() {
    if (!doc || !doc.querySelector) return;

    render();

    // Swap on a real breakpoint change (rotating a tablet), not on every
    // resize event, which would re-request ads continuously.
    if (global.matchMedia) {
      var mq = global.matchMedia(MOBILE_QUERY);
      if (mq.addEventListener) mq.addEventListener("change", render);
      else if (mq.addListener) mq.addListener(render); // Safari < 14
    }
  }

  global.PatidarAds = { render: render, UNITS: UNITS };

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);