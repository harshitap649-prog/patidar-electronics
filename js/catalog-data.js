/* =============================================================================
 * Patidar Electronics - Showroom Inventory (source: tax invoices)
 * -----------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for all non-mobile showroom stock.
 *
 * Every item below is a real unit recorded on a tax invoice. There is no mock,
 * sample or placeholder data in this file - if a product is not listed here, the
 * showroom does not stock it.
 *
 * Adding a product = appending one object to the matching category array.
 * `category.html` reads this file, so no page edits are needed.
 *
 * Schema per item:
 *   id      {string}  unique key, used for DOM ids + deep links
 *   brand   {string}  manufacturer
 *   name    {string}  display name (marketing name, no leading brand)
 *   model   {string}  manufacturer model / part number from the invoice
 *   price   {number}  selling price in INR (integer rupees, no paise)
 *   emi     {number}  monthly EMI in INR, or null when the invoice lists none
 *   badge   {string}  stock pill shown on the card
 *   image   {string}  local product photo - preferred, because it renders with
 *                    no network at all (the showroom site is also opened from
 *                    file://)
 *   imageFallback {string}  the vendor's own copy of that photo, used as the
 *                    next step when the local file is missing
 *
 * A missing image/imageFallback means "no photo published for this unit"; the
 * card then shows the generated branded art from fallbackArt() rather than a
 * broken image frame.
 *
 * The WhatsApp CTA is generated at render time from `name` + `price`, so the
 * enquiry text can never drift out of sync with the price on the card.
 *
 * BRAND NOTE (flagged, not silently changed)
 * ------------------------------------------
 * The five TV part numbers below - UA65U8300HULXL, UA55U8300HULXL,
 * UA43U8400HULXL, UA43F5600FUXXL, UA32H4520FUXXL - are Samsung India model
 * numbers (the UA...XXL form is Samsung's), yet they are recorded here with
 * `brand: "LG"` and lg-tv-* ids. `brand` is invoice data and also feeds the
 * WhatsApp message, the card tag and the wishlist, so it has been left exactly
 * as invoiced rather than guessed at here. The product photos are resolved by
 * part number, which is unambiguous either way. Worth reconciling against the
 * invoice before the next release.
 * ========================================================================== */

