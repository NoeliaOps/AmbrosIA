-- Migration: 20260607020000_warehouse_type
-- Distinción de almacenes por temperatura: ambiente (no frío) vs frío
-- (refrigerado / congelado).

alter table warehouses
  add column type text not null default 'ambiente'
  check (type in ('ambiente', 'refrigerado', 'congelado'));

-- El almacén demo "Bodega fría" pasa a refrigerado.
update warehouses set type = 'refrigerado' where lower(name) like '%frí%' or lower(name) like '%fri%';
