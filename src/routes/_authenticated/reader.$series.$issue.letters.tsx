import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getLettersPage,
  submitLetter,
  addLetterComment,
  deleteOwnComment,
  type ApprovedLetter,
  type LettersPageBundle,
} from "@/lib/letters.functions";
import { brandingFor } from "@/lib/letters-branding";

export const Route = createFileRoute("/_authenticated/reader/$series/$issue/letters")({
  head: ({ params }) => ({
    meta: [
      { title: `Letters — ${params.series} Issue ${params.issue} · Real World Comics` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LettersPage,
});

function LettersPage() {
  const { series, issue } = Route.useParams();
  const issueNum = Number(issue);
  const qc = useQueryClient();
  const fetchPage = useServerFn(getLettersPage);

  const query = useQuery({
    queryKey: ["letters-page", series, issueNum],
    queryFn: () => fetchPage({ data: { series, issue: issueNum } }),
  });

  if (query.isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center text-muted-foreground">
          Loading letters…
        </main>
      </>
    );
  }
  if (!query.data) throw notFound();
  const bundle = query.data as LettersPageBundle;
  const brand = brandingFor(series);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["letters-page", series, issueNum] });
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          to="/reader/$series/$issue"
          params={{ series, issue }}
          search={{ page: 1 }}
          className="text-xs text-[var(--mute)] hover:text-[var(--neon)]"
        >
          ← Back to issue
        </Link>

        <Masthead
          title={brand.title}
          tag={brand.tag}
          address={brand.address}
          background={brand.background}
          ink={brand.ink}
          accent={brand.accent}
          issueLabel={`${bundle.series.name} · Issue ${bundle.issue.issue_number}`}
        />

        {!bundle.unlocked ? (
          <LockedNotice
            issueLabel={`Issue ${bundle.issue.issue_number}`}
            seriesName={bundle.series.name}
          />
        ) : bundle.letters.length === 0 ? (
          <EmptyMail />
        ) : (
          <div className="newsprint mt-8 space-y-12 md:columns-2 md:gap-10">
            {bundle.letters.map((letter) => (
              <LetterBlock
                key={letter.id}
                letter={letter}
                canComment={bundle.hasActiveSub || bundle.isAdmin}
                onChanged={invalidate}
              />
            ))}
          </div>
        )}

        <div className="mt-16">
          <SubmitSection
            bundle={bundle}
            onSubmitted={invalidate}
          />
        </div>

        {bundle.isAdmin && (
          <p className="mt-10 text-center text-xs text-muted-foreground">
            You are viewing this page as an admin. Curate submissions in the{" "}
            <Link to="/admin/letters" className="text-[var(--neon)] underline">Letters admin</Link>.
          </p>
        )}
      </main>
    </>
  );
}

function Masthead({
  title, tag, address, background, ink, accent, issueLabel,
}: { title: string; tag: string; address: string; background: string; ink: string; accent: string; issueLabel: string }) {
  return (
    <div
      className="mt-4 overflow-hidden rounded-md border-4 border-black"
      style={{ background, color: ink }}
    >
      <div className="flex flex-col items-start gap-2 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div
            className="text-3xl font-black uppercase leading-none tracking-tight md:text-5xl"
            style={{ color: accent, textShadow: "2px 2px 0 #000" }}
          >
            {title}
          </div>
          <div className="mt-1 text-xs font-bold uppercase tracking-[3px]" style={{ color: ink }}>
            {tag}
          </div>
        </div>
        <div className="text-right text-[11px] font-mono uppercase leading-snug" style={{ color: ink }}>
          {address}<br />
          {issueLabel}
        </div>
      </div>
    </div>
  );
}

function LockedNotice({ issueLabel, seriesName }: { issueLabel: string; seriesName: string }) {
  return (
    <div className="card-rwc mt-8 p-8 text-center">
      <div className="eyebrow">Sealed envelope</div>
      <h2 className="mt-2 text-2xl font-black">{issueLabel} is still publishing.</h2>
      <p className="mx-auto mt-3 max-w-xl text-[var(--ink2)]">
        Reader letters for {seriesName} go public the moment the last page of this issue drops.
        Subscribers can still send their mail now — the editor reads it as it arrives.
      </p>
    </div>
  );
}

function EmptyMail() {
  return (
    <div className="card-rwc mt-8 p-8 text-center">
      <div className="eyebrow">Editor's desk</div>
      <h2 className="mt-2 text-2xl font-black">The editor is reading your mail.</h2>
      <p className="mx-auto mt-3 max-w-xl text-[var(--ink2)]">
        Approved letters will appear here, with the editor's reply and an open conversation under each one.
      </p>
    </div>
  );
}

