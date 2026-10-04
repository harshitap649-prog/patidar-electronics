/* =============================================================================
 * Patidar Electronics - mobile catalogue mirror (js/mobiles-data.js)
 * ----------------------------------------------------------------------------
 * GENERATED FILE - DO NOT EDIT BY HAND.
 * Produced by build-mobiles-data.js from the addProduct(...) calls inside
 * mobiles.html. Re-run "node build-mobiles-data.js" after editing that block.
 *
 * Why this file exists
 * ---------------------
 * wishlist.html must turn a stored mobile id such as
 *   nothing-phone-3a-lite-8128GB-27999
 * back into a card (photo, model, RAM/storage, price, EMI, WhatsApp link).
 * mobiles.html owns that inventory inline and products.json would need
 * fetch(), which is blocked on file://, so the mirror ships as a plain
 * <script> any page can load offline.
 *
 * The id rule matches mobiles.html exactly: "<slug>-<specs>-<price>" with
 * every non-alphanumeric character stripped from the spec, and the WhatsApp
 * message copies the mobiles.html card word for word.
 * ========================================================================== */

(function (global) {
  "use strict";

  var WHATSAPP_NUMBER = "919009909002";

  var products = [
    { brand: "Nothing", model: "Phone (3a) Lite", specs: "8/128GB", price: 27999, colors: "Black/White/Blue", image: "assets/images/products/nothing-phone-2a.png", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg", slug: "nothing-phone-3a-lite" },
    { brand: "Nothing", model: "Phone (3a) Lite", specs: "8/256GB", price: 29999, colors: "Black/White/Blue", image: "assets/images/products/nothing-phone-2a.png", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg", slug: "nothing-phone-3a-lite" },
    { brand: "Nothing", model: "Phone (4a)", specs: "8/128GB", price: 44999, colors: "Black/White/Blue", image: "assets/images/products/nothing-phone-4a.jpg", imageFallback: "", slug: "nothing-phone-4a" },
    { brand: "Nothing", model: "Phone (4a)", specs: "8/256GB", price: 49999, colors: "Black/White/Blue/Pink", image: "assets/images/products/nothing-phone-4a.jpg", imageFallback: "", slug: "nothing-phone-4a" },
    { brand: "Nothing", model: "Phone (4a)", specs: "12/256GB", price: 50999, colors: "Black/White/Blue/Pink", image: "assets/images/products/nothing-phone-4a.jpg", imageFallback: "", slug: "nothing-phone-4a" },
    { brand: "Nothing", model: "Phone (4a) Pro", specs: "8/128GB", price: 54999, colors: "Black/Silver", image: "assets/images/products/nothing-phone-4a-pro.jpg", imageFallback: "", slug: "nothing-phone-4a-pro" },
    { brand: "Nothing", model: "Phone (4a) Pro", specs: "8/256GB", price: 57999, colors: "Black/Silver", image: "assets/images/products/nothing-phone-4a-pro.jpg", imageFallback: "", slug: "nothing-phone-4a-pro" },
    { brand: "Nothing", model: "Phone (4a) Pro", specs: "12/256GB", price: 59999, colors: "Black/Silver/Pink", image: "assets/images/products/nothing-phone-4a-pro.jpg", imageFallback: "", slug: "nothing-phone-4a-pro" },
    { brand: "Nothing", model: "Phone (4b)", specs: "8/128GB", price: 39999, colors: "Black/White/Blue", image: "assets/images/products/nothing-phone-4b.jpg", imageFallback: "", slug: "nothing-phone-4b" },
    { brand: "Nothing", model: "Phone (4b)", specs: "8/256GB", price: 40999, colors: "Black/White/Blue", image: "assets/images/products/nothing-phone-4b.jpg", imageFallback: "", slug: "nothing-phone-4b" },
    { brand: "Oppo", model: "A60 4G", specs: "4+64GB", price: 14599, colors: "", image: "assets/images/products/oppo-a60-4g.jpg", imageFallback: "", slug: "oppo-a60-4g" },
    { brand: "Oppo", model: "A60 4G", specs: "4+128GB", price: 15599, colors: "", image: "assets/images/products/oppo-a60-4g.jpg", imageFallback: "", slug: "oppo-a60-4g" },
    { brand: "Oppo", model: "A60 4G", specs: "6+128GB", price: 17599, colors: "", image: "assets/images/products/oppo-a60-4g.jpg", imageFallback: "", slug: "oppo-a60-4g" },
    { brand: "Oppo", model: "A58", specs: "6+128GB", price: 13999, colors: "", image: "assets/images/products/oppo-a58.jpg", imageFallback: "", slug: "oppo-a58" },
    { brand: "Oppo", model: "F25 Pro 5G", specs: "8+128GB", price: 23999, colors: "", image: "", imageFallback: "", slug: "oppo-f25-pro-5g" },
    { brand: "Oppo", model: "F25 Pro 5G", specs: "8+256GB", price: 25999, colors: "", image: "", imageFallback: "", slug: "oppo-f25-pro-5g" },
    { brand: "Oppo", model: "F27 5G", specs: "8+128GB", price: 22999, colors: "", image: "", imageFallback: "", slug: "oppo-f27-5g" },
    { brand: "Oppo", model: "F27 5G", specs: "8+256GB", price: 24999, colors: "", image: "", imageFallback: "", slug: "oppo-f27-5g" },
    { brand: "Oppo", model: "F27 Pro+ 5G", specs: "8+128GB", price: 27999, colors: "", image: "", imageFallback: "", slug: "oppo-f27-pro-5g" },
    { brand: "Oppo", model: "F27 Pro+ 5G", specs: "8+256GB", price: 29999, colors: "", image: "", imageFallback: "", slug: "oppo-f27-pro-5g" },
    { brand: "Oppo", model: "Reno 12 5G", specs: "8+256GB", price: 32999, colors: "", image: "assets/images/products/oppo-reno-12-5g.jpg", imageFallback: "", slug: "oppo-reno-12-5g" },
    { brand: "Oppo", model: "Reno 12 5G", specs: "12+256GB", price: 35999, colors: "", image: "assets/images/products/oppo-reno-12-5g.jpg", imageFallback: "", slug: "oppo-reno-12-5g" },
    { brand: "Oppo", model: "Reno 12 Pro 5G", specs: "12+256GB", price: 36999, colors: "", image: "assets/images/products/oppo-reno-12-pro-5g.jpg", imageFallback: "", slug: "oppo-reno-12-pro-5g" },
    { brand: "Oppo", model: "Reno 12 Pro 5G", specs: "12+512GB", price: 40999, colors: "", image: "assets/images/products/oppo-reno-12-pro-5g.jpg", imageFallback: "", slug: "oppo-reno-12-pro-5g" },
    { brand: "Oppo", model: "Reno 12 Pro Mini 5G", specs: "8+128GB", price: 30999, colors: "", image: "", imageFallback: "", slug: "oppo-reno-12-pro-mini-5g" },
    { brand: "Oppo", model: "Reno 12 Pro Mini 5G", specs: "8+256GB", price: 32999, colors: "", image: "", imageFallback: "", slug: "oppo-reno-12-pro-mini-5g" },
    { brand: "Oppo", model: "Reno 13 5G", specs: "12+256GB", price: 37999, colors: "", image: "assets/images/products/oppo-reno-13-5g.jpg", imageFallback: "", slug: "oppo-reno-13-5g" },
    { brand: "Oppo", model: "Reno 13 Pro 5G", specs: "12+256GB", price: 44999, colors: "", image: "assets/images/products/oppo-reno-13-pro-5g.jpg", imageFallback: "", slug: "oppo-reno-13-pro-5g" },
    { brand: "Oppo", model: "Reno 13 Pro 5G", specs: "12+512GB", price: 49999, colors: "", image: "assets/images/products/oppo-reno-13-pro-5g.jpg", imageFallback: "", slug: "oppo-reno-13-pro-5g" },
    { brand: "Oppo", model: "Find X8 5G", specs: "12+256GB", price: 64999, colors: "", image: "assets/images/products/oppo-find-x8-5g.jpg", imageFallback: "", slug: "oppo-find-x8-5g" },
    { brand: "Oppo", model: "Find X8 5G", specs: "12+512GB", price: 69999, colors: "", image: "assets/images/products/oppo-find-x8-5g.jpg", imageFallback: "", slug: "oppo-find-x8-5g" },
    { brand: "Oppo", model: "Find X8 Pro 5G", specs: "16+512GB", price: 99999, colors: "", image: "assets/images/products/oppo-find-x8-pro-5g.jpg", imageFallback: "", slug: "oppo-find-x8-pro-5g" },
    { brand: "Oppo", model: "Find X8 Pro Ultra", specs: "16+1TB", price: 114999, colors: "", image: "assets/images/products/oppo-find-x8-pro-ultra.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x8-pro.jpg", slug: "oppo-find-x8-pro-ultra" },
    { brand: "Realme", model: "P4 Lite 5G", specs: "4+64GB", price: 17099, colors: "", image: "assets/images/products/realme-p4-lite-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-lite-5g" },
    { brand: "Realme", model: "P4 Lite 5G", specs: "4+128GB", price: 18099, colors: "", image: "assets/images/products/realme-p4-lite-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-lite-5g" },
    { brand: "Realme", model: "P4 Lite 5G", specs: "6+128GB", price: 22099, colors: "", image: "assets/images/products/realme-p4-lite-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-lite-5g" },
    { brand: "Realme", model: "P4 5G", specs: "4+64GB", price: 19999, colors: "", image: "assets/images/products/realme-p4-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-5g" },
    { brand: "Realme", model: "P4 5G", specs: "4+128GB", price: 21500, colors: "", image: "assets/images/products/realme-p4-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-5g" },
    { brand: "Realme", model: "P4 5G", specs: "6+128GB", price: 23999, colors: "", image: "assets/images/products/realme-p4-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-5g" },
    { brand: "Realme", model: "P4 5G", specs: "6+256GB", price: 26950, colors: "", image: "assets/images/products/realme-p4-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-5g.jpg", slug: "realme-p4-5g" },
    { brand: "Realme", model: "P4X", specs: "8+128GB", price: 27999, colors: "", image: "assets/images/products/realme-p4x.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", slug: "realme-p4x" },
    { brand: "Realme", model: "P4X", specs: "8+256GB", price: 32999, colors: "", image: "assets/images/products/realme-p4x.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", slug: "realme-p4x" },
    { brand: "Realme", model: "P4 Power", specs: "8+128GB", price: 31000, colors: "", image: "assets/images/products/realme-p4-power.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", slug: "realme-p4-power" },
    { brand: "Realme", model: "P4 Power", specs: "8+256GB", price: 34000, colors: "", image: "assets/images/products/realme-p4-power.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", slug: "realme-p4-power" },
    { brand: "Realme", model: "P4S New", specs: "4+64GB", price: 26999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", imageFallback: "", slug: "realme-p4s-new" },
    { brand: "Realme", model: "P4S New", specs: "4+128GB", price: 29999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", imageFallback: "", slug: "realme-p4s-new" },
    { brand: "Realme", model: "P4S New", specs: "6+128GB", price: 35999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", imageFallback: "", slug: "realme-p4s-new" },
    { brand: "Realme", model: "P4S New", specs: "12+256GB", price: 41000, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg", imageFallback: "", slug: "realme-p4s-new" },
    { brand: "Realme", model: "C1001 New", specs: "4+64GB", price: 10999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-c53.jpg", imageFallback: "", slug: "realme-c1001-new" },
    { brand: "Realme", model: "C100X", specs: "4+64GB", price: 16999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-c53.jpg", imageFallback: "", slug: "realme-c100x" },
    { brand: "Realme", model: "C83 5G", specs: "4+64GB", price: 19450, colors: "", image: "assets/images/products/realme-c83-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-c65.jpg", slug: "realme-c83-5g" },
    { brand: "Realme", model: "C83 5G", specs: "4+128GB", price: 21499, colors: "", image: "assets/images/products/realme-c83-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-c65.jpg", slug: "realme-c83-5g" },
    { brand: "Realme", model: "C83 5G", specs: "4+128GB", price: 24455, colors: "", image: "assets/images/products/realme-c83-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-c65.jpg", slug: "realme-c83-5g" },
    { brand: "Realme", model: "13x 5G", specs: "4+128GB", price: 25999, colors: "", image: "assets/images/products/realme-13x-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12x.jpg", slug: "realme-13x-5g" },
    { brand: "Realme", model: "13x 5G", specs: "6+128GB", price: 27999, colors: "", image: "assets/images/products/realme-13x-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12x.jpg", slug: "realme-13x-5g" },
    { brand: "Realme", model: "13x 5G", specs: "6+256GB", price: 30999, colors: "", image: "assets/images/products/realme-13x-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12x.jpg", slug: "realme-13x-5g" },
    { brand: "Realme", model: "15T 5G", specs: "6+128GB", price: 20999, colors: "", image: "assets/images/products/realme-15t-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-5g.jpg", slug: "realme-15t-5g" },
    { brand: "Realme", model: "15T 5G", specs: "8+128GB", price: 22999, colors: "", image: "assets/images/products/realme-15t-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-5g.jpg", slug: "realme-15t-5g" },
    { brand: "Realme", model: "16 5G", specs: "8+128GB", price: 28999, colors: "", image: "assets/images/products/realme-16-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-5g.jpg", slug: "realme-16-5g" },
    { brand: "Realme", model: "16 5G", specs: "8+256GB", price: 30999, colors: "", image: "assets/images/products/realme-16-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-5g.jpg", slug: "realme-16-5g" },
    { brand: "Realme", model: "16 5G", specs: "12+256GB", price: 32999, colors: "", image: "assets/images/products/realme-16-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-5g.jpg", slug: "realme-16-5g" },
    { brand: "Realme", model: "16 Pro 5G", specs: "8+128GB", price: 44999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg", imageFallback: "assets/images/products/realme-16-pro.jpg", slug: "realme-16-pro-5g" },
    { brand: "Realme", model: "16 Pro 5G", specs: "8+256GB", price: 46000, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg", imageFallback: "assets/images/products/realme-16-pro.jpg", slug: "realme-16-pro-5g" },
    { brand: "Realme", model: "16 Pro 5G", specs: "12+256GB", price: 49999, colors: "", image: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg", imageFallback: "assets/images/products/realme-16-pro.jpg", slug: "realme-16-pro-5g" },
    { brand: "Realme", model: "16 Pro+ 5G", specs: "8+128GB", price: 50999, colors: "", image: "assets/images/products/realme-16-pro-plus-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg", slug: "realme-16-pro-5g" },
    { brand: "Realme", model: "16 Pro+ 5G", specs: "8+256GB", price: 53000, colors: "", image: "assets/images/products/realme-16-pro-plus-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg", slug: "realme-16-pro-5g" },
    { brand: "Realme", model: "16 Pro+ 5G", specs: "12+512GB", price: 59999, colors: "", image: "assets/images/products/realme-16-pro-plus-5g.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg", slug: "realme-16-pro-5g" },
    { brand: "Realme", model: "GT 8 Pro", specs: "16+512GB", price: 70999, colors: "", image: "assets/images/products/realme-gt-8-pro.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-gt5-pro.jpg", slug: "realme-gt-8-pro" },
    { brand: "Realme", model: "Pad 3 5G LTE", specs: "6+128GB", price: 31999, colors: "", image: "assets/images/products/realme-pad-3.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-pad.jpg", slug: "realme-pad-3-5g-lte" },
    { brand: "Realme", model: "Pad 3 5G LTE", specs: "8+128GB", price: 32999, colors: "", image: "assets/images/products/realme-pad-3.jpg", imageFallback: "https://fdn2.gsmarena.com/vv/bigpic/realme-pad.jpg", slug: "realme-pad-3-5g-lte" },
  ];

  /** "8/128GB" -> "8128GB" (strips every separator, like mobiles.html). */
  function compactSpecs(specs) {
    return String(specs).replace(/[^a-z0-9]/gi, "");
  }

  /** Stable wishlist / deep-link id for one variant. */
  function idFor(product) {
    return product.slug + "-" + compactSpecs(product.specs) + "-" + product.price;
  }

  /** 27999 -> the rupee amount as en-IN currency. */
  function formatPrice(value) {
    return "\u20B9" + Number(value).toLocaleString("en-IN");
  }

  /** "Nothing Phone (3a) Lite" */
  function fullName(product) {
    return product.brand + " " + product.model;
  }

  /** "8/128GB" -> "8GB RAM, 128GB" (identical to the mobiles.html spec line). */
  function specLabel(specs) {
    return String(specs).replace("+", "GB RAM, ").replace("/", "GB, ");
  }

  /** Local photo, then the vendor photo, then the shared placeholder. */
  function imageSources(product) {
    return [
      product.image || "images/mobiles/" + product.slug + ".png",
      product.imageFallback || "",
      "assets/images/placeholder-phone.png"
    ];
  }

  function whatsappLink(product) {
    var text =
      "Hi, I'm interested in this model:\n\n" +
      "*Model:* " + fullName(product) + "\n" +
      "*Price:* " + formatPrice(product.price) + "\n" +
      "*Variant:* " + product.specs + "\n\n" +
      "Is it available for a store visit today?";
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  var index = null;

  /** Resolve a stored wishlist id back to its variant, or null. */
  function byId(id) {
    if (!id) return null;
    if (!index) {
      index = {};
      for (var i = 0; i < products.length; i++) index[idFor(products[i])] = products[i];
    }
    return index[String(id)] || null;
  }

  global.MobilesCatalog = {
    WHATSAPP_NUMBER: WHATSAPP_NUMBER,
    allProducts: products,
    idFor: idFor,
    byId: byId,
    compactSpecs: compactSpecs,
    formatPrice: formatPrice,
    fullName: fullName,
    specLabel: specLabel,
    imageSources: imageSources,
    whatsappLink: whatsappLink
  };
})(window);
