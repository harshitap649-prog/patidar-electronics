window.addEventListener('load', function () {
  function open() {
    if (typeof window.openCategoriesModal === 'function') window.openCategoriesModal();
  }
  open();
  setTimeout(function () {
    var out = [];
    function rect(el) {
      if (!el) return 'n/a';
      var r = el.getBoundingClientRect();
      return Math.round(r.width) + 'x' + Math.round(r.height);
    }
    // Home page reference card
    var homeCard = document.querySelector('#category-section .category-card');
    if (homeCard) {
      out.push('HOME card=' + rect(homeCard) +
        ' wrapper=' + rect(homeCard.querySelector('.category-image-wrapper')) +
        ' img=' + rect(homeCard.querySelector('img')));
    }
    // Modal cards (measure first few + the largest image of each)
    var items = document.querySelectorAll('.modal-category-item');
    var overflow = 0, maxImgH = 0, maxImgW = 0;
    Array.prototype.forEach.call(items, function (it, i) {
      var icon = it.querySelector('.modal-category-icon');
      var box = it.querySelector('.modal-category-icon-container');
      var img = it.querySelector('img');
      if (it.scrollWidth > it.clientWidth + 1 || it.scrollHeight > it.clientHeight + 1) overflow++;
      if (img) {
        var r = img.getBoundingClientRect();
        maxImgH = Math.max(maxImgH, r.height);
        maxImgW = Math.max(maxImgW, r.width);
      }
      if (i < 3) {
        out.push('MODAL[' + i + '] ' + (it.getAttribute('data-category') || '') +
          ' card=' + rect(it) + ' tile=' + rect(icon) + ' container=' + rect(box) + ' img=' + rect(img));
      }
    });
    out.push('MODAL items=' + items.length + ' overflowing=' + overflow +
      ' maxImg=' + Math.round(maxImgW) + 'x' + Math.round(maxImgH) +
      ' viewport=' + window.innerWidth + 'x' + window.innerHeight);
    var pre = document.createElement('pre');
    pre.id = 'LAYOUT_METRICS';
    pre.textContent = '### ' + out.join(' ### ');
    document.body.appendChild(pre);
  }, 600);
});