function LetterBlock({
  letter, canComment, onChanged,
}: { letter: ApprovedLetter; canComment: boolean; onChanged: () => void }) {
  return (
    <article className="break-inside-avoid">
      <header className="mb-2">
        <h3 className="text-lg font-black uppercase tracking-wide text-foreground">
          {letter.subject}
        </h3>
      </header>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
        {letter.body.split(/\n+/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="mt-3 text-right text-sm italic text-foreground/80">
        — {letter.display_name}
        {letter.location ? <><br />{letter.location}</> : null}
      </div>
      {letter.editor_reply && (
        <div className="mt-4 border-l-4 border-[var(--neon)] bg-foreground/5 px-4 py-3 text-sm italic">
          {letter.editor_reply.split(/\n+/).map((p, i) => (
            <p key={i} className="mb-2 last:mb-0">{p}</p>
          ))}
          <div className="mt-1 text-right not-italic text-xs font-bold uppercase tracking-[2px] text-[var(--neon)]">
            — The Editor
          </div>
        </div>
      )}

      <Comments letterId={letter.id} comments={letter.comments} canComment={canComment} onChanged={onChanged} />
    </article>
  );
}

function Comments({
  letterId, comments, canComment, onChanged,
}: {
  letterId: string;
  comments: ApprovedLetter["comments"];
  canComment: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const addFn = useServerFn(addLetterComment);
  const delFn = useServerFn(deleteOwnComment);

  const add = useMutation({
    mutationFn: () => addFn({ data: { letterId, body: body.trim(), displayName: name.trim() || "Reader" } }),
    onSuccess: () => {
      setBody("");
      toast.success("Reply posted");
      onChanged();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not post"),
  });

  const del = useMutation({
    mutationFn: (commentId: string) => delFn({ data: { commentId } }),
    onSuccess: () => { toast.success("Deleted"); onChanged(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete"),
  });

  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <button
        type="button"
        className="text-xs font-bold uppercase tracking-[2px] text-muted-foreground hover:text-[var(--neon)]"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "× Hide replies" : `▾ Replies (${comments.length})`}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">No replies yet. Be first.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-sm border border-border/60 bg-background/40 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-[2px] text-muted-foreground">
                <span>{c.display_name}</span>
                <span>{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-foreground/90">{c.body}</p>
              {c.mine && (
                <button
                  type="button"
                  className="mt-2 text-[10px] uppercase tracking-[2px] text-muted-foreground hover:text-red-400"
                  onClick={() => del.mutate(c.id)}
                  disabled={del.isPending}
                >
                  Delete
                </button>
              )}
            </div>
          ))}

          {canComment ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (body.trim().length < 1) return;
                add.mutate();
              }}
              className="space-y-2 rounded-sm border border-border/60 p-3"
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                maxLength={80}
                className="h-8 text-xs"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Talk back…"
                maxLength={1500}
                rows={3}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{body.length} / 1500</span>
                <Button type="submit" size="sm" disabled={add.isPending || body.trim().length < 1}>
                  Post reply
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">
              A subscription is required to reply.{" "}
              <Link to="/pricing" className="text-[var(--neon)] underline">See tiers</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SubmitSection({
  bundle, onSubmitted,
}: { bundle: LettersPageBundle; onSubmitted: () => void }) {
  const [subject, setSubject] = useState(bundle.myLetter?.subject ?? "");
  const [body, setBody] = useState(bundle.myLetter?.body ?? "");
  const [displayName, setDisplayName] = useState(bundle.myLetter?.display_name ?? "");
  const [location, setLocation] = useState(bundle.myLetter?.location ?? "");
  const submitFn = useServerFn(submitLetter);

  const mutate = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          issueId: bundle.issue.id,
          subject: subject.trim(),
          body: body.trim(),
          displayName: displayName.trim(),
          location: location.trim() || "",
        },
      }),
    onSuccess: () => { toast.success("Letter received. The editor will read it."); onSubmitted(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send"),
  });

  if (!bundle.hasActiveSub && !bundle.isAdmin) {
    return (
      <div className="card-rwc p-6 text-center">
        <div className="eyebrow">Submit a letter</div>
        <p className="mt-2 text-[var(--ink2)]">
          Only subscribers can send mail to the editor.
        </p>
        <Link to="/pricing" className="btn-cta mt-4 inline-flex">Choose a tier</Link>
      </div>
    );
  }

  const status = bundle.myLetter?.status;

  return (
    <div className="card-rwc p-6">
      <div className="eyebrow">Send a letter to the editor</div>
      {status && status !== "rejected" && (
        <p className="mt-2 text-xs uppercase tracking-[2px] text-muted-foreground">
          Your last submission: <span className="text-foreground">{status}</span>
          {status === "approved" && " — locked. Submit again to send a follow-up."}
        </p>
      )}
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (subject.trim().length < 2 || body.trim().length < 20 || displayName.trim().length < 1) {
            toast.error("Subject, name, and a longer body are required.");
            return;
          }
          mutate.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="ltr-name">Display name</Label>
            <Input id="ltr-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} required />
          </div>
          <div>
            <Label htmlFor="ltr-loc">Location / handle (optional)</Label>
            <Input id="ltr-loc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="e.g. Danvers, MA" />
          </div>
        </div>
        <div>
          <Label htmlFor="ltr-subject">Subject</Label>
          <Input id="ltr-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
        </div>
        <div>
          <Label htmlFor="ltr-body">Your letter</Label>
          <Textarea id="ltr-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} required />
          <div className="mt-1 text-right text-[10px] text-muted-foreground">{body.length} / 4000</div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutate.isPending}>
            {mutate.isPending ? "Sending…" : bundle.myLetter && status === "pending" ? "Update pending letter" : "Send letter"}
          </Button>
        </div>
      </form>
    </div>
  );
}
