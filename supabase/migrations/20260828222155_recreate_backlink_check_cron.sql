-- The source project ran a daily backlink check via pg_cron + pg_net. It lived
-- only in the Lovable dashboard, not in any migration, so it is recreated here
-- as code and repointed from the *.lovable.app preview host to production.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'check-backlinks-daily',
  '0 6 * * *',
  $job$
  select net.http_post(
    url := 'https://astralnautstudios.com/api/public/hooks/check-backlinks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_G3clskZ5uiIOyIye5wMIow_E5tjujLu'
    ),
    body := '{}'::jsonb
  );
  $job$
);
