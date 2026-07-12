import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL. Permanent redirect to /sweepstakes/rules.
export const Route = createFileRoute("/raffle/rules")({
  beforeLoad: () => {
    throw redirect({ to: "/sweepstakes/rules", replace: true });
  },
  component: () => null,
});
