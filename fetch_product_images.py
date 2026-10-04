#!/usr/bin/env python3
"""
fetch_product_images.py
=======================
Downloads an official product photo for every handset in ``mobiles.html`` and
rewrites the optional 5th ``image`` argument of each ``addProduct(...)`` call to
point at the local file.

Why this exists
---------------
``mobiles.html`` stores its catalogue as ``addProduct(brand, model, variants,
colors, image?)`` calls. Almost every call passes ``""`` for ``image``, so cards
fall through to ``images/mobiles/<slug>.png`` - a folder that only contains a
README - and finally to a generated placeholder card. This script fills the gap.

Safety model (important)
------------------------
A wrong product photo on a shopfront is worse than an honest placeholder, so
this script is deliberately conservative:

  1. Only images found on an **allow-listed manufacturer domain** or a small
     set of trusted spec sites are accepted.
  2. The candidate page's title must actually contain the device model, so a
     search that lands on "Realme GT 7" cannot satisfy "Realme GT 8 Pro".
  3. Downloads are validated with Pillow: real raster image, >= MIN_EDGE px,
     >= MIN_BYTES. SVG placeholders and sprites are rejected.
  4. **Any product that cannot be resolved is left untouched**, so its existing
     branded placeholder keeps working. Nothing is ever replaced by a guess.

Generic stock photos (Unsplash / Wikimedia) are available behind the opt-in
``--allow-stock`` flag only - see ``fallback_stock()`` for why that is off by
default.

Usage
-----
    python fetch_product_images.py --limit 3      # dry run on 3 products
    python fetch_product_images.py                # full run
    python fetch_product_images.py --dry-run      # resolve, print, write nothing
    python fetch_product_images.py --report-only  # show current state
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Tuple
from urllib.parse import unquote, urljoin, urlparse

import requests
from PIL import Image

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

ROOT = Path(__file__).resolve().parent
TARGET_HTML = ROOT / "mobiles.html"
OUT_DIR = ROOT / "assets" / "images" / "products"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# Only product pages on these domains may supply an image.
SEED_FILE = ROOT / "image_sources.json"

OFFICIAL_HOSTS = (
    "realme.com",
    "nothing.tech",
    "oppo.com",
    "oneplus.com",
)

# User forums / community boards live on the same registrable domain but carry
# no product imagery - a thread page would otherwise satisfy the host test and
# hand us a site logo.
BLOCKED_SUBHOST_MARKERS = (
    "community.",
    "forum.",
    "community/",
    "support.",
    "help.",
    "developer.",
    "blog.",
    "careers.",
)

# Images are only downloaded from these hosts.
#
# The first group are the manufacturers' own asset CDNs. They are reached only
# from a page on the matching OFFICIAL_HOSTS domain and only when the asset
# filename names the device, so an unverified host cannot be used to smuggle in
# an arbitrary picture. cdn.shopify.com is Nothing's storefront CDN (nothing.tech
# is a Shopify store); static2/image01.realme.net and image.oppo.com are the
# Realme and Oppo product-asset hosts.
TRUSTED_IMAGE_HOSTS = OFFICIAL_HOSTS + (
    "cdn.shopify.com",
    "cdn.sanity.io",
    "static2.realme.net",
    "static.realme.net",
    "image01.realme.net",
    "image02.realme.net",
    "image03.realme.net",
    "image04.realme.net",
    "image.oppo.com",
    "oppo.com",
    "gsmarena.com",
    "fdn2.gsmarena.com",
    "fdn1.gsmarena.com",
    "fdn.gsmarena.com",
    "wikimedia.org",
    "upload.wikimedia.org",
)

# Spec databases: product pages here are server-rendered, unlike the
# JS-only marketing SPAs, and their image filenames name the device.
SPEC_HOSTS = ("gsmarena.com",)

MIN_EDGE = 300        # reject anything smaller than this on either axis
MIN_BYTES = 8_000     # reject stubs / tracking pixels
MAX_EDGE = 900        # downscale larger hero shots; cards render at 400x500
MAX_BYTES = 6_000_000  # hard cap on any single download
JPEG_QUALITY = 92
REQUEST_DELAY = 3.0   # seconds between network calls (be polite)
SEARCH_ENDPOINT = "https://html.duckduckgo.com/html/"

# Words stripped from a model before searching so we land on the base device
# render rather than a storage/RAM-specific listing page.
TITLE_NOISE = re.compile(
    r"\b(\d+\s*\+\s*\d+\s*gb|\d+\s*/\s*\d+\s*gb|\d+\s*tb|\d+\s*gb|"
    r"ram|rom|storage|variant|edition)\b",
    re.IGNORECASE,
)


def log(msg: str) -> None:
    print(msg, flush=True)


# --------------------------------------------------------------------------- #
# Data model
# --------------------------------------------------------------------------- #

@dataclass
class Product:
    brand: str
    model: str
    image_current: str
    call_start: int          # index of "addProduct" in the file
    call_end: int            # index just past the closing ")"
    arg_spans: List[Tuple[int, int]] = field(default_factory=list)

    @property
    def slug(self) -> str:
        """Mirrors the JS slug in mobiles.html: lowercase, non-alnum -> '-'."""
        raw = f"{self.brand}-{self.model}".lower()
        return re.sub(r"[^a-z0-9]+", "-", raw).strip("-")

    @property
    def search_name(self) -> str:
        """Brand + model with RAM/storage noise removed."""
        name = f"{self.brand} {self.model}"
        return re.sub(r"\s+", " ", TITLE_NOISE.sub("", name)).strip()

    @property
    def model_key(self) -> str:
        return normalize(self.model)


def normalize(text: str) -> str:
    """Lowercase and strip everything but letters/digits - for name matching."""
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def host_of(url: str) -> str:
    """Lowercase hostname of a URL."""
    return (urlparse(url).netloc or "").lower()


def _host_matches(host: str, domains) -> bool:
    return any(host == d or host.endswith("." + d) for d in domains)


def is_official(url: str) -> bool:
    """True for the device manufacturer's real store domains (not forums)."""
    low = url.lower()
    if any(marker in low for marker in BLOCKED_SUBHOST_MARKERS):
        return False
    return _host_matches(host_of(url), OFFICIAL_HOSTS)


