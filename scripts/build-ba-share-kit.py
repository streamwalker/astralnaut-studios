#!/usr/bin/env python3
"""Rebuild the share kit: pip install pillow numpy imageio-ffmpeg.

Existing approved artwork is composed without generative modification.
Run from any directory. Public exports and editable sources stay versioned.
"""
from pathlib import Path
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/share-kit/battlefield-atlantis/v1'
FONT_SOURCE = ROOT / 'design/share-kit/v1'
OUT = ROOT / 'public/share/v1'
OUT.mkdir(parents=True, exist_ok=True)
W, H, FPS, SECONDS = 1200, 630, 24, 8
cover = Image.open(SOURCE / 'primary-cover-source.png').convert('RGB')
logo = Image.open(ROOT / 'src/assets/battlefield-atlantis-logo.png').convert('RGBA')
logo.thumbnail((590, 137), Image.Resampling.LANCZOS)
yy, xx = np.mgrid[0:H, 0:W]

def font(size, bold=False):
    f = ImageFont.truetype(str(FONT_SOURCE / 'Inter.ttf'), size)
    f.set_variation_by_axes([18, 700 if bold else 500])
    return f

def centered(draw, text, y, size, color, bold=False):
    draw.text((W/2, y), text, font=font(size, bold), fill=color, anchor='mt')

def frame(t):
    phase = 2 * math.pi * t / SECONDS
    # A gentle, periodic push into the approved cover. No synthetic character motion.
    zoom = 1 + .025 * (1 - math.cos(phase)) / 2
    cw = int(W * zoom)
    ch = round(cover.height * cw / cover.width)
    art = cover.resize((cw, ch), Image.Resampling.LANCZOS)
    left = (cw-W)//2
    top = round(735 * zoom)
    art = art.crop((left, top, left+W, top+H))
    a = np.array(art).astype(float)
    # Top/bottom and edge vignettes keep title and author positioning readable.
    dark = np.maximum(.16, .88*np.exp(-yy/150))
    dark = np.maximum(dark, .94/(1+np.exp(-(yy-405)/28)))
    dark = np.maximum(dark, .45*(abs(xx-600)/600)**3)
    base = np.array([3, 5, 16])
    a = a*(1-dark[...,None]) + base*dark[...,None]
    glow = np.exp(-((xx-950)**2/170000 + (yy-255)**2/80000))
    a += glow[...,None] * np.array([2, 5, 12]) * (1+.3*math.sin(phase))
    im = Image.fromarray(np.uint8(np.clip(a,0,255))).convert('RGBA')
    d=ImageDraw.Draw(im)
    centered(d, 'ASTRALNAUT STUDIOS PRESENTS', 28, 16, '#c6dce9', True)
    im.alpha_composite(logo, ((W-logo.width)//2, 61))
    d=ImageDraw.Draw(im)
    centered(d, 'ONLY ONE WILL RULE.', 422, 20, '#bce7f7', True)
    d.line((500,462,700,462), fill='#dc424b', width=2)
    centered(d, 'From former U.S. Air Force', 478, 28, '#f5f5fb', True)
    centered(d, 'intelligence operator Phil Russell', 515, 28, '#f5f5fb', True)
    centered(d, 'FICTION. INFORMED BY EXPERIENCE.', 575, 16, '#a8b7d2')
    return im.convert('RGB')

still=frame(0)
still.save(OUT/'battlefield-atlantis-share-v1.jpg', quality=92, optimize=True)

# Review sheet includes actual-size icons, a phone card and a center-square crop.
sheet=Image.new('RGB',(950,510),'#111522');d=ImageDraw.Draw(sheet)
d.text((20,15),'Phone card · 390px',font=font(16),fill='white')
sheet.paste(still.resize((390,205),Image.Resampling.LANCZOS),(20,45))
d.text((460,15),'Center-square crop',font=font(16),fill='white')
sheet.paste(still.crop((285,0,915,630)).resize((360,360)),(460,45))
for i,size in enumerate((16,32,48,180)):
    x=20+i*95;sheet.paste(Image.open(OUT/f'astralnaut-icon-{size}-v1.png'),(x,290));d.text((x,475),str(size)+'px',font=font(14),fill='white')
sheet.save(SOURCE/'review-contact-sheet.jpg',quality=93)

ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
cmd=[ffmpeg,'-y','-v','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','slow','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart','-t',str(SECONDS),str(OUT/'battlefield-atlantis-preview-v1.mp4')]
with subprocess.Popen(cmd,stdin=subprocess.PIPE) as p:
    for n in range(FPS*SECONDS):
        p.stdin.write(frame(n/FPS).tobytes())
    p.stdin.close()
    if p.wait(): raise RuntimeError('Video encoding failed')
for t in (0,2,4,6,8-1/FPS):
    frame(t).save(SOURCE/f'motion-{t:.2f}s.jpg',quality=90)
print('Created Battlefield Atlantis still and 8-second silent MP4 in',OUT)
