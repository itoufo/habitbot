-- Setup pg_cron for scheduled reminders

-- Enable pg_cron extension (may already be enabled in production)
create extension if not exists pg_cron;

-- Grant usage on schema cron to postgres role (if it doesn't already have it)
do $$
begin
  grant usage on schema cron to postgres;
exception
  when duplicate_object then
    null; -- Ignore if already granted
end $$;

-- Remove existing cron job if it exists
do $$
begin
  perform cron.unschedule('send-habit-reminders');
exception
  when undefined_table or undefined_object then
    null; -- Ignore if cron.job doesn't exist yet
end $$;

-- Create a function to call the Edge Function for reminders
-- This will be triggered every minute
select cron.schedule(
  'send-habit-reminders',
  '* * * * *', -- Every minute
  $$
  select
    net.http_post(
      url := 'http://kong:8000/functions/v1/habit_send_reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
