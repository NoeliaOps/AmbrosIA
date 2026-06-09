-- Migration: 20260607010000_warehouses_inventory
-- Almacenes (multi) + existencias por almacén + kardex de movimientos.
-- Conecta compras (recepción de OC = entrada) y eventos (consumo = salida).

-- ── Almacenes ─────────────────────────────────────────────────────────────────
create table warehouses (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  location   text,
  is_default boolean not null default false,
  is_active  boolean not null default true,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index warehouses_org_id_idx on warehouses(org_id);
create unique index warehouses_one_default on warehouses(org_id) where is_default;
create trigger warehouses_updated_at before update on warehouses for each row execute procedure handle_updated_at();

alter table warehouses enable row level security;
create policy "Users can read their org warehouses" on warehouses for select to authenticated using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert warehouses for their org" on warehouses for insert to authenticated with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org warehouses" on warehouses for update to authenticated using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org warehouses" on warehouses for delete to authenticated using (org_id = (select org_id from profiles where id = auth.uid()));

-- Almacén principal por organización.
insert into warehouses (org_id, name, is_default, is_active)
select id, 'Almacén principal', true, true from organizations;

-- ── Existencias por almacén (extiende inventory_items con warehouse_id) ────────
alter table inventory_items add column warehouse_id uuid references warehouses(id) on delete cascade;
update inventory_items ii
   set warehouse_id = (select w.id from warehouses w where w.org_id = ii.org_id and w.is_default limit 1);
alter table inventory_items alter column warehouse_id set not null;
-- Cambiar unicidad: un insumo puede existir en varios almacenes, único por (almacén, insumo).
alter table inventory_items drop constraint if exists inventory_items_org_id_ingredient_id_key;
alter table inventory_items add constraint inventory_items_wh_ing_key unique (warehouse_id, ingredient_id);
create index inventory_items_warehouse_id_idx on inventory_items(warehouse_id);

-- ── Kardex de movimientos ─────────────────────────────────────────────────────
-- quantity: cantidad en UNIDAD BASE con signo (+ entrada, − salida).
create table inventory_movements (
  id                uuid primary key default uuid_generate_v4(),
  org_id            uuid not null references organizations(id) on delete cascade,
  warehouse_id      uuid not null references warehouses(id) on delete cascade,
  ingredient_id     uuid not null references ingredients(id) on delete cascade,
  type              text not null check (type in ('entrada','salida','ajuste','traspaso_entrada','traspaso_salida')),
  quantity          numeric(14,3) not null,
  unit_cost         numeric(12,2),
  reference         text,
  event_id          uuid references events(id) on delete set null,
  purchase_order_id uuid references purchase_orders(id) on delete set null,
  transfer_group    uuid,
  notes             text,
  created_at        timestamptz not null default now()
);
create index inventory_movements_org_id_idx on inventory_movements(org_id);
create index inventory_movements_warehouse_id_idx on inventory_movements(warehouse_id);
create index inventory_movements_ingredient_id_idx on inventory_movements(ingredient_id);
create index inventory_movements_created_at_idx on inventory_movements(created_at desc);

alter table inventory_movements enable row level security;
create policy "Users can read their org movements" on inventory_movements for select to authenticated using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert movements for their org" on inventory_movements for insert to authenticated with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org movements" on inventory_movements for delete to authenticated using (org_id = (select org_id from profiles where id = auth.uid()));