(function (global) {
  "use strict";

  var WHATSAPP_NUMBER = "919009909002"; // showroom sales WhatsApp
  var BADGE_IN_STOCK = "In Stock at Showroom";

  // Last file-based step of every TV card's image chain, and the target of the
  // inline onerror="this.src='assets/images/placeholder-tv.png'" safety net.
  var PLACEHOLDER_TV = "assets/images/placeholder-tv.png";

  // Same role for the refrigerator cards. Added with the fridge photos: the
  // chain's last *file* step had to be a real file for refrigerators too, or a
  // card whose vendor copy was offline jumped straight to the inline SVG art.
  var PLACEHOLDER_FRIDGE = "assets/images/placeholder-fridge.png";

  // Same role for the washing-machine cards.
  var PLACEHOLDER_WM = "assets/images/placeholder-washing-machine.png";

  

  /* --- Smart TVs (5) ---
   * The photos used to be the lg.com dam assets under
   * /content/dam/channel/wcms/in/images/tv/<model>/gallery/dz-1.jpg. Every one of
   * those now answers 404 (an HTML error page, not a JPEG), which is why all
   * five TV cards rendered the generated placeholder.
   *
   * Each model is now carried locally under assets/images/products/ so the card
   * works offline, with the manufacturer's own copy kept as `imageFallback`.
   * `imageFallback` points at the Samsung India CDN, because these part numbers
   * are Samsung models - see BRAND NOTE in the file header. */
  var smartTvs = [
    { id: "lg-tv-ua65u8300hulxl", brand: "LG", name: '65" 4K Smart UHD TV', model: "UA65U8300HULXL", price: 63890, emi: 5324, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-65-4k-uhd.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/ua65u8300hulxl/gallery/in-uhd-u8000h-583569-583569-ua65u8300hulxl-551745609" },
    { id: "lg-tv-ua55u8300hulxl", brand: "LG", name: '55" 4K Smart UHD TV', model: "UA55U8300HULXL", price: 44770, emi: 3730, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-55-4k-uhd.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/ua55u8300hulxl/gallery/in-uhd-u8000h-583569-583569-ua55u8300hulxl-551952879" },
    // Samsung has retired the U8400 page and publishes no product photo for it
    // any more, so this card falls through to the branded art rather than being
    // given a look-alike from a different model.
    { id: "lg-tv-ua43u8400hulxl", brand: "LG", name: '43" 4K Smart UHD TV', model: "UA43U8400HULXL", price: 31420, emi: 2618, badge: BADGE_IN_STOCK },
    { id: "lg-tv-ua43f5600fuxxl", brand: "LG", name: '43" Full HD Smart LED TV', model: "UA43F5600FUXXL", price: 24300, emi: 2025, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-43-fhd-smart.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/ua43f5600fuxxl/gallery/in-1-08-m-43-hd-tv-f6000f-fhd-smart-tv-2026-ua43f5600fuxxl-554200429" },
    { id: "lg-tv-ua32h4520fuxxl", brand: "LG", name: '32" HD Ready Smart LED TV', model: "UA32H4520FUXXL", price: 15250, emi: 1270, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-32-hd-smart.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/ua32h4520fuxxl/gallery/in-hd-h4500-548524-ua32h4520fuxxl-546540756" }
  ];
  /* --- Refrigerators (6) ---
   * These six carried lg.com dam assets under
   * /content/dam/channel/wcms/in/images/refrigerators/gl-<model>-thumbnail.jpg.
   * Every one now answers 404, so all six cards rendered a broken image icon.
   * (The GL- model in each filename is also a different appliance from the RT/RR
   * part number actually invoiced - see the BRAND NOTE in the file header.)
   *
   * Each model is now carried locally under assets/images/products/ so the card
   * works offline, with the manufacturer's own copy kept as `imageFallback`.
   * `imageFallback` points at the Samsung India CDN, because RT../RR.. part
   * numbers are Samsung models. The photos were picked from each gallery by eye:
   * a closed full-body studio shot, not the open-interior, dimension-drawing or
   * "what's in the box" variants the same gallery also carries. */
  var refrigerators = [
    { id: "lg-frg-refrt31h4522s8", brand: "LG", name: "311L 5-Star Double Door Refrigerator", model: "REF-RT31H4522S8", price: 37780, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-311l-double-door.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/rt31h4522s8-hl/gallery/in-top-mount-freezer-curd-maestro-and-convertible-5in1-573625-rt31h4522s8-hl-551000928" },
    { id: "lg-frg-refrr24h2823ht", brand: "LG", name: "240L Direct Cool Refrigerator", model: "REF-RR24H2823HT", price: 21530, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-240l-direct-cool.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/rr24h2823ht-nl/gallery/in-oen-door-stylish-crown-design-580292-rr24h2823ht-nl-551226787" },
    { id: "lg-frg-refrr23h2h35rz", brand: "LG", name: "230L Smart Inverter Single Door", model: "REF-RR23H2H35RZ", price: 21790, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-230l-single-door.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/rr23h2h35rz-hl/gallery/in-digi-touch-cool%E2%84%A2-580028-rr23h2h35rz-hl-551050915" },
    { id: "lg-frg-refrr21h2h259r", brand: "LG", name: "210L Single Door Refrigerator", model: "REF-RR21H2H259R", price: 18320, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-210l-single-door.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/rr21h2h259r-hl/gallery/in-digi-touch-cool%E2%84%A2-580214-rr21h2h259r-hl-551075892" },
    { id: "lg-frg-refrr20h2712hn", brand: "LG", name: "200L Direct Cool Refrigerator", model: "REF-RR20H2712HN", price: 15470, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-200l-direct-cool.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/rr20h2712hn-nl/gallery/in-oen-door-stylish-crown-design-574820-rr20h2712hn-nl-551328522" },
    // Previously carried no photo at all and rendered the generated branded card.
    // Same treatment as the rest of the category now that a real one exists.
    { id: "lg-frg-refrr19h2yc1cr", brand: "LG", name: "190L Single Door Refrigerator", model: "REF-RR19H2YC1CR", price: 14440, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-190l-single-door.jpg", imageFallback: "https://images.samsung.com/is/image/samsung/p6pim/in/rr19h2yc1cr-nl/gallery/in-oen-door-stylish-crown-design-574832-rr19h2yc1cr-nl-551258126" }
  ];

  /* --- Washing Machines (9) ---
   * These nine pointed at the lg.com dam thumbnails under
   * /content/dam/channel/wcms/in/images/washing-machines/<model>-thumbnail.jpg,
   * every one of which now answers 404 - so all nine cards rendered a broken
   * image icon.
   *
   * Each model is now carried locally under assets/images/products/ so the card
   * works offline, with the manufacturer's own copy kept as `imageFallback`.
   * `imageFallback` is the lg.com dam gallery asset for that exact part number,
   * so it is the same model rather than a look-alike. */
  var washingMachines = [
    { id: "lg-wm-fafl-fhb1208z2m", brand: "LG", name: "12.0 Kg Front Load Fully Automatic", model: "LG-FAFL-FHB1208Z2M", price: 31800, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-12kg-front-load.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/wm/fhb1208z2m/FHB1208Z2M-450x450-1-v.jpg" },
    { id: "lg-wm-fatl-t90kmmb3z", brand: "LG", name: "9.0 Kg Top Load Fully Automatic", model: "LG-FATL-T90KMMB3Z", price: 18420, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-9kg-top-load.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/t90kmmb3z_abmqeil-_eail_in_c/gallery/T90KMMB3Z-450x450-1-v.jpg" },
    { id: "lg-wm-fatl-t80kmmb3z", brand: "LG", name: "8.0 Kg Top Load Fully Automatic", model: "LG-FATL-T80KMMB3Z", price: 16710, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-8kg-top-load.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/t80kmmb3z_abmqeil_eail_in_c/gallery/T80KMMB3Z-450x450-1-v.jpg" },
    // The semi-automatic series shares a chassis, so the four of these that have
    // no distinct photo published get the closest sibling's rather than a
    // generic category banner. Each still carries its own real photo where one
    // exists, so no two cards are left showing the same unrelated machine.
    { id: "lg-wm-sawm-p115aslaz", brand: "LG", name: "11.0 Kg Semi-Automatic Washer", model: "LG-SAWM-P115ASLAZ", price: 17240, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-11kg-semi-automatic.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/p115aslaz_ablqeil_eail_in_c/gallery-01/P115ASLAZ-450x450-1-v.jpg" },
    { id: "lg-wm-sawm-p105asraz", brand: "LG", name: "10.5 Kg Semi-Automatic Washer", model: "LG-SAWM-P105ASRAZ", price: 15820, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-10.5kg-semi-automatic.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/p105asraz_abgqeil_eail_in_c/gallery/P105ASRAZ-Washing-Machines-Front-View-D-1.jpg" },
    { id: "lg-wm-sawm-p9555skaz", brand: "LG", name: "9.5 Kg Semi-Automatic Washer", model: "LG-SAWM-P9555SKAZ", price: 15250, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-9.5kg-semi-automatic.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/p9555skaz_abmqeil_eail_in_c/gallery/P9555SKAZ-Washing-Machines-Front-View-D-01.jpg" },
    { id: "lg-wm-sawm-p8535sdaz", brand: "LG", name: "8.5 Kg Semi-Automatic Washer", model: "LG-SAWM-P8535SDAZ", price: 13340, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-8.5kg-semi-automatic.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/gallery/P8535SDAZ-450x450-1-v.jpg" },
    { id: "lg-wm-sawm-p7510rbaz", brand: "LG", name: "7.5 Kg Semi-Automatic Washer", model: "LG-SAWM-P7510RBAZ", price: 13585, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-7.5kg-semi-automatic.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/p7510rbaz_adbqnst_eail_in_c/gallery/P7510RBAZ-Washing-Machines-Front-View-D-1.jpg" },
    { id: "lg-wm-sawm-p7010ngaz", brand: "LG", name: "7.0 Kg Semi-Automatic Washer", model: "LG-SAWM-P7010NGAZ", price: 12240, emi: null, badge: BADGE_IN_STOCK, image: "assets/images/products/lg-7kg-semi-automatic.jpg", imageFallback: "https://www.lg.com/content/dam/channel/wcms/in/images/washing-machines/p7010ngaz/gallery/P7010NGAZ-450x450-1-v.jpg" }
  ];
  /* --- Category registry -----------------------------------------------
   * `slug` matches the ?type= query already used by the index.html links, so
   * existing URLs such as category.html?type=tvs resolve with no link edits.
   * -------------------------------------------------------------------- */
  /* --- Categories whose stock is not catalogued yet ----------------------
   * index.html already links 27 categories into category.html?type=<slug>, but
   * only the three above carry products. Without an entry here, getCategory()
   * returned null for the other 24 and every one of those links landed on
   * "Category not found" - a dead end for a category the site does sell, just
   * without photos and prices loaded yet.
   *
   * Registering them with an empty products array is what lets category.html
   * tell the two cases apart:
   *   known category, no stock yet -> "New Stock Arriving Soon" + WhatsApp CTA
   *   genuinely unknown slug        -> "Category not found"
   * allProducts() concats these, so the empty arrays add nothing there.
   *
   * Titles mirror the data-category label on each index.html link, so the
   * header and <title> agree with the label the shopper clicked.
   * `comingSoon` is the flag category.html keys off; it is not data, it is
   * presentation intent, so it lives with the rest of the metadata.
   * -------------------------------------------------------------------- */
  var comingSoonCategories = [
    { slug: "laptops",          title: "Laptops",            icon: "fa-laptop",      blurb: "Everyday, student and gaming laptops from the brands we stock." },
    { slug: "tablets",          title: "Tablets",            icon: "fa-tablet-screen", blurb: "Wi-Fi tablets for study, work and entertainment." },
    { slug: "smartwatches",     title: "Smartwatches",       icon: "fa-clock",       blurb: "Fitness and smart watches with health tracking." },
    { slug: "earphones",        title: "Earphones",          icon: "fa-headphones",  blurb: "True wireless and wired earphones." },
    { slug: "speakers",         title: "Speakers",           icon: "fa-volume-high", blurb: "Bluetooth and home-theatre speakers." },
    { slug: "projectors",       title: "Projectors",         icon: "fa-video",       blurb: "Home cinema and portable projectors." },
    { slug: "cameras",          title: "Cameras",            icon: "fa-camera",      blurb: "DSLR, mirrorless and compact cameras." },
    { slug: "ac",               title: "Air Conditioners",   icon: "fa-wind",        blurb: "Window and split air conditioners, installed or supplied." },
    { slug: "microwaves",       title: "Microwaves",         icon: "fa-microwave",   blurb: "Solo and convection microwave ovens." },
    { slug: "dishwashers",      title: "Dishwashers",        icon: "fa-plate",       blurb: "Freestanding and countertop dishwashers." },
    { slug: "water-heaters",    title: "Water Heaters",      icon: "fa-temperature-high", blurb: "Storage and instant water heaters." },
    { slug: "induction",        title: "Induction",          icon: "fa-fire-burner", blurb: "Induction cooktops and induction cookers." },
    { slug: "mixer-grinder",    title: "Mixer Grinder",      icon: "fa-blender",     blurb: "Mixer grinders and juicers." },
    { slug: "coffee-maker",     title: "Coffee Maker",       icon: "fa-mug-hot",     blurb: "Coffee makers and espresso machines." },
    { slug: "toasters",         title: "Toasters",           icon: "fa-utensils",    blurb: "Pop-up toasters and sandwich makers." },
    { slug: "pressure-cooker",  title: "Pressure Cooker",    icon: "fa-utensils",    blurb: "Electric pressure cookers." },
    { slug: "fans",             title: "Fans",               icon: "fa-fan",         blurb: "Table, pedestal and wall fans." },
    { slug: "air-purifiers",    title: "Air Purifiers",      icon: "fa-wind",        blurb: "HEPA and carbon air purifiers." },
    { slug: "coolers",          title: "Coolers",            icon: "fa-snowflake",   blurb: "Personal, desert and commercial coolers." },
    { slug: "sofas",            title: "Sofas",              icon: "fa-couch",       blurb: "Sofa sets and recliners." },
    { slug: "beds",             title: "Beds",               icon: "fa-bed",         blurb: "Single, double and king-size beds." },
    { slug: "tables",           title: "Tables",             icon: "fa-table",       blurb: "Dining, study and coffee tables." },
    { slug: "chairs",           title: "Chairs",             icon: "fa-chair",       blurb: "Office, dining and lounge chairs." },
    { slug: "wardrobes",        title: "Wardrobes",          icon: "fa-box-archive", blurb: "Wardrobes and almirahs." }
  ].map(function (c) {
    // No products yet, so no card can ask for a per-category placeholder file.
    return {
      slug: c.slug, title: c.title, blurb: c.blurb, icon: c.icon,
      products: [], comingSoon: true
    };
  });

  var categories = comingSoonCategories.concat([
    {
      slug: "tvs",
      title: "Smart TVs",
      blurb: "LG 4K UHD and Full HD smart televisions, in stock at the showroom.",
      image: "images/Tv image.png",
      placeholder: PLACEHOLDER_TV,
      icon: "fa-tv",
      products: smartTvs
    },
    {
      slug: "refrigerators",
      title: "Refrigerators",
      blurb: "Double door, single door and direct cool refrigerators.",
      image: "images/regrigrator image.png",
      placeholder: PLACEHOLDER_FRIDGE,
      icon: "fa-temperature-low",
      products: refrigerators
    },
    {
      slug: "washing-machines",
      title: "Washing Machines",
      blurb: "Front load, top load and semi-automatic washing machines.",
      image: "images/washing machine.png",
      placeholder: PLACEHOLDER_WM,
      icon: "fa-shirt",
      products: washingMachines
    }
  ]);

  /* --- Public helpers ---------------------------------------------------- */

  /** Resolve a category by its ?type= value, tolerating common aliases. */
  function getCategory(slug) {
    if (!slug) return null;
    var key = String(slug).toLowerCase().replace(/^\?/, "").trim();
    var aliases = {
      tv: "tvs",
      "smart-tv": "tvs",
      "smart-tvs": "tvs",
      refrigerator: "refrigerators",
      fridge: "refrigerators",
      "washing-machine": "washing-machines",
      washer: "washing-machines",
      washingmachines: "washing-machines"
    };
    var resolved = aliases[key] || key;
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].slug === resolved) return categories[i];
    }
    return null;
  }

  /** Every catalogued product, flattened. */
  function allProducts() {
    var out = [];
    for (var i = 0; i < categories.length; i++) {
      out = out.concat(categories[i].products);
    }
    return out;
  }

  /** 63890 -> "₹63,890" */
  function formatPrice(value) {
    return "₹" + Number(value).toLocaleString("en-IN");
  }

  /** "LG 65\" 4K Smart UHD TV" */
  function fullName(item) {
    return (item.brand ? item.brand + " " : "") + item.name;
  }

  /**
   * The single enquiry template required on every card:
   *   "Hi Patidar Electronics, I am interested in [Product Name] priced at
   *    ₹[Price]. Is it available at your Sagore showroom?"
   * Built from the same fields the card displays, so the text can never drift
   * out of sync with the price shown on the card.
   */
  function whatsappLink(item) {
    var text =
      "Hi Patidar Electronics, I am interested in " + fullName(item) +
      " priced at " + formatPrice(item.price) +
      ". Is it available at your Sagore showroom?";
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  /**
   * Inline branded card used when a product photo cannot load. Showroom stock
   * is linked to vendor CDNs (lg.com, ...), which are unreachable offline and
   * rate-limited, so every card needs a dependable last resort. Returns a
   * self-contained data: URI - no request, no 404, no flash of empty box.
   * Shared by category.html and wishlist.html so both look identical.
   */
  function fallbackArt(brand, name) {
    var label = String(name || "");
    label = label.length > 26 ? label.slice(0, 24) + "…" : label;
    function safe(v) {
      return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
      });
    }
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>" +
      "<rect width='400' height='300' fill='#F9FAFB'/>" +
      "<rect x='140' y='96' width='120' height='86' rx='8' fill='none' stroke='#D1D5DB' stroke-width='4'/>" +
      "<path d='M132 196h136' stroke='#D1D5DB' stroke-width='4' stroke-linecap='round'/>" +
      "<text x='200' y='140' text-anchor='middle' font-family='Arial,sans-serif' font-size='30' font-weight='700' fill='#E52321'>" +
      safe(brand) + "</text>" +
      "<text x='200' y='168' text-anchor='middle' font-family='Arial,sans-serif' font-size='15' fill='#6B7280'>" +
      safe(label) + "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  /** The category that owns a given item, or null when it is unknown. */
  function categoryFor(item) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].products.indexOf(item) !== -1) return categories[i];
    }
    return null;
  }

  /**
   * Image resolution order for one showroom card, in order:
   *   1. item.image        local file - works with no network at all
   *   2. item.imageFallback  the vendor's copy of the same photo
   *   3. category.placeholder  a real file (one per category)
   *   4. fallbackArt()     inline branded card - always resolves, even offline
   *
   * wishlist.html walks this list; category.html walks the same steps from the
   * data-* attributes on the <img>. Keeping the order in one place is what stops
   * the two pages drifting apart.
   */
  function imageSources(item) {
    var cat = categoryFor(item) || {};
    return [
      item.image || "",
      item.imageFallback || "",
      cat.placeholder || "",
      fallbackArt(item.brand, item.name)
    ].filter(Boolean);
  }

  global.ShowroomCatalog = {
    categories: categories,
    getCategory: getCategory,
    categoryFor: categoryFor,
    allProducts: allProducts,
    formatPrice: formatPrice,
    fullName: fullName,
    fallbackArt: fallbackArt,
    imageSources: imageSources,
    whatsappLink: whatsappLink,
    PLACEHOLDER_TV: PLACEHOLDER_TV,
    PLACEHOLDER_FRIDGE: PLACEHOLDER_FRIDGE,
    PLACEHOLDER_WM: PLACEHOLDER_WM,
    WHATSAPP_NUMBER: WHATSAPP_NUMBER
  };
})(window);
