"""Reference-driven Santee and Ryuken reconstruction; no source artwork altered.
Blender 5.2.1, deterministic geometry, merged by material for browser use.
Run: Blender --background --python assets/reference-fleet/build_reference_fleet.py
"""
import bpy, math, random, json, os
from mathutils import Vector
from pathlib import Path
BASE=Path(__file__).resolve().parent
OUT=BASE.parent.parent/'public/space-journey/reference-fleet'
OUT.mkdir(parents=True,exist_ok=True)
random.seed(321)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for x in list(bpy.data.materials):bpy.data.materials.remove(x)
MATS={}
def mat(name,color,metal=.8,rough=.32,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 MATS[name]=m
mat('Titanium',(0.23,.28,.32),.75,.44)
mat('Armor',(0.31,.36,.40),.72,.48)
mat('Dark',(0.07,.10,.13),.8,.37)
mat('Edge',(0.40,.46,.49),.8,.36)
mat('WarmWindows',(1,.48,.13),.1,.3,3.5)
mat('BlueWindows',(.15,.63,1),.1,.25,4)
mat('EngineCore',(.12,.65,1),.2,.3,7)
BUCKETS={}
def mesh(name,verts,faces,m):
 v,f=BUCKETS.setdefault(m,([],[]));n=len(v);v.extend(verts);f.extend([tuple(i+n for i in q) for q in faces])
def box(c,s,m='Titanium',rz=0):
 x,y,z=c;a,b,h=[k*.5 for k in s];co=math.cos(rz);si=math.sin(rz)
 verts=[(x+u*co-v*si,y+u*si+v*co,z+w) for u,v,w in [(-a,-b,-h),(a,-b,-h),(a,b,-h),(-a,b,-h),(-a,-b,h),(a,-b,h),(a,b,h),(-a,b,h)]]
 mesh('box',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m)
def beam(start,end,width=.055,material='Titanium'):
 a=Vector(start);b=Vector(end);d=(b-a).normalized();helper=Vector((0,0,1)) if abs(d.z)<.9 else Vector((1,0,0));u=d.cross(helper).normalized()*width*.5;v=d.cross(u).normalized()*width*.5
 verts=[tuple(c+su*u+sv*v) for c in [a,b] for su,sv in [(-1,-1),(1,-1),(1,1),(-1,1)]]
 mesh('truss',verts,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],material)
def lathe(profile,m='Titanium',n=96,c=(0,0,0),axis='z'):
 # profile list (radius,z), open ends optionally closed via r=0
 vs=[]
 for r,z in profile:
  for i in range(n):
   a=2*math.pi*i/n;p=(r*math.cos(a),r*math.sin(a),z)
   if axis=='y':p=(p[0],p[2],p[1])
   vs.append(tuple(p[k]+c[k] for k in range(3)))
 fs=[]
 for j in range(len(profile)-1):
  for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
 mesh('lathe',vs,fs,m)
def ring(r,z,w=.1,h=.08,m='Edge',n=128):
 lathe([(r-w/2,z-h/2),(r+w/2,z-h/2),(r+w/2,z+h/2),(r-w/2,z+h/2),(r-w/2,z-h/2)],m,n)
def sector(ri,ro,z,a,da,h,m):
 vs=[]
 for zz in [z-h/2,z+h/2]:
  for rr,ang in [(ri,a),(ro,a),(ro,a+da),(ri,a+da)]:vs.append((rr*math.cos(ang),rr*math.sin(ang),zz))
 mesh('panel',vs,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],m)
def lights(r,z,count=160,w=.045,h=.035,matname='WarmWindows',chance=.65):
 for i in range(count):
  if random.random()>chance:continue
  a=i*2*math.pi/count
  box((r*math.cos(a),r*math.sin(a),z),(w,.035,h),matname,a+math.pi/2)
def finalize(name):
 root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
 for material,(verts,faces) in BUCKETS.items():
  data=bpy.data.meshes.new(name+'_'+material);data.from_pydata(verts,[],faces);data.update()
  o=bpy.data.objects.new(name+'_'+material,data);bpy.context.collection.objects.link(o);o.data.materials.append(MATS[material]);o.parent=root
 BUCKETS.clear()
 return root
