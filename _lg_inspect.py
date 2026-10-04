"""Inspect saved LG category pages: context around model hits + dam image URLs."""
import re

FRAGS = ["t80kmm", "t90kmm", "rt31h4522", "rr24h2823", "rr23h2h35", "rr21h2h25",
         "rr20h2712", "fhb1208", "p115asl", "p105asr", "p9555", "p8535",
         "u8400", "f5600", "h4520", "u8300", "ua8300"]

for name in ["_lg_frg.html", "_lg_wm.html", "_lg_tv.html"]:
    html = open(name, encoding="utf-8").read()
    print("=" * 70)
    print(name, len(html))
    for frag in FRAGS:
        for m in re.finditer(frag, html, re.I):
            s = max(0, m.start() - 160)
            e = min(len(html), m.end() + 160)
            print(f"  [{frag}] ...{html[s:e]}...")
            break  # first occurrence only
    # dam images
    imgs = re.findall(r'https://www\.lg\.com/content/dam/[^"\'\\ ]+?\.(?:jpg|jpeg|png|webp)', html)
    print("  dam images:", len(imgs))
    for i in imgs[:8]:
        print("    ", i)
