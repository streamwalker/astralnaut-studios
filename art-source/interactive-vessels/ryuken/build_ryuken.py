"""Ryuken close-up model, reconstructed from Ryuken One.jpg.
No source photograph is projected onto the geometry. All visible mechanisms,
armor, deck tiers and windows are three-dimensional. Blender 5.2.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[2]
OUT=ROOT/'public/space-journey/interactive-vessels';OUT.mkdir(parents=True,exist_ok=True)
random.seed(22026)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
BUCKETS={};MATS={}
def mat(name,c,metal=.77,rough=.39,em=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if em:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=em
 MATS[name]=m
mat('HullTitanium',(.21,.26,.29),.82,.37)
mat('DorsalArmor',(.30,.35,.38),.79,.39)
mat('Machinery',(.045,.064,.075),.74,.43)
mat('BeveledEdges',(.42,.47,.49),.85,.30)
mat('DarkPanel',(.13,.17,.20),.8,.42)
mat('TurquoiseWindows',(.045,.35,.53),.2,.28,1.15)
mat('AmberWindows',(.93,.52,.24),.1,.30,1.8)
mat('EngineWell',(.015,.034,.046),.56,.3)


# Baked micro-surface maps are portable to glTF: subtle alloy grain, brushed
# scratches and roughness variation. No photograph or source-art projection.
import numpy as np
rng=np.random.default_rng(731)
size=256
noise=rng.random((size,size)).astype(np.float32)
soft=noise.copy()
for k in range(4):soft=(soft+np.roll(soft,1,0)+np.roll(soft,-1,0)+np.roll(soft,1,1)+np.roll(soft,-1,1))/5
height=(noise-.5)*.07+(soft-.5)*.26
for k in range(95):
 yy=int(rng.integers(0,size));xx=int(rng.integers(0,size));ll=int(rng.integers(3,42));height[yy,xx:min(size,xx+ll)]+=.035
normal=np.zeros((size,size,4),dtype=np.float32);normal[:,:,0]=.5+(np.roll(height,1,1)-np.roll(height,-1,1))*.50;normal[:,:,1]=.5+(np.roll(height,1,0)-np.roll(height,-1,0))*.50;normal[:,:,2]=1;normal[:,:,3]=1
rough=np.zeros((size,size,4),dtype=np.float32);r=.42+(soft-.5)*.5+(noise-.5)*.06
for k in range(34):
 x=int(rng.integers(0,size));y=int(rng.integers(0,size));w=int(rng.integers(3,38));h=int(rng.integers(8,54));r[y:min(size,y+h),x:min(size,x+w)]+=float(rng.uniform(-.06,.07))
rough[:,:,:3]=r[:,:,None];rough[:,:,3]=1
images=[]
for name,pixels in [('Alloy-normal',normal),('Alloy-roughness',rough)]:
 im=bpy.data.images.new(name,width=size,height=size,alpha=False);im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(pixels.ravel());im.filepath_raw=str(BASE/(name+'.png'));im.file_format='PNG';im.save();im.pack();images.append(im)
for key in ['HullTitanium','DorsalArmor','Machinery','BeveledEdges','DarkPanel']:
 m=MATS[key];nodes=m.node_tree.nodes;links=m.node_tree.links;p=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexImage');tex.image=images[0];n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.3;links.new(tex.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs['Normal']);rtex=nodes.new('ShaderNodeTexImage');rtex.image=images[1];links.new(rtex.outputs['Color'],p.inputs['Roughness'])

def mesh(v,f,m='HullTitanium'):
 vs,fs=BUCKETS.setdefault(m,([],[]));n=len(vs);vs.extend(v);fs.extend(tuple(n+i for i in q) for q in f)
def box(c,s,m='HullTitanium',angle=0):
 x,y,z=c;a,b,h=[d*.5 for d in s];co,si=math.cos(angle),math.sin(angle)
 v=[(x+u*co-v*si,y+u*si+v*co,z+w) for u,v,w in [(-a,-b,-h),(a,-b,-h),(a,b,-h),(-a,b,-h),(-a,-b,h),(a,-b,h),(a,b,h),(-a,b,h)]]
 mesh(v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m)
def beam(a,b,w=.04,m='HullTitanium'):
 a,b=Vector(a),Vector(b);d=(b-a).normalized();u=d.cross(Vector((0,0,1)) if abs(d.z)<.9 else Vector((1,0,0))).normalized()*w*.5;v=d.cross(u).normalized()*w*.5
 verts=[tuple(p+u*i+v*j) for p in [a,b] for i,j in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 mesh(verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m)
def lathe(profile,m='HullTitanium',n=96,c=(0,0,0),axis='z',scale=(1,1)):
 v=[]
 for r,h in profile:
  for j in range(n):
   a=j*math.tau/n;p=(r*math.cos(a)*scale[0],r*math.sin(a)*scale[1],h)
   if axis=='y':p=(p[0],p[2],p[1])
   v.append(tuple(p[k]+c[k] for k in range(3)))
 f=[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j) for i in range(len(profile)-1) for j in range(n)]
 mesh(v,f,m)
def plate(outline,z,height=.04,m='DorsalArmor',bevel=.03):
 # Individually beveled polygon slab. Top plane and wall bevel catch keylight.
 cx=sum(p[0] for p in outline)/len(outline);cy=sum(p[1] for p in outline)/len(outline);n=len(outline)
 inset=[]
 for x,y in outline:
  dx,dy=cx-x,cy-y;l=math.hypot(dx,dy);inset.append((x+dx/l*bevel,y+dy/l*bevel))
 v=[(x,y,z) for x,y in outline]+[(x,y,z+height*.65) for x,y in outline]+[(x,y,z+height) for x,y in inset]
 f=[tuple(range(n-1,-1,-1)),tuple(2*n+i for i in range(n))]
 for i in range(n):
  j=(i+1)%n;f.extend([(i,j,n+j,n+i),(n+i,n+j,2*n+j,2*n+i)])
 mesh(v,f,m)
def rectplate(x,y,w,l,z,m='DorsalArmor',h=.045):
 b=min(w,l)*.12
 plate([(x-w/2+b,y-l/2),(x+w/2-b,y-l/2),(x+w/2,y-l/2+b),(x+w/2,y+l/2-b),(x+w/2-b,y+l/2),(x-w/2+b,y+l/2),(x-w/2,y+l/2-b),(x-w/2,y-l/2+b)],z,h,m,min(.022,b*.4))
# Smoothly varied round-shouldered slab, bow -Y. Nose retains a solid broad tip.
sections=[(-10.2,.92,.08,-.48),(-9.85,1.21,.28,-.65),(-9.0,1.62,.49,-.86),(-7.8,2.21,.73,-1.02),(-6.1,2.64,.88,-1.12),(-4.1,3.25,1.06,-1.20),(-2.0,3.62,1.22,-1.20),(.2,3.68,1.35,-1.08),(2.5,3.43,1.46,-.90),(4.5,3.00,1.48,-.72),(6.3,2.43,1.35,-.57),(7.8,1.88,1.13,-.43),(8.6,1.38,.91,-.31)]
def shape(y):
 for i in range(len(sections)-1):
  a,b=sections[i],sections[i+1]
  if a[0]<=y<=b[0]:
   t=(y-a[0])/(b[0]-a[0]);return tuple(a[j]*(1-t)+b[j]*t for j in range(1,4))
 return sections[0][1:] if y<sections[0][0] else sections[-1][1:]
def top(x,y):
 w,z,bot=shape(y);u=abs(x)/w
 if u<=.60:return z
 if u<=.88:return z*(1-(u-.60)/.28*.26)
 if u<=.97:return z*(.74-(u-.88)/.09*.44)
 return z*max(0,(1-u)/.03*.30)
# cross-section ring: flat crown, faceted bevels, vertical multi-level sidewall, belly.
profile=[(-1,0),(-.97,.30),(-.88,.74),(-.60,1),(.60,1),(.88,.74),(.97,.30),(1,0),(.98,-.30),(.87,-.75),(.57,-1),(-.57,-1),(-.87,-.75),(-.98,-.30)]
v=[]
for y,w,t,b in sections:
 for xf,zf in profile:v.append((w*xf,y,t*zf if zf>=0 else -b*zf))
n=len(profile);f=[tuple(range(n-1,-1,-1)),tuple((len(sections)-1)*n+i for i in range(n))]
f.extend((i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j) for i in range(len(sections)-1) for j in range(n));mesh(v,f,'DarkPanel')
# Armor mapped to actual curved surface: irregular longitudinal bands, controlled panel hierarchy.
for i in range(47):
 y=-9.75+i*.385;ye=min(y+.365,8.5);w,zz,bb=shape(y);we,ze,be=shape(ye)
 for j in range(12):
  u=-.94+j*.156;ue=u+.147
  # Boundary follows tapered hull, no floating rectangular plates at shoulders.
  verts=[(u*w,y,top(u*w,y)+.025),(ue*w,y,top(ue*w,y)+.025),(ue*we,ye,top(ue*we,ye)+.025),(u*we,ye,top(u*we,ye)+.025)]
  upper=[(x,yy,z+.035) for x,yy,z in verts]
  mesh(verts+upper,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],random.choices(['DorsalArmor','HullTitanium','BeveledEdges'],[82,17,1])[0])
  # Tiny recessed edge strips and seam accents, not uniform checkerboard blocks.
  if (i*5+j)%11==0:
   x=(u+ue)/2*w;rectplate(x,y+.22,min(.36,w*.13),.26,top(x,y+.22)+.06,'DarkPanel',.025)
 # Belly panels and transverse ribs preserve an authored underside.
 for j in range(6):
  u=-.72+j*.25;x=u*w;box((x,y,bb*.93),(.20 if w<1 else .37,.42,.055),'Machinery' if j%3 else 'HullTitanium')
# Large complex inset machinery panels grouped on the broad top front, a large-scale composition.
for x,y,w,l in [(0,-6.1,.95,1.3),(-.85,-4.6,.65,1.15),(.85,-4.6,.65,1.15),(0,-3.4,1.2,1.0),(-1.25,-2.5,.52,1.25),(1.25,-2.5,.52,1.25),(0,-8.2,.46,.7),(0,7.2,.75,1.15)]:
 z=top(x,y)+.07;rectplate(x,y,w,l,z,'Machinery',.07);rectplate(x,y,w*.83,l*.86,z+.075,'HullTitanium',.045)
 for k in range(5):box((x,y-l*.32+k*l*.16,z+.13),(w*.69,.025,.018),'DarkPanel')
# Layered flank armor and exposed machinery trench on both sides.
for side in [-1,1]:
 for band,z in enumerate([.18,-.05,-.28,-.51,-.72]):
  y=-9.45
  while y<7.85:
   length=random.uniform(.46,.97);ye=min(y+length,7.85);wa,ta,ba=shape(y);wb,tb,bb=shape(ye);factor=1-max(0,-z)*.13
   xa=side*(wa*factor+.025);xb=side*(wb*factor+.025);h=.075 if band%2==0 else .04
   v=[(xa,y,z-h),(xb,ye-.025,z-h),(xb,ye-.025,z+h),(xa,y,z+h)];v+=[(x-side*.12,yy,zz) for x,yy,zz in v]
   mesh(v,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(3,2,6,7),(0,3,7,4),(1,5,6,2)],'HullTitanium' if band%2==0 else 'Machinery')
   if band in [1,3]:
    for k in range(3):
     yy=y+.1+k*.18
     if yy>=ye or random.random()<.25:continue
     ww,_,_=shape(yy);box((side*(ww*factor+.043),yy,z),(.025,random.uniform(.035,.085),.025),'TurquoiseWindows' if random.random()>.12 else 'AmberWindows')
   y=ye
 for i in range(70):
  y=-8.7+i*.23;w,z,b=shape(y)
  box((side*w*.86,y,-.73),(.14,.14,.12),'Machinery')
  if i%3==0:beam((side*w*.80,y,-.85),(side*w*.98,y+.15,-.40),.035,'BeveledEdges')
  if i%4==0:box((side*w*.87,y,-.80),(.025,.09,.023),'TurquoiseWindows')
 # shoulder rib trusses and lower side cannisters
 for i in range(9):
  y=-4+i*.93;w,z,b=shape(y)
  beam((side*w*.75,y,b*.85),(side*w*.97,y+.20,-.14),.075,'HullTitanium')
# Twin raised oval command terraces, stepped curved perimeter with many window rows.
def deck(cx,cy,rx,ry,z,height):
 lathe([(0,z),(1,z), (1.025,z+.07),(1.025,z+height-.06),(1,z+height),(0,z+height)],'HullTitanium',96,(cx,cy,0),scale=(rx,ry))
 for zz in [z+.08,z+height-.055]:
  lathe([(.92,zz), (1.035,zz),(1.035,zz+.035),(.92,zz+.035)],'DarkPanel',96,(cx,cy,0),scale=(rx,ry))
 for j in range(72):
  a=j*math.tau/72
  if j%7 not in [0,2]:box((cx+rx*1.035*math.cos(a),cy+ry*1.035*math.sin(a),z+height*.48),(.018,.095,.011),'TurquoiseWindows',a)
 for i in range(6):
  x=cx+(i-2.5)*rx*.25;rectplate(x,cy,rx*.22,ry*1.4,z+height+.01,'DorsalArmor',.025)
for cy,rx,ry,z,h in [(3.6,2.10,2.15,1.47,.24),(3.7,1.95,1.96,1.77,.21),(3.85,1.75,1.72,2.04,.22),(4.0,1.45,1.43,2.32,.18),(4.4,1.0,1.15,2.56,.18),(-.2,1.32,1.75,1.34,.21),(-.1,1.20,1.57,1.59,.17)]:deck(0,cy,rx,ry,z,h)
# Dome turret anterior to command tower.
lathe([(0,1.83),(.71,1.83),(.73,1.95),(.65,2.18),(.49,2.39),(.24,2.50),(0,2.52)],'Machinery',64,(0,-.05,0),scale=(1,.95))
lathe([(.66,1.84),(.8,1.84),(.8,1.93),(.66,1.93)],'BeveledEdges',64,(0,-.05,0))
for a in [0,math.pi/2,math.pi,3*math.pi/2]:
 beam((.7*math.cos(a),-.05+.7*math.sin(a),1.95),(.3*math.cos(a),-.05+.3*math.sin(a),2.47),.035,'HullTitanium')
# Rear elevated cathedral command equipment and irregular sensor aerial silhouette.
for i in range(38):
 x=random.uniform(-1,1);y=random.uniform(3.55,5.55);h=random.uniform(.12,.42)
 rectplate(x,y,random.uniform(.13,.28),random.uniform(.15,.33),2.72,'Machinery',h)
for x,y,h,w in [(0,4.5,2.6,.10),(-.53,4.65,1.8,.10),(.55,4.75,1.55,.095),(-.88,5.1,1.0,.07),(.91,4.85,1.35,.085),(-.32,3.9,.9,.08),(.28,5.4,1.9,.075),(0,5.7,1.1,.08)]:
 box((x,y,2.8+h*.42),(w*1.7,w*2,h*.84),'DarkPanel');box((x,y,2.8+h*.85),(w*.5,w*.6,h*.3),'BeveledEdges')
 for k in range(3):box((x,y,2.9+h*k*.25),(w*2.2,w*2.2,.045),'HullTitanium')
for side in [-1,1]:
 beam((side*.8,4.6,3.15),(side*3.1,4.6,3.15),.045,'Machinery')
 beam((side*.8,4.6,3.15),(side*1.7,4.6,3.65),.035,'Machinery')
# Engine assembly: large barrels, open recessed mouths, concentric segmented throat LEDs.
for side in [-1,1]:
 x=side*4.20;zc=.72
 # Broad armor pylons physically connect nacelles and hull.
 rectplate(side*3.2,2.4,2.6,3.2,.61,'Machinery',.26)
 rectplate(side*3.2,2.4,2.4,2.9,.88,'DorsalArmor',.08)
 lathe([(.87,-.30),(1.08,-.12),(1.12,.28),(1.10,.7),(1.04,1.15),(1.04,3.35),(.94,3.95),(.75,4.30),(0,4.30)],'HullTitanium',96,(x,0,zc),'y')
 # rolled lip is dimensional rather than an emissive flat disk
 lathe([(.78,-.37),(.88,-.37),(1.07,-.20),(1.09,-.08),(.86,-.07),(.79,-.18),(.78,-.37)],'BeveledEdges',96,(x,0,zc),'y')
 lathe([(.0,.36),(.72,.36),(.78,-.26),(.84,-.31)],'EngineWell',96,(x,0,zc),'y')
 for yy,rad in [(.25,1.12),(.85,1.09),(1.42,1.08),(2.2,1.08),(3.05,1.07),(3.62,1.01)]:
  lathe([(rad-.03,yy-.06),(rad+.045,yy-.06),(rad+.045,yy+.06),(rad-.03,yy+.06)],'DarkPanel',96,(x,0,zc),'y')
  lathe([(rad+.03,yy+.04),(rad+.06,yy+.04),(rad+.06,yy+.065),(rad+.03,yy+.065)],'BeveledEdges',96,(x,0,zc),'y')
 for j in range(28):
  a=j*math.tau/28
  for r,y in [(.70,-.26),(.48,.01)]:
   # segmented luminous curved ring, with dark intervals
   aa=a+.038;bb=a+.14;vs=[]
   for yy in [y-.01,y+.012]:
    for rr,ang in [(r-.035,aa),(r+.035,aa),(r+.035,bb),(r-.035,bb)]:vs.append((x+rr*math.cos(ang),yy,zc+rr*math.sin(ang)))
   mesh(vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'TurquoiseWindows')
 for j in range(18):
  a=j*math.tau/18
  beam((x+1.065*math.cos(a),.8,zc+1.065*math.sin(a)),(x+1.045*math.cos(a),3.35,zc+1.045*math.sin(a)),.065,'DarkPanel' if j%3 else 'BeveledEdges')
 # Side utility islands behind engines
 rectplate(side*3.85,5.15,1.4,1.45,.57,'HullTitanium',.33)
 for j in range(10):box((side*3.85,4.65+j*.10,.94),(1.15,.035,.02),'Machinery')
# Fine asymmetric maintenance service detail, pipes, vent combs.
for i in range(245):
 y=random.uniform(-8.5,7.8);w,z,b=shape(y);x=random.uniform(-w*.75,w*.75)
 if -.8<y<6 and abs(x)<2.2:continue
 zz=top(x,y)+.065
 if i%3==0:
  rectplate(x,y,.18,.30,zz,'Machinery',.045)
  for j in range(5):box((x,y-.1+j*.05,zz+.05),(.13,.013,.015),'BeveledEdges')
 else:
  rectplate(x,y,.13,.19,zz,'HullTitanium',.06)
# Belly spine, docking hatch, wrapped pipes, recessed reactor oval, aft exhaust grille.
lathe([(0,-1.29),(.85,-1.29),(.95,-1.17),(.95,-1.08),(.85,-1.01),(0,-1.01)],'Machinery',64,(0,1.8,0),scale=(1,1.8))
for side in [-1,1]:
 for i in range(7):
  x=side*(.25+i*.17);beam((x,-7.5,-.90),(x,4.3,-1.09),.055,'DarkPanel')
 for i in range(14):
  y=-6.3+i*.9;beam((side*.3,y,-1.17),(side*2.4,y+.25,-.95),.05,'HullTitanium')
for j in range(13):box(((j-6)*.19,8.56,.1),(.11,.055,.47),'Machinery')

# Dorsal service layers: small plates on inclined shoulders follow the hull.
# Broken-width inset machinery islands replace broad empty polygon surfaces.
for side in [-1,1]:
 for j in range(35):
  y=-8.7+j*.44;w,z,b=shape(y)
  u=.68 if j%3 else .77;x=side*w*u
  zz=top(x,y)+.075
  rectplate(x,y,min(.25,w*.18),.26,zz,'DarkPanel',.035)
  if j%3==0:
   beam((x,y-.1,zz+.06),(x,y+.12,zz+.06),.025,'BeveledEdges')
 for j in range(23):
  y=-6.7+j*.56;w,z,b=shape(y);x=side*w*.47;zz=top(x,y)+.08
  if -1<y<5:continue
  rectplate(x,y,.19,.38,zz,'HullTitanium',.025)
  box((x,y,zz+.04),(.07,.27,.035),'DarkPanel')
# Heavier ventral docking mechanisms and service racks are readable from below.
for x,y,w,l in [(0,-4,.8,1.4),(0,4,.7,1.0),(-1.2,-.7,.6,1.2),(1.2,-.7,.6,1.2)]:
 ww,zz,b=shape(y)
 box((x,y,b-.08),(w,l,.16),'HullTitanium')
 box((x,y,b-.18),(w*.8,l*.8,.045),'Machinery')
 for j in range(6):box((x,y-l*.3+j*l*.12,b-.215),(w*.72,.025,.03),'BeveledEdges')


# Dense irregular plating clusters connect the main greeble islands into a
# complex armored mechanical surface. Four scales of paneling prevent a tiled toy look.
for i in range(380):
 y=random.uniform(-9.2,7.7);ww,z,bb=shape(y);x=random.uniform(-ww*.78,ww*.78)
 if -1.5<y<6.1 and abs(x)<2.2:continue
 z=top(x,y)+.09;w=random.uniform(.10,.32);l=random.uniform(.12,.43)
 rectplate(x,y,w,l,z,'HullTitanium' if i%4 else 'DarkPanel',random.uniform(.02,.07))
 if i%3==0:
  rectplate(x+w*.13,y+l*.08,w*.58,l*.64,z+.075,'DorsalArmor',.025)
 if i%5==0:
  for j in range(3):box((x-w*.25+j*w*.25,y,z+.092),(.012,l*.65,.012),'Machinery')
# Exposed stern systems: pipes, lateral sensor struts, distributed service modules.
for side in [-1,1]:
 for j in range(22):
  y=5.6+j*.12;ww,zz,bb=shape(y);x=side*ww*.60
  rectplate(x,y,.19,.11,top(x,y)+.07,'Machinery',.05+random.random()*.1)
 for j in range(14):
  y=random.uniform(2.2,6.7);ww,zz,bb=shape(y);x=side*ww*.80
  beam((x,y,top(x,y)+.14),(x,y+.28,top(x,y)+.14),.042,'BeveledEdges')
 # Several irregular racks wrap the exposed side wall beneath each pylon.
 for j in range(28):
  y=-5.7+j*.39;ww,zz,bb=shape(y)
  box((side*(ww-.08),y,-.35),(.17,.16,.11),'Machinery')
  if j%4==0:box((side*(ww+.015),y,-.37),(.025,.08,.015),'AmberWindows')

# Bow blade/prongs project past plated nose as in reference.
for side in [-1,1]:
 for i,length in enumerate([1.95,1.65,1.1]):
  x=side*(.25+i*.23);beam((x,-9.55,-.15),(x,-9.55-length,-.24),.085 if i==0 else .055,'BeveledEdges')
  beam((x,-9.6,-.3),(x,-10.2,-.36),.12,'Machinery')
# Merge per material, orient normals consistently, keep hard faceted mechanical surfaces.
import bmesh
root=bpy.data.objects.new('Ryuken_Reference_3D',None);bpy.context.collection.objects.link(root)
for name,(v,f) in BUCKETS.items():
 data=bpy.data.meshes.new(name);data.from_pydata(v,[],f);data.update()
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
 uv=data.uv_layers.new(name='IndustrialSurfaceUV')
 for face in data.polygons:
  axis=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=axis]
  for li in face.loop_indices:
   vv=data.vertices[data.loops[li].vertex_index].co;uv.data[li].uv=(vv[axes[0]]*.44,vv[axes[1]]*.44)
 obj=bpy.data.objects.new('Ryuken_'+name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(MATS[name]);obj.parent=root
# Center geometrical bounds, so rotation remains about center.
coords=[o.matrix_local@v.co for o in root.children for v in o.data.vertices]
mins=Vector(tuple(min(v[i] for v in coords) for i in range(3)));maxs=Vector(tuple(max(v[i] for v in coords) for i in range(3)));center=(mins+maxs)*.5
for o in root.children:
 for v in o.data.vertices:v.co-=center
# Export camera-free compressed model.
bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(OUT/'ryuken-v2.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=7)
dims=maxs-mins
stats={'bytes':(OUT/'ryuken-v2.glb').stat().st_size,'meshes':len(root.children),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in root.children),'blenderDimensionsXYZ':list(dims),'gltfDimensionsXYZ':[dims.x,dims.z,dims.y],'gltfBowAxis':'+Z','referenceViewCameraGltf':[-17,23,28],'centerOffsetBlender':list(center)}
(BASE/'asset-stats.json').write_text(json.dumps(stats,indent=2))
# Reference-quality inspection renders with studio rim and broad neutral key.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
scene.cycles.use_denoising=True;scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.052,.075,.10,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.40
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
for name,loc,power,size,color in [('Key',(-10,-10,23),6500,13,(.91,.95,1)),('Rim',(13,8,13),5500,10,(.68,.82,1)),('Fill',(-15,3,4),2000,14,(.75,.84,.91))]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',camdata);bpy.context.collection.objects.link(cam);scene.camera=cam;camdata.type='ORTHO';camdata.ortho_scale=24
for filename,location in [('ryuken-reference-view.png',(-17,-28,23)),('ryuken-reverse-view.png',(-20,26,-14))]:
 cam.location=location;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(BASE/filename);bpy.ops.render.render(write_still=True)
cam.location=(-17,-28,23);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'Ryuken-Interactive.blend'),compress=True)
print('RYUKEN_DONE',json.dumps(stats))
