"""Generate only synthetic fixtures; no downloaded images or personal data."""
from pathlib import Path
from PIL import Image, ImageDraw, PngImagePlugin
import json, hashlib, struct, zlib
ROOT=Path(__file__).resolve().parent/'fixtures'

def chunk(kind, data):
    return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)

im=Image.new('RGBA',(640,400),(245,247,239,255)); draw=ImageDraw.Draw(im)
draw.rectangle((0,0,639,50),fill=(32,75,58,255))
draw.text((20,20),'SYNTHETIC FIXTURE - NO REAL DATA',fill='white')
draw.text((25,90),'Email: fixture@example.invalid',fill=(20,30,25,255))
draw.text((25,120),'Token: DEMO-NOT-A-SECRET-1234',fill=(20,30,25,255))
draw.rectangle((20,170,250,230),fill=(200,30,150,0))
draw.text((25,280),'Visible content should remain after redaction.',fill=(20,30,25,255))
draw.rectangle((560,330,620,390),fill=(10,30,250,120))
meta=PngImagePlugin.PngInfo();meta.add_text('Comment','COVERCHECK-METADATA-SENTINEL-ONLY-FIXTURE');meta.add_itxt('Description','SYNTHETIC PRIVATE METADATA TEST')
im.save(ROOT/'synthetic-alpha-metadata.png',pnginfo=meta)
rgb=im.convert('RGB')
for orientation in range(1,9):
    exif=Image.Exif();exif[274]=orientation;exif[270]='COVERCHECK-EXIF-SENTINEL'
    rgb.save(ROOT/f'orientation-{orientation}.jpg',exif=exif,quality=95)
raw=(ROOT/'synthetic-alpha-metadata.png').read_bytes()
apng=raw[:33]+chunk(b'acTL',struct.pack('>II',1,0))+raw[33:]
(ROOT/'reject-animation.png').write_bytes(apng)
(ROOT/'reject-trailing.png').write_bytes(raw+b'COVERCHECK-TRAILING-SENTINEL')
(ROOT/'reject-truncated.png').write_bytes(raw[:-10])
(ROOT/'reject.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="5" y="20">SYNTHETIC</text></svg>',encoding='utf-8')
manifest={'synthetic':True,'license':'MIT','generator':'make_fixtures.py','covered_test_rectangle':{'x':20,'y':70,'width':360,'height':90},'input_png':{'width':640,'height':400,'metadata':'tEXt and iTXt sentinel values','alpha':'includes transparent RGB and partial alpha'},'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(ROOT.iterdir()) if p.suffix.lower() in ('.png','.jpg','.svg')}}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print('Generated synthetic PNG/JPEG/rejection fixtures and manifest.')
