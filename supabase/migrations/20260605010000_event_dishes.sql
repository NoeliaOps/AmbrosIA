-- Migration: 20260605010000_event_dishes
-- Menú del evento: los platillos (con porciones) que se servirán en cada evento.
-- Es la fuente de verdad operativa de la que parte la requisición y la orden de
-- compra. Multi-tenant (org_id) + RLS org-scoped.

create table event_dishes (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  event_id   uuid not null references events(id) on delete cascade,
  dish_id    uuid not null references dishes(id) on delete restrict,
  servings   integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(event_id, dish_id)
);

create index event_dishes_org_id_idx on event_dishes(org_id);
create index event_dishes_event_id_idx on event_dishes(event_id);

alter table event_dishes enable row level security;

create policy "Users can read their org event dishes"
  on event_dishes for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert event dishes for their org"
  on event_dishes for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org event dishes"
  on event_dishes for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org event dishes"
  on event_dishes for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
