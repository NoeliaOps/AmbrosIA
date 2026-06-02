-- Migration: 20260525160000_phase6_staff_assignments
-- Event staff assignments: assign staff members to events with role, call time, hours, and computed cost

-- ── event_staff_assignments ───────────────────────────────────────────────────
create table event_staff_assignments (
  id               uuid primary key default uuid_generate_v4(),
  org_id           uuid not null references organizations(id),
  event_id         uuid not null references events(id) on delete cascade,
  staff_member_id  uuid not null references staff_members(id),
  role             text,
  call_time        time,
  estimated_hours  numeric(4,1) not null default 8,
  computed_cost    numeric(12,2) not null default 0,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(event_id, staff_member_id)
);

create trigger event_staff_assignments_updated_at before update on event_staff_assignments
  for each row execute procedure handle_updated_at();

-- RLS
alter table event_staff_assignments enable row level security;

create policy "org members can manage event_staff_assignments"
  on event_staff_assignments for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));
