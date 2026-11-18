import { CatmullRomCurve3, Vector3 } from "three";
// Five waypoints correspond to the DOM section centers. Forward flight, planet orbit, docking.
export const flight = new CatmullRomCurve3(
  [
    [0, 0, 48],
    [-7, 2, -45],
    [0, 0, -110],
    [-42, 14, -185],
    [0, 0, -308],
  ].map((p) => new Vector3(...p)),
  false,
  "catmullrom",
  0.35,
);
export const gaze = new CatmullRomCurve3(
  [
    [8, 0, -70],
    [4, 0, -120],
    [12, 4, -162],
    [0, 5, -255],
    [-4, 0, -355],
  ].map((p) => new Vector3(...p)),
  false,
  "catmullrom",
  0.3,
);
export const chapterIds = ["departure", "nebula", "slate", "world", "invitation"];
