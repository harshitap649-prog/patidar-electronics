"""Probe LG catalog image URLs + Realme/Oppo seed pages for status & og:image."""
import re
import requests

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
H = {"User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9"}

src = open("js/catalog-data.js", encoding="utf-8").read()
lg = sorted(set("https://www." + u for u in re.findall(r'lg\.com/content/dam/[^"]+', src)))
print("== LG CDN assets ==")
for u in lg:
    try:
        r = requests.get(u, headers=H, timeout=20)
        print(f"  {r.status_code} {len(r.content):>8}  {u.split('/')[-1]}")
    except Exception as e:
        print(f"  ERR {type(e).__name__}  {u.split('/')[-1]}")

pages = [
    "https://www.realme.com/global/realme-16-5g",
    "https://www.realme.com/global/realme-16-pro-5g",
    "https://www.realme.com/global/realme-15t-5g",
    "https://www.realme.com/global/realme-c100x",
    "https://www.realme.com/global/realme-p4-lite",
    "https://www.realme.com/global/realme-p4",
    "https://www.realme.com/global/realme-p4x",
    "https://www.realme.com/global/realme-gt-8-pro",
    "https://www.realme.com/global/realme-pad-3",
    "https://www.realme.com/in/",
    "https://www.oppo.com/en/smartphones/series-f/",
]
print("\n== seed pages ==")
for u in pages:
    try:
        r = requests.get(u, headers=H, timeout=25, allow_redirects=True)
        og = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', r.text)
        if not og:
            og = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', r.text)
        print(f"  {r.status_code} len={len(r.text):>7} og={(og.group(1) if og else '-')[:110]}  {u}")
    except Exception as e:
        print(f"  ERR {type(e).__name__}  {u}")