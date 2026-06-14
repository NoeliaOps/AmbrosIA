-- Migration: 20260610010000_service_costs
-- Los costos indirectos incluyen también SERVICIOS (seguridad, valet, DJ, mobiliario,
-- limpieza, transporte…). Normalmente se reparten por SEMANA (prorrateo entre los
-- eventos de esa semana) o por EVENTO (asignación directa, eventos grandes).
--
-- Esta migración habilita el prorrateo SEMANAL en `overhead_expenses` (que antes solo
-- prorrateaba por mes) y distingue gastos generales de servicios con `kind`.
--  - period_type='month' → period = primer día del mes (comportamiento existente).
--  - period_type='week'  → period = LUNES de la semana; se reparte entre los eventos
--    de esa semana ISO (lunes-domingo).
-- La asignación "por evento" de un servicio ya se cubre con `event_indirect_costs`.

alter table overhead_expenses
  add column if not exists period_type text not null default 'month'
    check (period_type in ('month', 'week'));

alter table overhead_expenses
  add column if not exists kind text not null default 'overhead'
    check (kind in ('overhead', 'service'));

create index if not exists overhead_expenses_kind_idx on overhead_expenses(kind);
