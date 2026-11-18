import bpy,os
ROOT=os.path.dirname(os.path.abspath(__file__));OUT=os.path.abspath(os.path.join(ROOT,'../../public/space-journey'))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT,'asteroids.blend'))
rocks=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in rocks:
 bpy.context.view_layer.objects.active=o
 mod=o.modifiers.new('Eroded surface','SUBSURF');mod.levels=2;bpy.ops.object.modifier_apply(modifier=mod.name)
 texture=bpy.data.textures.new(o.name+'erosion',type='CLOUDS');texture.noise_scale=.15;mod=o.modifiers.new('Regolith detail','DISPLACE');mod.texture=texture;mod.strength=.11;bpy.ops.object.modifier_apply(modifier=mod.name)
 for f in o.data.polygons:f.use_smooth=True
m=rocks[0].data.materials[0];n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=16;noise.inputs['Detail'].default_value=6;r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].color=(.025,.018,.02,1);r.color_ramp.elements[1].color=(.28,.24,.22,1);l.new(noise.outputs['Fac'],r.inputs[0]);l.new(r.outputs[0],p.inputs['Base Color']);img=bpy.data.images.new('RegolithBaked',width=512,height=512);node=n.new('ShaderNodeTexImage');node.image=img;n.active=node;bpy.ops.object.select_all(action='DESELECT');rocks[0].select_set(True);bpy.context.view_layer.objects.active=rocks[0];bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=1;bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'});img.filepath_raw=os.path.join(OUT,'regolith.jpg');img.file_format='JPEG';img.save();l.new(node.outputs['Color'],p.inputs['Base Color']);bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'asteroids.glb'),export_format='GLB',export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'asteroids.blend'))
