export type HeroGlow = {
  series_slug: string;
  enabled: boolean;
  color: string;
  intensity: number;
  spread: number;
};

const BASE_SHADOW = "drop-shadow(0 8px 30px rgba(0,0,0,0.7))";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { r: 255, g: 255, b: 255 };
  const int = parseInt(m[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

/** Build a CSS `filter` value for a hero logo glow. */
export function buildGlowFilter(g: HeroGlow | null | undefined): string {
  if (!g || !g.enabled || g.intensity <= 0) return BASE_SHADOW;
  const { r, g: gc, b } = hexToRgb(g.color);
  const inner = Math.min(1, (g.intensity / 100) * 0.9);
  const outer = Math.min(1, (g.intensity / 100) * 0.55);
  const innerBlur = Math.max(2, Math.round(g.spread * 0.42));
  const outerBlur = Math.max(6, g.spread);
  return [
    `drop-shadow(0 0 ${innerBlur}px rgba(${r},${gc},${b},${inner.toFixed(2)}))`,
    `drop-shadow(0 0 ${outerBlur}px rgba(${r},${gc},${b},${outer.toFixed(2)}))`,
    BASE_SHADOW,
  ].join(" ");
}

export const HERO_GLOW_QUERY_KEY = ["hero-logo-glow"] as const;
