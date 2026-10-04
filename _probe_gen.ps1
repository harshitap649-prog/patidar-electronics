$probe = @'
<script>
function __runProbe() {
  if (window.__PROBE_DONE) return; window.__PROBE_DONE = 1;
  var r = { page: location.pathname.split('/').pop() };
    try {
      var slider = document.querySelector('.slider-container');
      var strip = document.querySelector('.section-container .store-trust-strip');
      r.stripExists = !!strip;
      r.stripItems = strip ? strip.querySelectorAll('.trust-item').length : 0;
      r.stripLabels = strip ? Array.prototype.map.call(strip.querySelectorAll('.trust-text strong'), function (e) { return e.textContent.trim(); }) : [];
      r.stripBelowSlider = !!(slider && strip && strip.getBoundingClientRect().top >= slider.getBoundingClientRect().bottom - 1);
      r.stripCols = strip ? getComputedStyle(strip).gridTemplateColumns.split(' ').filter(Boolean).length : 0;
      r.stripIconsRendered = strip ? Array.prototype.every.call(strip.querySelectorAll('.trust-icon i'), function (ic) { return ic.getBoundingClientRect().width > 0; }) : false;
      var call = document.querySelector('.btn-call');
      var maps = document.querySelector('.btn-directions');
      r.callHref = call ? call.getAttribute('href') : null;
      r.callText = call ? call.textContent.trim() : null;
      var acts = document.querySelector('.store-actions');
      r.actionsCount = acts ? acts.children.length : 0;
      r.actionsRect = acts ? (function (rc) { return { w: Math.round(rc.width), h: Math.round(rc.height), top: Math.round(rc.top + window.pageYOffset) }; })(acts.getBoundingClientRect()) : null;
      r.dirBtnRect = maps ? (function (rc) { return { w: Math.round(rc.width), h: Math.round(rc.height), top: Math.round(rc.top + window.pageYOffset) }; })(maps.getBoundingClientRect()) : null;
      r.callBtnRect = call ? (function (rc) { return { w: Math.round(rc.width), h: Math.round(rc.height), top: Math.round(rc.top + window.pageYOffset) }; })(call.getBoundingClientRect()) : null;
      r.mapsHref = maps ? maps.getAttribute('href') : null;
      r.mapsText = maps ? maps.textContent.trim() : null;
      r.docHeight = document.documentElement.scrollHeight;
      r.showroomHeading = !!Array.prototype.some.call(document.querySelectorAll('h2'), function (h) { return h.textContent.indexOf('Visit Our Showroom') > -1; });
      var mf = document.querySelector('.map-box iframe');
      r.mapEmbed = !!(mf && mf.src.indexOf('output=embed') > -1);
      r.storeHours = !!document.querySelector('.store-hours');
      var cards = document.querySelectorAll('.product-card');
      r.cardCount = cards.length;
      if (cards.length) {
        var c = cards[0];
        r.badge = c.querySelector('.stock-badge') ? c.querySelector('.stock-badge').textContent.trim() : null;
        r.emi = c.querySelector('.emi-label') ? c.querySelector('.emi-label').textContent.trim() : null;
        r.price = c.querySelector('.product-price') ? c.querySelector('.product-price').textContent.trim() : null;
        r.name = c.querySelector('.product-name') ? c.querySelector('.product-name').textContent.trim() : null;
        var a = c.querySelector('a.btn-whatsapp');
        r.waHref = a ? a.getAttribute('href') : null;
        r.waText = (r.waHref && r.waHref.indexOf('text=') > -1) ? decodeURIComponent(r.waHref.split('text=')[1]) : null;
        var priceNum = parseInt(r.price.replace(/[^0-9]/g, ''), 10);
        r.emiMathOk = !!r.emi && r.emi.indexOf('\u20B9' + Math.round(priceNum / 12).toLocaleString('en-IN') + '/mo') > -1;
        r.waHasModel = !!r.waText && r.waText.indexOf(r.name) > -1;
        r.waHasPrice = !!r.waText && r.waText.indexOf(r.price) > -1;
        var spec = c.querySelector('.product-spec');
        r.waHasVariant = !!r.waText && spec ? r.waText.indexOf(c.querySelector('.product-spec').textContent.split(' | ')[0]) > -1 || r.waText.indexOf('Variant:') > -1 : false;
        r.allCardsHaveBadge = Array.prototype.every.call(cards, function (x) { return !!x.querySelector('.stock-badge'); });
        r.allCardsHaveEmi = Array.prototype.every.call(cards, function (x) { return !!x.querySelector('.emi-label'); });
        var waRect = a.getBoundingClientRect();
        r.waBtnVisible = waRect.width > 0 && waRect.height > 0;
        r.stockIconRendered = (function () { var bi = c.querySelector('.stock-badge i'); return !!bi && bi.getBoundingClientRect().width > 0; })();
        r.emiIconRendered = (function () { var ei = c.querySelector('.emi-label i'); return !!ei && ei.getBoundingClientRect().width > 0; })();
      }
      r.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    } catch (e) { r.error = String(e); }
    var pre = document.createElement('pre');
    pre.id = 'PROBE_RESULTS';
    pre.textContent = 'PROBE::' + JSON.stringify(r);
    document.body.appendChild(pre);
}
window.addEventListener('load', function () { setTimeout(__runProbe, 400); });
setTimeout(__runProbe, 3000);
</script>
</body>
'@

foreach ($page in @('index.html', 'mobiles.html')) {
  $src = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $page), [System.Text.UTF8Encoding]::new($false))
  $out = $src -replace '(?i)</body>', $probe
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) "_probe_$page"), $out, [System.Text.UTF8Encoding]::new($false))
  Write-Output "wrote _probe_$page"
}
