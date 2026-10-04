/* Temporary CSSOM probe: the headless window is clamped to ~504px CSS px, so the
   max-width:500px block never activates during geometry runs. Verify those rules
   exist, parse cleanly, and carry the intended properties. */
window.addEventListener("load", function () {
  setTimeout(function () {
    var out = [];
    var sheets = document.styleSheets;
    var found = { card: 0, label: 0, heart: 0, wrapper: 0 }, ruleCount = 0;

    Array.prototype.forEach.call(sheets, function (sheet) {
      var rules;
      try { rules = sheet.cssRules; } catch (e) { return; }
      if (!rules) return;
      Array.prototype.forEach.call(rules, function (r) {
        if (r.type === CSSRule.MEDIA_RULE && /max-width:\s*500px/.test(r.conditionText || r.media.mediaText)) {
          Array.prototype.forEach.call(r.cssRules, function (mr) {
            if (!mr.selectorText) return;
            ruleCount++;
            if (/\.card-actions-header/.test(mr.selectorText)) found.card++;
            if (/\.compare-label/.test(mr.selectorText)) found.label++;
            if (/\.wishlist-btn/.test(mr.selectorText)) found.heart++;
            if (/\.product-image-wrapper/.test(mr.selectorText)) found.wrapper++;
          });
        }
      });
    });

    out.push("max500 rules found=" + ruleCount +
             " cardActionsHeader=" + found.card +
             " compareLabel=" + found.label +
             " wishlistBtn=" + found.heart +
             " imageWrapper=" + found.wrapper);

    // Confirm the base (non-media) rules still carry the required flex contract.
    var probe = document.querySelector(".card-actions-header");
    if (probe) {
      var s = getComputedStyle(probe);
      out.push("base header: display=" + s.display + " justify=" + s.justifyContent +
               " align=" + s.alignItems + " width=" + s.width + " padding=" + s.padding);
      var wl = probe.querySelector(".wishlist-btn");
      if (wl) { var ws = getComputedStyle(wl); out.push("base heart: marginLeft=" + ws.marginLeft + " flex=" + ws.flexGrow + "/" + ws.flexShrink + "/" + ws.flexBasis); }
      var cb = probe.querySelector(".compare-checkbox");
      if (cb) { var cs = getComputedStyle(cb); out.push("base checkbox: position=" + cs.position + " margin=" + cs.margin); }
    }

    var d = document.createElement("div");
    d.id = "RESULT";
    d.textContent = "RESULTSTART\n" + out.join("\n") + "\nRESULTEND";
    document.body.appendChild(d);
  }, 2000);
});
