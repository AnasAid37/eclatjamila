"""Rebuild outfit thumbnails and lossless direct-file PNG export assets. Requires Pillow and Node.js."""
from pathlib import Path
from PIL import Image
import io,base64,json,hashlib
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import subprocess
root=Path(__file__).resolve().parents[1]
catalog=json.loads(subprocess.check_output(['node',str(root/'tools/catalog.cjs')]))
items,looks=catalog['items'],catalog['looks']
@lru_cache(maxsize=8)
def source(path):
 return Image.open(root/path).convert('RGBA')
for look,plan in zip(looks,catalog['plans']):
 figure=Image.new('RGBA',(1360,2048))
 for layer in plan:
  top,bottom=layer['from'],layer['to']
  image=source(layer['u'])
  figure.alpha_composite(image.crop((0,top,1360,bottom)),(0,top))
 figure.resize((236,356),Image.Resampling.LANCZOS).save(root/look['f'],quality=90)
source.cache_clear()
paths={'assets/base.png','assets/masks.png','assets/background-fallback.jpg','assets/archive/studio.webp'}
for x in items:
 for k in ['f','mask','foot','hand','base']:
  if x.get(k):paths.add(x[k])
for x in items:
 for fit in ('tucked','insideBoot','waistFront'):
  if x.get(fit):
   paths.add(x[fit]['f'])
   if x[fit].get('mask'):paths.add(x[fit]['mask'])
paths.update(x.relative_to(root).as_posix() for x in (root/'assets/base').glob('*.png'))
def encode(p):
 file=root/p
 if file.suffix=='.png':
  with Image.open(file) as im:
   im=im.convert('RGBA');bb=im.getbbox() or (0,0,1,1);buf=io.BytesIO();im.crop(bb).save(buf,format='WEBP',method=2,lossless=True);blob=buf.getvalue();mime='webp';shape=[*im.size,*bb[:2]]
 else:
  blob=file.read_bytes();mime='jpeg' if file.suffix=='.jpg' else 'webp';shape=[]
 key=hashlib.sha256(blob).digest();return p,shape,key,'data:image/'+mime+';base64,'+base64.b64encode(blob).decode()
assets=[];refs={};known={}
with ThreadPoolExecutor(3) as ex:
 for p,shape,key,data in ex.map(encode,sorted(paths)):
  if key not in known:known[key]=len(assets);assets.append(data)
  refs[p]=[known[key],*shape]
(root/'assets/offline-export.js').write_text('/* Lossless local-file export source. Loaded on first PNG export only. */\nwindow.eclatPhotos='+json.dumps(assets,separators=(',',':'))+';\nwindow.eclatPhotoIndex='+json.dumps(refs,separators=(',',':'))+';\n')
masks={'assets/masks.png':Image.open(root/'assets/masks.png')}
for it in items:
 if it.get('tint') and it.get('mi') is None:
  key=it.get('mask',it['f']);masks[key]=Image.open(root/key)
for item in items:
 for fit in ('tucked','insideBoot','waistFront'):
  k=item.get(fit,{}).get('mask')
  if k:masks[k]=Image.open(root/k)
data={}
for k,im in masks.items():
 m=im.convert('RGBA').getchannel('A');mk=Image.new('LA',im.size,(255,0));mk.putalpha(m);stream=io.BytesIO();mk.save(stream,format='PNG',compress_level=9);data[k]='data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode()
(root/'assets/offline-masks.js').write_text('window.eclatMasks='+json.dumps(data,separators=(',',':'))+';')
print('File export support',len(refs),'sources',round((root/'assets/offline-export.js').stat().st_size/2**20,2),'MiB')
