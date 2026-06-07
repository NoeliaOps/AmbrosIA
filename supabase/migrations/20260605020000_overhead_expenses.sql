-- Migration: 20260605020000_overhead_expenses
-- Gastos generales del negocio por periodo (gas, luz, renta, etc.). Se prorratean
-- entre el número de eventos del mismo mes para repartir el costo fijo por evento.
-- Multi-tenant (org_id) + RLS org-scoped.

create table overhead_expenses (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  concept    text not null,                 -- Gas, Luz, Renta, etc.
  amount     numeric(12,2) not null default 0,
  period     date not null,                 -- primer día del mes al que aplica
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index overhead_expenses_org_id_idx on overhead_expenses(org_id);
create index overhead_expenses_period_idx on overhead_expenses(period);

create trigger overhead_expenses_updated_at
  before update on overhead_expenses
  for each row execute procedure handle_updated_at();

alter table overhead_expenses enable row level security;

create policy "Users can read their org overhead"
  on overhead_expenses for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can insert overhead for their org"
  on overhead_expenses for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can update their org overhead"
  on overhead_expenses for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
create policy "Users can delete their org overhead"
  on overhead_expenses for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
