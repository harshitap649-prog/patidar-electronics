/* =============================================================================
 * Patidar Electronics - shared "Back" navigation (nav.js)
 * -----------------------------------------------------------------------------
 * mobiles.html, category.html and wishlist.html all render the same
 * "< Back" control in .header-top, and all three used to decide how to go back
 * with `window.history.length > 1`. That test is wrong on its own: a fresh tab
 * or a direct URL entry still reports a length above 1, so history.back() ran
 * and left the shopper on about:blank - which reads as a dead button.
 *
 * document.referrer is the signal that actually distinguishes "arrived from
 * somewhere in this session" from "opened cold". It is empty on a typed URL, a
 * bookmark, a fresh tab and a link opened in a new tab, which are exactly the
 * cases that need the fallback.
 *
 * Loaded by every page that owns a Back button, so the three cannot drift apart.
 * Exposed as window.goBack so the existing onclick="goBack()" markup keeps
 * working untouched.
 * ========================================================================== */

(function (global) {
  "use strict";

  // Where Back lands when there is genuinely nowhere to go back to.
  var HOME = "index.html";

  /**
   * True when this page was navigated to from another page in the current
   * session, i.e. history.back() has somewhere real to go.
   *
   * Both conditions are required:
   *   - history.length > 1  there is at least one entry to step to
   *   - a non-empty referrer that is not this page itself, which rules out a
   *     reload (a reload keeps the referrer but must not navigate away) and a
   *     cold open
   */
  function hasSessionHistory() {
    var ref = global.document && global.document.referrer;
    if (!ref) return false;

    // A reload reports itself as the referrer; stepping back then either loops
    // or exits the site, which is never what the shopper meant.
    if (ref === global.location.href) return false;

    return global.history.length > 1;
  }

  /** Shared Back handler: step back when that is meaningful, else go home. */
  function goBack() {
    if (hasSessionHistory()) {
      global.history.back();
      return;
    }
    global.location.href = HOME;
  }

  global.PatidarNav = {
    goBack: goBack,
    hasSessionHistory: hasSessionHistory,
    HOME: HOME
  };

  // Kept as a plain global for the existing inline onclick="goBack()" callers.
  global.goBack = goBack;
})(window);