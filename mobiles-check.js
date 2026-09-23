
    // --- Product Data ---
    const products = [];
    function addProduct(brand, model, variants, colors) {
      variants.forEach(([specs, price]) => products.push({
        brand, model, specs, price, colors,
        slug: `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      }));
    }

    addProduct("Nothing", "Phone (3a) Lite", [["8/128GB", 27999], ["8/256GB", 29999]], "Black/White/Blue");
    addProduct("Nothing", "Phone (4a)", [["8/128GB", 44999], ["8/256GB", 49999], ["12/256GB", 50999]], "Black/White/Blue/Pink");
    addProduct("Nothing", "Phone (4a) Pro", [["8/128GB", 54999], ["8/256GB", 57999], ["12/256GB", 59999]], "Black/Silver/Pink");
    addProduct("Nothing", "Phone (4b)", [["8/128GB", 39999], ["8/256GB", 40999]], "Black/White/Blue");

    addProduct("Oppo", "A60 4G", [["4+64GB", 14599], ["4+128GB", 15599], ["6+128GB", 17599]], "Black/Blue");
    addProduct("Oppo", "A58", [["6+128GB", 13999]], "Black/Green");
    addProduct("Oppo", "F25 Pro 5G", [["8+128GB", 23999], ["8+256GB", 25999]], "Black/White");
    addProduct("Oppo", "F27 5G", [["8+128GB", 22999], ["8+256GB", 24999]], "Black/Blue");
    addProduct("Oppo", "F27 Pro+ 5G", [["8+128GB", 27999], ["8+256GB", 29999]], "Black/Blue");
    addProduct("Oppo", "Reno 12 5G", [["8+256GB", 32999], ["12+256GB", 35999]], "Black/Gold");
    addProduct("Oppo", "Reno 12 Pro 5G", [["12+256GB", 36999], ["12+512GB", 40999]], "Black/Gold");
    addProduct("Oppo", "Reno 12 Pro Mini 5G", [["8+128GB", 30999], ["8+256GB", 32999]], "Black/Gold");
    addProduct("Oppo", "Reno 13 5G", [["12+256GB", 37999]], "Black/Blue");
    addProduct("Oppo", "Reno 13 Pro 5G", [["12+256GB", 44999], ["12+512GB", 49999]], "Black/Blue");
    addProduct("Oppo", "Find X8 5G", [["12+256GB", 64999], ["12+512GB", 69999]], "Black/White");
    addProduct("Oppo", "Find X8 Pro 5G", [["16+512GB", 99999]], "Black/White");
    addProduct("Oppo", "Find X8 Pro Ultra", [["16+1TB", 114999]], "Black/White");

    addProduct("Realme", "P4 Lite 5G", [["4+64GB", 17099], ["4+128GB", 18099], ["6+128GB", 22099]], "Black/Blue");
    addProduct("Realme", "P4 5G", [["4+64GB", 19999], ["4+128GB", 21500], ["6+128GB", 23999], ["6+256GB", 26950]], "Black/Blue");
    addProduct("Realme", "P4X", [["8+128GB", 27999], ["8+256GB", 32999]], "Black/Blue");
    addProduct("Realme", "P4 Power", [["8+128GB", 31000], ["8+256GB", 34000]], "Black/Blue");
    addProduct("Realme", "P4S New", [["4+64GB", 26999], ["4+128GB", 29999], ["6+128GB", 35999], ["12+256GB", 41000]], "Black/Blue");
    addProduct("Realme", "C1001 New", [["4+64GB", 10999]], "Black/Blue");
    addProduct("Realme", "C100X", [["4+64GB", 16999]], "Black/Blue");
    addProduct("Realme", "C83 5G", [["4+64GB", 19450], ["4+128GB", 21499], ["4+128GB", 24455]], "Black/Blue");
    addProduct("Realme", "13x 5G", [["4+128GB", 25999], ["6+128GB", 27999], ["6+256GB", 30999]], "Black/Blue");
    addProduct("Realme", "15T 5G", [["6+128GB", 20999], ["8+128GB", 22999]], "Black/Blue");
    addProduct("Realme", "16 5G", [["8+128GB", 28999], ["8+256GB", 30999], ["12+256GB", 32999]], "Black/Blue");
    addProduct("Realme", "16 Pro 5G", [["8+128GB", 44999], ["8+256GB", 46000], ["12+256GB", 49999]], "Black/Blue");
    addProduct("Realme", "16 Pro+ 5G", [["8+128GB", 50999], ["8+256GB", 53000], ["12+512GB", 59999]], "Black/Blue");
    addProduct("Realme", "GT 8 Pro", [["16+512GB", 70999]], "Black/White");
    addProduct("Realme", "Pad 3 5G LTE", [["6+128GB", 31999], ["8+128GB", 32999]], "Black/Gray");

    const allProducts = products;

    let filteredProducts = [...allProducts];
    let currentSort = "popularity";
    let selectedForCompare = new Set();
    const wishlist = new Set();

    function formatPrice(value) {
      return `₹${value.toLocaleString("en-IN")}`;
    }

    function phoneFallback(image, productName) {
      image.onerror = null;
      image.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 300'%3E%3Crect x='15' y='5' width='150' height='290' rx='24' fill='%23111416' stroke='%236b737b' stroke-width='5'/%3E%3Crect x='25' y='30' width='130' height='235' rx='12' fill='%23333b42'/%3E%3Ccircle cx='90' cy='278' r='5' fill='%23f3c969'/%3E%3C/svg%3E";
      image.alt = `${productName} phone mockup`;
    }

    function toggleWishlist(id, button) {
      if (wishlist.has(id)) wishlist.delete(id);
      else wishlist.add(id);
      button.classList.toggle("active", wishlist.has(id));
      button.innerHTML = wishlist.has(id) ? "<i class=\"fa-solid fa-heart\"></i>" : "<i class=\"fa-regular fa-heart\"></i>";
    }

    // --- Render Products ---
    function renderProducts() {
      const grid = document.getElementById("productsGrid");
      const noResults = document.getElementById("noResults");

      if (filteredProducts.length === 0) {
        grid.innerHTML = "";
        noResults.style.display = "block";
        return;
      }

      noResults.style.display = "none";
      grid.innerHTML = filteredProducts.map((product, index) => {
        const productId = `${product.slug}-${product.specs.replace(/[^a-z0-9]/gi, "")}-${product.price}`;
        const title = `${product.brand} ${product.model}`;
        const mrp = Math.ceil(product.price * 1.1 / 100) * 100;
        const specs = product.specs.replace("+", "GB RAM, ").replace("/", "GB, ");
        return `
        <div class="product-card">
          <div class="product-image-wrapper">
            <div class="product-top">
              <label class="compare-label"><input type="checkbox" class="compare-checkbox" data-index="${index}" onchange="toggleProductCompare(${index}, this)"> Compare</label>
              <button class="wishlist-btn" type="button" onclick="toggleWishlist('${productId}', this)" aria-label="Add to wishlist"><i class="fa-regular fa-heart"></i></button>
            </div>
            <img src="images/mobiles/${product.slug}.png" onerror="phoneFallback(this, '${title.replace(/'/g, "\\'")}')" alt="${title}" class="product-image">
          </div>
          <div class="product-details">
            <div class="product-name">${title}</div>
            <span class="product-spec">${specs} | ${product.colors}</span>
            <div class="product-price">${formatPrice(product.price)}</div>
            <div class="price-meta"><span class="mrp"><s>MRP ${formatPrice(mrp)}</s></span><span class="save-tag">Save ${formatPrice(mrp - product.price)}</span></div>
            <a href="https://wa.me/919000000000?text=${encodeURIComponent(`I am interested in ${title} ${product.specs}`)}" 
              target="_blank" class="btn-whatsapp">
              <i class="fa-brands fa-whatsapp"></i> Enquire on WhatsApp
            </a>
          </div>
        </div>
      `;
      }).join("");
    }

    // --- Handle Search ---
    function handleSearch() {
      const query = document.getElementById("searchInput").value.toLowerCase();
      filteredProducts = allProducts.filter(p => 
        `${p.brand} ${p.model}`.toLowerCase().includes(query) || 
        p.specs.toLowerCase().includes(query)
      );
      applySort();
      renderProducts();
    }

    // --- Filter by Price ---
    function filterByPrice(range, element) {
      // Reset all filter chips
      document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
      element.classList.add('active');

      if (!range) {
        filteredProducts = [...allProducts];
      } else {
        filteredProducts = allProducts.filter(p => p.price >= range[0] && p.price <= range[1]);
      }

      const query = document.getElementById("searchInput").value.toLowerCase();
      if (query) {
        filteredProducts = filteredProducts.filter(p => 
          `${p.brand} ${p.model}`.toLowerCase().includes(query) || 
          p.specs.toLowerCase().includes(query)
        );
      }

      applySort();
      renderProducts();
    }

    // --- Handle Sort ---
    function handleSort() {
      const sortMobile = document.getElementById("mobileSort").value;
      const sortDesktop = document.getElementById("sidebarSort").value;
      currentSort = sortMobile || sortDesktop;
      applySort();
      renderProducts();
    }

    // --- Apply Sort ---
    function applySort() {
      const sorted = [...filteredProducts];
      if (currentSort === "low-to-high") {
        sorted.sort((a, b) => a.price - b.price);
      } else if (currentSort === "high-to-low") {
        sorted.sort((a, b) => b.price - a.price);
      }
      filteredProducts = sorted;
    }

    // --- Apply Custom Price Filter ---
    function applyPriceFilter() {
      const min = parseInt(document.getElementById("minPrice").value) || 0;
      const max = parseInt(document.getElementById("maxPrice").value) || 160000;
      filterByPrice([min, max], document.querySelector('[data-filter="all"]'));
    }

    // --- Compare Functionality ---
    function toggleProductCompare(index, checkbox) {
      if (checkbox.checked) {
        selectedForCompare.add(index);
      } else {
        selectedForCompare.delete(index);
      }
      updateCompareBtn();
    }

    function updateCompareBtn() {
      const compareBtn = document.getElementById("compareBtn");
      if (selectedForCompare.size > 0) {
        compareBtn.disabled = false;
        compareBtn.textContent = `Compare (${selectedForCompare.size})`;
      } else {
        compareBtn.disabled = true;
        compareBtn.textContent = 'Compare';
      }
    }

    function toggleCompare() {
      if (selectedForCompare.size === 0) return;
      // In a real app, this would navigate to a comparison page
      alert(`Compare selected products:\n${Array.from(selectedForCompare).map(i => 
        `${filteredProducts[i].brand} ${filteredProducts[i].model} (${filteredProducts[i].specs})`
      ).join('\n')}`);
    }

    // --- Go Back ---
    function goBack() {
      window.history.back();
    }

    // --- Initialize ---
    renderProducts();
  
