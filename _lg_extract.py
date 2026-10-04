"""Extract model -> live imageUrl pairs out of the saved LG India category HTML.

The category pages embed the whole listing as JSON (modelNumber, pdpUrl,
imageUrl), so we do not need to guess PDP slugs one by one.
"""
import re

FILES = {
    "FRG": "_lg_frg.html",
    "WM": "_lg_wm.html",
    "TV4K": "_lg_tv.html",
}

# Any object that mentions a modelNumber: try to pull model + a dam image near it.
PAIR_PATTERNS = [
    # "modelNumber":"XXX" ... "imageUrl":"YYY"   (order-independent, same object)
    re.compile(r'"modelNumber"\s*:\s*"([^"]+)"[^{}]{0,4000}?"imageUrl"\s*:\s*"([^"]+)"', re.I),
    re.compile(r'"imageUrl"\s*:\s*"([^"]+)"[^{}]{0,4000}?"modelNumber"\s*:\s*"([^"]+)"', re.I),
    re.compile(r'"modelNumber"\s*:\s*"([^"]+)"[^{}]{0,4000}?"thumbnail"\s*:\s*"([^"]+)"', re.I),
]

for label, path in FILES.items():
    try:
        html = open(path, encoding="utf-8", errors="ignore").read()
    except OSError:
        print("MISSING", path)
        continue
    print("=" * 70)
    print(label, path, len(html), "bytes")
    models = sorted(set(re.findall(r'"modelNumber"\s*:\s*"([^"]+)"', html)))
    print("  distinct modelNumber values:", len(models))
    for m in models[:200]:
        print("    M", m)
    for pat in PAIR_PATTERNS:
        hits = pat.findall(html)
        if hits:
            print("  pair hits:", len(hits))
            for a, b in hits[:200]:
                print("    P", a, "|", b)
    # any dam asset that looks like a fridge / washer / tv thumbnail
    assets = sorted(set(re.findall(
        r'(https://www\.lg\.com/content/dam/channel/wcms/in/[^"\']+?\.(?:jpg|jpeg|png|webp))', html)))
    print("  dam assets:", len(assets))
    for a in assets[:80]:
        print("    A", a)
