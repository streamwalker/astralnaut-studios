import { Link } from "@tanstack/react-router";
import { pageUrl } from "@/lib/storage";
import { logoFor } from "@/lib/series-logos";

interface Props {
  slug: string;
  name: string;
  genre: string | null;
  logline: string | null;
  cover_path: string | null;
  status: string;
  launch_label: string | null;
}

const seriesRoute: Record<string, "/battlefield-atlantis" | "/children-of-aquarius" | "/darker-ages"> = {
  "battlefield-atlantis": "/battlefield-atlantis",
  "children-of-aquarius": "/children-of-aquarius",
  "darker-ages": "/darker-ages",
};

// Per-series accent palette for the logo plate.
// Values are RGB triplets so we can compose Tailwind-safe inline styles.
type Accent = {
  glowA: string; // primary glow color (rgb)
  glowB: string; // secondary glow color (rgb)
  edge: string;  // border / hover edge color (rgb)
};

const accents: Record<string, Accent> = {
  "battlefield-atlantis": { glowA: "59,130,246", glowB: "220,38,38", edge: "59,130,246" },
  "children-of-aquarius": { glowA: "34,211,238", glowB: "16,185,129", edge: "34,211,238" },
  "darker-ages":          { glowA: "249,115,22", glowB: "127,29,29",  edge: "249,115,22" },
};

const defaultAccent: Accent = { glowA: "120,160,255", glowB: "80,80,120", edge: "120,160,255" };

export function SeriesCard(p: Props) {
  const logo = logoFor(p.slug);
  const cover = pageUrl(p.cover_path);
  const to = seriesRoute[p.slug] ?? "/";
  const isActive = p.status === "active";
  const a = accents[p.slug] ?? defaultAccent;

  return (
    <Link
      to={to}
      className="card-rwc group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[color-mix(in_oklab,var(--bg2)_70%,transparent)] shadow-2xl backdrop-blur-sm transition-all duration-500 md:h-80 md:flex-row"
      style={{ ["--edge" as string]: `rgb(${a.edge})` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(${a.edge}, 0.35)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
    >
      {/* Logo Plate (60%) */}
      <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-black md:h-full md:w-3/5">
        {/* Base gradient wash */}
        <div
          className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: `linear-gradient(to bottom right, rgba(${a.glowA},0.30), rgba(${a.glowB},0.12), transparent)` }}
        />
        {/* Animated corner glows */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 animate-pulse rounded-full"
          style={{ background: `rgba(${a.glowA},0.22)`, filter: "blur(100px)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 animate-pulse rounded-full"
          style={{ background: `rgba(${a.glowB},0.16)`, filter: "blur(100px)" }}
        />

        {/* Badge */}
        <div
          className="absolute left-6 top-6 z-20 rounded-sm border px-3 py-1 backdrop-blur-md"
          style={{
            background: isActive ? `rgba(${a.glowA},0.18)` : "rgba(255,255,255,0.05)",
            borderColor: isActive ? `rgba(${a.glowA},0.45)` : "rgba(255,255,255,0.2)",
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: isActive ? `rgb(${a.glowA})` : "rgb(212,212,216)" }}
          >
            {isActive ? "Reading now" : (p.launch_label ?? "Coming soon")}
          </span>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex max-h-full w-full items-center justify-center px-8">
          {logo ? (
            <img
              src={logo}
              alt={`${p.name} logo`}
              className="max-h-32 w-auto max-w-[80%] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-[1.03] md:max-h-44"
              loading="lazy"
            />
          ) : cover ? (
            <img src={cover} alt={p.name} className="max-h-40 w-auto max-w-[80%] object-contain md:max-h-56" loading="lazy" />
          ) : (
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>Logo forthcoming</div>
              <div className="mt-3 text-2xl font-black tracking-tight text-white">{p.name}</div>
            </div>
          )}
        </div>
      </div>

      {/* Copy block (40%) */}
      <div className="flex w-full flex-col justify-center bg-gradient-to-r from-black/40 to-transparent p-8 md:w-2/5 md:p-10">
        <span className="mb-2 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--gold)" }}>
          {p.genre ?? "Series"}
        </span>
        <h3 className="mb-4 text-2xl font-black leading-tight text-white md:text-3xl">{p.name}</h3>
        <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-[var(--ink2)]">{p.logline}</p>
        <span className="group/btn flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--neon)" }}>
          {isActive ? "Read first act free" : "Preview"}
          <span className="block h-px w-8 bg-[var(--neon)] transition-all duration-300 group-hover:w-12" />
        </span>
      </div>
    </Link>
  );
}
