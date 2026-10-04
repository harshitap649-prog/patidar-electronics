// Probe: force a broken image and confirm the transparent-outline fallback kicks in.
window.addEventListener("load", function () {
  setTimeout(function () {
    var img = document.querySelector("img.product-image");
    var before = img.src.slice(0, 40);
    img.setAttribute("data-title", "Broken Test (Pro)");
    img.src = "images/definitely-missing-xyz.png";
    setTimeout(function () {
      var box = img.getBoundingClientRect();
      var d = {
        beforeWasDataUri: before.indexOf("data:image/svg+xml,") === 0,
        afterIsOutline: img.src.indexOf("%23CBD5E1") > -1 && img.src.indexOf("No%20image") > -1,
        rendered: img.naturalWidth > 0,
        placeholderClass: img.classList.contains("is-placeholder"),
        alt: img.alt,
        box: [Math.round(box.width), Math.round(box.height)],
        stillInsideWrapper: (function () {
          var w = img.parentElement.getBoundingClientRect();
          return box.width <= w.width + 1 && box.height <= w.height + 1;
        })(),
      };
      var pre = document.createElement("pre");
      pre.id = "PROBE_RESULT";
      pre.textContent = "PROBE::" + JSON.stringify(d);
      document.body.appendChild(pre);
    }, 900);
  }, 1200);
});
