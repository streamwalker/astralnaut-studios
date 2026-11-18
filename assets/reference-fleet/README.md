# Santee Station and Ryuken source assets

Rebuilt in Blender 5.2.1 from the user's Santee Station 2.jpg and Ryuken One.jpg references. The supplied image files are not changed. This is a geometric reconstruction of recognizable silhouettes and mechanical features, not a pixel-exact reconstruction of unobserved surfaces.

- **Santee**: upright axial station; broad central docking ring; smaller upper and lower ring decks; long descending keel; upper city spires; metallic radial paneling, service blocks and amber windows.
- **Ryuken**: elongated broad armored hull, rounded/tapered bow, layered command bridge, antenna masts, twin cylindrical lateral nacelles and cyan annular emitters.

`build_reference_fleet.py` deterministically builds both models, exports Draco GLBs, renders inspection PNGs and writes the editable `Santee-and-Ryuken.blend`. Run using `/Applications/Blender.app/Contents/MacOS/Blender --background --python assets/reference-fleet/build_reference_fleet.py` from the repository root.

Exports in `public/space-journey/reference-fleet/` are at canonical origin with glTF +Y up. Ryuken's bow points +Z. The two models are separated horizontally only in the editable Blender scene for convenient inspection. Meshes are merged per material to limit draw calls; materials use glTF-compatible PBR and emissive colors without texture dependencies. The public GLBs require the existing Draco decoder.

| Asset | Transfer bytes | Triangles | Meshes | glTF dimensions X/Y/Z |
| --- | ---: | ---: | ---: | --- |
| station.glb | 1,810,912 | 335,848 | 6 | 19.25 / 27.28 / 19.25 |
| ryuken.glb | 128,408 | 32,824 | 7 | 11 / 6.275 / 20.26 |

Three modeling iterations were rendered and inspected. The second reduced uniform checkerboard contrast on the ship hull, rounded the raised bridge terraces, added upper station spires, and compressed both GLBs. The third adds dense crossed structural bracing, access galleries, underside trusses, stronger radial seams, fine amber window bands, darker ship steel, and horizontal segmented side armor. The retained review PNGs are Blender renders; they are not evidence of browser or physical-mobile performance. Runtime integration/browser checks are performed by the main implementation task.

## Website presentation

The live close-up scenes retain the original Santee and Ryuken reference photographs with cursor/touch parallax. They are not GLB close-up renders. The Ryuken GLB supplies the independently moving orbital fleet. The Santee GLB is retained as an editable reference reconstruction and is not downloaded by the live scene. Original planet, bridge, and city artwork is resized into WebP without repainting.
