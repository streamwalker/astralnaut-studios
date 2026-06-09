export type SeriesSlug = "battlefield-atlantis" | "children-of-aquarius" | "darker-ages";

export const LETTERS_BRANDING: Record<SeriesSlug, {
  title: string;
  tag: string;
  address: string;
  accent: string; // CSS color var or hex
  background: string; // banner background color
  ink: string; // banner text color
}> = {
  "battlefield-atlantis": {
    title: "BATTLEFIELD AT LETTERS",
    tag: "Dispatches from the front",
    address: "c/o Astralnaut Studios · Saantris Station",
    accent: "#22D3FF",
    background: "#0B1530",
    ink: "#FFD84D",
  },
  "children-of-aquarius": {
    title: "MAIL OF AQUARIUS",
    tag: "Signals from the children",
    address: "c/o Astralnaut Studios · Aquarian Hold",
    accent: "#7CF5C8",
    background: "#0B2733",
    ink: "#F7F4E9",
  },
  "darker-ages": {
    title: "DARKER PAGES",
    tag: "Letters from the dying age",
    address: "c/o Astralnaut Studios · The Old Keep",
    accent: "#E94560",
    background: "#1A0A0F",
    ink: "#F2D8B6",
  },
};

export function brandingFor(slug: string) {
  return LETTERS_BRANDING[slug as SeriesSlug] ?? {
    title: "READER LETTERS",
    tag: "Letters page",
    address: "c/o Astralnaut Studios",
    accent: "#22D3FF",
    background: "#0F172A",
    ink: "#F8FAFC",
  };
}
