-- Migration: 20260607000000_ingredient_purchase_units
-- Conversión de unidades: un insumo se USA en recetas en su "unidad base"
-- (ingredients.unit) pero se COMPRA en presentaciones distintas (kg, caja, pieza…),
-- cada una con su equivalencia a la unidad base, su precio y proveedor.
-- El costo por unidad base (ingredients.current_price) se DERIVA de la presentación
-- predeterminada (precio ÷ equivalencia) para que costeo de receta y compra cuadren.

create table ingredient_purchase_units (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  unit          text not null,                       -- Caja, Kg, Pieza, Costal…
  factor        numeric(14,6) not null default 1,    -- unidades BASE por 1 de esta presentación
  price         numeric(12,2) not null default 0,    -- costo de 1 de esta presentación
  supplier_id   uuid references suppliers(id) on delete set null,
  is_default    boolean not null default false,      -- presentación usada para comprar/costear
  whole_units   boolean not null default true,       -- true = se compra completa (redondeo hacia arriba)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint ingredient_purchase_units_factor_pos check (factor > 0)
);

create index ingredient_purchase_units_org_id_idx on ingredient_purchase_units(org_id);
create index ingredient_purchase_units_ingredient_id_idx on ingredient_purchase_units(ingredient_id);
-- Máximo una presentación predeterminada por insumo.
create unique index ingredient_purchase_units_one_default
  on ingredient_purchase_units(ingredient_id) where is_default;

create trigger ingredient_purchase_units_updated_at
  before update on ingredient_purchase_units
  for each row execute procedure handle_updated_at();

alter table ingredient_purchase_units enable row level security;

create policy "Users can read their org purchase units"
  on ingredient_purchase_units for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert purchase units for their org"
  on ingredient_purchase_units for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org purchase units"
  on ingredient_purchase_units for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org purchase units"
  on ingredient_purchase_units for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ── Backfill: una presentación base por insumo existente ──────────────────────
-- 1 [unidad actual] = 1 unidad base, precio = current_price. Así nada se rompe y el
-- usuario puede agregar después kg/caja/pieza con sus equivalencias.
insert into ingredient_purchase_units (org_id, ingredient_id, unit, factor, price, supplier_id, is_default, whole_units)
select org_id, id, unit, 1, current_price, preferred_supplier_id, true, false
from ingredients;