# SANTEE STATION: axial city, major ring at shoulder, staggered terraces and long keel
lathe([(0,-12.8),(.28,-12.8),(.45,-11.1),(.9,-10.5),(1.0,-7.4),(1.45,-6.8),(1.5,-3.7),(2.1,-2.5),(2.3,-.8),(2.6,1.2),(2.8,3.9),(2.3,5.1),(1.8,7.4),(1.2,9.4),(.4,10.3),(.22,13.2),(0,13.2)],'Dark',96)
for z,r,t in [(4,9.2,.72),(3.3,8.7,.28),(4.6,7.7,.3),(8.4,4.2,.48),(7.7,3.8,.25),(6.5,3.2,.38),(1.1,6.0,.42),(-.2,5.6,.29),(-2.3,4.4,.5),(-3,3.6,.35),(-5.0,2.5,.3)]:
 lathe([(1.3,z-t*.5),(r*.9,z-t*.5),(r,z-t*.2),(r,z+t*.2),(r*.9,z+t*.5),(1.3,z+t*.5)],'Titanium',128)
 ring(r,z,.08,.12,'Dark');ring(r*.99,z+t*.17,.045,.035,'Edge')
 ring(r*.93,z+t*.5,.06,.045,'Edge');ring(r*.77,z+t*.51,.08,.035,'Dark')
 lights(r+.022,z,count=int(r*36),chance=.55)
 for band in range(4):
  ri=1.5+(r-1.5)*band/4;ro=1.5+(r-1.5)*(band+1)/4
  for i in range(80):
   a=i*2*math.pi/80;da=2*math.pi/80*.91
   sector(ri+.025,ro-.025,z+t*.5+.025,a,da,.025,random.choice(['Titanium','Armor','Dark','Edge']))
 for i in range(32):
  a=i*2*math.pi/32
  rr=r*.72
  box((rr*math.cos(a),rr*math.sin(a),z+t*.5+.085),(r*.40,.06,.06),'Dark',a)
 # micro city blocks above rim
 for i in range(int(r*26)):
  a=random.random()*2*math.pi;rr=random.uniform(r*.54,r*.9);h=random.uniform(.035,.18)
  box((rr*math.cos(a),rr*math.sin(a),z+t*.5+h/2),(.08+random.random()*.17,.08+random.random()*.23,h),random.choice(['Titanium','Dark']),a)
# high density vertical trunk plating, elevators and window banks
for k in range(32):
 z=-10.6+k*.59
 r= .88 if z< -7 else 1.35 if z< -4 else 1.85 if z< -1 else 2.45 if z<5 else 1.9 if z<7 else 1.1
 ring(r,z,.045,.04,'Edge',64)
 for j in range(48):
  a=2*math.pi*j/48;rr=r+random.uniform(.01,.15)
  box((rr*math.cos(a),rr*math.sin(a),z+.24),(.12,.14,random.uniform(.18,.46)),random.choice(['Dark','Titanium','Armor']),a)
 lights(r+.17,z+.31,100,.045,.035,chance=.47)
 if k%4==0:lights(r+.18,z+.15,54,.04,.025,'BlueWindows',.3)
# greeble structural poles continuing down the long lower shaft
for i in range(50):
 a=i*2*math.pi/50;rr=random.uniform(.65,1.4);length=random.uniform(3.5,7.2)
 box((rr*math.cos(a),rr*math.sin(a),-6.2-length*.5),(.07,.09,length),'Titanium',a)
# spires on upper ring plus central mast
for i in range(65):
 a=random.random()*math.tau;rr=random.uniform(.3,3.8);h=random.uniform(.15,.6) if rr>1.1 else random.uniform(.8,3.8)
 box((rr*math.cos(a),rr*math.sin(a),8.65+h*.5),(.08,.1,h),'Edge',a)
 if i%7==0:box((rr*math.cos(a),rr*math.sin(a),8.65+h),(.045,.045,.045),'WarmWindows')
for i in range(17):
 a=random.random()*math.tau;r=random.uniform(.1,.65);h=random.uniform(2,5.1)
 box((r*math.cos(a),r*math.sin(a),9+h/2),(.07,.085,h),'Titanium')
# docking piers around large ring
for i in range(12):
 a=i*math.tau/12;rr=8.6
 box((rr*math.cos(a),rr*math.sin(a),4.45),(1.8,.36,.12),'Dark',a)
 box((9.5*math.cos(a),9.5*math.sin(a),4.49),(.25,.45,.11),'Armor',a)
 lights(9.52,4.52,64,.08,.035,'BlueWindows',.15)
