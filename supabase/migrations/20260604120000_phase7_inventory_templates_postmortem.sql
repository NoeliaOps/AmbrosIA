-- Migration: 20260604120000_phase7_inventory_templates_postmortem
-- Backend para los tres módulos opcionales: Inventario, Plantillas y Post-mortem.
-- Sigue el patrón multi-tenant del proyecto: cada tabla con org_id y RLS
-- org-scoped vía (select org_id from profiles where id = auth.uid()).

-- ════════════════════════════════════════════════════════════════════════════
-- 1. INVENTARIO — existencias por ingrediente
-- ════════════════════════════════════════════════════════════════════════════
create table inventory_items (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity      numeric(12,3) not null default 0,
  min_quantity  numeric(12,3) not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(org_id, ingredient_id)
);

create index inventory_items_org_id_idx on inventory_items(org_id);
create index inventory_items_ingredient_id_idx on inventory_items(ingredient_id);

create trigger inventory_items_updated_at
  before update on inventory_items
  for each row execute procedure handle_updated_at();

alter table inventory_items enable row level security;

create policy "Users can read their org inventory"
  on inventory_items for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert inventory for their org"
  on inventory_items for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org inventory"
  on inventory_items for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org inventory"
  on inventory_items for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ════════════════════════════════════════════════════════════════════════════
-- 2. PLANTILLAS — paquetes de cotización reutilizables
-- ════════════════════════════════════════════════════════════════════════════
create table quote_templates (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  name            text not null,
  event_type      text,
  description     text,
  price_per_guest numeric(12,2) not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index quote_templates_org_id_idx on quote_templates(org_id);

create trigger quote_templates_updated_at
  before update on quote_templates
  for each row execute procedure handle_updated_at();

create table quote_template_items (
  id          uuid primary key default uuid_generate_v4(),
  template_id uuid not null references quote_templates(id) on delete cascade,
  description text not null,
  quantity    numeric(12,2) not null default 1,
  unit_cost   numeric(12,2) not null default 0,
  sort_order  integer not null default 0
);

create index quote_template_items_template_id_idx on quote_template_items(template_id);

alter table quote_templates enable row level security;

create policy "Users can read their org templates"
  on quote_templates for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert templates for their org"
  on quote_templates for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org templates"
  on quote_templates for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org templates"
  on quote_templates for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- quote_template_items: sin org_id, scoped vía quote_templates.org_id
alter table quote_template_items enable row level security;

create policy "Users can read template items for their org templates"
  on quote_template_items for select to authenticated
  using (template_id in (select id from quote_templates where org_id = (select org_id from profiles where id = auth.uid())));
create policy "Users can insert template items for their org templates"
  on quote_template_items for insert to authenticated
  with check (template_id in (select id from quote_templates where org_id = (select org_id from profiles where id = auth.uid())));
create policy "Users can update template items for their org templates"
  on quote_template_items for update to authenticated
  using (template_id in (select id from quote_templates where org_id = (select org_id from profiles where id = auth.uid())));
create policy "Users can delete template items for their org templates"
  on quote_template_items for delete to authenticated
  using (template_id in (select id from quote_templates where org_id = (select org_id from profiles where id = auth.uid())));

-- ════════════════════════════════════════════════════════════════════════════
-- 3. POST-MORTEM — retrospectiva por evento (una por evento)
-- ════════════════════════════════════════════════════════════════════════════
create table event_postmortems (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  rating      integer check (rating between 1 and 5),
  went_well   text,
  to_improve  text,
  lessons     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(event_id)
);

create index event_postmortems_org_id_idx on event_postmortems(org_id);
create index event_postmortems_event_id_idx on event_postmortems(event_id);

create trigger event_postmortems_updated_at
  before update on event_postmortems
  for each row execute procedure handle_updated_at();

alter table event_postmortems enable row level security;

create policy "Users can read their org postmortems"
  on event_postmortems for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert postmortems for their org"
  on event_postmortems for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org postmortems"
  on event_postmortems for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org postmortems"
  on event_postmortems for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
