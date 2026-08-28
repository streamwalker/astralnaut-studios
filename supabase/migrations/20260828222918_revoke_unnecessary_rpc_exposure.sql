-- Narrow the PostgREST RPC surface. Every function below is SECURITY DEFINER and
-- was reachable at /rest/v1/rpc/<name> by any unauthenticated caller, inherited
-- from the Lovable-owned project. Each revocation is justified by an actual audit
-- of call sites (pg_policies expressions, pg_proc bodies, and src/).
--
-- Deliberately NOT touched, because RLS policy expressions are evaluated as the
-- calling role and would fail with "permission denied" if EXECUTE were revoked:
--   has_role                    (referenced by 79 policies)
--   issue_is_concluded          (3 policies)
--   has_any_active_subscription (2 policies)

-- Trigger function only. Fires on auth.users insert; trigger execution does not
-- consult the invoking role's EXECUTE privilege, so this is a no-op for the
-- trigger and removes a meaningless RPC endpoint.
revoke execute on function public.handle_new_user_profile() from anon, authenticated;

-- Reached only through supabaseAdmin (service role) in src/lib/storage-access.server.ts.
-- Exposing an abuse-detection sweep to anonymous callers is a free DoS lever.
revoke execute on function public.detect_storage_access_bursts(integer, integer) from anon, authenticated;

-- Reached only through supabaseAdmin in src/lib/site-stats.functions.ts.
revoke execute on function public.get_active_subscriber_count() from anon, authenticated;

-- No call sites anywhere: not in any policy, not in any function body, not in src/.
revoke execute on function public.is_user_suspended(uuid) from anon, authenticated;

-- The following are reached only via server functions guarded by the
-- requireSupabaseAuth middleware, so the caller is always `authenticated`.
-- Anonymous access is removed; signed-in access is preserved.
--
-- has_active_subscription takes an arbitrary user_uuid, so anon EXECUTE let
-- anyone probe the subscription state of any user id they could guess.
revoke execute on function public.has_active_subscription(uuid, text) from anon;
revoke execute on function public.archive_redeem(uuid) from anon;
revoke execute on function public.archive_subscription_months_used(uuid) from anon;

-- Document the intentional deny-all on the DSAR token table so the
-- rls_enabled_no_policy lint is explainable rather than mysterious.
comment on table public.dsar_verification_tokens is
  'RLS enabled with no policies on purpose: deny-all to anon and authenticated. '
  'These are single-use identity-verification tokens for data-subject access '
  'requests and are only ever read or written by the service role.';