# Dense upper-city vertical architecture breaks the tapered core into a skyline.
for i in range(120):
 a=random.random()*math.tau;r=random.uniform(.2,1.15);h=random.uniform(.6,4.4)
 x,y=r*math.cos(a),r*math.sin(a)
 box((x,y,9.1+h/2),(.07,.09,h),'Dark' if i%3 else 'Titanium')
 if i%4==0:
  for k in range(5):box((x+.04,y-.05,9.1+h*k/6),(.025,.025,.045),'WarmWindows')
# V3: dense exposed infrastructural lattice, conduit runs and service galleries.
# Tapered trunk diagonals, circumferential horizontal bracing and window bays.
for level in range(31):
 z=-9.8+level*.64
 r=.99 if z<-7 else 1.52 if z<-4 else 2.05 if z<-1 else 2.76 if z<5 else 2.10 if z<7 else 1.30
 for j in range(36):
  a=j*math.tau/36;b=(j+1)*math.tau/36
  p=(r*math.cos(a),r*math.sin(a),z);q=(r*math.cos(b),r*math.sin(b),z+.60)
  beam(p,q,.035,'Edge' if j%7==0 else 'Titanium')
  beam((q[0],q[1],z),(p[0],p[1],z+.60),.025,'Dark')
  beam(p,(p[0],p[1],z+.60),.04,'Dark')
  if (j+level)%5==0:
   box(((r+.035)*math.cos(a),(r+.035)*math.sin(a),z+.25),(.17,.055,.035),'WarmWindows',a+math.pi/2)
 # circumferential access galleries and incomplete plate fields
 ring(r+.045,z+.025,.06,.055,'Dark',96)
 for j in range(16):
  a=j*math.tau/16
  if (level+j)%3:box((r*math.cos(a),r*math.sin(a),z+.22),(.15,.065,.22),'Dark',a+math.pi/2)
# Large mixed machine enclosures break up exposed smooth cylinder walls.
for lo,hi,r in [(-9.8,-7.5,1.04),(-6.7,-5.2,1.55),(-4.6,-3.4,1.8),(-1.8,-.65,2.28),(1.5,2.9,2.8),(5.2,5.9,2.35),(7.05,7.5,1.98)]:
 for j in range(48):
  a=j*math.tau/48;zz=random.uniform(lo,hi);h=min(.7,hi-lo)*random.uniform(.5,1)
  box((r*math.cos(a),r*math.sin(a),zz),(.13,.23,h),'Dark' if j%3 else 'Titanium',a)
  beam(((r+.10)*math.cos(a),(r+.10)*math.sin(a),lo),((r+.10)*math.cos(a),(r+.10)*math.sin(a),hi),.035,'Edge' if j%4==0 else 'Dark')
  if j%3==0:box(((r+.13)*math.cos(a),(r+.13)*math.sin(a),zz+.12),(.025,.11,.035),'WarmWindows',a)
# Diagonal buttresses underneath every major rim, radial structural ribs,
# recessed black deck seams, hanging mechanical racks, and multiple window bands.
for z,r,t in [(4,9.2,.72),(8.4,4.2,.48),(6.5,3.2,.38),(1.1,6.0,.42),(-2.3,4.4,.5),(-5,2.5,.3)]:
 ri=max(1.1,r*.37)
 for j in range(64):
  a=j*math.tau/64;b=(j+1)*math.tau/64
  inner=(ri*math.cos(a),ri*math.sin(a),z-t*.5-.6)
  outer=(r*.92*math.cos(a),r*.92*math.sin(a),z-t*.5-.04)
  beam(inner,outer,.07,'Titanium')
  beam(inner,(r*.92*math.cos(b),r*.92*math.sin(b),z-t*.5-.04),.045,'Dark')
  beam((r*.70*math.cos(a),r*.70*math.sin(a),z-t*.5-.44),outer,.035,'Edge')
  # black narrow panel seam across upper surface
  sector(ri,r*.92,z+t*.5+.05,a,.007,.018,'Dark')
  if j%2==0:
   rr=r*.77
   box((rr*math.cos(a),rr*math.sin(a),z-t*.5-.12),(.13,.28,.25),'Dark',a)
  # vertical rim battens define multi-level docking decks
  box((r*math.cos(a),r*math.sin(a),z),(.075,.035,t*.8),'Dark',a)
 ring(r*.93,z-t*.5-.03,.05,.04,'Edge')
 lights(r+.025,z-.14,int(r*54),.035,.022,'WarmWindows',.72)
 lights(r+.026,z+.10,int(r*47),.027,.02,'WarmWindows',.52)
