import { Link } from "@tanstack/react-router";
import { pageUrl } from "@/lib/storage";

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

export function SeriesCard(p: Props) {
  const cover = pageUrl(p.cover_path);
  const to = seriesRoute[p.slug] ?? "/";
  const isActive = p.status === "active";
  return (
    <Link to={to} className="card-rwc group block overflow-hidden">
      <div className="relative aspect-[1054/1491] overflow-hidden bg-[var(--bg2)]">
        {cover ? (
          <img src={cover} alt={`${p.name} cover`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-8 text-center" style={{ background: "var(--gradient-panel)" }}>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>Cover forthcoming</div>
              <div className="mt-3 text-2xl font-black tracking-tight">{p.name}</div>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {isActive ? <span className="badge-free">Reading now</span> : <span className="badge-locked">{p.launch_label ?? "Coming soon"}</span>}
        </div>
      </div>
      <div className="p-5">
        <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>{p.genre ?? "Series"}</div>
        <h3 className="mt-2 text-xl font-black leading-tight">{p.name}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-[var(--ink2)]">{p.logline}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--neon)]">{isActive ? "Read first act free →" : "Preview →"}</span>
        </div>
      </div>
    </Link>
  );
}
