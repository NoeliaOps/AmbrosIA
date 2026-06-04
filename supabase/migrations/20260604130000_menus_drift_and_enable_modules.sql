-- Migration: 20260604130000_menus_drift_and_enable_modules
-- (1) Corrige el drift del esquema de Menús: el código (menu-client + actions)
--     usa columnas que faltaban en la tabla desplegada, por lo que crear/editar
--     menús fallaba y el listado erroraba al seleccionarlas.
-- (2) Habilita en module_settings los módulos que ya son funcionales.

-- ── (1) Columnas faltantes de Menús ───────────────────────────────────────────
alter table menus       add column if not exists event_type text;
alter table menus       add column if not exists notes      text;
alter table menu_dishes add column if not exists servings   integer not null default 1;
alter table menu_dishes add column if not exists notes      text;

-- ── (2) Habilitar módulos funcionales ─────────────────────────────────────────
update module_settings
   set is_enabled = true
 where module_key in ('calendar', 'inventory', 'templates', 'postmortem');