# Long antenna/conduit bundles protrude from lower machinery shaft.
for j in range(45):
 a=random.random()*math.tau;r=random.uniform(.85,1.6);z=random.uniform(-10,-4)
 box((r*math.cos(a),r*math.sin(a),z),(.025,.04,random.uniform(.8,3.1)),'Edge' if j%5==0 else 'Dark',a)
station=finalize('Santee_Station')
# RYUKEN: long rounded wedge with broad stern and curved, armored slab bow
# Cross-section longitudinal stations (y,halfwidth,top,bottom)
sections=[(-10.5,.4,.00,-.28),(-9.8,1.15,.35,-.55),(-8.1,2.05,.70,-.86),(-5.4,2.95,.95,-1.02),(-2.0,3.55,1.16,-1.05),(1.5,3.65,1.27,-.92),(4.5,3.1,1.38,-.7),(7.1,2.35,1.15,-.58),(8.4,1.6,.85,-.3)]
vs=[]
for y,w,zt,zb in sections:
 vs.extend([(-w,y,0),(-w*.88,y,zt*.74),(-w*.60,y,zt),(w*.60,y,zt),(w*.88,y,zt*.74),(w,y,0),(w*.75,y,zb),(-w*.75,y,zb)])
fs=[]
for k in range(len(sections)-1):
 for j in range(8):fs.append((k*8+j,k*8+(j+1)%8,(k+1)*8+(j+1)%8,(k+1)*8+j))
fs.extend([tuple(range(7,-1,-1)),tuple((len(sections)-1)*8+i for i in range(8))]);mesh('ArmoredHull',vs,fs,'Armor')
def width(y):
 for i in range(len(sections)-1):
  a,b=sections[i],sections[i+1]
  if a[0]<=y<=b[0]:
   t=(y-a[0])/(b[0]-a[0]);return a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t
 return .5,.1
# broad continuous beveled side edge strips, rows of blue windows
for side in [-1,1]:
 for i in range(94):
  y=-9.6+i*.185;w,z=width(y)
  box((side*(w-.1),y,-.02),(.075,.135,.07),'Dark')
  if i%2==0:box((side*(w+.008),y,-.12),(.024,.075,.025),'BlueWindows')
  if i%3==0:box((side*(w*.84),y,-.50),(.06,.12,.06),'Titanium')
# Armor plating varies in length and width; seams stay narrow and subdued.
for row in range(42):
 y=-9.3+row*.40;w,z=width(y)
 for col in range(-8,9):
  x=col*.41
  if abs(x)>w*.78:continue
  zz=z if abs(x)<w*.6 else z*(1-(abs(x)/w-.6)*.93)
  box((x,y,zz+.008),(.39,.38,.018),random.choices(['Armor','Titanium','Edge'],[70,26,4])[0])
  if random.random()<.16:
   box((x,y,zz+.045),(.26,.30,.045),'Titanium')
   box((x,y-.04,zz+.073),(.16,.035,.013),'Dark')
# stepped lower hull side plating and mechanical detail
for side in [-1,1]:
 for i in range(75):
  y=-9.1+i*.22;w,z=width(y)
  box((side*(w-.10),y,-.09),(.08,.18,.22),'Titanium')
  if i%4==0:box((side*(w-.14),y,-.26),(.09,.16,.08),'Dark')
 # long armor ribs following the bow shoulders
 for i in range(30):
  y=-7.5+i*.22;w,z=width(y)
  box((side*w*.83,y,z*.78),(.07,.18,.035),'Edge')
# axial spine, structural trench and layered raised command deck
for s in [-1,1]:
 box((s*.43,-3.5,1.14),(.055,8,.035),'Dark')
