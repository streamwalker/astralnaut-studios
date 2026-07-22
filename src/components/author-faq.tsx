import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveAuthorFaq } from "@/lib/author-faq.functions";

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
        <div className="mt-6 space-y-5">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/5 bg-black/20 p-4 md:p-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">{item.question}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--ink2)]">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
