"""Scrape LG IN category listing pages for product links containing model slugs."""
import concurrent.futures as cf
import re
import urllib.request

PAGES = [
    "https://www.lg.com/in/refrigerators/",
    "https://www.lg.com/in/washing-machines/",
    "https://www.lg.com/in/tv-soundbars/4k-uhd-tvs/",
    "https://www.lg.com/in/tv-soundbars/full-hd-tvs/",
    "https://www.lg.com/in/tv-soundbars/hd-tvs/",
]

MODELS = [
    "rt31h4522", "rr24h2823", "rr23h2h35", "rr21h2h25", "rr20h2712",
    "fhb1208", "t90kmm", "t80kmm", "p115asl", "p105asr", "p9555", "p8535", "p7510", "p7010",
    "u8400", "f5600", "h4520", "u8300",
]

HDRS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def fetch(u):
    try:
        req = urllib.request.Request(u, headers=HDRS)
        r = urllib.request.urlopen(req, timeout=40)
        return u, r.read().decode("utf-8", "ignore")
    except Exception as e:
        return u, f"__ERR__ {e}"


for u, html in cf.ThreadPoolExecutor(5).map(fetch, PAGES):
    if html.startswith("__ERR__"):
        print("ERR", u, html[:120])
        continue
    links = set(re.findall(r'https://www\.lg\.com/in/[a-z0-9\-/]*/?[\w\-]*/', html))
    hits = sorted({l for l in links if any(m in l.lower() for m in MODELS)})
    print("==", u, len(html), "bytes;", len(hits), "model hits")
    for h in hits:
        print("   ", h)
    # also dump all product-detail-ish links for category structure
    prod = sorted({l for l in links if "/in/" in l and re.search(r'/[a-z0-9]{12,}/$', l)})
    for p in prod[:40]:
        print("   P", p)
