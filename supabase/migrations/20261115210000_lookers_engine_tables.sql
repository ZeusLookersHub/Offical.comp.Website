-- Lookers AI Mission Engine: sessions, results and anonymous learning events.
-- Every row belongs to the (anonymous) auth user who created it; no personal data in events.

create table public.lookers_engine_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blueprint_id text not null check (char_length(blueprint_id) between 1 and 64),
  blueprint_version integer not null check (blueprint_version > 0),
  lang text not null check (lang in ('ar', 'en')),
  phase text not null check (phase in ('intake', 'questions', 'brief', 'confirmed')),
  idea text check (char_length(idea) <= 4000),
  state jsonb not null default '{}'::jsonb check (pg_column_size(state) <= 60000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lookers_engine_sessions_owner_idx on public.lookers_engine_sessions (owner_id, updated_at desc);

create table public.lookers_engine_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.lookers_engine_sessions (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blueprint_id text not null check (char_length(blueprint_id) between 1 and 64),
  blueprint_version integer not null,
  output jsonb not null check (pg_column_size(output) <= 120000),
  report jsonb not null,
  gates_passed integer not null,
  gates_total integer not null,
  attempts smallint not null check (attempts between 1 and 3),
  model text not null,
  created_at timestamptz not null default now()
);
create index lookers_engine_results_owner_idx on public.lookers_engine_results (owner_id, created_at desc);
create index lookers_engine_results_session_idx on public.lookers_engine_results (session_id);
create index lookers_engine_results_blueprint_idx on public.lookers_engine_results (blueprint_id, created_at desc);

create table public.lookers_engine_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid references public.lookers_engine_sessions (id) on delete cascade,
  blueprint_id text not null check (char_length(blueprint_id) between 1 and 64),
  event text not null check (event in (
    'intake', 'question_shown', 'answered', 'skipped', 'suggestion_used',
    'brief_shown', 'brief_edited', 'brief_confirmed', 'composed', 'copied', 'tool_opened', 'feedback'
  )),
  slot text check (char_length(slot) <= 64),
  meta jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 2000),
  created_at timestamptz not null default now()
);
create index lookers_engine_events_blueprint_idx on public.lookers_engine_events (blueprint_id, event, created_at desc);
create index lookers_engine_events_owner_idx on public.lookers_engine_events (owner_id);
create index lookers_engine_events_session_idx on public.lookers_engine_events (session_id);

alter table public.lookers_engine_sessions enable row level security;
alter table public.lookers_engine_results enable row level security;
alter table public.lookers_engine_events enable row level security;

-- Sessions: owners read, create and update their own.
create policy own_sessions_select on public.lookers_engine_sessions for select to authenticated using ((select auth.uid()) = owner_id);
create policy own_sessions_insert on public.lookers_engine_sessions for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy own_sessions_update on public.lookers_engine_sessions for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Results: written by the engine function with the user's token; owners read their own. No updates.
create policy own_results_select on public.lookers_engine_results for select to authenticated using ((select auth.uid()) = owner_id);
create policy own_results_insert on public.lookers_engine_results for insert to authenticated with check ((select auth.uid()) = owner_id);

-- Events: append-only from the owner; nobody reads them through the API (analysis runs server-side).
create policy own_events_insert on public.lookers_engine_events for insert to authenticated with check ((select auth.uid()) = owner_id);

revoke all on public.lookers_engine_sessions, public.lookers_engine_results, public.lookers_engine_events from anon;
grant select, insert, update on public.lookers_engine_sessions to authenticated;
grant select, insert on public.lookers_engine_results to authenticated;
grant insert on public.lookers_engine_events to authenticated;
