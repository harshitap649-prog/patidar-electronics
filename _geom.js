// Geometry probe: decode every generated card SVG, re-render it inline, and
// measure real text metrics to prove nothing clips, overflows or overlaps.
window.addEventListener("load", function () {
  setTimeout(function () {
    var prefix = "data:image/svg+xml,";
    var imgs = [].slice.call(document.querySelectorAll("img.product-image"));
    var host = document.createElement("div");
    host.style.cssText = "position:absolute;left:-9999px;top:0;width:400px;height:500px";
    document.body.appendChild(host);
    var issues = [];
    var samples = [];
    imgs.forEach(function (img, idx) {
      if (img.src.indexOf(prefix) !== 0) return;
      host.innerHTML = decodeURIComponent(img.src.slice(prefix.length));
      var svg = host.querySelector("svg");
      if (!svg) {
        issues.push("idx" + idx + " no-svg");
        return;
      }
      var texts = [].slice.call(svg.getElementsByTagName("text")).map(function (t) {
        return {
          text: t.textContent,
          x: parseFloat(t.getAttribute("x")),
          y: parseFloat(t.getAttribute("y")),
          len: t.getComputedTextLength(),
        };
      });
      texts.forEach(function (t) {
        if (t.x - t.len / 2 < 6 || t.x + t.len / 2 > 394) {
          issues.push("idx" + idx + " H-OVERFLOW " + t.text + " [" + (t.x - t.len / 2).toFixed(1) + ".." + (t.x + t.len / 2).toFixed(1) + "]");
        }
        if (t.y < 12 || t.y > 486) issues.push("idx" + idx + " V-OVERFLOW y=" + t.y + " " + t.text);
      });
      var brand = texts[0];
      var wordmark = texts.slice(1, texts.length - (texts.length > 1 ? 1 : 0));
      if (brand && brand.y <= 306) issues.push("idx" + idx + " brand-on-phone y=" + brand.y);
      wordmark.forEach(function (t, i) {
        if (i === 0 && brand && t.y - brand.y < 16) issues.push("idx" + idx + " brand/wordmark overlap");
        if (i > 0 && t.y - wordmark[i - 1].y < 20) issues.push("idx" + idx + " line collision");
      });
      if (idx < 4) {
        samples.push({
          title: img.getAttribute("data-title"),
          ys: texts.map(function (t) { return Math.round(t.y); }),
          widths: texts.map(function (t) { return Math.round(t.len); }),
        });
      }
    });
    var pre = document.createElement("pre");
    pre.id = "PROBE_RESULT";
    pre.textContent = "PROBE::" + JSON.stringify({
      cards: imgs.length,
      issueCount: issues.length,
      issues: issues.slice(0, 10),
      samples: samples,
    });
    document.body.appendChild(pre);
  }, 1200);
});
