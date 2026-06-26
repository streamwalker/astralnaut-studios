// Phase III data seed: artifacts (pinned to the globe) + chronological events.
// Kept client-side for now; promote to a Supabase table when curation needs editing.

export type Artifact = {
  id: string;
  code: string;
  name: string;
  series: "Battlefield Atlantis" | "Darker Ages" | "Children of Aquarius" | "Cross-Timeline";
  lat: number;
  lng: number;
  year: string;
  classification: "PUBLIC" | "RESEARCHER" | "FIELD_AGENT" | "OPERATIVE";
  summary: string;
};

export const ARTIFACTS: Artifact[] = [
  {
    id: "ATL-001",
    code: "ATL-001",
    name: "Atlantean Beacon Array",
    series: "Battlefield Atlantis",
    lat: 31.7,
    lng: -28.5,
    year: "—12,000 BCE",
    classification: "PUBLIC",
    summary: "Submerged transmitter ring recovered on the Mid-Atlantic ridge. Final verified Atlantean signal.",
  },
  {
    id: "DA-014",
    code: "DA-014",
    name: "Iron Cathedral Reliquary",
    series: "Darker Ages",
    lat: 52.52,
    lng: 13.4,
    year: "1349 CE",
    classification: "PUBLIC",
    summary: "Iron-bound case containing plague-era contact logs. Recovered intact from a sealed Berlin crypt.",
  },
  {
    id: "CA-007",
    code: "CA-007",
    name: "Aquarius Glyph Plates",
    series: "Children of Aquarius",
    lat: -13.16,
    lng: -72.54,
    year: "Unknown",
    classification: "RESEARCHER",
    summary: "Three obsidian plates etched with non-terrestrial astronomy. Andean recovery site, integrity nominal.",
  },
  {
    id: "RSW-1947",
    code: "RSW-1947",
    name: "Roswell Recovery",
    series: "Cross-Timeline",
    lat: 33.39,
    lng: -104.52,
    year: "1947 CE",
    classification: "FIELD_AGENT",
    summary: "First publicly disputed recovery event. Cross-references all three timelines.",
  },
  {
    id: "TUN-22",
    code: "TUN-22",
    name: "Tunguska Impact Echo",
    series: "Cross-Timeline",
    lat: 60.89,
    lng: 101.9,
    year: "1908 CE",
    classification: "RESEARCHER",
    summary: "Residual EM signature consistent with the Atlantean beacon array. Origin still classified.",
  },
  {
    id: "ANT-09",
    code: "ANT-09",
    name: "Vostok Subglacial Lattice",
    series: "Children of Aquarius",
    lat: -78.46,
    lng: 106.84,
    year: "2014 CE",
    classification: "OPERATIVE",
    summary: "Crystalline lattice imaged through 3.7km of ice. Reading withheld pending Operative clearance.",
  },
];

export type ChronoEvent = {
  id: string;
  date: string;
  /** Sortable numeric year, negative for BCE. */
  sortYear: number;
  series: Artifact["series"];
  title: string;
  body: string;
  artifactId?: string;
};

export const CHRONO_EVENTS: ChronoEvent[] = [
  {
    id: "evt-nerria",
    date: "—25,000 BCE",
    sortYear: -25000,
    series: "Cross-Timeline",
    title: "The Nerrian Galaxy falls silent",
    body: "All long-range transmissions cease within a 72-hour window. Cause undetermined.",
  },
  {
    id: "evt-atlantis",
    date: "—12,000 BCE",
    sortYear: -12000,
    series: "Battlefield Atlantis",
    title: "Final Atlantean transmission",
    body: "The Beacon Array broadcasts a 38-second loop before going dark.",
    artifactId: "ATL-001",
  },
  {
    id: "evt-plague",
    date: "1349 CE",
    sortYear: 1349,
    series: "Darker Ages",
    title: "Iron Cathedral sealed",
    body: "Contact-era reliquary entombed beneath what is now central Berlin.",
    artifactId: "DA-014",
  },
  {
    id: "evt-tunguska",
    date: "1908 CE",
    sortYear: 1908,
    series: "Cross-Timeline",
    title: "Tunguska event",
    body: "Atmospheric detonation leaves an EM echo that matches the Atlantean beacon.",
    artifactId: "TUN-22",
  },
  {
    id: "evt-roswell",
    date: "1947 CE",
    sortYear: 1947,
    series: "Cross-Timeline",
    title: "Roswell recovery",
    body: "First disputed public recovery. Becomes the founding case of the modern Archive.",
    artifactId: "RSW-1947",
  },
  {
    id: "evt-vostok",
    date: "2014 CE",
    sortYear: 2014,
    series: "Children of Aquarius",
    title: "Vostok lattice imaged",
    body: "Subglacial scan returns geometry inconsistent with any known formation.",
    artifactId: "ANT-09",
  },
  {
    id: "evt-archive",
    date: "Present day",
    sortYear: 2026,
    series: "Cross-Timeline",
    title: "The Archive opens to the public",
    body: "Public-tier observers granted limited terminal access.",
  },
];

export const SERIES_COLOR: Record<Artifact["series"], string> = {
  "Battlefield Atlantis": "#22d3ee",
  "Darker Ages": "#f59e0b",
  "Children of Aquarius": "#a78bfa",
  "Cross-Timeline": "#ef4444",
};
