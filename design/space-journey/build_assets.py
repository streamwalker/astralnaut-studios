import bpy, math, random, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.abspath(os.path.join(ROOT,'../../public/space-journey')); os.makedirs(OUT,exist_ok=True)
random.seed(41)
def reset():
 bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.5,emission=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
def apply(obj,name,m):obj.name=name; obj.data.materials.append(m);return obj
def box(name,loc,scale,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return apply(o,name,m)
def torus(name,r,minor,loc,m):
 bpy.ops.mesh.primitive_torus_add(major_segments=64,minor_segments=8,location=loc,major_radius=r,minor_radius=minor);return apply(bpy.context.object,name,m)
def export(name):
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_cameras=False,export_lights=False)
def camera(loc,target,ortho=0):
 bpy.ops.object.camera_add(location=loc);o=bpy.context.object;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.camera=o
 if ortho:o.data.type='ORTHO';o.data.ortho_scale=ortho
 return o
def light(loc,power,color,size):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
def render(path,w,h):
 s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=64;s.cycles.use_denoising=True;s.render.resolution_x=w;s.render.resolution_y=h;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True;s.render.filepath=path;bpy.ops.render.render(write_still=True)
# Real volumetric sprites rendered in Blender. Twelve independent noise fields.
reset(); s=bpy.context.scene;s.world.color=(.01,.01,.01)
for i in range(12):
 reset(); bpy.ops.mesh.primitive_cube_add(size=2);o=bpy.context.object;o.scale=(2.8,2,1.2);m=bpy.data.materials.new('NebulaVolume%02d'%i);m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links
 out=n.new('ShaderNodeOutputMaterial');v=n.new('ShaderNodeVolumePrincipled');tex=n.new('ShaderNodeTexNoise');tex.noise_dimensions='4D';tex.inputs['W'].default_value=i*3.73;tex.inputs['Scale'].default_value=3;tex.inputs['Detail'].default_value=5;tex.inputs['Roughness'].default_value=.7
 coord=n.new('ShaderNodeTexCoord');distance=n.new('ShaderNodeVectorMath');distance.operation='DISTANCE';distance.inputs[1].default_value=(.5,.5,.5);l.new(coord.outputs['Generated'],tex.inputs['Vector']);l.new(coord.outputs['Generated'],distance.inputs[0]);r=n.new('ShaderNodeMapRange');r.inputs['From Min'].default_value=.12;r.inputs['From Max'].default_value=.5;r.inputs['To Min'].default_value=1;r.inputs['To Max'].default_value=0;l.new(distance.outputs['Value'],r.inputs['Value']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';l.new(r.outputs[0],mul.inputs[0]);ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.45;ramp.color_ramp.elements[1].position=.68;l.new(tex.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],mul.inputs[1]);l.new(mul.outputs[0],v.inputs['Density']);l.new(mul.outputs[0],v.inputs['Emission Strength']);v.inputs['Emission Color'].default_value=(*([(0.23,.10,.55),(.07,.38,.48),(.35,.12,.38)][i%3]),1);v.inputs['Color'].default_value=(.3,.4,.8,1);l.new(v.outputs['Volume'],out.inputs['Volume']);o.data.materials.append(m)
 camera((0,0,7),(0,0,0),6.2);light((0,1,4),400,(.4,.7,1),5);render(os.path.join(OUT,'nebula-%02d.png'%i),384,384)
 print('NEBULA_READY',i,flush=True)
reset();steel=mat('Titanium',(0.10,.15,.22),.8,.28);silver=mat('Ceramic silver',(.45,.53,.62),.65,.25);dark=mat('Dark carbon',(.015,.024,.045),.6,.4);cyan=mat('Ion navigation',(.08,.7,1),.3,.2,5);gold=mat('Dock guidance',(1,.45,.13),.2,.25,3)
# Orbital station: rotating habitat, ribs, solar wings, docking spine and windows.
for radius,z in [(4,0),(4,.35),(2.8,-.5)]:torus('HabitatRing',radius,.16,(0,0,z),steel)
for radius,z in [(4.04,.18),(2.83,-.5)]:torus('NavigationRibbon',radius,.026,(0,0,z),cyan)
for i in range(24):
 a=i*math.tau/24;x,y=4*math.cos(a),4*math.sin(a);o=box('HabitatModule',(x,y,0),(.6,.42,.48),silver);o.rotation_euler.z=a
 box('Window',(x,y,.251),(.15,.18,.018),cyan)
for i in range(6):
 a=i*math.tau/6;o=box('RadialTruss',(2*math.cos(a),2*math.sin(a),0),(3.9,.14,.14),steel);o.rotation_euler.z=a
box('CommandSpine',(0,0,0),(1,1,5),silver)
for z in [-2,-1,1,2]:torus('SpineCollar',.65,.1,(0,0,z),dark)
for side in [-1,1]:
 box('SolarBoom',(side*5.3,0,0),(3,.15,.15),silver)
 for y in [-1.35,1.35]:
  box('SolarArray',(side*6.1,y,0),(1.8,2.3,.05),dark)
  for k in range(9):box('SolarCell',(side*6.1,y-1+k*.25,.035),(1.74,.012,.012),cyan)
export('station');camera((10,-13,10),(0,0,0),19);light((3,-6,12),1800,(.5,.75,1),8);light((-8,1,4),1600,(.7,.3,1),7);render(os.path.join(ROOT,'station-reference.png'),1000,720);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'station.blend'))
# Starship with tapered hull, layered wings, emissive engines.
reset()
bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=1.1,radius2=.15,depth=6,location=(0,0,0));apply(bpy.context.object,'FlightHull',silver)
for side in [-1,1]:
 mesh=bpy.data.meshes.new('WingMesh');mesh.from_pydata([(side*.5,0,2),(side*4,0,-2),(side*.6,0,-1),(side*.5,.2,2),(side*4,.2,-2),(side*.6,.2,-1)],[],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)]);o=bpy.data.objects.new('SweptWing',mesh);bpy.context.collection.objects.link(o);apply(o,'SweptWing',steel)
 box('EnginePod',(side*1.35,0,-1.8),(.65,.65,2.5),dark);torus('EngineHalo',.25,.06,(side*1.35,0,-3.06),cyan)
