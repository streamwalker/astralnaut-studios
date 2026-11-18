# Santee Station — interactive 3D asset

This is a complete geometric Blender reconstruction of `Santee Station 2.jpg`, including the rear and underside. It contains no photographs, billboards, or background planes. The unseen surfaces are modeled consistently with the supplied design; one source view cannot establish their exact form.

The second-generation model corrects the previous thin-disc interpretation. It has a broad continuous industrial shoulder, a tapered machinery-filled underside, smaller layered upper decks and spires, a long lower equipment spine, projecting docks, conduits, trusses, armor panels, and restrained amber/cyan windows.

Three reviewed passes were rendered. The first exposed an overly smooth shoulder funnel and solid center spire; both were replaced with dense service decks, conduits and individual spires in the second pass. The third pass added irregular lower elevator and equipment enclosures, hanging rails, and offset docking gantries to break up repeated open truss bays; lighting and metal tones were neutralized. The final views are `front-review.png` (low frontal angle matching the reference) and `underside-review.png` (opposite side from below). Source: `Santee-Station-v2.blend`; deterministic build: `build_santee.py`.

The model is 320,544 triangles across seven material batches. Draco GLB is 1,808,744 bytes. Exported dimensions are approximately 19.372 × 28.023 × 19.368, Y up. The model is centered radially; the viewer should center its bounding box before framing. Front camera direction in glTF coordinates is approximately (28, 2, 42), looking at the model center; low elevation preserves the broad ring silhouette. Leave enough room for the top spire and long lower spine when fitting mobile.

Web files: `/space-journey/interactive-vessels/santee-v2.glb` and `santee-preview.webp`. The WebP is a transparent render of this model for loading/failure only, not the original artwork.

Rebuild with Blender 5.2:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python art-source/interactive-vessels/santee/build_santee.py
```

After rendering, use Pillow to convert `front-review.png` to the public WebP with quality 90. The main model's detail, silhouettes and palette are reference-driven; it is not a claim that every pixel or unseen surface matches the source photograph.