for y,w,z,l in [(.2,1.55,1.27,3.0),(3.1,2.0,1.5,3.5),(4.5,1.62,1.9,2.5),(5.0,1.2,2.25,1.7),(5.15,.78,2.55,1.35)]:
 # 12-sided elongated rounded bridge silhouette
 outline=[(-w*.7,-l*.5),(w*.7,-l*.5),(w,-l*.28),(w,l*.3),(w*.7,l*.5),(-w*.7,l*.5),(-w,l*.3),(-w,-l*.28)]
 deck=[(x,y+dy,z+dz) for dz in [-.16,.16] for x,dy in outline]
 mesh('Bridge',deck,[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(j,(j+1)%8,(j+1)%8+8,j+8) for j in range(8)],'Titanium')
 box((0,y-.08,z+.175),(w*1.4,l*.88,.035),'Armor')
 for k in range(8):box(((k-3.5)*w*.16,y,z+.20),(w*.12,l*.65,.025),'Dark' if k%4==0 else 'Armor')
 for side in [-1,1]:
  for n in range(12):box((side*(w+.01),y-l*.43+n*l*.072,z),(.025,.05,.025),'BlueWindows')
# forward turret/dome on platform
lathe([(0,1.65),(.65,1.65),(.66,1.82),(.56,2.12),(.3,2.34),(0,2.4)],'Dark',48,c=(0,-.25,0))
lathe([(.70,1.5),(.79,1.5),(.79,1.62),(.7,1.62)],'Edge',48,c=(0,-.25,0))
# engine outriggers, 2 cylinders along Y with rings facing bow (-Y)
for side in [-1,1]:
 box((side*3.6,3.2,.6),(2.5,2.15,.42),'Dark')
 box((side*3.6,3.2,.86),(2.3,1.8,.08),'Armor')
 x=side*4.4
 lathe([(0,-.05),(.85,-.05),(1.02,.15),(1.05,.65),(1.0,3.5),(.76,4.1),(0,4.1)],'Titanium',64,c=(x,0,.65),axis='y')
 for y in [.1,.52,1.05,1.5,2.1,2.8,3.3,3.75]:
  lathe([(.99,y-.065),(1.10,y-.065),(1.10,y+.065),(.99,y+.065)],'Dark' if y in [1.05,2.1,3.3] else 'Edge',64,c=(x,0,.65),axis='y')
 lathe([(0,-.08),(.82,-.08),(.82,-.14),(0,-.14)],'Dark',64,c=(x,0,.65),axis='y')
 lathe([(.65,-.15),(.72,-.15),(.72,-.17),(.65,-.17)],'EngineCore',64,c=(x,0,.65),axis='y')
 lathe([(.43,-.151),(.46,-.151),(.46,-.16),(.43,-.16)],'BlueWindows',48,c=(x,0,.65),axis='y')
 for k in range(16):
  a=k*math.tau/16
  box((x+.78*math.cos(a),-.18,.65+.78*math.sin(a)),(.035,.025,.035),'BlueWindows')
 # longitudinal armor plates on nacelle
 for k in range(12):
  a=k*math.tau/12
  box((x+1.04*math.cos(a),1.9,.65+1.04*math.sin(a)),(.11,2.9,.11),'Titanium')
# dorsal masts, antenna, forward prongs
for x,y,h in [(-.7,5.8,2.0),(.6,5.8,2.5),(0,5.4,3.2),(-.4,6.4,1.5),(.4,6.8,1.2)]:
 box((x,y,2+h/2),(.09,.1,h),'Dark');box((x,y,2+h),(.045,.045,.05),'BlueWindows')
for side in [-1,1]:
 for i in range(3):box((side*(.25+i*.27),-10.6-i*.23,-.13),(.07,2.2-i*.3,.08),'Edge')
 box((side*3.9,5.6,.6),(1.45,1.2,.48),'Titanium')
 for j in range(10):box((side*3.9,5.15+j*.1,.87),(1.2,.025,.02),'Dark')
# small dorsal service detail clusters and vent banks
for i in range(80):
 y=random.uniform(-6.8,6.6);w,z=width(y);x=random.uniform(-w*.55,w*.55)
 if y>0 and abs(x)<1.8:continue
 box((x,y,z+.1),(.10+random.random()*.2,.12+random.random()*.3,.11),'Dark')
 for s in [-1,1]:
  if i%6==0:box((s*w*.85,y,.32),(.035,.09,.02),'WarmWindows')
