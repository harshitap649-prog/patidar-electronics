"""Probe candidate URLs for liveness + capture og:image where present."""
import concurrent.futures as cf
import re
import urllib.request

URLS = [
    # realme 13x regional official pages
    "https://www.realme.com/bd/realme-13x",
    "https://www.realme.com/pk/realme-13x",
    "https://www.realme.com/in/realme-13x",
    "https://www.realme.com/bd/realme-13x-5g",
    # LG U8300 series pages
    "https://www.lg.com/in/tv-soundbars/4k-uhd-tvs/65ua83006la/",
    "https://www.lg.com/in/tv-soundbars/4k-uhd-tvs/55ua83006la/",
    "https://www.lg.com/in/tv-soundbars/4k-uhd-tvs/43ua84006la/",
    # OPPO Reno 12 Pro (known good) for reuse check
    "https://www.oppo.com/in/smartphones/series-reno/reno12-pro/",
]

HDRS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def probe(u):
    try:
        req = urllib.request.Request(u, headers=HDRS)
        r = urllib.request.urlopen(req, timeout=30)
        html = r.read(400000).decode("utf-8", "ignore")
        og = re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
        if not og:
            og = re.search(r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"', html)
        title = re.search(r"<title>(.*?)</title>", html, re.S)
        return (u, r.status, (og.group(1) if og else "-"),
                (title.group(1).strip()[:80] if title else "-"))
    except Exception as e:
        return (u, "ERR", str(e)[:100], "")


with cf.ThreadPoolExecutor(6) as ex:
    for u, st, og, ti in ex.map(probe, URLS):
        print(st, "|", u)
        print("   og:", og)
        print("   ti:", ti)
