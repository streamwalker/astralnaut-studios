import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL. Permanent redirect to /sweepstakes/free-entry.
export const Route = createFileRoute("/raffle/free-entry")({
  beforeLoad: () => {
    throw redirect({ to: "/sweepstakes/free-entry", replace: true });
  },
  component: () => null,
});
