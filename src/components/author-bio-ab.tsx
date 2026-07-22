import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listActiveAuthorBioVariants,
  logAuthorBioEvent,
} from "@/lib/author-bio.functions";

type Variant = Awaited<ReturnType<typeof listActiveAuthorBioVariants>>[number];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const key = "ab_session_id";
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

function pickVariant(variants: Variant[], sessionId: string): Variant | null {
  if (variants.length === 0) return null;
  // Deterministic per-session: hash sessionId + slug pool into [0, totalWeight)
  const total = variants.reduce((s, v) => s + Math.max(0, v.weight), 0);
  if (total <= 0) return variants[0];
  let hash = 2166136261;
  const seed = sessionId || String(Date.now());
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  let n = (hash % total);
  for (const v of variants) {
    const w = Math.max(0, v.weight);
    if (n < w) return v;
    n -= w;
  }
  return variants[variants.length - 1];
}

// Very small, safe inline formatter: **bold**, *italic*, paragraphs on blank line.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={key++} className="text-white">{tok.slice(2, -2)}</strong>);
    } else {
      out.push(<em key={key++} className="text-white not-italic">{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className={className}>{renderInline(p)}</p>
      ))}
    </>
  );
}

export function AuthorBioAB({ pagePath }: { pagePath: string }) {
  const listFn = useServerFn(listActiveAuthorBioVariants);
  const logFn = useServerFn(logAuthorBioEvent);
  const { data: variants } = useQuery({
    queryKey: ["author-bio-variants"],
    queryFn: () => listFn(),
    staleTime: 5 * 60 * 1000,
  });

  const [sessionId, setSessionId] = useState<string>("");
  useEffect(() => { setSessionId(getSessionId()); }, []);

  const chosen = useMemo(
    () => (variants && sessionId ? pickVariant(variants, sessionId) : null),
    [variants, sessionId],
  );

  const impressionSent = useRef<string | null>(null);
  useEffect(() => {
    if (!chosen || impressionSent.current === chosen.id) return;
    impressionSent.current = chosen.id;
    logFn({
      data: {
        variantId: chosen.id,
        eventType: "impression",
        pagePath,
        sessionId: sessionId || null,
      },
    }).catch(() => {});
  }, [chosen, logFn, pagePath, sessionId]);

  if (!chosen) {
    // SSR-safe placeholder that matches container size to avoid CLS
    return (
      <section className="mt-20">
        <div className="card-rwc border-l-4 border-violet-400 p-6 md:p-8 min-h-[240px]" aria-hidden />
      </section>
    );
  }

  const handleCta = () => {
    logFn({
      data: {
        variantId: chosen.id,
        eventType: "conversion",
        pagePath,
        sessionId: sessionId || null,
      },
    }).catch(() => {});
  };

  return (
    <section className="mt-20" data-ab-variant={chosen.slug}>
      <div className="card-rwc border-l-4 border-violet-400 p-6 md:p-8">
        <div className="eyebrow" style={{ color: "var(--neon)" }}>{chosen.eyebrow}</div>
        {chosen.pull_quote && (
          <blockquote
            className="mt-5 font-serif text-[1.35rem] font-bold italic leading-[1.2] tracking-tight text-[var(--gold)] sm:text-2xl md:mt-6 md:text-[1.75rem] lg:text-3xl"
          >
            <span aria-hidden="true">&ldquo;</span>{chosen.pull_quote}<span aria-hidden="true">&rdquo;</span>
          </blockquote>
        )}
        <div className="mt-5 max-w-3xl space-y-4 text-sm leading-relaxed text-[var(--ink2)]">
          <Paragraphs text={chosen.body} />
        </div>
        {chosen.cta_label && chosen.cta_href && (
          <div className="mt-6">
            <a
              href={chosen.cta_href}
              onClick={handleCta}
              className="btn-cinema inline-flex items-center gap-2 rounded-md border border-[var(--gold)]/60 bg-[var(--gold)]/10 px-4 py-2 text-xs font-black uppercase tracking-[2px] text-[var(--gold)] transition hover:bg-[var(--gold)]/20"
            >
              {chosen.cta_label} →
            </a>
          </div>
        )}
        {chosen.disclaimer && (
          <div className="mt-5 max-w-3xl border-t border-white/10 pt-4 text-xs leading-relaxed text-[var(--mute)]">
            <Paragraphs text={chosen.disclaimer} />
          </div>
        )}
      </div>
    </section>
  );
}
