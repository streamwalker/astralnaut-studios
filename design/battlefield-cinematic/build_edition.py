"""Reproducible, lightweight cover presentation. This is a visual study, not print specifications.
Run: Blender --background --python build_edition.py -- /absolute/output/directory
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector

OUT = Path(sys.argv[sys.argv.index('--') + 1])
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metal=0, rough=.4):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m

navy = material('Midnight cover stock', (.012,.025,.035), .12, .34)
paper = material('Warm paper edges', (.72,.72,.67), 0, .8)
line = material('Page edge detail', (.24,.28,.29), 0, .9)
cyan = material('Cyan spine rule', (.1,.48,.63), .6, .3)
art = material('Approved cover artwork', (1,1,1), 0, .46)
im = bpy.data.images.load(str(OUT / 'approved-cover.png'))
im.scale(1024, 1383)
im.filepath_raw = str(OUT / 'cover-texture.jpg')
im.file_format = 'JPEG'
im.save()
im = bpy.data.images.load(str(OUT / 'cover-texture.jpg'))
node = art.node_tree.nodes.new('ShaderNodeTexImage')
node.image = im
art.node_tree.links.new(node.outputs['Color'], art.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

def box(name, loc, scale, mat, bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj=bpy.context.object
    obj.name=name
    obj.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    mod=obj.modifiers.new('Soft bound edges','BEVEL')
    mod.width=bevel
    mod.segments=2
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

box('Page block', (0,0,0), (2.12,.16,2.865),paper)
box('Front cover', (0,-.105,0), (2.16,.035,2.915),navy)
box('Back cover', (0,.105,0), (2.16,.035,2.915),navy)
box('Bound spine', (-1.072,0,0), (.035,.24,2.915),navy)
for z in [-1.27,1.27]:
    box('Spine cyan accent',(-1.092,0,z),(.004,.20,.012),cyan,.001)
for i in range(11):
    box('Page edge %02d'%i,(1.062,-.068+i*.0136,0),(.003,.002,2.83),line,.0005)

# Front texture plane, four explicit UVs; faces toward -Y in Blender / +Z in glTF.
mesh=bpy.data.meshes.new('Cover artwork UV')
mesh.from_pydata([(-1.071,-.125,-1.449),(1.071,-.125,-1.449),(1.071,-.125,1.449),(-1.071,-.125,1.449)],[],[(0,1,2,3)])
mesh.update()
uv=mesh.uv_layers.new()
for i,co in enumerate([(0,0),(1,0),(1,1),(0,1)]): uv.data[i].uv=co
obj=bpy.data.objects.new('Canonical cover artwork',mesh)
bpy.context.collection.objects.link(obj)
obj.data.materials.append(art)

objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in objects: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'battlefield-edition.glb'),export_format='GLB',use_selection=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_image_format='JPEG')

world=bpy.context.scene.world
world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.06,.09,.13,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35
def area(name, pos, energy, color, size):
    bpy.ops.object.light_add(type='AREA', location=pos)
    o=bpy.context.object; o.name=name; o.data.energy=energy; o.data.color=color; o.data.shape='DISK'; o.data.size=size
    o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area('Softbox key',(-3,-4,5),650,(.85,.94,1),5)
area('Cyan rim',(4,1,2),900,(.22,.64,1),3)
area('Warm edge',(-3,1,-1),500,(1,.65,.36),2)
bpy.ops.object.camera_add(location=(3.3,-8.6,2.6))
cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=4.6
bpy.context.scene.camera=cam
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1000;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'edition-reference.png')
scene.view_settings.view_transform='AgX'
for image in bpy.data.images:
    if image.source == 'FILE': image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'battlefield-edition.blend'))
bpy.ops.render.render(write_still=True)
