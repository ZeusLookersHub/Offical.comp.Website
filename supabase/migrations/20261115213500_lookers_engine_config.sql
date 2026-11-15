-- Public, non-secret engine settings (e.g. which pinned blueprints file to load and its SHA-256).
create table public.lookers_engine_config (
  key text primary key check (char_length(key) between 1 and 64),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.lookers_engine_config enable row level security;
create policy engine_config_read on public.lookers_engine_config for select to anon, authenticated using (true);
revoke all on public.lookers_engine_config from anon, authenticated;
grant select on public.lookers_engine_config to anon, authenticated;
-- Seeded with the pin current at creation; updated by scripts/pin-engine-blueprints (SQL) on each blueprint release.
