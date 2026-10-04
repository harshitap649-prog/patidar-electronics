import re, requests
s=requests.Session()
H={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
CANDS={
 "Reno 12 5G":["https://www.oppo.com/en/smartphones/series-reno/reno12/","https://www.oppo.com/in/smartphones/series-reno/reno12/"],
 "Reno 12 Pro 5G":["https://www.oppo.com/en/smartphones/series-reno/reno12-pro/"],
 "Reno 13 5G":["https://www.oppo.com/en/smartphones/series-reno/reno13/"],
 "Reno 13 Pro 5G":["https://www.oppo.com/en/smartphones/series-reno/reno13-pro/"],
 "Find X8 5G":["https://www.oppo.com/en/smartphones/series-find-x/find-x8/"],
 "Find X8 Pro 5G":["https://www.oppo.com/en/smartphones/series-find-x/find-x8-pro/"],
 "Find X8 Pro Ultra":["https://www.oppo.com/en/smartphones/series-find-x/find-x8-ultra/"],
 "A60 4G":["https://www.oppo.com/en/smartphones/series-a/a60/"],
 "A58":["https://www.oppo.com/en/smartphones/series-a/a58/"],
 "F25 Pro 5G":["https://www.oppo.com/en/smartphones/series-f/f25-pro/"],
 "F27 5G":["https://www.oppo.com/en/smartphones/series-f/f27/"],
 "F27 Pro+ 5G":["https://www.oppo.com/en/smartphones/series-f/f27-pro/"],
}
for model,urls in CANDS.items():
  for u in urls:
    try:
      r=s.get(u,headers=H,timeout=(8,25))
    except Exception as e:
      print(f"{model:18} FETCHFAIL {type(e).__name__}"); continue
    t=re.search(r"<title[^>]*>(.*?)</title>", r.text, re.S|re.I)
    og=re.findall(r"og:image[\"\x27][^>]*content=[\"\x27]([^\"\x27]+)", r.text, re.I)
    print(f"{model:18} {r.status_code} len={len(r.text):>7} title={(t.group(1).strip()[:44] if t else chr(63))}")
    for o in og[:2]: print("      og:", o[-95:])
    if r.status_code==200 and len(r.text)>50000: break