# V3: segmented horizontal side armor layers. They follow the curved hull
# instead of leaving the side as a single smooth bright polygon.
for side in [-1,1]:
 for band,z in enumerate([.21,.02,-.20,-.41,-.61]):
  y=-9.1
  while y<7.9:
   length=random.uniform(.5,1.2);ye=min(y+length,7.9)
   wa,za=width(y);wb,zb=width(ye)
   def xx(w):return side*(w*(1-max(0,-z)*.24)+.035)
   xa,xb=xx(wa),xx(wb);dz=.065 if band%2 else .085
   verts=[(xa,y,z-dz),(xb,ye-.035,z-dz),(xb,ye-.035,z+dz),(xa,y,z+dz)]
   verts += [(x-side*.10,yy,zz) for x,yy,zz in verts]
   mesh('LayeredSideArmor',verts,[(0,1,2,3),(4,7,6,5),(0,4,5,1),(3,2,6,7),(0,3,7,4),(1,5,6,2)],'Dark' if band%2 else 'Titanium')
   if band in [1,3] and random.random()<.55:
    box((xa+side*.02,y+.14,z),(.025,.13,.022),'BlueWindows')
   y=ye
 # suspended equipment racks beneath shoulders
 for j in range(20):
  y=-4+j*.48;w,z=width(y)
  box((side*w*.83,y,-.64),(.19,.31,.13),'Dark')
  if j%3==0:box((side*w*.85,y,-.70),(.08,.16,.025),'WarmWindows')
ship=finalize('Ryuken')
# Separate steel values for the vessel; station palette is kept intact.
ship_colors={'Armor':(.18,.215,.245),'Titanium':(.12,.16,.19),'Edge':(.32,.38,.42)}
for o in ship.children:
 old=o.data.materials[0]
 if old.name in ship_colors:
  m=old.copy();m.name='Ryuken_'+old.name;m.diffuse_color=(*ship_colors[old.name],1)
  p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*ship_colors[old.name],1);p.inputs['Roughness'].default_value=.48
  o.data.materials[0]=m
# export selected models, measurement stats
stats={}
for root,filename in [(station,'station.glb'),(ship,'ryuken.glb')]:
 bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
 for o in root.children:o.select_set(True)
 bpy.context.view_layer.objects.active=root
 bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
 verts=[root.matrix_world@o.matrix_local@v.co for o in root.children for v in o.data.vertices]
 dims=[max(v[i] for v in verts)-min(v[i] for v in verts) for i in range(3)]
 stats[filename]={'bytes':(OUT/filename).stat().st_size,'meshes':len(root.children),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in root.children),'blenderDimensionsXYZ':dims,'gltfDimensionsXYZ':[dims[0],dims[2],dims[1]]}
# source scene with separated models, canonical origin retained in public export
station.location.x=-15;ship.location.x=15
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=20
scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world.color=(.04,.04,.04)
world=bpy.data.worlds.new('OrbitalStudio') if not scene.world else scene.world;scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.055,.075,.105,1);world.node_tree.nodes['Background'].inputs[1].default_value=.55
scene.view_settings.view_transform='AgX'
def area(name,loc,power,size,color):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler();return o
lights_scene=[area('Key',(0,-15,28),4500,16,(.85,.91,1)),area('Rim',(10,10,10),6000,12,(.3,.6,1)),area('WarmFill',(-12,-8,8),2500,16,(1,.77,.48))]
camdata=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',camdata);bpy.context.collection.objects.link(cam);scene.camera=cam;camdata.type='ORTHO';camdata.ortho_scale=30
# screenshots each model at canonical origin
for root,filename,loc,target,scale in [(station,'station-review.png',(23,-38,9),(0,0,.7),30),(ship,'ryuken-review.png',(18,-27,29),(0,0,1),25)]:
 station.hide_render=root!=station;ship.hide_render=root!=ship
 for o in station.children:o.hide_render=root!=station
 for o in ship.children:o.hide_render=root!=ship
 root.location.x=0;cam.location=loc;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();camdata.ortho_scale=scale
 scene.render.filepath=str(BASE/filename);bpy.ops.render.render(write_still=True)
 root.location.x=-15 if root==station else 15
for root in [station,ship]:
 root.hide_render=False
 for o in root.children:o.hide_render=False
scene.render.resolution_x=1600;scene.render.resolution_y=1000
cam.location=(38,-52,37);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.ortho_scale=50
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'Santee-and-Ryuken.blend'),compress=True)
(BASE/'asset-stats.json').write_text(json.dumps(stats,indent=2));print('REFERENCE_FLEET_DONE',json.dumps(stats))
