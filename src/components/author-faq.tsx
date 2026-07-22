import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { listActiveAuthorFaq } from "@/lib/author-faq.functions";
import { supabase } from "@/integrations/supabase/client";
import { hasConsent } from "@/lib/cookies-client";

const FALLBACK = [
  {
    id: "fallback-1",
    question: "How does the author’s background inform the story?",
    answer:
      "Phil Russell spent more than three decades in U.S. Air Force intelligence and special-access programs. That experience shaped the way characters handle classified information, compartmentalized operations, and the quiet discipline of people who live inside secrets. The rituals of security, the weight of need-to-know, and the moral tension between disclosure and protection all come from direct familiarity with that world.",
    sort_order: 10,
  },
  {
    id: "fallback-2",
    question: "Is Children of Aquarius based on real UAP crash-retrieval programs?",
    answer:
      "The novel is a work of fiction. It draws on the author’s knowledge of intelligence culture and security procedure, but any resemblance to specific government programs, recovered materials, or alleged crash-retrieval efforts is a narrative device. The author can neither confirm nor deny the existence of such programs.",
    sort_order: 20,
  },
  {
    id: "fallback-3",
    question: "Why the 'neither confirm nor deny' stance?",
    answer:
      "It is both a narrative boundary and a professional one. The story is meant to entertain, provoke questions, and honor the mindset of people who guard sensitive information — not to serve as a source document. That boundary protects both the fiction and the real-world obligations that inspired it.",
    sort_order: 30,
  },
  {
    id: "fallback-4",
    question: "Should readers treat the book as fact or speculation?",
    answer:
      "As fiction. The book blends esoteric symbolism, religious prophecy, and intelligence tradecraft into a thriller, but it is not reporting, testimony, or disclosure. Readers are invited to enjoy the mystery without mistaking it for evidence.",
    sort_order: 40,
  },
];

const SESSION_KEY = "as_analytics_sid";
function sid(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

async function logFaq(action: "expand" | "collapse", item: { id: string; question: string }) {
  if (!hasConsent("analytics")) return;
  const session_id = sid();
  if (!session_id) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      session_id,
      user_id: userData.user?.id ?? null,
      event_type: "click",
      path: typeof window !== "undefined" ? window.location.pathname.slice(0, 500) : "/",
      target: `faq:${action}:${item.question}`.slice(0, 500),
      referrer: typeof document !== "undefined" ? document.referrer.slice(0, 500) || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      metadata: { component: "author_faq", action, faq_id: item.id, question: item.question },
    } as never);
  } catch {
    /* swallow */
  }
}

function FaqItem({ item }: { item: { id: string; question: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      void logFaq(next ? "expand" : "collapse", item);
      return next;
    });
  }, [item]);
  const panelId = `faq-panel-${item.id}`;
  return (
    <div className="rounded-lg border border-white/5 bg-black/20">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5"
      >
        <h3 className="text-sm font-black uppercase tracking-wider text-white">{item.question}</h3>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--gold)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div id={panelId} className="px-4 pb-4 md:px-5 md:pb-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink2)]">{item.answer}</p>
        </div>
      ) : null}
    </div>
  );
}

export function AuthorFaq() {
  const listFn = useServerFn(listActiveAuthorFaq);
  const { data } = useQuery({
    queryKey: ["author-faq"],
    queryFn: () => listFn(),
    staleTime: 5 * 60 * 1000,
  });

  const items = data && data.length > 0 ? data : FALLBACK;

  return (
    <section className="mt-10">
      <div className="card-rwc border-l-4 border-[var(--gold)] p-6 md:p-8">
        <div className="eyebrow" style={{ color: "var(--gold)" }}>Frequently asked questions</div>
        <h2 className="mt-3 text-2xl font-black md:text-3xl">About the author</h2>
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <FaqItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
