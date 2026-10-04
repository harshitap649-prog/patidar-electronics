"""Probe the 14 distinct LG image URLs in js/catalog-data.js for liveness."""
import concurrent.futures as cf
import re
import urllib.request

SRC = open("js/catalog-data.js", encoding="utf-8").read()
URLS = sorted(set(re.findall(r'https://www\.lg\.com/[^"]+', SRC)))
print(len(URLS), "distinct LG URLs")

HDRS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"),
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.lg.com/in/",
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "same-origin",
}


def probe(u):
    try:
        req = urllib.request.Request(u, headers=HDRS)
        r = urllib.request.urlopen(req, timeout=25)
        data = r.read(64)
        return u, r.status, r.headers.get("Content-Type"), r.headers.get("Content-Length")
    except Exception as e:
        return u, "ERR", str(e)[:90], ""


with cf.ThreadPoolExecutor(8) as ex:
    for u, st, ct, ln in ex.map(probe, URLS):
        print(st, "|", ct, "|", ln, "|", u)
