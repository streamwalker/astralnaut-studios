"""Santee Station complete 3D reconstruction, reference-driven second generation.
Deterministic mesh geometry. No photographic planes or projections.
Run from repo: Blender --background --python art-source/interactive-vessels/santee/build_santee.py
"""
import bpy, math, random, json
from mathutils import Vector
from pathlib import Path
BASE=Path(__file__).resolve().parent
OUT=BASE.parents[2]/'public/space-journey/interactive-vessels'
OUT.mkdir(parents=True,exist_ok=True)
random.seed(20261118)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
MATS={}
def mat(name,color,metal=.8,rough=.32,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 MATS[name]=m
mat('Titanium',(0.095,.115,.13),.76,.48)
mat('Armor',(0.165,.185,.205),.72,.49)
mat('Dark',(0.028,.041,.052),.68,.53)
mat('Edge',(0.21,.24,.27),.76,.42)
mat('WarmWindows',(1,.49,.16),.1,.3,2.4)
mat('BlueWindows',(.17,.52,.85),.1,.25,2.3)
mat('Machinery',(0.05,.062,.075),.65,.6)
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
# Broad industrial mass, deliberately continuous under the main ring.
# The original's dominant upper ring supports a tapered underside with machinery-filled terraces.
lathe([(0,-13),(.35,-13),(.47,-11.4),(1.2,-11.2),(1.48,-9),(1.85,-7),
 (2.0,-5.1),(2.35,-4.1),(2.7,-3),(3.5,-1.9),(4.2,-.8),(5.1,.3),
 (6.5,1.5),(8.1,2.5),(9.1,3.3),(9.3,3.7),(9.1,4.1),(8.1,4.25),
 (3.2,4.55),(2.75,5.1),(2.45,6.5),(2.35,7.7),(1.8,8.7),(.65,9.4),(0,9.4)],'Dark',128)
# Asymmetric machinery enclosures and service galleries above/below every station level.
def industrial_band(z,r,height,count=96):
 for j in range(count):
  a=j*math.tau/count
  if random.random()<.12:continue
  h=random.uniform(height*.23,height*.82);w=random.uniform(.08,.21);rr=r+random.uniform(-.02,.13)
  box((rr*math.cos(a),rr*math.sin(a),z+random.uniform(-height*.2,height*.2)),(w,.12,h),random.choice(['Dark','Machinery','Titanium']),a+math.pi/2)
  if j%4==0:
   beam(((rr+.1)*math.cos(a),(rr+.1)*math.sin(a),z-height*.45),((rr+.1)*math.cos(a),(rr+.1)*math.sin(a),z+height*.45),.025,'Edge')
  if random.random()<.33:
   box(((rr+.08)*math.cos(a),(rr+.08)*math.sin(a),z+.1),(.06,.025,.022),'WarmWindows',a+math.pi/2)

def disk(z,r,t,inner=1.7):
 lathe([(inner,z-t*.5),(r*.94,z-t*.5),(r,z-t*.25),(r,z+t*.17),(r*.97,z+t*.5),(inner,z+t*.5)],'Titanium',128)
 for rr,zz in [(r,z),(r*.985,z+t*.4),(r*.93,z-t*.48)]:ring(rr,zz,.045,.04,'Machinery',128)
 for band in range(5):
  ri=inner+(r-inner)*band/5;ro=inner+(r-inner)*(band+1)/5
  for j in range(96):
   a=j*math.tau/96;da=math.tau/96*random.uniform(.83,.96)
   sector(ri+.018,ro-.025,z+t*.5+.012,a,da,random.uniform(.02,.055),random.choice(['Titanium','Titanium','Machinery','Armor']))
 # underside panels extend to the inner infrastructure, visible when tilted
 for band in range(3):
  ri=inner+(r-inner)*band/3;ro=inner+(r-inner)*(band+1)/3
  for j in range(80):
   a=j*math.tau/80
   sector(ri+.025,ro-.025,z-t*.5-.025,a,math.tau/80*.9,.035,random.choice(['Machinery','Dark','Titanium']))
 lights(r+.015,z-.04,int(r*41),.028,.018,'WarmWindows',.39)
 # Fine radial ridges, interrupted rim edge structures, projecting docking gantries.
 for j in range(48):
  a=j*math.tau/48
  beam((inner*math.cos(a),inner*math.sin(a),z+t*.5+.05),(r*.96*math.cos(a),r*.96*math.sin(a),z+t*.5+.05),.026,'Machinery')
  if j%3==0:
   rr=r*.86
   box((rr*math.cos(a),rr*math.sin(a),z+t*.5+.11),(.44,.16,.15),'Machinery',a)
   box((rr*math.cos(a),rr*math.sin(a),z-t*.5-.12),(.37,.18,.20),'Dark',a)
 for j in range(int(r*13)):
  a=random.random()*math.tau;rr=random.uniform(inner,r*.94);h=random.uniform(.025,.16)
  box((rr*math.cos(a),rr*math.sin(a),z+t*.5+h*.5),(.08+random.random()*.22,.055+random.random()*.16,h),random.choice(['Dark','Titanium','Machinery']),a)
# Major shoulder ring and outer layered city deck.
disk(3.6,9.35,.68,2.8)
disk(4.18,8.2,.20,2.8)
# The upper decks are compact stacked terraces under a dense central skyline.
disk(8.35,4.45,.48,1.35)
disk(7.86,4.18,.20,1.5)
disk(6.33,3.35,.33,1.8)
disk(5.75,3.15,.14,2.1)
# Lower tapered terraces support the continuous central body.
disk(.15,5.55,.30,3.0)
disk(-.7,4.95,.20,2.8)
disk(-3.25,4.0,.42,1.8)
disk(-3.82,3.3,.22,1.7)
disk(-5.65,2.7,.23,1.4)
# Dense stepped belts across the underside of the main mass: no empty disc gaps.
for z,r,h in [(2.85,8.9,.35),(2.35,7.8,.4),(1.95,7.1,.4),(1.45,6.4,.4),(.95,5.9,.42),(.47,5.55,.4),(-.3,4.9,.4),(-1.18,4.55,.5),(-1.75,4.05,.48),(-2.35,3.55,.5),(-2.85,3.1,.43)]:
 industrial_band(z,r,h,128)
 ring(r,z,.065,.035,'Machinery',128)
 lights(r+.09,z-.11,150,.023,.017,'WarmWindows',.3)
 for j in range(36):
  a=j*math.tau/36
  beam((r*.94*math.cos(a),r*.94*math.sin(a),z-.22),((r+.08)*math.cos(a),(r+.08)*math.sin(a),z+.25),.035,'Titanium')
# Tall central infrastructure; interrupted rows are less regular than a uniform window grid.
for z,r in [(-10.6,1.28),(-10,1.35),(-9.4,1.43),(-8.8,1.48),(-8.2,1.6),(-7.6,1.72),(-7,1.83),(-6.4,1.94),(-5.3,2.02),(-4.7,2.14),(-4.1,2.32),(4.7,2.95),(5.25,2.75),(6.75,2.5),(7.3,2.45),(8.8,1.6)]:
 industrial_band(z,r,.6,64)
 ring(r+.1,z-.28,.05,.055,'Titanium',96)
 for j in range(32):
  a=j*math.tau/32;b=(j+1)*math.tau/32
  beam(((r+.13)*math.cos(a),(r+.13)*math.sin(a),z-.25),((r+.13)*math.cos(b),(r+.13)*math.sin(b),z+.25),.018,'Titanium')
# Long tapered vertical shaft, rugged rectangular conduits / lift tracks, visible to full underside.
for j in range(90):
 a=random.random()*math.tau;r=random.uniform(.65,1.7);length=random.uniform(3.4,7.2)
 top=random.uniform(-4.8,-5.6);w=random.uniform(.04,.13)
 box((r*math.cos(a),r*math.sin(a),top-length*.5),(w,w*.8,length),'Dark' if j%3 else 'Titanium',a)
 if j%7==0:
  for k in range(7):box(((r+.07)*math.cos(a),(r+.07)*math.sin(a),top-length*k/8),(.022,.022,.05),'BlueWindows')
for j in range(16):
 a=j*math.tau/16;r=1.55
 box((r*math.cos(a),r*math.sin(a),-8.6),(.16,.20,3.5),'Machinery',a)
 box((r*math.cos(a),r*math.sin(a),-10.4),(.06,.08,1.5),'Titanium',a)
# Upper skyline. Do not make a solid cone: varied spires, radar pylons and warm markers.
for j in range(110):
 a=random.random()*math.tau;r=random.uniform(.12,1.35);h=random.uniform(.35,4.7)*(1-r*.3)
 z=8.64;w=random.uniform(.03,.11)
 box((r*math.cos(a),r*math.sin(a),z+h*.5),(w,w*.85,h),'Titanium' if j%3 else 'Dark')
 if j%7==0:
  box((r*math.cos(a),r*math.sin(a),z+h),(.033,.033,.045),'WarmWindows')
 # Cross-spire bridges create the slender mechanical towers.
 if j%5==0:beam((r*math.cos(a),r*math.sin(a),z+h*.65),(0,0,z+h*.65),.025,'Machinery')
for x,y,h in [(0,0,5.6),(.16,-.07,4.7),(-.16,.12,4.2)]:
 box((x,y,8.65+h*.5),(.065,.055,h),'Edge')
for j in range(80):
 a=j*math.tau/80;r=random.uniform(3.4,4.2);h=random.uniform(.12,.8)
 box((r*math.cos(a),r*math.sin(a),8.59+h*.5),(.055,.06,h),'Titanium')
 if j%10==0:box((r*math.cos(a),r*math.sin(a),8.59+h),(.04,.04,.05),'WarmWindows')
# Irregular lateral docks and truss catwalks interrupt the circular silhouette.
for z,r,count in [(3.8,9.1,18),(-3.1,3.8,13),(-5.4,2.6,9),(6.5,3.2,7)]:
 for j in range(count):
  a=j*math.tau/count+.13;reach=random.uniform(.35,1.0);w=random.uniform(.1,.32)
  box(((r+reach*.35)*math.cos(a),(r+reach*.35)*math.sin(a),z),(reach,w,.075),'Titanium',a)
  for off in [-w*.4,w*.4]:
   start=(r*.85*math.cos(a)-off*math.sin(a),r*.85*math.sin(a)+off*math.cos(a),z-.4)
   end=((r+reach*.8)*math.cos(a)-off*math.sin(a),(r+reach*.8)*math.sin(a)+off*math.cos(a),z)
   beam(start,end,.026,'Titanium')
  if j%3==0:box(((r+reach*.7)*math.cos(a),(r+reach*.7)*math.sin(a),z+.055),(.035,.07,.025),'BlueWindows',a)
# Second review correction: remove the smooth funnel appearance with dense service decks,
# tapered machine racks and conduits, and replace the solid central cone with true spires.
shoulder=[(.3,5.1),(1.5,6.5),(2.5,8.1),(3.3,9.1)]
def shoulder_radius(z):
 for (za,ra),(zb,rb) in zip(shoulder,shoulder[1:]):
  if za<=z<=zb:return ra+(rb-ra)*(z-za)/(zb-za)
 return 5.1
for level in range(24):
 z=.34+level*.12;r=shoulder_radius(z)
 ring(r+.025,z,.045,.022,'Machinery',96)
 for j in range(80):
  a=j*math.tau/80+random.uniform(-.016,.016)
  if random.random()<.13:continue
  rr=r+random.uniform(.04,.10);h=random.uniform(.025,.1)
  box((rr*math.cos(a),rr*math.sin(a),z),(.04+random.random()*.13,.04,h),random.choice(['Titanium','Machinery','Dark']),a+math.pi/2)
  if j%7==0:box(((rr+.03)*math.cos(a),(rr+.03)*math.sin(a),z+.025),(.025,.015,.012),'WarmWindows',a+math.pi/2)
for j in range(120):
 a=j*math.tau/120
 for za,zb in [(.4,1.4),(1.55,2.4),(2.55,3.1)]:
  ra,rb=shoulder_radius(za)+.06,shoulder_radius(zb)+.06
  beam((ra*math.cos(a),ra*math.sin(a),za),(rb*math.cos(a),rb*math.sin(a),zb),.017,'Titanium' if j%3 else 'Dark')
# Irregular core lift shafts / equipment break the repetitive diagonal trusses.
for j in range(250):
 a=random.random()*math.tau;z=random.uniform(-10.7,-4.2);r=1.35+max(0,z+10.7)*.14
 box((r*math.cos(a),r*math.sin(a),z),(.06,.09,random.uniform(.2,.9)),random.choice(['Dark','Machinery']),a)
for j in range(20):
 a=random.random()*math.tau;r=random.uniform(.23,.6);h=random.uniform(.3,1.3)
 box((r*math.cos(a),r*math.sin(a),-12.5-h*.5),(.04,.06,h),'Titanium' if j%4==0 else 'Machinery',a)
# Third review correction: irregular lower elevator blocks, hanging armor racks and
# offset service gantries cover repeated open truss bays without losing depth.
for j in range(38):
 a=random.random()*math.tau;z=random.uniform(-10.8,-4.0);r=1.34+max(0,z+10.7)*.14
 h=random.uniform(.65,2.6);w=random.uniform(.15,.42)
 rr=r+random.uniform(.08,.30)
 box((rr*math.cos(a),rr*math.sin(a),z),(w,.19,h),'Dark' if j%3 else 'Machinery',a+math.pi/2)
 box(((rr+.12)*math.cos(a),(rr+.12)*math.sin(a),z-h*.12),(w*.7,.035,h*.75),'Titanium' if j%6==0 else 'Machinery',a+math.pi/2)
 for k in range(3):
  zz=z-h*.3+k*h*.21
  box(((rr+.145)*math.cos(a),(rr+.145)*math.sin(a),zz),(w*.8,.025,.025),'Dark',a+math.pi/2)
 if j%4==0:
  box(((rr+.15)*math.cos(a),(rr+.15)*math.sin(a),z+h*.22),(.02,.02,.12),'BlueWindows')
 for side in [-1,1]:
  start=(rr*math.cos(a)-side*w*.4*math.sin(a),rr*math.sin(a)+side*w*.4*math.cos(a),z+h*.45)
  end=((rr+.25)*math.cos(a)-side*w*.4*math.sin(a),(rr+.25)*math.sin(a)+side*w*.4*math.cos(a),z-h*.55)
  beam(start,end,.025,'Machinery')
for j in range(11):
 a=j*math.tau/11+.23;z=random.uniform(-6.9,-4.5);r=2.3;length=random.uniform(.5,1.5)
 box(((r+length*.35)*math.cos(a),(r+length*.35)*math.sin(a),z),(length,.15,.09),'Dark',a)
 beam((1.6*math.cos(a),1.6*math.sin(a),z-.65),((r+length*.7)*math.cos(a),(r+length*.7)*math.sin(a),z),.03,'Titanium')
 for k in range(5):
  rr=r+length*k/6
  box((rr*math.cos(a),rr*math.sin(a),z+.07),(.035,.22,.025),'Machinery',a)
station=finalize('Santee_Station_v2')
# Full geometry export, merged into seven physically based material batches.
bpy.ops.object.select_all(action='DESELECT');station.select_set(True)
for o in station.children:o.select_set(True)
bpy.context.view_layer.objects.active=station
bpy.ops.export_scene.gltf(filepath=str(OUT/'santee-v2.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
verts=[o.matrix_local@v.co for o in station.children for v in o.data.vertices]
dims=[max(v[i] for v in verts)-min(v[i] for v in verts) for i in range(3)]
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in station.children)
stats={'file':'santee-v2.glb','bytes':(OUT/'santee-v2.glb').stat().st_size,'triangles':triangles,'meshes':len(station.children),'blenderDimensionsXYZ':dims,'gltfDimensionsXYZ':[dims[0],dims[2],dims[1]],'imagePlanes':0,'reviewCameraGltf':[28,2,42],'modelUp':'Y in exported GLB'}
(BASE/'asset-stats.json').write_text(json.dumps(stats,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=960;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.film_transparent=True
world=scene.world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.055,.075,.105,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
scene.view_settings.view_transform='AgX'
def area(name,loc,power,size,color):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area('Broad neutral starlight',(-18,-15,22),6000,16,(.87,.92,1))
area('Cold planet rim',(13,7,4),5000,10,(.45,.65,.85))
area('Soft camera fill',(8,-30,8),1500,22,(.76,.85,1))
area('Underside reflected planet',(-7,3,-14),1900,14,(.42,.59,.75))
camdata=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',camdata);bpy.context.collection.objects.link(cam);scene.camera=cam;camdata.type='ORTHO';camdata.ortho_scale=30
for name,location in [('front-review',(28,-42,2)),('underside-review',(-30,34,-9))]:
 cam.location=location;cam.rotation_euler=(Vector((0,0,.3))-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=str(BASE/(name+'.png'));bpy.ops.render.render(write_still=True)
cam.location=(28,-42,2);cam.rotation_euler=(Vector((0,0,.3))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'Santee-Station-v2.blend'),compress=True)
print('SANTEE_COMPLETE',json.dumps(stats))