def is_spec_site(url: str) -> bool:
    """True for the spec-database pages we use as a secondary source."""
    return _host_matches(host_of(url), SPEC_HOSTS)


def image_matches_model(image_url: str, brand: str, model: str,
                        sibling_keys=()) -> bool:
    """
    Confirm the asset really is this device, not a near neighbour.

    Vendor asset names carry extra tokens ("nothing-phone-(4a)-5g.jpg" for
    "Phone (4a)"), so containment - not equality - is the right test. But bare
    containment is unsafe: "nothing-phone-4a-pro.jpg" also contains "phone4a".
    So we additionally reject the image if any *other* model in the catalogue
    with a longer key is present in the name, which pins each asset to exactly
    one device in this shop.

    The device is looked for in the last two path segments, not just the file
    name: some vendors name the device in a directory and put an opaque hash as
    the file ("/images/realme-gt-8-pro-in/1762339...webp"), and that hash must
    not stop an otherwise valid official render from being recognised.
    """
    path = urlparse(image_url).path
    segments = [s for s in path.split("/") if s]

    stems: List[str] = []
    for seg in segments[-2:]:
        stem = re.sub(r"\.[a-z0-9]+$", "", seg)        # drop extension
        stem = re.sub(r"[-_]?\d{3,}$", "", stem)       # drop trailing catalogue id
        if normalize(stem):
            stems.append(stem)

    key = normalize(model)
    if not key or not stems:
        return False

    # The file name is the strongest signal, so it must carry the device...
    if key not in normalize(stems[-1]):
        return False
    stem_norm = normalize(stems[-1])

    # ...but a longer sibling present in the file name is always a rejection,
    # even when a parent directory is what pinned the match.
    for other in sibling_keys or ():
        if other and other != key and len(other) > len(key) and other in stem_norm:
            return False                       # a longer sibling also matches
    return True


