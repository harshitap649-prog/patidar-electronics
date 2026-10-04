"""Probe Google Maps embed URLs: follow redirects, report resolved coords/place."""
import re
import urllib.parse
import urllib.request

QUERIES = [
    "Sagore Bus Stand",
    "Patidar Mobile Gallery, Sagore",
    "Patidar Electronics and Furniture Mall, Bus Stand, Sagore",
    "Sagore, Market Road",
]

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

for q in QUERIES:
    url = "https://maps.google.com/maps?" + urllib.parse.urlencode({
        "q": q, "t": "", "z": "15", "ie": "UTF8", "iwloc": "", "output": "embed",
    })
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-IN,en"})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            final = resp.geturl()
            body = resp.read().decode("utf-8", "replace")
    except Exception as exc:  # noqa: BLE001
        print(f"QUERY: {q}\n  ERROR: {exc}\n")
        continue

    center = re.findall(r"center[=:]\s*\[?(-?\d+\.\d+)[,%~]+(-?\d+\.\d+)", body)
    ll = re.findall(r"\[\s*(-?\d{1,3}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})\s*\]", body)
    notfound = [p for p in ("didn't match", "did not match", "no results", "couldn't find", "cannot be found",
                            "Your search", "could not find") if p.lower() in body.lower()]
    title = re.search(r"<title>(.*?)</title>", body, re.S)
    print(f"QUERY: {q}")
    print(f"  final = {final[:150]}")
    print(f"  bytes = {len(body)}  title = {title.group(1)[:90] if title else None!r}")
    print(f"  coords(center)  = {center[:3]}")
    print(f"  coords(array)   = {ll[:3]}")
    print(f"  notfound hints  = {notfound}")
    print()
