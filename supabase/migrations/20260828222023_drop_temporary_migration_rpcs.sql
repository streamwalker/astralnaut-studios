-- Tear down the one-time migration pipe. These were SECURITY DEFINER functions
-- granted to anon and guarded only by a shared secret; they must not survive the
-- move off Lovable's Supabase org.
drop function if exists public.mig_exec(text, text);
drop function if exists public.mig_query(text, text);
drop function if exists public.mig_load(text, text, jsonb);
drop schema if exists migration_tmp cascade;
