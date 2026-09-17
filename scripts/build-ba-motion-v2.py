#!/usr/bin/env python3
"""Compose the supplied trailer excerpts into a branded, silent sharing loop.

Requires pillow, numpy and imageio-ffmpeg. See source provenance.json for cuts.
"""
from pathlib import Path
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/share-kit/battlefield-atlantis/v2'
OUT = ROOT / 'public/share/v2'
OUT.mkdir(parents=True, exist_ok=True)
W, H, FPS = 1200, 630, 24
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
cover = Image.open(ROOT / 'design/share-kit/battlefield-atlantis/v1/primary-cover-source.png').convert('RGB')
logo = Image.open(ROOT / 'src/assets/battlefield-atlantis-logo.png').convert('RGBA')
logo.thumbnail((470, 109), Image.Resampling.LANCZOS)
yy, xx = np.mgrid[0:H, 0:W]
dark = np.maximum(.10, .87*np.exp(-yy/90))
dark = np.maximum(dark, .97/(1+np.exp(-(yy-458)/21)))
dark = np.maximum(dark, .28*(abs(xx-600)/600)**3)

def font(size, bold=False):
    f = ImageFont.truetype(str(ROOT/'design/share-kit/v1/Inter.ttf'), size)
    f.set_variation_by_axes([18, 700 if bold else 500])
    return f

overlay = Image.new('RGBA', (W,H))
d = ImageDraw.Draw(overlay)
def text(value, y, size, color, bold=True):
    d.text((W/2,y),value,font=font(size,bold),fill=color,anchor='mt')
text('ASTRALNAUT STUDIOS PRESENTS', 14, 15, '#c6dce9')
overlay.alpha_composite(logo, ((W-logo.width)//2, 39))
text('ONLY ONE WILL RULE.', 467, 20, '#bce7f7')
d.line((500,498,700,498),fill='#dc424b',width=2)
text('From former U.S. Air Force', 516, 27, '#f5f5fb')
text('intelligence operator Phil Russell', 550, 27, '#f5f5fb')
text('FICTION. INFORMED BY EXPERIENCE.', 600, 15, '#a8b7d2',False)

def cover_frame(t):
    zoom=1+.022*(1-math.cos(2*math.pi*t/12))/2
    cw=round(W*zoom)
    art=cover.resize((cw,round(cover.height*cw/cover.width)),Image.Resampling.LANCZOS)
    left=(cw-W)//2;top=round(735*zoom)
    return art.crop((left,top,left+W,top+H))

def footage(name, count):
    cmd=[FFMPEG,'-v','error','-i',str(SOURCE/(name+'-source.mp4')),'-f','rawvideo','-pix_fmt','rgb24','-']
    with subprocess.Popen(cmd,stdout=subprocess.PIPE) as p:
        for i in range(count):
            b=p.stdout.read(W*536*3)
            if len(b)!=W*536*3: raise RuntimeError('Incomplete source '+name)
            im=Image.new('RGB',(W,H),'#030510')
            im.paste(Image.frombytes('RGB',(W,536),b),(0,32))
            yield im
        p.stdout.close()
        if p.wait(): raise RuntimeError('Source decoding failed')

def timeline():
    # 1.5s cover, 8s of supplied footage, 2.5s cover. Natural forward motion.
    yield [cover_frame(n/FPS) for n in range(36)]
    for name,count in [('fleet',42),('flyby',42),('ocean',72),('energy',36)]:
        yield footage(name,count)
    yield [cover_frame((228+n)/FPS) for n in range(60)]

cmd=[FFMPEG,'-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','slow','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'battlefield-atlantis-preview-v2.mp4')]
samples={0,36,48,84,132,168,204,228,252,287}
review=[];number=0
with subprocess.Popen(cmd,stdin=subprocess.PIPE) as p:
    for scene_index,frames in enumerate(timeline()):
        frames=list(frames)
        for i,im in enumerate(frames):
            a=np.asarray(im,dtype=np.float32)
            # Short dip transitions avoid doubled people. Branding stays fixed.
            fade=1.0
            if scene_index>0: fade=min(fade,min(1,i/4))
            if scene_index<5: fade=min(fade,min(1,(len(frames)-1-i)/4))
            a=a*(1-dark[...,None])*fade+np.array([3,5,16])*dark[...,None]
            final=Image.fromarray(np.uint8(np.clip(a,0,255))).convert('RGBA')
            final.alpha_composite(overlay);final=final.convert('RGB')
            p.stdin.write(final.tobytes())
            if number in samples:
                final.save(SOURCE/f'review-{number/FPS:05.2f}s.jpg',quality=90)
                review.append((number/FPS,final.copy()))
            number+=1
    p.stdin.close()
    if p.wait(): raise RuntimeError('Preview encoding failed')
assert number==288,number
sheet=Image.new('RGB',(1200,780),'#111522');sd=ImageDraw.Draw(sheet)
for i,(t,im) in enumerate(review):
    x=(i%3)*400;y=(i//3)*195
    sheet.paste(im.resize((360,189)),(x,y))
    sd.text((x+3,y+3),f'{t:.2f}s',font=font(14),fill='white',stroke_width=2,stroke_fill='black')
sheet.save(SOURCE/'motion-contact-sheet.jpg',quality=92)
print('Rendered',number,'frames / 12 seconds:',OUT/'battlefield-atlantis-preview-v2.mp4')
