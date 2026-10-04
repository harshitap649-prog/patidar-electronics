"""Find live LG India product images (og:image) for the 14 dead catalog URLs.

LG India PDP slug pattern: https://www.lg.com/in/<cat>/<sub>/<model-lower>/
We try several slugs per model, then read og:image (a live
/content/dam/channel/wcms/1-channel/... asset) from the PDP.
"""
import re
import sys

import requests

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
H = {"User-Agent": UA, "Accept-Language": "en-IN,en;q=0.9",
     "Accept": "text/html,application/xhtml+xml,*/*;q=0.8"}

# catalog model -> candidate PDP slugs (relative to https://www.lg.com/in/)
MODELS = {
    # TVs
    "UA65U8300HULXL": ["tv-soundbars/4k-uhd-tvs/ua65u8300hulxl",
                       "tv-soundbars/4k-uhd-tvs/65ua83006la",
                       "tv-soundbars/4k-uhd-tvs/ua65u8300hulxl-in"],
    "UA55U8300HULXL": ["tv-soundbars/4k-uhd-tvs/ua55u8300hulxl",
                       "tv-soundbars/4k-uhd-tvs/55ua83006la"],
    "UA43U8400HULXL": ["tv-soundbars/4k-uhd-tvs/ua43u8400hulxl",
                       "tv-soundbars/4k-uhd-tvs/43ua84006la"],
    "UA43F5600FUXXL": ["tv-soundbars/full-hd-tvs/ua43f5600fuxxl",
                       "tv-soundbars/full-hd-tvs/43f5600fuxxl"],
    "UA32H4520FUXXL": ["tv-soundbars/hd-tvs/ua32h4520fuxxl",
                       "tv-soundbars/hd-ready-tvs/ua32h4520fuxxl",
                       "tv-soundbars/hd-tvs/32h4520fuxxl"],
    # Refrigerators
    "REF-RT31H4522S8": ["refrigerators/double-door-refrigerators/rt31h4522s8"],
    "REF-RR24H2823HT": ["refrigerators/single-door-refrigerators/rr24h2823ht"],
    "REF-RR23H2H35RZ": ["refrigerators/single-door-refrigerators/rr23h2h35rz"],
    "REF-RR21H2H259R": ["refrigerators/single-door-refrigerators/rr21h2h259r"],
    "REF-RR20H2712HN": ["refrigerators/single-door-refrigerators/rr20h2712hn"],
    "REF-RR19H2YC1CR": ["refrigerators/single-door-refrigerators/rr19h2yc1cr"],
    # Washing machines
    "LG-FAFL-FHB1208Z2M": ["washing-machines/front-load-washing-machines/fhb1208z2m"],
    "LG-FATL-T90KMMB3Z": ["washing-machines/top-load-washing-machines/t90kmmb3z"],
    "LG-FATL-T80KMMB3Z": ["washing-machines/top-load-washing-machines/t80kmmb3z"],
    "LG-SAWM-P115ASLAZ": ["washing-machines/semi-automatic-washing-machines/p115aslaz"],
}

OG = re.compile(r'<meta[^>]+(?:property|name)=["\']og:image["\'][^>]+content=["\']([^"\']+)', re.I)
OG2 = re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']og:image', re.I)
TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)

s = requests.Session()
for model, slugs in MODELS.items():
    hit = False
    for slug in slugs:
        url = "https://www.lg.com/in/" + slug + "/"
        try:
            r = s.get(url, headers=H, timeout=25, allow_redirects=True)
        except Exception as e:                                    # noqa: BLE001
            print(f"{model:22} FETCHFAIL {type(e).__name__}")
            continue
        m = OG.search(r.text) or OG2.search(r.text)
        t = TITLE.search(r.text)
        title = t.group(1).strip()[:60] if t else "?"
        og = m.group(1) if m else "-"
        print(f"{model:22} {r.status_code} len={len(r.text):>7} {title}")
        print(f"      og: {og}")
        if og != "-" and r.status_code == 200:
            hit = True
            break
    if not hit:
        print(f"{model:22} >>> no og:image found")