box('Cockpit',(0,-.55,.8),(.6,.15,1.3),cyan);export('starship');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'starship.blend'))
reset();rock=mat('Asteroid regolith',(.18,.15,.19),.12,.95)
for i in range(7):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(0,0,0));o=bpy.context.object;apply(o,'Asteroid_%d'%i,rock)
 for v in o.data.vertices:v.co*=random.uniform(.65,1.3);v.co.x*=1.2+i*.07
export('asteroids');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'asteroids.blend'))
# UV sphere and independent cloud layer. Baked procedural terrain map, not an Earth texture.
reset(); ocean=mat('Consterya oceans',(.02,.13,.23),.1,.4)
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=64,radius=1);planet=apply(bpy.context.object,'ConsteryaMinor',ocean)
for p in planet.data.polygons:p.use_smooth=True
nodes=ocean.node_tree.nodes;links=ocean.node_tree.links;p=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.2;tex.inputs['Detail'].default_value=4;tex.inputs['Roughness'].default_value=.75;r=nodes.new('ShaderNodeValToRGB');r.color_ramp.elements.remove(r.color_ramp.elements[1]);r.color_ramp.elements[0].position=.34;r.color_ramp.elements[0].color=(.012,.045,.11,1)
for pos,col in [(.49,(.03,.19,.26,1)),(.51,(.12,.24,.18,1)),(.59,(.33,.36,.22,1)),(.68,(.7,.64,.48,1)),(.77,(.85,.89,.91,1))]:e=r.color_ramp.elements.new(pos);e.color=col
links.new(tex.outputs['Fac'],r.inputs[0]);links.new(r.outputs[0],p.inputs['Base Color']);img=bpy.data.images.new('ConsteryaTerrain',width=2048,height=1024);node=nodes.new('ShaderNodeTexImage');node.image=img;nodes.active=node;bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=1;bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'});img.filepath_raw=os.path.join(OUT,'consterya-terrain.jpg');img.file_format='JPEG';img.save();links.new(node.outputs['Color'],p.inputs['Base Color'])
cloud=mat('CloudShell',(.8,.92,1),0,.9);bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=1.015);apply(bpy.context.object,'CloudShell',cloud)
export('planet');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'planet.blend'));print('ASSETS_COMPLETE',flush=True)
