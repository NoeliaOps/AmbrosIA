-- Migration: 20260609010000_standardize_categorical_values
-- Estandariza valores categóricos que estaban como texto libre (sembrados con
-- variantes de casing/plurales/sinónimos) para que coincidan con las listas
-- canónicas de lib/constants.ts. La captura nueva ya pasa por dropdowns; esto
-- alinea los datos existentes. Idempotente (re-ejecutable sin efectos extra).

-- ── Tipo de evento (events, menus, quote_templates) → EVENT_TYPES ──────────────
update events          set event_type = 'Evento corporativo' where event_type in ('Corporativo', 'Cena Corporativa');
update events          set event_type = 'Evento social'       where event_type in ('Celebración');
update menus           set event_type = 'Evento corporativo' where event_type in ('Corporativo', 'Cena Corporativa');
update menus           set event_type = 'Evento social'       where event_type in ('Celebración');
update quote_templates set event_type = 'Evento corporativo' where event_type in ('Corporativo', 'Cena Corporativa');
update quote_templates set event_type = 'Evento social'       where event_type in ('Celebración');

-- ── Categoría de platillo → DISH_CATEGORIES (singular) ────────────────────────
update dishes set category = case category
  when 'Platillos Principales' then 'Plato principal'
  when 'Postres'               then 'Postre'
  when 'Entradas'              then 'Entrada'
  when 'Guarniciones'          then 'Guarnición'
  when 'Sopas y Cremas'        then 'Sopa'
  when 'Ensaladas'             then 'Ensalada'
  else category end;

-- ── Categoría de insumo → FOOD_CATEGORIES (taxonomía unificada) ───────────────
update ingredients set category = case category
  when 'Verduras'   then 'Frutas y verduras'
  when 'Abarrotes'  then 'Abarrotes y secos'
  when 'Lácteos'    then 'Lácteos y huevos'
  when 'Carnes'     then 'Carnes y aves'
  when 'Especias'   then 'Especias y condimentos'
  when 'Panadería'  then 'Panadería y repostería'
  when 'Vinos'      then 'Vinos y licores'
  when 'Mariscos'   then 'Pescados y mariscos'
  else category end;

-- ── Categoría de proveedor → FOOD_CATEGORIES (misma taxonomía que insumos) ────
update suppliers set category = case category
  when 'Carnes y embutidos' then 'Carnes y aves'
  when 'Mariscos y pescados' then 'Pescados y mariscos'
  when 'Lácteos y quesos'    then 'Lácteos y huevos'
  when 'Verduras y frutas'   then 'Frutas y verduras'
  when 'Panes y pasteles'    then 'Panadería y repostería'
  else category end;
-- ('Abarrotes y secos', 'Especias y condimentos', 'Vinos y licores' ya son canónicos)

-- ── Unidades → UNITS_OF_MEASURE (abreviaturas consistentes) ───────────────────
update ingredients             set unit = 'l'   where unit = 'litro';
update ingredients             set unit = 'pza' where unit = 'pieza';
update ingredient_purchase_units set unit = 'l'   where unit = 'litro';
update ingredient_purchase_units set unit = 'pza' where unit = 'pieza';
update requisition_items       set unit = 'l'   where unit = 'litro';
update requisition_items       set unit = 'pza' where unit = 'pieza';
update purchase_order_items    set unit = 'l'   where unit = 'litro';
update purchase_order_items    set unit = 'pza' where unit = 'pieza';
update actual_purchases        set unit = 'l'   where unit = 'litro';
update actual_purchases        set unit = 'pza' where unit = 'pieza';

-- ── Puesto del catálogo de personal → STAFF_POSITIONS ─────────────────────────
update staff_members set position = case position
  when 'Mesera'             then 'Mesero'
  when 'Capitán de Meseros' then 'Capitán'
  when 'Sous Chef'          then 'Sous chef'
  when 'Chef Ejecutivo'     then 'Chef ejecutivo'
  when 'Cocinera'           then 'Cocinero'
  when 'Repostera'          then 'Repostero'
  else position end;
