import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight, Grid2X2, LockKeyhole, Bookmark } from "lucide-react";
export type ShelfPage = { number: number; url: string | null; label: string; locked: boolean };
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm transition hover:border-[var(--neon)]/60 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--neon)] disabled:opacity-30";
export function ReaderShelf({
  series,
  title,
  issue,
  pages,
  current,
  onSelect,
  accountId,
}: {
  series: string;
  title: string;
  issue: number;
  pages: ShelfPage[];
  current: number;
  onSelect: (n: number) => void;
  accountId: string;
}) {
  const [open, setOpen] = useState(false),
    [resume, setResume] = useState<number | null>(null);
  const key = `comic-bookmark:v2:${accountId}:${series}:${issue}`;
  useEffect(() => {
    setResume(null);
    if (!accountId) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const n = Number(raw);
        if (pages.some((p) => p.number === n)) setResume(n);
      }
    } catch {}
  }, [key, accountId]);
  useEffect(() => {
    if (!accountId) return;
    try {
      localStorage.setItem(key, String(current));
    } catch {}
  }, [current, key, accountId]);
  const at = pages.findIndex((p) => p.number === current);
  const active = pages[at];
  return (
    <section
      className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#152230] to-[#0a1018] shadow-xl"
      aria-label="Issue library"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--neon)]">
            Astralnaut Studios · Digital comics
          </p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Issue {issue} · {active?.label || "Start reading"}
          </p>
        </div>
        <nav aria-label="Switch comic series" className="flex flex-wrap gap-2">
          {[
            { slug: "battlefield-atlantis", name: "Battlefield Atlantis" },
            { slug: "children-of-aquarius", name: "Children of Aquarius" },
          ].map((s) => (
            <Link
              key={s.slug}
              to="/reader/$series/$issue"
              params={{ series: s.slug, issue: "1" }}
              search={{ page: 0 }}
              className={
                button +
                (series === s.slug
                  ? " border-[var(--neon)]/50 bg-[var(--neon)]/10 text-[var(--neon)]"
                  : " text-slate-300")
              }
              aria-current={series === s.slug ? "page" : undefined}
            >
              <BookOpen size={15} />
              {s.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-black/20 p-3 sm:px-5">
        <button
          className={button}
          disabled={at <= 0}
          onClick={() => onSelect(pages[at - 1].number)}
          aria-label="Previous comic page"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs text-slate-400">
          Jump to
          <select
            className="max-w-40 bg-transparent py-2 text-sm text-white outline-none"
            aria-label="Jump to comic page"
            value={current}
            onChange={(e) => onSelect(Number(e.target.value))}
          >
            {pages.map((p) => (
              <option className="bg-slate-900" key={p.number} value={p.number}>
                {p.label}
                {p.locked ? " · locked" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          className={button}
          disabled={at < 0 || at === pages.length - 1}
          onClick={() => onSelect(pages[at + 1].number)}
          aria-label="Next comic page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </button>
        <button
          className={button + " ml-auto"}
          aria-expanded={open}
          aria-controls="reader-page-library"
          onClick={() => setOpen((o) => !o)}
        >
          <Grid2X2 size={16} />
          {open ? "Hide pages" : "Browse pages"}
        </button>
        {resume !== null && resume !== current && (
          <button
            className={button + " text-[var(--gold)]"}
            onClick={() => {
              onSelect(resume);
              setResume(null);
            }}
          >
            <Bookmark size={15} />
            Resume {resume === 0 ? "cover" : `page ${resume}`}
          </button>
        )}
      </div>
      <div className="h-0.5 bg-white/10" aria-hidden="true">
        <div
          className="h-full bg-[var(--neon)] transition-[width]"
          style={{ width: `${pages.length ? ((at + 1) / pages.length) * 100 : 0}%` }}
        />
      </div>
      {open && (
        <div
          id="reader-page-library"
          className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-auto p-4 sm:grid-cols-5 lg:grid-cols-8"
        >
          {pages.map((p) => (
            <button
              key={p.number}
              aria-label={`Open ${p.label}${p.locked ? ", subscription required" : ""}`}
              aria-current={p.number === current ? "page" : undefined}
              onClick={() => onSelect(p.number)}
              className={`overflow-hidden rounded-lg border text-left ${p.number === current ? "border-[var(--neon)] ring-1 ring-[var(--neon)]" : "border-white/15 hover:border-white/50"}`}
            >
              <div className="flex aspect-[2/3] items-center justify-center bg-black/40">
                {p.url ? (
                  <img
                    src={p.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-2 px-2 text-center text-xs text-slate-400">
                    {p.locked ? (
                      <>
                        <LockKeyhole size={20} />
                        Locked
                      </>
                    ) : (
                      <>Coming soon</>
                    )}
                  </span>
                )}
              </div>
              <span className="block p-2 text-xs">{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
