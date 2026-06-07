-- Migration: 20260605000000_event_commissions
-- Comisiones por evento (a vendedores, planners o lugares de eventos).
-- Multi-tenant (org_id) + RLS org-scoped, como el resto del esquema.

create table event_commissions (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  beneficiary text not null,                       -- persona o lugar que recibe la comisión
  role        text,                                -- Ventas / Planner / Lugar / Otro
  basis       text not null default 'fixed' check (basis in ('fixed', 'percentage')),
  percentage  numeric(5,2),                        -- si basis = percentage (sobre total cotización)
  amount      numeric(12,2) not null default 0,    -- monto de la comisión (fijo o calculado)
  status      text not null default 'pendiente' check (status in ('pendiente', 'pagada')),
  paid_at     date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index event_commissions_org_id_idx on event_commissions(org_id);
create index event_commissions_event_id_idx on event_commissions(event_id);

create trigger event_commissions_updated_at
  before update on event_commissions
  for each row execute procedure handle_updated_at();

alter table event_commissions enable row level security;

create policy "Users can read their org commissions"
  on event_commissions for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert commissions for their org"
  on event_commissions for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org commissions"
  on event_commissions for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org commissions"
  on event_commissions for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
