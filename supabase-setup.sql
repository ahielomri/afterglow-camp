-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table if not exists kv_store (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table kv_store enable row level security;

-- Needed because "Automatically expose new tables" was left off during project
-- creation (Supabase's own recommended default) - this grants the Data API
-- roles access to the table; the RLS policy below still controls who can do what.
grant select, insert, update, delete on kv_store to anon, authenticated;

-- The app has its own name+password login built in (not Supabase Auth),
-- so we allow the public "anon" key to read/write this table freely,
-- matching the trust model already used throughout the app.
create policy "Allow all access to kv_store"
on kv_store
for all
using (true)
with check (true);
