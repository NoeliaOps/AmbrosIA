-- Migration: 20260525130000_phase3_payments
-- Payment schedule milestones per event

create table payment_schedules (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id) on delete cascade,
  description text not null,
  amount      numeric(12,2) not null,
  due_date    date not null,
  status      text not null default 'pendiente',
  paid_at     date,
  paid_amount numeric(12,2),
  reference   text,
  notes       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger payment_schedules_updated_at before update on payment_schedules
  for each row execute procedure handle_updated_at();

create index payment_schedules_event_id_idx on payment_schedules(event_id);
create index payment_schedules_due_date_idx on payment_schedules(due_date);
create index payment_schedules_status_idx on payment_schedules(status);

alter table payment_schedules enable row level security;

create policy "org members can manage payment schedules"
  on payment_schedules for all
  using (
    event_id in (
      select id from events
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  )
  with check (
    event_id in (
      select id from events
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );
