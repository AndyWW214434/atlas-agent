-- Atlas cloud schema. Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> Run).
--
-- Security model: the browser never talks to these tables. Only the Atlas server does, with the project's
-- *secret* key (which bypasses Row Level Security). RLS is switched ON with no policies, so the publishable
-- key that the browser uses for sign-in cannot read or write anything here.

-- Per-user settings and small records (projects, automations, plugins, credits, library index, saved logins).
-- owner is the user's id, or 'global' for app-wide rows such as the daily spend counter.
create table if not exists public.atlas_kv (
  owner      text not null,
  name       text not null,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner, name)
);

-- Tasks: the conversation, the UI event log and the plan, stored as JSON.
create table if not exists public.atlas_tasks (
  id         text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default 'New task',
  status     text not null default 'idle',
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists atlas_tasks_user on public.atlas_tasks (user_id, updated_at desc);

alter table public.atlas_kv    enable row level security;
alter table public.atlas_tasks enable row level security;
-- (No policies on purpose: anon and authenticated roles get no access.)

-- Private file storage: Library uploads, task output files and browser screenshots, under <user_id>/...
insert into storage.buckets (id, name, public)
values ('atlas-files', 'atlas-files', false)
on conflict (id) do nothing;
