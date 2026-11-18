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
# UV sphere and independent cloud layer. Baked procedural terrain map, not an Earth texture.
reset(); ocean=mat('Consterya oceans',(.02,.13,.23),.1,.4)
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=64,radius=1);planet=apply(bpy.context.object,'ConsteryaMinor',ocean)
for p in planet.data.polygons:p.use_smooth=True
nodes=ocean.node_tree.nodes;links=ocean.node_tree.links;p=nodes.get('Principled BSDF');tex=nodes.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.2;tex.inputs['Detail'].default_value=4;tex.inputs['Roughness'].default_value=.75;r=nodes.new('ShaderNodeValToRGB');r.color_ramp.elements.remove(r.color_ramp.elements[1]);r.color_ramp.elements[0].position=.34;r.color_ramp.elements[0].color=(.012,.045,.11,1)
for pos,col in [(.49,(.03,.19,.26,1)),(.51,(.12,.24,.18,1)),(.59,(.33,.36,.22,1)),(.68,(.7,.64,.48,1)),(.77,(.85,.89,.91,1))]:e=r.color_ramp.elements.new(pos);e.color=col
links.new(tex.outputs['Fac'],r.inputs[0]);links.new(r.outputs[0],p.inputs['Base Color']);img=bpy.data.images.new('ConsteryaTerrain',width=2048,height=1024);node=nodes.new('ShaderNodeTexImage');node.image=img;nodes.active=node;bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=1;bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'});img.filepath_raw=os.path.join(OUT,'consterya-terrain.jpg');img.file_format='JPEG';img.save();links.new(node.outputs['Color'],p.inputs['Base Color'])
cloud=mat('CloudShell',(.8,.92,1),0,.9);bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=1.015);apply(bpy.context.object,'CloudShell',cloud)
export('planet');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'planet.blend'));print('ASSETS_COMPLETE',flush=True)
