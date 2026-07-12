import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  attestAdultCommunityAccess,
  getCommunityAttestation,
} from "@/lib/community-attestation.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/community/join")({
  head: () =>
    seo({
      title: "Join the community — 18+ | Astralnaut Studios",
      description:
        "Age-gated attestation required to join the Astralnaut Studios community and Discord. Adults 18+ only.",
      noindex: true,
    }),
  component: CommunityJoinPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-lg p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg p-6 text-sm">Not found.</div>
  ),
});

function CommunityJoinPage() {
  const router = useRouter();
  const fetchAttestation = useServerFn(getCommunityAttestation);
  const submitAttestation = useServerFn(attestAdultCommunityAccess);

  const { data, isLoading } = useQuery({
    queryKey: ["community-attestation"],
    queryFn: () => fetchAttestation(),
  });

  const [dob, setDob] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const existing = data?.attestation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirm) {
      setError("You must confirm you are 18 or older to continue.");
      return;
    }
    setBusy(true);
    try {
      const result = await submitAttestation({
        data: { date_of_birth: dob, attested: true },
      });
      setInviteUrl(result.inviteUrl);
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Join the community
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Astralnaut Studios community spaces — including our Discord — are
        restricted to adults <strong>18 years of age or older</strong>. Please
        verify your date of birth to continue. Submitting false information is
        a violation of our Terms of Service and may result in account
        termination.
      </p>

      {isLoading ? (
        <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
      ) : existing ? (
        <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6">
          <p className="text-sm">
            Your 18+ attestation is on file (recorded{" "}
            {new Date(existing.created_at).toLocaleDateString()}). You may
            proceed to the community.
          </p>
          <InviteBlock inviteUrl={inviteUrl} />
        </div>
      ) : inviteUrl !== null ? (
        <div className="mt-8 rounded-lg border border-border/60 bg-card/40 p-6">
          <p className="text-sm">Thanks — your attestation has been recorded.</p>
          <InviteBlock inviteUrl={inviteUrl} />
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
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-0.5"
              required
            />
            <span>
              I attest that I am <strong>18 years of age or older</strong>,
              that the date of birth I provided is accurate, and I understand
              that community and Discord access is restricted to adults 18+.
            </span>
          </label>
          {error && (
            <div className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Verifying…" : "Verify age & continue"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            We store your date of birth, IP address, and browser user-agent as
            a compliance record. See our{" "}
            <Link to="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}

function InviteBlock({ inviteUrl }: { inviteUrl: string | null }) {
  if (!inviteUrl) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        A Discord invite link will appear here once the community launches.
        Your attestation is saved — you won't need to re-verify.
      </p>
    );
  }
  return (
    <a
      href={inviteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
    >
      Open Discord invite →
    </a>
  );
}
