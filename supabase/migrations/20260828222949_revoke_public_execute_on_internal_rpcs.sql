-- Follow-up to revoke_unnecessary_rpc_exposure. Revoking EXECUTE from anon and
-- authenticated had no effect on most of these because Postgres grants EXECUTE
-- to PUBLIC by default, and the PUBLIC grant (the "=X/postgres" ACL entry)
-- shadows any role-level revoke. The real fix is to revoke PUBLIC.
--
-- Safe because postgres and service_role each hold an explicit grant on every
-- function below, and `authenticated` holds an explicit grant on the two
-- archive functions, so only anonymous access is actually removed.

-- Internal / service-role-only. After this, only postgres and service_role remain.
revoke execute on function public.handle_new_user_profile() from public;
revoke execute on function public.detect_storage_access_bursts(integer, integer) from public;
revoke execute on function public.get_active_subscriber_count() from public;

-- Signed-in only. `authenticated` keeps its explicit grant; anon loses access.
revoke execute on function public.archive_redeem(uuid) from public;
revoke execute on function public.archive_subscription_months_used(uuid) from public;
