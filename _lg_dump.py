"""Save LG IN category pages and report embedded product-URL/model structures."""
import re
import urllib.request

HDRS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

PAGES = {
    "_lg_frg.html": "https://www.lg.com/in/refrigerators/",
    "_lg_wm.html": "https://www.lg.com/in/washing-machines/",
    "_lg_tv.html": "https://www.lg.com/in/tv-soundbars/4k-uhd-tvs/",
}

for name, u in PAGES.items():
    req = urllib.request.Request(u, headers=HDRS)
    html = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "ignore")
    open(name, "w", encoding="utf-8").write(html)
    print("==", name, len(html))
    # where does 'model' data live?
    for pat in [r'"modelNumber"\s*:\s*"([^"]+)"', r'"modelName"\s*:\s*"([^"]+)"',
                r'"pdpUrl"\s*:\s*"([^"]+)"', r'"productUrl"\s*:\s*"([^"]+)"',
                r'"url"\s*:\s*"(https://www\.lg\.com/in/[^"]+)"',
                r'"imageUrl"\s*:\s*"([^"]+)"', r'"ogImage"\s*:\s*"([^"]+)"']:
        hits = re.findall(pat, html)
        if hits:
            print("   ", pat, "->", len(hits), "e.g.", hits[0][:140])
    # count occurrences of 'rt31' style model fragments case-insensitively
    for frag in ["rt31", "rr24", "rr23", "rr21", "rr20", "fhb1208", "t90kmm", "t80kmm", "p115asl", "u8400", "f5600", "h4520"]:
        n = len(re.findall(frag, html, re.I))
        if n:
            print("    frag", frag, n)
