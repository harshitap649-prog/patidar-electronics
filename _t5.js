(async function(){
  var out = [];
  var imgs = Array.prototype.slice.call(document.querySelectorAll('.product-image'));
  out.push('images on page: ' + imgs.length);
  for (var i = 0; i < imgs.length; i++) {
    var im = imgs[i];
    // wait for settle
    if (!im.complete) { await new Promise(function(r){ im.addEventListener('load', r, {once:true}); im.addEventListener('error', r, {once:true}); setTimeout(r, 9000); }); }
    var card = im.closest('.product-card');
    var usedFallback = im.getAttribute('src').indexOf('data:image/svg+xml') === 0;
    out.push('  ' + (card ? card.dataset.productId : '?').padEnd(24) +
             ' loaded=' + (im.naturalWidth > 0) +
             ' ' + (im.naturalWidth + 'x' + im.naturalHeight).padEnd(11) +
             ' fallback=' + usedFallback);
  }
  return out.join('\n');
})()