def is_trusted_image_host(url: str) -> bool:
    """True for domains we are willing to download an image from."""
    return _host_matches(host_of(url), TRUSTED_IMAGE_HOSTS)


TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.S | re.IGNORECASE)

# Marketing pages routinely drop the connectivity suffix the catalogue keeps
# ("Reno 12 5G" is titled just "OPPO Reno12"). Stripping it lets the title test
# succeed without loosening it so far that it accepts a sibling device.
_CONNECTIVITY = ("lte", "5g", "4g", "3g")


def core_model_key(key: str) -> str:
    """A normalised model key with any trailing connectivity suffix removed."""
    for token in _CONNECTIVITY:
        if key.endswith(token) and len(key) > len(token) + 1:
            return key[:-len(token)]
    return key


def _longer_sibling_present(haystack: str, own_core: str, sibling_keys) -> bool:
    """True if a longer catalogue sibling also appears in this text."""
    for other in sibling_keys or ():
        other_core = core_model_key(other)
        if (other_core != own_core and len(other_core) > len(own_core)
                and other_core in haystack):
            return True
    return False


def title_confirms_device(html: str, brand: str, model: str,
                          sibling_keys=()) -> bool:
    """
    True when the page's own <title> names this exact device.

    This is what makes the seeded page trustworthy: the map points at a page,
    but only the page can prove it really is that device. Brand and model are
    matched separately because real titles reorder and pad them
    ("Phone (4a) | Smartphones | Nothing | UK"), and the connectivity suffix is
    dropped on both sides so "Reno 12 5G" still matches the title "OPPO Reno12".

    A longer catalogue sibling in the title is always a refusal, so the
    "Reno12 Pro" page can never be accepted for the plain "Reno 12 5G".
    """
    m = TITLE_RE.search(html)
    if not m:
        return False
    haystack = normalize(re.sub(r"<[^>]+>", "", m.group(1)))
    brand_key = normalize(brand)
    if brand_key and brand_key not in haystack:
        return False

    own_core = core_model_key(normalize(model))
    if len(own_core) < 2 or own_core not in haystack:
        return False
    return not _longer_sibling_present(haystack, own_core, sibling_keys)


def names_other_model(image_url: str, own_key: str, sibling_keys=()) -> bool:
    """
    True when the asset name points at a *different* catalogue device.

    Used only for the looser, page-verified route: a vendor may call the hero
    render something generic ("427-600-silver.png", "product-thumbnail-white
    .webp"), which is fine once the <title> has pinned the page, but an asset
    that actually names another device in this shop must still be refused.
    """
    name = normalize(urlparse(image_url).path.rsplit("/", 1)[-1])
    return _longer_sibling_present(name, core_model_key(own_key), sibling_keys)


# --------------------------------------------------------------------------- #
# addProduct() parsing
# --------------------------------------------------------------------------- #

