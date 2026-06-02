-- Migration: 20260525000000_initial_schema
-- Creates the foundational tables: organizations, profiles, module_settings

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────────────────────
create type user_role as enum ('admin', 'coordinator', 'chef');
create type event_status as enum ('cotizado', 'contratado', 'en_requisicion', 'en_compras', 'completado', 'cancelado');
create type quote_status as enum ('borrador', 'enviada', 'aprobada', 'rechazada');
create type payment_status as enum ('pendiente', 'pagado', 'vencido');
create type requisition_status as enum ('generada', 'revisada', 'aprobada');
create type po_status as enum ('pendiente', 'enviada', 'recibida');

-- ── organizations ─────────────────────────────────────────────────────────────
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- Artesano's single organization seed
insert into organizations (name, slug)
values ('Artesano Banquetes', 'artesano');

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with business fields
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id),
  email       text not null,
  full_name   text,
  role        user_role not null default 'coordinator',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

-- Auto-create profile on new auth user
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_id_val uuid;
begin
  select id into org_id_val from organizations where slug = 'artesano' limit 1;

  insert into profiles (id, org_id, email, role)
  values (
    new.id,
    org_id_val,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'coordinator')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── module_settings ───────────────────────────────────────────────────────────
create table module_settings (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id),
  module_key  text not null,
  is_enabled  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(org_id, module_key)
);

create trigger module_settings_updated_at
  before update on module_settings
  for each row execute procedure handle_updated_at();

-- Seed default module settings for Artesano
insert into module_settings (org_id, module_key, is_enabled)
select
  o.id,
  m.module_key,
  m.is_enabled
from organizations o
cross join (values
  ('dashboard',       true),
  ('events',          true),
  ('quotes',          true),
  ('contracts',       true),
  ('payments',        true),
  ('requisitions',    true),
  ('purchase_orders', true),
  ('actual_purchases',true),
  ('profit',          true),
  ('staff',           true),
  ('calendar',        false),
  ('templates',       false),
  ('postmortem',      false),
  ('inventory',       false)
) as m(module_key, is_enabled)
where o.slug = 'artesano';

-- ── Row Level Security ────────────────────────────────────────────────────────

-- Organizations: read-only for authenticated users
alter table organizations enable row level security;

create policy "Authenticated users can read organizations"
  on organizations for select
  to authenticated
  using (true);

-- Profiles: users can read all profiles in their org, update only their own
alter table profiles enable row level security;

create policy "Users can read profiles in their org"
  on profiles for select
  to authenticated
  using (
    org_id = (select org_id from profiles where id = auth.uid())
  );

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

create policy "Service role can insert profiles"
  on profiles for insert
  to service_role
  with check (true);

-- Module settings: read for all org members, update for admins only
alter table module_settings enable row level security;

create policy "Users can read module settings in their org"
  on module_settings for select
  to authenticated
  using (
    org_id = (select org_id from profiles where id = auth.uid())
  );

create policy "Admins can update module settings"
  on module_settings for update
  to authenticated
  using (
    org_id = (select org_id from profiles where id = auth.uid())
    and (select role from profiles where id = auth.uid()) = 'admin'
  );
