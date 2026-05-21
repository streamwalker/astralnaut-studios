import baLogo from "@/assets/battlefield-atlantis-logo.png";
import coaLogo from "@/assets/children-of-aquarius-logo.png";
import daLogo from "@/assets/darker-ages-logo.png";

export const seriesLogos: Record<string, string> = {
  "battlefield-atlantis": baLogo,
  "children-of-aquarius": coaLogo,
  "darker-ages": daLogo,
};

export function logoFor(slug: string): string | undefined {
  return seriesLogos[slug];
}
