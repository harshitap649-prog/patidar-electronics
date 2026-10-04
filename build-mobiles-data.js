/* =============================================================================
 * Patidar Electronics - mobile catalogue mirror generator
 * (build-mobiles-data.js)
 * -----------------------------------------------------------------------------
 * SOURCE OF TRUTH : the inline addProduct(...) calls inside mobiles.html
 * OUTPUT          : js/mobiles-data.js   -> window.MobilesCatalog
 *
 * Why this exists
 * ---------------
 * mobiles.html owns the handset inventory as inline addProduct() calls, so no
 * other page can resolve a mobile wishlist id (e.g.
 * "nothing-phone-3a-lite-8128GB-27999") into a card. products.json holds the
 * same data but needs fetch(), which is blocked on the file:// protocol this
 * site is also opened from. This generator emits a plain <script> mirror so
 * wishlist.html renders handsets offline with zero drift from mobiles.html.
 *
 * Regenerate after ANY edit to the addProduct(...) block in mobiles.html:
 *     node build-mobiles-data.js
 *
 * The image-rewrite tool (fetch_product_images.py) still edits mobiles.html,
 * so the addProduct() calls remain the one place product data is authored.
 * ========================================================================== */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SOURCE = path.join(ROOT, "mobiles.html");
const TARGET = path.join(ROOT, "js", "mobiles-data.js");

/**
 * Split one addProduct(...) argument list into top-level argument spans.
 * Handles nested arrays/objects, multi-line calls and quoted strings so a
 * variant array such as [["8/128GB", 27999], ["8/256GB", 29999]] survives.
 */
function splitArgs(src, openParen) {
  const args = [];
  let depth = 0;
  let start = openParen + 1;
  let quote = null;
  let escaped = false;

  for (let i = openParen + 1; i < src.length; i++) {
    const ch = src[i];

    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "[" || ch === "(" || ch === "{") { depth++; continue; }
    if (ch === "]" || ch === "}") { depth--; continue; }
    if (ch === ")") {
      if (depth === 0) { args.push(src.slice(start, i)); return { args, end: i }; }
      depth--;
      continue;
    }
    if (ch === "," && depth === 0) { args.push(src.slice(start, i)); start = i + 1; }
  }
  return { args, end: -1 };
}

