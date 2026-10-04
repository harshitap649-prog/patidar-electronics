import requests
import sys
import requests
import re
from urllib.parse import urljoin

sys.path.insert(0, r"C:\Users\Keshav\Desktop\shop")
import fetch_product_images as F

page = "https://www.realme.com/global/realme-gt-8-pro"
sess = requests.Session()
resp = F.polite_get(sess, page)
html = resp.text
print("status", resp.status_code, "len", len(html))

brand, model = "Realme", "GT 8 Pro"
sibs = tuple(sorted({F.normalize(m) for m in
                     ["GT 8 Pro", "P4X", "C100X", "15T 5G", "16 5G",
                      "16 Pro 5G", "16 Pro+ 5G", "13x 5G", "C83 5G"]}))

import sys
import io
import re
import requests
from PIL import Image, ImageDraw

sys.path.insert(0, r"C:\Users\Keshav\Desktop\shop")
import fetch_product_images as F

H = {"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
     "Referer": "https://www.realme.com/"}
sess = requests.Session()

# 1) probe candidate slugs for the models we still cannot match
print("--- slug probe ---")
PROBE = {
    "16 Pro+ 5G": ["realme-16-pro-plus-5g", "realme-16pro-plus-5g", "realme-16-pro-",
                    "realme-16-pro-plus", "realme-16proplus-5g"],
    "15T 5G": ["realme-15t-5g", "realme-15t-plus-5g", "realme-15t-5g-global"],
    "P4 5G": ["realme-p4-5g", "realme-p4", "realme-p4-5g-global"],
    "P4 Lite 5G": ["realme-p4-lite-5g", "realme-p4-lite"],
    "C83 5G": ["realme-c83-5g", "realme-c83"],
    "13x 5G": ["realme-13x-5g", "realme-13x-5g-global", "realme-13x"],
    "Pad 3 5G LTE": ["realme-pad-3-5g", "realme-pad-3", "realme-pad3-5g"],
    "P4S New": ["realme-p4s-new", "realme-p4s", "realme-p4s-5g"],
    "C1001 New": ["realme-c1001-new", "realme-c1001"],
}
for model, slugs in PROBE.items():
    key = F.normalize(model)
    for slug in slugs:
        u = f"https://www.realme.com/global/{slug}"
        try:
            html = sess.get(u, timeout=(8, 25)).text
        except Exception:
            print(f"  {model:14} {slug:24} FETCH FAIL")
            continue
        n = sum(1 for a in re.findall(
            r'https://static2\.realme\.net/images/[^"\'\s]+', html)
            if key in F.normalize(a.rsplit("/", 2)[-2]))
        title = re.search(r"<title>(.*?)</title>", html, re.S | re.I)
        t = (title.group(1).strip()[:42] if title else "?")
        print(f"  {model:14} {slug:24} assets={n:>4}  title={t}")
        if n > 100:
            break

# 2) Does realme use a predictable name for the main product render?
print("\n--- portrait probe (realme) ---")
PAGES = [("realme-16-pro-5g", "16 Pro 5G"), ("realme-gt-8-pro", "GT 8 Pro"),
         ("realme-p4x", "P4X"), ("realme-c100x", "C100X"),
         ("realme-15t-5g", "15T 5G"), ("realme-16-5g", "16 5G"),
         ("realme-16-pro-plus-5g", "16 Pro+ 5G")]
BANNER = re.compile(r"bg|banner|line|kv|p[0-9]|z[0-9]|md|mos|lt|sound|icon|logo", re.I)

for slug, model in PAGES:
    page = f"https://www.realme.com/global/{slug}"
    try:
        html = sess.get(page, timeout=(8, 25)).text
    except Exception:
        print(f"  {model:12} FETCH FAIL"); continue
    key = F.normalize(model)
    seen, cands = set(), []
    for a in re.findall(r'https://static2\.realme\.net/images/[^"\'\s]+', html):
        base = a.rsplit("/", 1)[-1]
        if base in seen or key not in F.normalize(a.rsplit("/", 2)[-2]):
            continue
        seen.add(base)
        if not base.endswith(".svg") and not BANNER.search(base):
            cands.append(a)
    # probe dimensions cheaply by downloading a capped sample
    probe = cands[:14]
    sheet = Image.new("RGB", (7 * 190, 2 * 215), "white")
    draw = ImageDraw.Draw(sheet)
    drawn, notes = 0, []
    for u in probe:
        try:
            r = requests.get(u, headers=H, timeout=(8, 20))
            im = Image.open(io.BytesIO(r.content)).convert("RGB")
            w, h = im.size
            if min(im.size) < 400 or not (0.55 <= w / h <= 1.15):
                notes.append(f"{base}={w}x{h}")
                continue
            im.thumbnail((180, 175))
            x, y = (drawn % 7) * 190, (drawn // 7) * 215
            sheet.paste(im, (x + 5, y + 5))
            draw.text((x + 5, y + 182), f"{w}x{h} r={w/h:.2f}", fill="black")
            draw.text((x + 5, y + 197), u.rsplit("/", 1)[-1][:24], fill="black")
            drawn += 1
        except Exception as e:
            notes.append(f"{u.rsplit('/',1)[-1]}={type(e).__name__}")
    out = rf"C:\Users\Keshav\Desktop\shop\_p_{model.replace(' ', '').replace('+','p')}.png"
    sheet.save(out)
    print(f"  {model:12} modelDir={len(seen):>4} portraitLike={drawn:>3} "
          f"-> {out}   skipped={notes[:4]}")

# 3) Nothing product pages: what is actually offered?
print("\n--- nothing og:image ---")
NOTHING = ["phone-3a-lite", "phone-4a", "phone-4a-pro", "phone-4b"]
for slug in NOTHING:
    u = f"https://nothing.tech/products/{slug}"
    try:
        html = sess.get(u, timeout=(8, 25)).text
    except Exception as e:
        print(f"  {slug:16} FETCH FAIL {type(e).__name__}"); continue
    title = re.search(r"<title>(.*?)</title>", html, re.S | re.I)
    ogs = re.findall(r'<meta[^>]+og:image[^>]+content=["\']([^"\']+)', html, re.I)
    print(f"  {slug:16} len={len(html):>7} title="
          f"{(title.group(1).strip()[:40] if title else '?')}")
    for o in ogs[:5]:
        print(f"      og: {o[-92:]}")
    # any cdn.shopify image whose name carries the slug?
    hits = [a for a in re.findall(r'https://cdn\.shopify\.com/[^"\'\s]+', html)
            if F.normalize(slug.replace("-", " ")) in F.normalize(a.rsplit("/", 1)[-1])]
    print(f"      shopify assets naming this model: {len(hits)}")
    for h in hits[:4]:
        print("        ", h.rsplit("/", 1)[-1][:80])
