-- Migration: 20260525140000_phase4_requisitions
-- Requisitions, requisition items, purchase orders, purchase order items

-- ── requisitions ───────────────────────────────────────────────────────────────

create table requisitions (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  event_id    uuid not null unique references events(id) on delete cascade,
  status      text not null default 'generada',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger requisitions_updated_at before update on requisitions
  for each row execute procedure handle_updated_at();

create index requisitions_org_id_idx   on requisitions(org_id);
create index requisitions_event_id_idx on requisitions(event_id);

alter table requisitions enable row level security;

create policy "org members can manage requisitions"
  on requisitions for all
  using  (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

-- ── requisition_items ──────────────────────────────────────────────────────────

create table requisition_items (
  id               uuid primary key default uuid_generate_v4(),
  requisition_id   uuid not null references requisitions(id) on delete cascade,
  ingredient_id    uuid not null references ingredients(id) on delete restrict,
  quantity         numeric(10,3) not null,
  unit             text not null,
  unit_cost        numeric(12,2) not null default 0,
  total_cost       numeric(12,2) not null default 0,
  notes            text
);

create index requisition_items_requisition_id_idx on requisition_items(requisition_id);

alter table requisition_items enable row level security;

create policy "org members can manage requisition items"
  on requisition_items for all
  using (
    requisition_id in (
      select id from requisitions
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  )
  with check (
    requisition_id in (
      select id from requisitions
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

-- ── purchase_orders ────────────────────────────────────────────────────────────

create table purchase_orders (
  id               uuid primary key default uuid_generate_v4(),
  org_id           uuid not null references organizations(id) on delete cascade,
  requisition_id   uuid not null references requisitions(id) on delete cascade,
  event_id         uuid not null references events(id) on delete cascade,
  supplier_id      uuid references suppliers(id) on delete set null,
  status           text not null default 'pendiente',
  buy_by_date      date,
  received_at      date,
  subtotal         numeric(12,2) not null default 0,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger purchase_orders_updated_at before update on purchase_orders
  for each row execute procedure handle_updated_at();

create index purchase_orders_org_id_idx        on purchase_orders(org_id);
create index purchase_orders_event_id_idx      on purchase_orders(event_id);
create index purchase_orders_requisition_id_idx on purchase_orders(requisition_id);
create index purchase_orders_status_idx        on purchase_orders(status);

alter table purchase_orders enable row level security;

create policy "org members can manage purchase orders"
  on purchase_orders for all
  using  (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

-- ── purchase_order_items ───────────────────────────────────────────────────────

create table purchase_order_items (
  id                   uuid primary key default uuid_generate_v4(),
  purchase_order_id    uuid not null references purchase_orders(id) on delete cascade,
  ingredient_id        uuid not null references ingredients(id) on delete restrict,
  quantity             numeric(10,3) not null,
  unit                 text not null,
  unit_cost            numeric(12,2) not null default 0,
  total_cost           numeric(12,2) not null default 0,
  received_quantity    numeric(10,3),
  notes                text
);

create index purchase_order_items_po_id_idx on purchase_order_items(purchase_order_id);

alter table purchase_order_items enable row level security;

create policy "org members can manage purchase order items"
  on purchase_order_items for all
  using (
    purchase_order_id in (
      select id from purchase_orders
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  )
  with check (
    purchase_order_id in (
      select id from purchase_orders
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );
