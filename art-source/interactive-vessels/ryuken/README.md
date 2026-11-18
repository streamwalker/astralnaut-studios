# Ryuken interactive 3D model

This is a complete, volumetric reconstruction in Blender, following the supplied **Ryuken One.jpg**. It is not a photograph on a flat card and has no projected source-image texture. The main hull, front and aft face, layered port/starboard side armor, ventral equipment, command decks, engine barrels and throats are geometry that can be inspected from any direction.

## Iteration and visual inspection

Four geometry/material revisions were rendered and inspected from front-above and reverse-below:

1. The initial solid hull, seven oval command terraces and twin forward-facing cylindrical engine mouths established the principal silhouette.
2. Broadened the chamfered slab bow; corrected shoulder armor to lie on the actual hull surface rather than underneath it; extended machinery to the underside.
3. Added hundreds of irregular layered mechanical panels, shoulder details, vent banks and stern equipment; changed decorative-looking command-deck dots to thinner, interrupted cyan window slits. Moved the delivery camera so the bow points toward the bottom right, matching the reference composition.
4. Baked a portable, subtle alloy-grain normal map and variable roughness texture. The textures are procedural surface detail, not source artwork.

The reference constrains the visible front/top silhouette. Rear and underside details are authored extrapolations because the supplied image does not reveal them. This is not an exact scan or recovered original production mesh.

## Deliverables

- `Ryuken-Interactive.blend`: editable source with materials, cameras and studio lighting.
- `build_ryuken.py`: deterministic generator (Blender 5.2); run from any working directory with Blender's background Python.
- `ryuken-reference-view.png`: inspected front-above render.
- `ryuken-reverse-view.png`: inspected rear-below render.
- `Alloy-normal.png`, `Alloy-roughness.png`: embedded, portable 256px material maps.
- `asset-stats.json`: exact export measurements.
- `public/space-journey/interactive-vessels/ryuken-v2.glb`: web model, relative to repository root.
- `public/space-journey/interactive-vessels/ryuken-preview.webp`: generated model render for fallback.

## Browser orientation and budget

The export is centered at the origin. glTF coordinates: **Y up, bow +Z**. Suggested camera vector **[-17, 23, 28]**, looking at [0, 0, 0], provides the reference-facing top-front view. Normalize according to the bounding box for viewer framing.

Export: **977,380 bytes**, **105,400 triangles**, **8 material meshes**. Dimensions XYZ in glTF: **10.7600 × 6.8300 × 20.1020**. Draco compression requires the existing GLTFLoader decoder. The background fleet intentionally retains its lighter separate model.
