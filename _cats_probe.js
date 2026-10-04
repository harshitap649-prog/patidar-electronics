// Probe for the "All Categories" modal grid: verifies 3 columns per row on
// mobile and that no card / label / image is clipped or overflows the viewport.
window.addEventListener('load', function () {
  var pre = document.createElement('pre');
  pre.id = 'CATS_PROBE';
  pre.textContent = 'CATS_PROBE::{"phase":"script-loaded"}';
  document.body.appendChild(pre);

  try {
    if (typeof window.openCategoriesModal === 'function') window.openCategoriesModal();

    function rect(el) {
      var r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left), r: Math.round(r.right) };
    }
    function need(el, name) { if (!el) throw new Error('missing element: ' + name); return el; }

    var grids = [].slice.call(document.querySelectorAll('.categories-modal .modal-category-grid'));
    var grid = need(grids.length ? grids[0] : null, '.categories-modal .modal-category-grid');
    var cols = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean);
    var cards = [].slice.call(document.querySelectorAll('.categories-modal .modal-category-item'));

    // children of every modal grid that are not a category item (markup sanity)
    var strayGridChildren = [];
    grids.forEach(function (g, gi) {
      [].slice.call(g.children).forEach(function (ch) {
        if (!ch.classList.contains('modal-category-item')) strayGridChildren.push('grid' + gi + ':' + ch.tagName);
      });
    });

    var firstTop = Math.round(cards[0].getBoundingClientRect().top);
    var firstRow = cards.filter(function (c) {
      return Math.round(c.getBoundingClientRect().top) === firstTop;
    }).length;

    var clipped = [];
    var maxImgH = 0;
    var maxCardRight = 0;
    cards.forEach(function (c) {
      var name = c.getAttribute('data-category') || '?';
      var cr = rect(c);
      maxCardRight = Math.max(maxCardRight, cr.r);
      if (c.scrollWidth > c.clientWidth + 1) clipped.push(name + ' card ' + c.scrollWidth + '>' + c.clientWidth);
      var lbl = c.querySelector('.modal-category-label');
      if (lbl && lbl.scrollWidth > lbl.clientWidth + 1) clipped.push(name + ' label ' + lbl.scrollWidth + '>' + lbl.clientWidth);
      var img = c.querySelector('img');
      var tile = c.querySelector('.modal-category-icon');
      if (img && tile) {
        var ir = rect(img);
        var tr = rect(tile);
        maxImgH = Math.max(maxImgH, ir.h);
        if (ir.r > tr.r + 1 || ir.w > tr.w + 1) clipped.push(name + ' img-vs-tile ' + ir.w + 'x' + ir.h + ' / ' + tr.w + 'x' + tr.h);
      }
    });

    var tile0 = rect(need(cards[0].querySelector('.modal-category-icon'), 'card[0] icon'));
    var img0 = rect(need(cards[0].querySelector('img'), 'card[0] img'));
    var gridBox = rect(grid);
    var docSW = document.documentElement.scrollWidth;
    var modalBody = need(document.getElementById('modalBody'), '#modalBody');
    var modalContent = need(document.querySelector('.categories-modal .modal-content'), '.modal-content');

    var out = {
      viewport: window.innerWidth + 'x' + window.innerHeight,
      modalGrids: grids.length,
      strayGridChildren: strayGridChildren,
      columns: cols.length,
      columnWidths: cols,
      firstRowCards: firstRow,
      totalCards: cards.length,
      gridClient: grid.clientWidth,
      gridScroll: grid.scrollWidth,
      gridBoxW: gridBox.w,
      card0: rect(cards[0]).w + 'x' + rect(cards[0]).h,
      tile0: tile0.w + 'x' + tile0.h,
      img0: img0.w + 'x' + img0.h,
      maxImgH: Math.round(maxImgH),
      maxCardRight: maxCardRight,
      modalBodyClient: modalBody.clientWidth,
      modalBodyScroll: modalBody.scrollWidth,
      modalContentClient: modalContent.clientWidth,
      modalContentScroll: modalContent.scrollWidth,
      docScrollWidth: docSW,
      bodyOverflowX: docSW - window.innerWidth,
      gridOverflow: grid.scrollWidth - grid.clientWidth,
      clipped: clipped
    };

    pre.textContent = 'CATS_PROBE::' + JSON.stringify(out);
  } catch (e) {
    pre.textContent = 'CATS_PROBE_ERROR::' + (e && e.message ? e.message : String(e));
  }
});
