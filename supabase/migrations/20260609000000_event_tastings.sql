-- Migration: 20260609000000_event_tastings
-- Degustaciones por evento (pruebas de menú a clientes potenciales antes de cerrar).
-- Tienen un costo real (insumos + personal de la prueba) que impacta la utilidad del
-- evento, por lo que se registran como un gasto más, igual que las comisiones.
-- Multi-tenant (org_id) + RLS org-scoped, como el resto del esquema.

create table event_tastings (
  id           uuid primary key default uuid_generate_v4(),
  org_id       uuid not null references organizations(id) on delete cascade,
  event_id     uuid not null references events(id) on delete cascade,
  tasting_date date not null default current_date,   -- fecha de la degustación
  attendees    integer not null default 0,           -- personas que asistieron a probar
  cost         numeric(12,2) not null default 0,      -- costo de la degustación (insumos + personal)
  status       text not null default 'programada' check (status in ('programada', 'realizada', 'cancelada')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index event_tastings_org_id_idx on event_tastings(org_id);
create index event_tastings_event_id_idx on event_tastings(event_id);

create trigger event_tastings_updated_at
  before update on event_tastings
  for each row execute procedure handle_updated_at();

alter table event_tastings enable row level security;

create policy "Users can read their org tastings"
  on event_tastings for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert tastings for their org"
  on event_tastings for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org tastings"
  on event_tastings for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org tastings"
  on event_tastings for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
