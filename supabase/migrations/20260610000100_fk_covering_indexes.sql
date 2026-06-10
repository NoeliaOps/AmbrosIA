-- Migration: 20260610000100_fk_covering_indexes
-- Índices de cobertura para llaves foráneas sin indexar (Supabase perf advisor
-- 0001_unindexed_foreign_keys). Aceleran joins y, sobre todo, los DELETE/UPDATE
-- en la tabla padre (que escanean al hijo para validar la FK). Aditivo y seguro.

create index if not exists contracts_quote_id_idx                 on public.contracts(quote_id);
create index if not exists event_dishes_dish_id_idx               on public.event_dishes(dish_id);
create index if not exists event_indirect_costs_category_id_idx   on public.event_indirect_costs(category_id);
create index if not exists ingredient_price_history_ingredient_id_idx on public.ingredient_price_history(ingredient_id);
create index if not exists ingredient_purchase_units_supplier_id_idx on public.ingredient_purchase_units(supplier_id);
create index if not exists ingredients_preferred_supplier_id_idx  on public.ingredients(preferred_supplier_id);
create index if not exists inventory_movements_event_id_idx       on public.inventory_movements(event_id);
create index if not exists inventory_movements_purchase_order_id_idx on public.inventory_movements(purchase_order_id);
create index if not exists menu_dishes_dish_id_idx                on public.menu_dishes(dish_id);
create index if not exists profiles_org_id_idx                    on public.profiles(org_id);
create index if not exists purchase_order_items_ingredient_id_idx on public.purchase_order_items(ingredient_id);
create index if not exists purchase_orders_supplier_id_idx        on public.purchase_orders(supplier_id);
create index if not exists recipe_items_ingredient_id_idx         on public.recipe_items(ingredient_id);
create index if not exists requisition_items_ingredient_id_idx    on public.requisition_items(ingredient_id);
