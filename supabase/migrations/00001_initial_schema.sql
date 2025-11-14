-- HabitLine Initial Schema Migration
-- All tables, functions, and objects prefixed with 'habit_'

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ==========================================
-- Users Table
-- ==========================================
create table if not exists habit_users (
  id uuid primary key default gen_random_uuid(),
  line_id text unique not null,
  name text,
  plan text check (plan in ('free','standard','premium','team')) default 'free',
  character_type text check (character_type in ('angel','coach','friend','analyst')) default 'angel',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table habit_users is 'User accounts linked to LINE';
comment on column habit_users.line_id is 'LINE user identifier';
comment on column habit_users.character_type is 'AI personality type for messages';

-- ==========================================
-- Habits Table
-- ==========================================
create table if not exists habit_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references habit_users(id) on delete cascade,
  title text not null,
  reminder_time time,
  is_active boolean default true,
  streak_count int default 0 check (streak_count >= 0),
  last_completed_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table habit_habits is 'User-defined habits to track';
comment on column habit_habits.streak_count is 'Consecutive days of completion';
comment on column habit_habits.last_completed_date is 'Most recent completion date for streak calculation';

-- ==========================================
-- Logs Table
-- ==========================================
create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habit_habits(id) on delete cascade,
  date date not null,
  status boolean default false,
  note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (habit_id, date)
);

comment on table habit_logs is 'Daily habit execution logs';
comment on column habit_logs.status is 'true = completed, false = skipped/pending';

-- ==========================================
-- AI Feedback Table
-- ==========================================
create table if not exists habit_ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references habit_users(id) on delete cascade,
  message text not null,
  sentiment float check (sentiment between -1 and 1),
  feedback_date date not null,
  created_at timestamp with time zone default now()
);

comment on table habit_ai_feedback is 'AI-generated feedback and encouragement';
comment on column habit_ai_feedback.sentiment is 'Sentiment score: -1 (negative) to 1 (positive)';

-- ==========================================
-- Schedules Table
-- ==========================================
create table if not exists habit_schedules (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habit_habits(id) on delete cascade,
  notify_time time not null,
  days text[] check (array_length(days, 1) > 0),
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table habit_schedules is 'Custom reminder schedules for habits';
comment on column habit_schedules.days is 'Array of day abbreviations: Mon, Tue, Wed, etc.';

-- ==========================================
-- Teams Table
-- ==========================================
create table if not exists habit_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references habit_users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table habit_teams is 'Team/organization accounts for B2B';

-- ==========================================
-- Team Members Table
-- ==========================================
create table if not exists habit_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references habit_teams(id) on delete cascade,
  user_id uuid not null references habit_users(id) on delete cascade,
  role text check (role in ('owner','admin','member')) default 'member',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (team_id, user_id)
);

comment on table habit_team_members is 'Team membership and roles';

