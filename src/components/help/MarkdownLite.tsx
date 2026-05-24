/**
 * Tiny markdown renderer. Supports: # headings, ## headings, ### headings,
 * - bullets, 1. ordered, **bold**, `code`, [text](url), --- hr, tables, blank lines.
 * Not a general-purpose markdown lib — only what our content uses.
 */
import { Fragment } from "react";

function renderInline(text: string, keyBase: string) {
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let i = 0;
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/;
  while (rest.length) {
    const m = rest.match(re);
    if (!m) {
      nodes.push(<Fragment key={`${keyBase}-t-${i++}`}>{rest}</Fragment>);
      break;
    }
    const idx = m.index ?? 0;
    if (idx > 0) nodes.push(<Fragment key={`${keyBase}-t-${i++}`}>{rest.slice(0, idx)}</Fragment>);
    if (m[2]) nodes.push(<strong key={`${keyBase}-b-${i++}`}>{m[2]}</strong>);
    else if (m[4])
      nodes.push(
        <code
          key={`${keyBase}-c-${i++}`}
          className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-[var(--neon)]"
        >
          {m[4]}
        </code>,
      );
    else if (m[6] && m[7])
      nodes.push(
        <a
          key={`${keyBase}-a-${i++}`}
          href={m[7]}
          className="text-[var(--neon)] underline-offset-2 hover:underline"
        >
          {m[6]}
        </a>,
      );
    rest = rest.slice(idx + m[0].length);
  }
  return nodes;
}

export function MarkdownLite({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      out.push(
        <h3 key={k++} className="mt-6 mb-2 text-lg font-bold text-[var(--ink)]">
          {renderInline(line.slice(4), `h3-${k}`)}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      out.push(
        <h2
          key={k++}
          className="mt-8 mb-3 text-xl font-extrabold uppercase tracking-wide text-[var(--ink)]"
        >
          {renderInline(line.slice(3), `h2-${k}`)}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      out.push(
        <h1 key={k++} className="mt-8 mb-4 text-2xl font-extrabold text-[var(--ink)]">
          {renderInline(line.slice(2), `h1-${k}`)}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.trim() === "---") {
      out.push(<hr key={k++} className="my-6 border-[var(--border-line)]" />);
      i++;
      continue;
    }

    // table
    if (line.includes("|") && lines[i + 1]?.includes("---")) {
      const headers = line.split("|").map((s) => s.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(lines[i].split("|").map((s) => s.trim()).filter(Boolean));
        i++;
      }
      out.push(
        <div key={k++} className="my-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-line)] text-left text-[var(--ink2)]">
                {headers.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 font-semibold uppercase tracking-wide">
                    {renderInline(h, `th-${k}-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-[var(--border-line)]/40">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2 text-[var(--ink2)]">
                      {renderInline(c, `td-${k}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // unordered list
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      out.push(
        <ul key={k++} className="my-3 list-disc space-y-1 pl-6 text-[var(--ink2)]">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `li-${k}-${ii}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(
        <ol key={k++} className="my-3 list-decimal space-y-1 pl-6 text-[var(--ink2)]">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it, `oli-${k}-${ii}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // paragraph
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|-\s|\d+\.\s|---)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      <p key={k++} className="my-3 leading-relaxed text-[var(--ink2)]">
        {renderInline(para.join(" "), `p-${k}`)}
      </p>,
    );
  }

  return <div className="text-[0.95rem]">{out}</div>;
}
