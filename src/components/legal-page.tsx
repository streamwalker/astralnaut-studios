import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { LEGAL_CONFIG } from "@/config/legal";

type Props = {
  title: string;
  eyebrow?: string;
  effective: string;
  updated?: string;
  version?: string;
  canonical: string;
  noindex?: boolean;
  children: ReactNode;
};

export function LegalPage({ title, eyebrow, effective, updated, version, canonical: _canonical, noindex: _noindex, children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <a href="#legal-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-sm focus:text-white">
        Skip to content
      </a>
      <SiteHeader />
      <main id="legal-content" className="mx-auto max-w-[70ch] px-6 py-16 print:max-w-none print:px-0 print:py-4">
        <div className="legal-doc">
          {eyebrow ? (
            <div className="text-[10px] font-bold uppercase tracking-[3px]" style={{ color: "var(--gold)" }}>{eyebrow}</div>
          ) : null}
          <h1 className="mt-2 text-3xl font-black text-[var(--ink)] md:text-5xl">{title}</h1>
          <p className="mt-3 text-xs text-[var(--fg-muted)]">
            Effective date: <strong>{effective}</strong>
            {updated ? <> · Last updated: <strong>{updated}</strong></> : null}
            {version ? <> · Version {version}</> : null}
          </p>
          <p className="mt-2 text-xs italic text-[var(--fg-muted)]">
            Pending attorney review. This page is provided as-is by {LEGAL_CONFIG.entity}.
          </p>
          <div className="legal-body mt-8">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
      <style>{`
        .legal-body h2 { color: var(--gold); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-top: 2.5rem; }
        .legal-body h3 { color: var(--ink); font-size: 0.95rem; font-weight: 700; margin-top: 1.75rem; }
        .legal-body p, .legal-body li { color: var(--mute); font-size: 0.925rem; line-height: 1.7; }
        .legal-body p { margin-top: 0.75rem; }
        .legal-body ul, .legal-body ol { margin-top: 0.75rem; padding-left: 1.5rem; }
        .legal-body ul li { list-style: disc; margin-top: 0.35rem; }
        .legal-body ol li { list-style: decimal; margin-top: 0.35rem; }
        .legal-body strong { color: var(--ink); }
        .legal-body address { font-style: normal; color: var(--mute); margin-top: 0.5rem; line-height: 1.6; }
        .legal-body table { width: 100%; margin-top: 1rem; border-collapse: collapse; font-size: 0.85rem; }
        .legal-body th, .legal-body td { border: 1px solid var(--border-line); padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
        .legal-body th { background: rgba(255,255,255,0.04); color: var(--ink); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px; }
        @media print {
          .legal-body { color: #000 !important; }
          .legal-body h2, .legal-body h3, .legal-body strong { color: #000 !important; }
          .legal-body p, .legal-body li { color: #111 !important; }
          header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export function metaFor(opts: { title: string; description: string; path: string; noindex?: boolean }) {
  const url = `${LEGAL_CONFIG.siteUrl}${opts.path}`;
  const meta: Array<Record<string, string>> = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:type", content: "website" },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex" });
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}