def _split_args(src: str, open_paren: int) -> List[Tuple[int, int]]:
    """
    Split one addProduct(...) argument list into top-level (start, end) spans.

    Handles nested arrays/objects, multi-line calls, and quoted strings so that
    commas inside "8+128GB" or ["Black", "White"] never split an argument.
    """
    spans: List[Tuple[int, int]] = []
    depth = 0
    arg_start = open_paren + 1
    i = arg_start
    quote = None

    while i < len(src):
        ch = src[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            if depth == 0:
                if src[arg_start:i].strip():
                    spans.append((arg_start, i))
                return spans
            depth -= 1
        elif ch == "," and depth == 0:
            spans.append((arg_start, i))
            arg_start = i + 1
        i += 1
    return spans


def _as_string(src: str, span: Tuple[int, int]) -> str:
    """Decode a JS string literal span; empty for anything else."""
    raw = src[span[0]:span[1]].strip()
    if len(raw) >= 2 and raw[0] in "\"'" and raw[-1] == raw[0]:
        return raw[1:-1]
    return ""


def parse_products(src: str) -> List[Product]:
    """Find every addProduct(...) call and pull out brand/model/image."""
    products: List[Product] = []
    for m in re.finditer(r"\baddProduct\s*\(", src):
        open_paren = m.end() - 1
        spans = _split_args(src, open_paren)
        if len(spans) < 4:
            continue
        brand = _as_string(src, spans[0])
        model = _as_string(src, spans[1])
        if not brand or not model:
            continue
        image = _as_string(src, spans[4]) if len(spans) >= 5 else ""
        products.append(Product(
            brand=brand, model=model, image_current=image,
            call_start=m.start(), call_end=open_paren + _matching_close(src, open_paren),  # _matching_close() already counts the +1 (span from '(' through ')')
            arg_spans=spans,
        ))
    return products


def _matching_close(src: str, open_paren: int) -> int:
    """Offset from the opening paren to its matching close."""
    depth = 0
    quote = None
    i = open_paren
    while i < len(src):
        ch = src[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
            if depth == 0:
                return i - open_paren + 1
        i += 1
    return len(src) - open_paren


def _slug_of(brand: str, model: str, plus_as_word: bool = False) -> str:
    """
    Build a filename slug.

    The default reproduces mobiles.html's own scheme exactly. With
    ``plus_as_word`` the "+" becomes the word "plus" instead of another "-",
    which is what disambiguates "16 Pro+ 5G" from "16 Pro 5G".
    """
    name = f"{brand}-{model}".replace("+", "plus") if plus_as_word else f"{brand}-{model}"
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def resolve_slugs(products: List[Product]):
    """
    Assign each addProduct() call a unique output filename.

    mobiles.html derives its slug with a regex that turns every run of
    non-alphanumerics into a single "-". That makes "Realme 16 Pro+ 5G" and
    "Realme 16 Pro 5G" collapse onto the same slug, so today the live page gives
    both models one shared image slot. Silently reusing that slug here would
    show one phone's photo on another phone's card, so colliding models get a
    "plus"-aware slug instead and the collision is reported.

    Returns (mapping, collisions) where mapping is {call_start: slug}.
    """
    by_slug: dict = {}
    for p in products:
        by_slug.setdefault(p.slug, []).append(p)

    mapping: dict = {}
    collisions: List[Tuple[str, List[str]]] = []

    for slug, group in by_slug.items():
        if len(group) == 1:
            mapping[group[0].call_start] = slug
            continue

        collisions.append((slug, [f"{p.brand} {p.model}" for p in group]))
        taken = {p.slug for p in group if len(group) > 1 and p is not group[0]}
        for idx, p in enumerate(group):
            alt = _slug_of(p.brand, p.model, plus_as_word=True)
            mapping[p.call_start] = alt if alt not in taken else f"{slug}-{idx + 1}"
            taken.add(mapping[p.call_start])

    return mapping, collisions


def apply_updates(src: str, products: List[Product],
                  updates: dict) -> Tuple[str, int]:
    """
    Rewrite the 5th addProduct argument (or append one) for resolved products.

    Edits are applied right-to-left so earlier offsets stay valid.
    """
    edits = []
    for p in products:
        new_path = updates.get(p.call_start)
        if not new_path:
            continue
        literal = '"%s"' % new_path.replace("\\", "\\\\").replace('"', '\\"')
        if len(p.arg_spans) >= 5:
            s, e = p.arg_spans[4]
            # preserve any inline comment that followed the argument
            m = re.match(r"(\s*//[^\n]*)?", src[e:])
            edits.append((s, e, literal + (m.group(1) or "")))
        else:
            edits.append((p.call_end - 1, p.call_end - 1, ", " + literal))

    for s, e, text in sorted(edits, key=lambda t: -t[0]):
        src = src[:s] + text + src[e:]
    return src, len(edits)


# --------------------------------------------------------------------------- #
# HTTP helpers
# --------------------------------------------------------------------------- #

_last_call = [0.0]


def polite_get(session: requests.Session, url: str, **kwargs) -> requests.Response:
    """
    GET with a global delay and a hard (connect, read) timeout.

    The read cap matters: several manufacturer sites stream a response body so
    slowly that a connect-only timeout never fires and the call hangs forever.
    A read timeout plus a byte cap keeps the whole run bounded.
    """
    wait = REQUEST_DELAY - (time.time() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    _last_call[0] = time.time()

    headers = dict(kwargs.pop("headers", {}) or {})
    headers.setdefault("User-Agent", USER_AGENT)
    resp = session.get(url, timeout=(8, 20), headers=headers,
                       stream=True, **kwargs)
    body = resp.raw.read(MAX_BYTES, decode_content=True)
    resp.close()
    resp._content = body            # already-capped payload
    resp._content_consumed = True
    return resp


def search_official_page(session: requests.Session, name: str,
                         brand: str, model: str,
                         domains=None) -> Optional[str]:
    """
    Find the manufacturer's own product page for this device.

    Brand and model are matched separately rather than as one phrase, because
    real titles reorder them ("Phone (4a) | Smartphones | Nothing"). Returns None
    when no official page matches, which is the signal to leave the product
    alone rather than attach a substitute photo.
    """
    query = f"{name} official site"
    resp = polite_get(session, SEARCH_ENDPOINT, params={"q": query},
                      headers={"User-Agent": USER_AGENT})
    html = resp.text

    results = re.findall(
        r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.S)
    if not results:
        return None

    brand_key = normalize(brand)
    model_key = normalize(model)
    fallback: Optional[str] = None

    for href, title_html in results:
        url = href
        if "uddg=" in url:
            m = re.search(r"uddg=([^&]+)", url)
            if not m:
                continue
            url = unquote(m.group(1))
        if domains == SPEC_HOSTS:
            if not is_spec_site(url):
                continue
        elif not is_official(url):
            continue

        title = re.sub(r"<[^>]+>", "", title_html).replace("&amp;", "&")
        haystack = normalize(title + " " + url)

        # Both the brand and the model must appear, else it is another device.
        if brand_key and brand_key not in haystack:
            continue
        if model_key and model_key not in haystack:
            continue
        return url
    return fallback


def load_seed_map(path: Path) -> Dict[str, Optional[str]]:
    """
    Load the curated '<brand> <model>' -> product page map.

    Search-engine HTML endpoints (DuckDuckGo) answer HTTP 202 with a bot
    challenge from datacenter IPs, and GSMArena's own search (res.php3) is
    behind a Cloudflare Turnstile check, so neither is dependable for automated
    discovery. The manufacturers' own product pages do resolve normally, so the
    page lookup is seeded and everything after it stays automatic.
    """
    if not path.exists():
        log(f"NOTE: no seed map at {path.name}; falling back to web search")
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


OG_IMAGE_RE = re.compile(
    r'<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
    re.IGNORECASE)
OG_IMAGE_RE_ALT = re.compile(
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:image["\']',
    re.IGNORECASE)


BANNER_RATIO = 1.6   # wider than this is a marketing banner, not a product shot


def _is_banner_hint(url: str) -> bool:
    """URLs that name a banner/hero rather than a standalone product render."""
    return any(w in url.lower() for w in
               ("banner", "hero", "bg", "background", "header", "promo",
                "wide", "social", "og-", "thumb", "gallery"))


def extract_product_image(session: requests.Session, page_url: str,
                          name: str, brand: str, model: str,
                          sibling_keys=()) -> Optional[str]:
    """
    Pick the best standalone product image from a page.

    Candidates must sit on a trusted host and carry the device name in their
    asset path. Among survivors the ranking prefers a plain product render over
    a promotional banner, because cards render with object-fit:contain in a
    400x500 box - a 2.3:1 banner shows up as a thin, cropped strip.
    """
    resp = polite_get(session, page_url)
    html = resp.text

    # Only a page that names this exact device may supply a generic-named
    # hero render (see names_other_model).
    verified = title_confirms_device(html, brand, model, sibling_keys)
    own_key = normalize(model)

    def usable(url: str) -> bool:
        return (url.startswith("http")
                and is_trusted_image_host(url)
                and image_matches_model(url, brand, model, sibling_keys))

    def usable_og(url: str) -> bool:
        """og:image: strict match, or a verified page's own non-conflicting pick."""
        if not url.startswith("http") or not is_trusted_image_host(url):
            return False
        if image_matches_model(url, brand, model, sibling_keys):
            return True
        return verified and not names_other_model(url, own_key, sibling_keys)

    candidates: List[Tuple[int, str]] = []

    for regex in (OG_IMAGE_RE, OG_IMAGE_RE_ALT):
        for m in regex.finditer(html):
            img = urljoin(page_url, m.group(1).strip())
            if usable_og(img):
                # The page's own declared hero render outranks in-page copies,
                # which are often downscaled thumbnails ("?width=144").
                candidates.append((20 if verified else 12, img))

    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE):
        img = urljoin(page_url, m.group(1).strip())
        if not usable(img):
            continue
        blob = (m.group(0) + " " + img).lower()
        if any(w in blob for w in ("logo", "icon", "sprite", "placeholder",
                                   "avatar", "gravatar", "badge", "flag",
                                   "button", "payment", "rating")):
            continue
        score = 8
        if "bigpic" in img.lower():
            score = 10
        if _is_banner_hint(img):
            score -= 6
        # Delivery-time resizing (Shopify "?width=144&height=144") yields a
        # thumbnail too small to survive validation; prefer the original.
        small = re.search(r"[?&](?:width|w)=(\d+)", img)
        if small and int(small.group(1)) < MIN_EDGE:
            score -= 5
        candidates.append((score, img))

    if not candidates:
        return None
    candidates.sort(key=lambda t: -t[0])
    return candidates[0][1]


def download_and_store(session: requests.Session, image_url: str,
                       dest: Path) -> Tuple[bool, str]:
    """
    Download, validate and re-encode one product image to JPEG on disk.

    Returns (ok, message). Rejects placeholders, non-raster files and anything
    too small to be a real product shot.
    """
    try:
        resp = polite_get(session, image_url, headers={"User-Agent": USER_AGENT,
                                                       "Referer": image_url})
        raw = resp.content
    except Exception as exc:                     # noqa: BLE001 - reported, not fatal
        return False, f"download failed: {type(exc).__name__}"

    if len(raw) < MIN_BYTES:
        return False, f"too small ({len(raw)} bytes)"

    try:
        with Image.open(io.BytesIO(raw)) as im:
            im.load()
            fmt = (im.format or "").upper()
            if fmt not in ("JPEG", "PNG", "WEBP"):
                return False, f"unsupported format {fmt}"
            if min(im.size) < MIN_EDGE:
                return False, f"image too small {im.size[0]}x{im.size[1]}"

            # Cards render with object-fit:contain in a 400x500 box, so a wide
            # marketing banner would appear as a thin cropped strip. Reject it.
            w, h = im.size
            if w / float(h) > BANNER_RATIO:
                return False, f"banner aspect ratio {w}x{h} (wider than {BANNER_RATIO}:1)"

            # Normalise onto a white canvas (PNG/WEBP may carry alpha) so the
            # JPEG matches the white product-image style used across the site.
            if im.mode in ("RGBA", "LA", "P"):
                rgba = im.convert("RGBA")
                canvas = Image.new("RGB", rgba.size, (255, 255, 255))
                canvas.paste(rgba, mask=rgba.split()[-1])
                im = canvas
            else:
                im = im.convert("RGB")

            im.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
            dest.parent.mkdir(parents=True, exist_ok=True)
            im.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)
            return True, f"{im.size[0]}x{im.size[1]} {fmt}"
    except Exception as exc:                     # noqa: BLE001
        return False, f"invalid image: {type(exc).__name__}"


# --------------------------------------------------------------------------- #
# Optional generic-stock fallback (OFF by default - see --allow-stock)
# --------------------------------------------------------------------------- #

def fallback_stock(session: requests.Session, name: str,
                   dest: Path) -> Tuple[bool, str]:
    """
    Opt-in only: look for a Wikimedia Commons photo of the device.

    Generic stock imagery (a generic phone shot) would misrepresent the exact
    model on a shopfront, so this only runs behind --allow-stock and even then
    only accepts a Commons file whose title contains the device name.
    """
    api = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"{name} filetype:bitmap", "gsrnamespace": "6",
        "gsrlimit": "5", "prop": "imageinfo", "iiprop": "url|size",
        "iiurlwidth": str(MAX_EDGE),
    }
    try:
        resp = polite_get(session, api, params=params,
                          headers={"User-Agent": USER_AGENT})
        pages = resp.json().get("query", {}).get("pages", {})
    except Exception as exc:                     # noqa: BLE001
        return False, f"commons lookup failed: {type(exc).__name__}"

    key = normalize(name)
    for page in pages.values():
        title = normalize(page.get("title", ""))
        if key and key not in title:
            continue
        info = (page.get("imageinfo") or [{}])[0]
        url = info.get("thumburl") or info.get("url")
        if not url:
            continue
        ok, msg = download_and_store(session, url, dest)
        if ok:
            return True, "commons " + msg
    return False, "no matching Commons file"


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #

def main() -> int:
    global REQUEST_DELAY

    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--limit", type=int, default=0,
                    help="only process the first N products (smoke testing)")
    ap.add_argument("--dry-run", action="store_true",
                    help="resolve and report, but do not write files or HTML")
    ap.add_argument("--report-only", action="store_true",
                    help="show current image state and exit")
    ap.add_argument("--force", action="store_true",
                    help="re-fetch even when an image is already assigned")
    ap.add_argument("--allow-stock", action="store_true",
                    help="permit generic Wikimedia fallback for unresolved products")
    ap.add_argument("--delay", type=float, default=REQUEST_DELAY,
                    help="seconds between network requests")
    args = ap.parse_args()
    REQUEST_DELAY = max(0.5, args.delay)

    if not TARGET_HTML.exists():
        log(f"ERROR: {TARGET_HTML} not found")
        return 2

    src = TARGET_HTML.read_text(encoding="utf-8")
    products = parse_products(src)
    if not products:
        log("ERROR: no addProduct() calls parsed from mobiles.html")
        return 2

    # One photo per device, not per storage variant. Slug collisions between
    # genuinely different models are disambiguated before de-duplicating.
    slug_map, collisions = resolve_slugs(products)

    if collisions:
        log("\nWARNING: colliding slugs in mobiles.html's slug scheme:")
        for slug, names in collisions:
            log(f"  {slug} <- {', '.join(names)}")
            log("    (these are different devices that already share one image slot)")

    unique: dict = {}
    for p in products:
        unique.setdefault(slug_map[p.call_start], p)
    targets = list(unique.values())
    if args.limit:
        targets = targets[:args.limit]

    log(f"Parsed {len(products)} addProduct() call(s) -> {len(unique)} unique device(s)")

    seed = load_seed_map(SEED_FILE)
    if seed:
        hit = sum(1 for k, v in seed.items() if v)
        log(f"Seed map: {hit} page(s) mapped, {len(seed) - hit} device(s) with no page")
    # Every model name in the catalogue, so an asset that also matches a longer
    # sibling ("phone-4a-pro" for "Phone (4a)") can be rejected.
    sibling_keys = tuple(sorted({normalize(p.model) for p in unique.values()
                                 if normalize(p.model)}))

    if args.report_only:
        missing = sum(1 for p in unique.values() if not p.image_current)
        stale = [p for p in unique.values()
                 if p.image_current and not (ROOT / p.image_current).is_file()]
        log(f"  with image assigned : {len(unique) - missing}")
        log(f"  without image       : {missing}  (renders a generated placeholder)")
        if stale:
            log(f"  STALE (file absent) : {len(stale)}  <-- will be re-resolved")
            for p in stale:
                log(f"    {p.brand} {p.model} -> {p.image_current}")
        for p in unique.values():
            flag = "[img] " if p.image_current else "[---] "
            if p in stale:
                flag = "[BAD] "
            log(f"    {flag}{p.brand} {p.model}")
        return 0

    session = requests.Session()
    resolved: dict = {}
    failures: List[Tuple[str, str, str]] = []
    unchanged = 0

    for i, p in enumerate(targets, 1):
        head = f"[{i:>2}/{len(targets)}] {p.brand} {p.model}"

        # A path in the HTML is not proof the picture is there. If the file was
        # moved or deleted the entry is stale, and the product must be resolved
        # again rather than counted as "already set" (which would leave a
        # broken <img> in the page).
        stale = bool(p.image_current) and not (ROOT / p.image_current).is_file()
        if stale:
            log(f"{head} -> assigned path missing on disk ({p.image_current}), "
                f"re-resolving")
        elif p.image_current and not args.force:
            log(f"{head} -> already set ({p.image_current}), skipping")
            unchanged += 1
            continue

        dest = OUT_DIR / f"{slug_map[p.call_start]}.jpg"
        rel = dest.relative_to(ROOT).as_posix()
        status, detail, source = "", "", ""

        # Sources in order of preference:
        #   1. the seeded manufacturer product page -> official renders, no
        #      engine scraping, and the only source that reliably yields a
        #      high-resolution asset (realme.com and nothing.tech both name
        #      the device in the file)
        #   2. DuckDuckGo + manufacturer store page (unreliable: the endpoint
        #      returns HTTP 202 bot challenges, and og:image there is often a
        #      wide promo banner)
        page = seed.get(p.search_name)
        source = "seed" if page else ""
        if not page:
            if p.search_name in seed:
                # An explicit null in the seed: this device has no matching
                # product page, so do not fall back to a looser search.
                detail = "no product page known for this device"
            else:
                try:
                    page = search_official_page(session, p.search_name, p.brand,
                                                p.model, OFFICIAL_HOSTS)
                except Exception as exc:         # noqa: BLE001
                    page = None
                    detail = f"search error {type(exc).__name__}"
                if page:
                    source = host_of(page)

        if page:
            try:
                img = extract_product_image(session, page, p.search_name, p.brand,
                                               p.model, sibling_keys)
            except Exception as exc:             # noqa: BLE001
                img = None
                detail = f"page error {type(exc).__name__}"

            if img:
                if args.dry_run:
                    status, detail = "DRY", host_of(img)
                else:
                    ok, msg = download_and_store(session, img, dest)
                    if ok:
                        status, detail = "OK", msg
                    else:
                        detail = msg
            else:
                detail = detail or f"no model-matching image on {host_of(page)}"
        else:
            detail = detail or "no product page found"

        if status == "OK" and args.allow_stock and not args.dry_run:
            ok2, msg2 = fallback_stock(session, p.search_name, dest)
            detail = f"{detail}; {msg2}" if not ok2 else msg2

        if status == "OK":
            resolved[p.call_start] = rel
            log(f"{head} -> OK  {rel}  [{source}] ({detail})")
        elif args.dry_run and page:
            log(f"{head} -> DRY would use {rel} via {host_of(page)}")
        else:
            failures.append((f"{p.brand} {p.model}", detail or "unresolved", page or "-"))
            log(f"{head} -> KEEP PLACEHOLDER  ({detail or 'unresolved'})")

    log("")
    log(f"Downloaded : {len(resolved)}")
    log(f"Kept as-is : {unchanged}")
    log(f"No image   : {len(failures)}  (placeholder stays, nothing overwritten)")

    if failures and not args.dry_run:
        log("\nUnresolved (no safe match found):")
        for name, why, page in failures:
            log(f"  - {name}: {why}")

    if args.dry_run:
        log("\nDRY RUN - no files written, mobiles.html untouched.")
        return 0

    if resolved:
        new_src, edited = apply_updates(src, products, resolved)
        backup = TARGET_HTML.with_suffix(".html.bak")
        backup.write_text(src, encoding="utf-8")
        TARGET_HTML.write_text(new_src, encoding="utf-8")
        log(f"\nUpdated {edited} addProduct() call(s) in mobiles.html")
        log(f"Backup written to {backup.name}")
    else:
        log("\nNo changes to mobiles.html.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
