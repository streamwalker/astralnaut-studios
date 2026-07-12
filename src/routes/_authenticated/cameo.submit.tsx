import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  getMyCameoSubmissions,
  submitCameoRequest,
} from "@/lib/cameo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/cameo/submit")({
  head: () => ({
    meta: [
      { title: "Submit a cameo — 18+ | Astralnaut Studios" },
      {
        name: "description",
        content:
          "Age-gated cameo submission form for active Patron-tier subscribers. Adults 18+ only.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CameoSubmitPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg p-6 text-sm">Not found.</div>
  ),
});

function CameoSubmitPage() {
  const router = useRouter();
  const fetchMine = useServerFn(getMyCameoSubmissions);
  const submit = useServerFn(submitCameoRequest);

  const { data, isLoading } = useQuery({
    queryKey: ["my-cameo-submissions"],
    queryFn: () => fetchMine(),
  });

  const [dob, setDob] = useState("");
  const [fullLegalName, setFullLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submissions = data?.submissions ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ageConfirm) {
      setError("You must confirm you are 18 or older to continue.");
      return;
    }
    if (!releaseConfirm) {
      setError("You must sign the likeness release to continue.");
      return;
    }
    setBusy(true);
    try {
      await submit({
        data: {
          date_of_birth: dob,
          attested_18_plus: true,
          release_signed: true,
          full_legal_name: fullLegalName,
          display_name: displayName,
          likeness_notes: notes,
          reference_url: referenceUrl || undefined,
        },
      });
      setSuccess(true);
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Submit a cameo request
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cameos are drawn from active <strong>Patron-tier</strong> subscribers.
        Cameo submissions are restricted to adults{" "}
        <strong>18 years of age or older</strong>. Submitting false
        information is a violation of our Terms of Service and may result in
        account termination and removal from the cameo pool.
      </p>

      {success ? (
        <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6">
          <p className="text-sm">
            Thanks — your cameo submission has been recorded and is now{" "}
            <strong>pending review</strong>. You'll see it listed below and
            we'll reach out if selected.
          </p>
          <Link to="/perks" className="mt-4 inline-block text-xs underline">
            Back to perks
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="full_legal_name">Full legal name</Label>
            <Input
              id="full_legal_name"
              required
              minLength={2}
              maxLength={120}
              value={fullLegalName}
              onChange={(e) => setFullLegalName(e.target.value)}
              placeholder="As it appears on government-issued ID"
            />
          </div>

          <div>
            <Label htmlFor="display_name">Cameo display name</Label>
            <Input
              id="display_name"
              required
              minLength={2}
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How the character should be credited"
            />
          </div>

          <div>
            <Label htmlFor="notes">Likeness notes (optional)</Label>
            <Textarea
              id="notes"
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details you'd like the artist to reference"
            />
          </div>

          <div>
            <Label htmlFor="reference_url">
              Reference image URL (optional)
            </Label>
            <Input
              id="reference_url"
              type="url"
              maxLength={500}
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={ageConfirm}
              onChange={(e) => setAgeConfirm(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span>
              I attest that I am <strong>18 years of age or older</strong> and
              that the date of birth I provided is accurate.
            </span>
          </label>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={releaseConfirm}
              onChange={(e) => setReleaseConfirm(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span>
              I grant Streamwalkers Corporation a perpetual, worldwide,
              royalty-free license to use my likeness and the reference
              materials I have provided for the purpose of creating and
              distributing a cameo appearance in a published comic issue and
              related promotional materials.
            </span>
          </label>

          {error && (
            <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Submitting…" : "Submit cameo request"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            We store your date of birth, IP address, and browser user-agent
            as a compliance record. See our{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your submissions
        </h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No cameo submissions yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 rounded-lg border border-border/60">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{s.display_name}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