/** "Black/White" -> Black/White ; ["a","b"] -> ["a","b"] */
function parseColors(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return "";
  if (text[0] !== "[") return text.replace(/^["'`]|["'`]$/g, "");
  const out = [];
  const re = /(["'`])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(text))) out.push(m[2].replace(/\\(.)/g, "$1"));
  return out.length ? out : "";
}

/** Replicates the slug rule in mobiles.html's addProduct(): brand-model, kebab. */
function slugOf(brand, model) {
  return `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseProducts(html) {
  const products = [];
  const re = /\baddProduct\s*\(/g;
  let m;

  while ((m = re.exec(html))) {
    const { args } = splitArgs(html, m.index + m[0].length - 1);
    if (args.length < 3) continue;

    const brand = args[0].trim().replace(/^["'`]|["'`]$/g, "");
    const model = args[1].trim().replace(/^["'`]|["'`]$/g, "");
    const colors = parseColors(args[3]);
    const image = (args[4] || "").trim().replace(/^["'`]|["'`]$/g, "");
    const imageFallback = (args[5] || "").trim().replace(/^["'`]|["'`]$/g, "");

    let variants;
    try { variants = JSON.parse(args[2].trim()); } catch (err) { continue; }
    if (!Array.isArray(variants) || !variants.length) continue;

    const slug = slugOf(brand, model);
    variants.forEach((variant, index) => {
      if (!Array.isArray(variant) || variant.length < 2) return;
      if (typeof variant[0] !== "string" || typeof variant[1] !== "number") return;
      products.push({
        brand,
        model,
        specs: variant[0],
        price: variant[1],
        colors: Array.isArray(colors) ? (colors[index] || "") : colors,
        image,
        imageFallback,
        slug
      });
    });
  }
  return products;
}

/** One product object rendered on a single readable line. */
function renderProduct(p) {
  const fields = [
    ["brand", p.brand], ["model", p.model], ["specs", p.specs], ["price", p.price],
    ["colors", p.colors], ["image", p.image], ["imageFallback", p.imageFallback],
    ["slug", p.slug]
  ];
  return "    { " + fields.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ") + " },";
}

const HEADER = [
  "/* =============================================================================",
  " * Patidar Electronics - mobile catalogue mirror (js/mobiles-data.js)",
  " * ----------------------------------------------------------------------------",
  " * GENERATED FILE - DO NOT EDIT BY HAND.",
  " * Produced by build-mobiles-data.js from the addProduct(...) calls inside",
  ' * mobiles.html. Re-run "node build-mobiles-data.js" after editing that block.',
  " *",
  " * Why this file exists",
  " * ---------------------",
  " * wishlist.html must turn a stored mobile id such as",
  " *   nothing-phone-3a-lite-8128GB-27999",
  " * back into a card (photo, model, RAM/storage, price, EMI, WhatsApp link).",
  " * mobiles.html owns that inventory inline and products.json would need",
  " * fetch(), which is blocked on file://, so the mirror ships as a plain",
  " * <script> any page can load offline.",
  " *",
  ' * The id rule matches mobiles.html exactly: "<slug>-<specs>-<price>" with',
  " * every non-alphanumeric character stripped from the spec, and the WhatsApp",
  " * message copies the mobiles.html card word for word.",
  " * ========================================================================== */",
  "",
  "(function (global) {",
  '  "use strict";',
  "",
  '  var WHATSAPP_NUMBER = "919009909002";',
  "",
  "  var products = ["
].join("\n");

const FOOTER = [
  "  ];",
  "",
  '  /** "8/128GB" -> "8128GB" (strips every separator, like mobiles.html). */',
  "  function compactSpecs(specs) {",
  '    return String(specs).replace(/[^a-z0-9]/gi, "");',
  "  }",
  "",
  "  /** Stable wishlist / deep-link id for one variant. */",
  "  function idFor(product) {",
  '    return product.slug + "-" + compactSpecs(product.specs) + "-" + product.price;',
  "  }",
  "",
  "  /** 27999 -> the rupee amount as en-IN currency. */",
  "  function formatPrice(value) {",
  '    return "\\u20B9" + Number(value).toLocaleString("en-IN");',
  "  }",
  "",
  '  /** "Nothing Phone (3a) Lite" */',
  "  function fullName(product) {",
  '    return product.brand + " " + product.model;',
  "  }",
  "",
  '  /** "8/128GB" -> "8GB RAM, 128GB" (identical to the mobiles.html spec line). */',
  "  function specLabel(specs) {",
  '    return String(specs).replace("+", "GB RAM, ").replace("/", "GB, ");',
  "  }",
  "",
  "  /** Local photo, then the vendor photo, then the shared placeholder. */",
  "  function imageSources(product) {",
  "    return [",
  '      product.image || "images/mobiles/" + product.slug + ".png",',
  '      product.imageFallback || "",',
  '      "assets/images/placeholder-phone.png"',
  "    ];",
  "  }",
  "",
  "  function whatsappLink(product) {",
  "    var text =",
  '      "Hi, I\'m interested in this model:\\n\\n" +',
  '      "*Model:* " + fullName(product) + "\\n" +',
  '      "*Price:* " + formatPrice(product.price) + "\\n" +',
  '      "*Variant:* " + product.specs + "\\n\\n" +',
  '      "Is it available for a store visit today?";',
  '    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);',
  "  }",
  "",
  "  var index = null;",
  "",
  "  /** Resolve a stored wishlist id back to its variant, or null. */",
  "  function byId(id) {",
  "    if (!id) return null;",
  "    if (!index) {",
  "      index = {};",
  "      for (var i = 0; i < products.length; i++) index[idFor(products[i])] = products[i];",
  "    }",
  '    return index[String(id)] || null;',
  "  }",
  "",
  "  global.MobilesCatalog = {",
  "    WHATSAPP_NUMBER: WHATSAPP_NUMBER,",
  "    allProducts: products,",
  "    idFor: idFor,",
  "    byId: byId,",
  "    compactSpecs: compactSpecs,",
  "    formatPrice: formatPrice,",
  "    fullName: fullName,",
  "    specLabel: specLabel,",
  "    imageSources: imageSources,",
  "    whatsappLink: whatsappLink",
  "  };",
  "})(window);",
  ""
].join("\n");

function build() {
  const html = fs.readFileSync(SOURCE, "utf8");
  const products = parseProducts(html);

  if (!products.length) {
    console.error("ERROR: no addProduct() calls parsed from mobiles.html");
    process.exit(2);
  }

  const keys = products.map((p) => `${p.slug}|${p.specs}|${p.price}`);
  const duplicates = keys.length - new Set(keys).size;
  if (duplicates > 0) {
    console.error(`ERROR: ${duplicates} duplicate slug/specs/price combination(s) - ids would collide.`);
    process.exit(3);
  }

  const body = products.map(renderProduct).join("\n");
  fs.writeFileSync(TARGET, `${HEADER}\n${body}\n${FOOTER}`, "utf8");

  console.log(
    `Wrote ${path.relative(ROOT, TARGET)} - ${products.length} variant(s) ` +
    `from ${path.relative(ROOT, SOURCE)}`
  );
}

build();
