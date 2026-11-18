# Interactive Santee Station and Ryuken

These are complete Blender mesh assets for the Astralnaut Studios homepage. The vessel close-ups are rendered from GLBs in real time; the original portrait artwork is no longer used as the interactive surface or the chapter backdrop.

- `santee/`: editable station scene, generator, review renders and model measurements.
- `ryuken/`: editable capital ship scene, generator, review renders and model measurements.
- Web assets: `public/space-journey/interactive-vessels/` relative to repository root.

The models follow the supplied Santee Station 2.jpg and Ryuken One.jpg references. The references show one viewpoint each, so reverse sides and undersides are constructed consistently from their visible industrial forms.

Desktop visitors drag the model in two axes and can use labeled zoom/reset controls or the keyboard. Touch visitors select Rotate model to enter free rotation within the viewport, then Done to return to page scrolling. Reduced-motion preferences keep manual model interaction available without idle animation. Model loading/rendering failure shows a clearly identified Blender-rendered fallback.

The distant orbiting fleet retains its lighter geometry to avoid loading these close-up meshes for every ship. Environmental city, orbit and bridge artwork is separate from both vessel models.
