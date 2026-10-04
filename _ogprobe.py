import io, re, requests
from PIL import Image, ImageDraw
H={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
s=requests.Session()
SH="https://cdn.shopify.com/s/files/1/0376/5420/0459/files/"
CAND=[("3aLite BulbT-White",SH+"BulbT-White.png"),("4b product-thumbnail-white",SH+"product-thumbnail-white.webp"),("4a Phone-4a-White",SH+"Phone-4a-White.png"),("4aPro Phone-4a-Pro-White",SH+"Phone-4a-Pro-White.png")]
sheet=Image.new("RGB",(4*310,360),"white"); d=ImageDraw.Draw(sheet)
for i,(lab,u) in enumerate(CAND):
    r=s.get(u,headers=H,timeout=30)
    try:
        im=Image.open(io.BytesIO(r.content)).convert("RGB"); w,h=im.size
        t=im.copy(); t.thumbnail((290,300))
        sheet.paste(t,(i*310+10,10))
        d.text((i*310+10,320),f"{lab[:26]} {w}x{h}",fill="black")
        print(lab, r.status_code, f"{w}x{h}", len(r.content)//1024,"KB")
    except Exception as e:
        print(lab,"FAIL",type(e).__name__, r.status_code)
sheet.save(r"C:\Users\Keshav\Desktop\shop\_og.png")
print("sheet saved")
