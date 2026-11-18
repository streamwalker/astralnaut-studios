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
