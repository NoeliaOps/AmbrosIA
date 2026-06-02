-- Migration: 20260525150000_phase5_actuals
-- Actual purchases and event indirect cost allocations

-- ── actual_purchases ───────────────────────────────────────────────────────────

create table actual_purchases (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  event_id      uuid not null references events(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity      numeric(10,3) not null,
  unit          text not null,
  unit_cost     numeric(12,2) not null,
  total_cost    numeric(12,2) not null,
  purchased_at  date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger actual_purchases_updated_at before update on actual_purchases
  for each row execute procedure handle_updated_at();

create index actual_purchases_org_id_idx      on actual_purchases(org_id);
create index actual_purchases_event_id_idx    on actual_purchases(event_id);
create index actual_purchases_ingredient_id_idx on actual_purchases(ingredient_id);

alter table actual_purchases enable row level security;

create policy "org members can manage actual purchases"
  on actual_purchases for all
  using  (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

-- ── event_indirect_costs ───────────────────────────────────────────────────────

create table event_indirect_costs (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  category_id uuid not null references indirect_cost_categories(id) on delete restrict,
  amount      numeric(12,2) not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger event_indirect_costs_updated_at before update on event_indirect_costs
  for each row execute procedure handle_updated_at();

create index event_indirect_costs_event_id_idx on event_indirect_costs(event_id);
create index event_indirect_costs_org_id_idx   on event_indirect_costs(org_id);

alter table event_indirect_costs enable row level security;

create policy "org members can manage event indirect costs"
  on event_indirect_costs for all
  using  (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));