-- ==========================================
-- Retry Queue Table (for failed operations)
-- ==========================================
create table if not exists habit_retry_queue (
  id uuid primary key default gen_random_uuid(),
  operation_type text not null,
  payload jsonb not null,
  retry_count int default 0,
  max_retries int default 3,
  next_retry_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table habit_retry_queue is 'Queue for retry failed operations (e.g., LINE notifications)';

-- ==========================================
-- Indexes
-- ==========================================
create index habit_users_line_id_idx on habit_users(line_id);
create index habit_habits_user_id_idx on habit_habits(user_id);
create index habit_habits_is_active_idx on habit_habits(is_active) where is_active = true;
create index habit_logs_habit_id_date_idx on habit_logs(habit_id, date desc);
create index habit_logs_date_idx on habit_logs(date);
create index habit_ai_feedback_user_id_date_idx on habit_ai_feedback(user_id, feedback_date desc);
create index habit_schedules_habit_id_idx on habit_schedules(habit_id);
create index habit_team_members_team_id_idx on habit_team_members(team_id);
create index habit_team_members_user_id_idx on habit_team_members(user_id);
create index habit_retry_queue_next_retry_idx on habit_retry_queue(next_retry_at) where retry_count < max_retries;

-- ==========================================
-- Functions: Update Timestamp
-- ==========================================
create or replace function habit_update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function habit_update_updated_at is 'Automatically update updated_at timestamp';

-- ==========================================
-- Functions: Update Streak
-- ==========================================
create or replace function habit_update_streak_fn()
returns trigger
language plpgsql
as $$
declare
  v_last_date date;
  v_yesterday date;
begin
  -- Only process if status is true (completed)
  if new.status = true then
    select last_completed_date into v_last_date
    from habit_habits
    where id = new.habit_id;

    v_yesterday := new.date - interval '1 day';

    -- If last completed was yesterday, increment streak
    if v_last_date = v_yesterday::date then
      update habit_habits
      set
        streak_count = streak_count + 1,
        last_completed_date = new.date
      where id = new.habit_id;
    -- If this is the first completion or streak was broken, reset to 1
    elsif v_last_date is null or v_last_date < v_yesterday::date then
      update habit_habits
      set
        streak_count = 1,
        last_completed_date = new.date
      where id = new.habit_id;
    -- If same day update (should not happen due to unique constraint)
    elsif v_last_date = new.date then
      update habit_habits
      set last_completed_date = new.date
      where id = new.habit_id;
    end if;
  end if;

  return new;
end;
$$;

comment on function habit_update_streak_fn is 'Update habit streak count based on consecutive completions';

-- ==========================================
-- Triggers: Updated At
-- ==========================================
create trigger habit_users_updated_at
  before update on habit_users
  for each row
  execute function habit_update_updated_at();

create trigger habit_habits_updated_at
  before update on habit_habits
  for each row
  execute function habit_update_updated_at();

create trigger habit_logs_updated_at
  before update on habit_logs
  for each row
  execute function habit_update_updated_at();

create trigger habit_schedules_updated_at
  before update on habit_schedules
  for each row
  execute function habit_update_updated_at();

create trigger habit_teams_updated_at
  before update on habit_teams
  for each row
  execute function habit_update_updated_at();

create trigger habit_team_members_updated_at
  before update on habit_team_members
  for each row
  execute function habit_update_updated_at();

-- ==========================================
-- Triggers: Streak Update
-- ==========================================
create trigger habit_update_streak_trg
  after insert or update on habit_logs
  for each row
  execute function habit_update_streak_fn();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS
alter table habit_users enable row level security;
alter table habit_habits enable row level security;
alter table habit_logs enable row level security;
alter table habit_ai_feedback enable row level security;
alter table habit_schedules enable row level security;
alter table habit_teams enable row level security;
alter table habit_team_members enable row level security;

-- Users policies
create policy habit_users_select_self on habit_users
  for select
  using (auth.uid() = id);

create policy habit_users_update_self on habit_users
  for update
  using (auth.uid() = id);

-- Habits policies
create policy habit_habits_select_owner on habit_habits
  for select
  using (
    exists (
      select 1 from habit_users
      where habit_users.id = habit_habits.user_id
      and habit_users.id = auth.uid()
    )
  );

create policy habit_habits_insert_owner on habit_habits
  for insert
  with check (
    exists (
      select 1 from habit_users
      where habit_users.id = habit_habits.user_id
      and habit_users.id = auth.uid()
    )
  );

create policy habit_habits_update_owner on habit_habits
  for update
  using (
    exists (
      select 1 from habit_users
      where habit_users.id = habit_habits.user_id
      and habit_users.id = auth.uid()
    )
  );

create policy habit_habits_delete_owner on habit_habits
  for delete
  using (
    exists (
      select 1 from habit_users
      where habit_users.id = habit_habits.user_id
      and habit_users.id = auth.uid()
    )
  );

-- Logs policies
create policy habit_logs_select_owner on habit_logs
  for select
  using (
    exists (
      select 1 from habit_habits
      join habit_users on habit_users.id = habit_habits.user_id
      where habit_habits.id = habit_logs.habit_id
      and habit_users.id = auth.uid()
    )
  );

create policy habit_logs_insert_owner on habit_logs
  for insert
  with check (
    exists (
      select 1 from habit_habits
      join habit_users on habit_users.id = habit_habits.user_id
      where habit_habits.id = habit_logs.habit_id
      and habit_users.id = auth.uid()
    )
  );

create policy habit_logs_update_owner on habit_logs
  for update
  using (
    exists (
      select 1 from habit_habits
      join habit_users on habit_users.id = habit_habits.user_id
      where habit_habits.id = habit_logs.habit_id
      and habit_users.id = auth.uid()
    )
  );

-- AI Feedback policies
create policy habit_ai_feedback_select_owner on habit_ai_feedback
  for select
  using (user_id = auth.uid());

-- Schedules policies
create policy habit_schedules_all_owner on habit_schedules
  for all
  using (
    exists (
      select 1 from habit_habits
      join habit_users on habit_users.id = habit_habits.user_id
      where habit_habits.id = habit_schedules.habit_id
      and habit_users.id = auth.uid()
    )
  );

-- Teams policies
create policy habit_teams_select_member on habit_teams
  for select
  using (
    exists (
      select 1 from habit_team_members
      where habit_team_members.team_id = habit_teams.id
      and habit_team_members.user_id = auth.uid()
    )
  );

-- Team members policies
create policy habit_team_members_select_member on habit_team_members
  for select
  using (
    team_id in (
      select team_id from habit_team_members
      where user_id = auth.uid()
    )
  );
