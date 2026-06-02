-- Migration: 20260601000002_db_indexes_and_constraints
-- Phase 3 DB integrity: missing indexes, CHECK constraints, UNIQUE constraints, FK cascade fix

-- ── Indexes: events ───────────────────────────────────────────────────────────
create index if not exists events_status_idx on events(status);
create index if not exists events_org_status_date_idx on events(org_id, status, event_date);

-- ── Indexes: quotes ───────────────────────────────────────────────────────────
create index if not exists quotes_status_idx on quotes(status);
create index if not exists quotes_event_id_status_idx on quotes(event_id, status);

-- ── Indexes: event_staff_assignments ─────────────────────────────────────────
create index if not exists event_staff_assignments_event_id_idx on event_staff_assignments(event_id);
create index if not exists event_staff_assignments_org_id_idx on event_staff_assignments(org_id);
create index if not exists event_staff_assignments_staff_member_id_idx on event_staff_assignments(staff_member_id);

-- ── Indexes: catalog tables (org_id for RLS performance) ─────────────────────
create index if not exists suppliers_org_id_idx on suppliers(org_id);
create index if not exists ingredients_org_id_idx on ingredients(org_id);
create index if not exists dishes_org_id_idx on dishes(org_id);
create index if not exists menus_org_id_idx on menus(org_id);
create index if not exists staff_members_org_id_idx on staff_members(org_id);
create index if not exists staff_members_is_active_idx on staff_members(is_active);
create index if not exists indirect_cost_categories_org_id_idx on indirect_cost_categories(org_id);
create index if not exists indirect_cost_categories_is_active_idx on indirect_cost_categories(is_active);

-- ── CHECK constraints: payment amounts ───────────────────────────────────────
alter table payment_schedules
  add constraint payment_schedules_amount_positive check (amount >= 0),
  add constraint payment_schedules_paid_amount_positive check (paid_amount is null or paid_amount >= 0);

-- ── UNIQUE: contracts(event_id) ───────────────────────────────────────────────
alter table contracts
  add constraint contracts_event_id_unique unique (event_id);

-- ── UNIQUE: event_indirect_costs(event_id, category_id) ──────────────────────
alter table event_indirect_costs
  add constraint event_indirect_costs_event_category_unique unique (event_id, category_id);

-- ── FK cascade: event_staff_assignments.org_id ────────────────────────────────
alter table event_staff_assignments
  drop constraint if exists event_staff_assignments_org_id_fkey;

alter table event_staff_assignments
  add constraint event_staff_assignments_org_id_fkey
    foreign key (org_id) references organizations(id) on delete cascade;
