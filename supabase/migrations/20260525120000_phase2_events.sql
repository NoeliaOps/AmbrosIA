-- Migration: 20260525120000_phase2_events
-- Events, clients, quotes, line items, contracts

-- ── clients ───────────────────────────────────────────────────────────────────
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger clients_updated_at before update on clients
  for each row execute procedure handle_updated_at();
create index clients_org_id_idx on clients(org_id);

alter table clients enable row level security;
create policy "org members can manage clients"
  on clients for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

-- ── events ────────────────────────────────────────────────────────────────────
create table events (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  name        text not null,
  event_type  text,
  event_date  date not null,
  event_time  time,
  location    text,
  guest_count int not null default 1,
  status      text not null default 'cotizado',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger events_updated_at before update on events
  for each row execute procedure handle_updated_at();
create index events_org_id_idx on events(org_id);
create index events_client_id_idx on events(client_id);

alter table events enable row level security;
create policy "org members can manage events"
  on events for all
  using (org_id = (select org_id from profiles where id = auth.uid()))
  with check (org_id = (select org_id from profiles where id = auth.uid()));

-- ── quotes ────────────────────────────────────────────────────────────────────
create table quotes (
  id              uuid primary key default uuid_generate_v4(),
  event_id        uuid not null references events(id) on delete cascade,
  version_number  int not null default 1,
  status          text not null default 'borrador',
  subtotal        numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  margin_percent  numeric(5,2),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger quotes_updated_at before update on quotes
  for each row execute procedure handle_updated_at();
create index quotes_event_id_idx on quotes(event_id);

alter table quotes enable row level security;
create policy "org members can manage quotes"
  on quotes for all
  using (event_id in (select id from events where org_id = (select org_id from profiles where id = auth.uid())))
  with check (event_id in (select id from events where org_id = (select org_id from profiles where id = auth.uid())));

-- ── quote_line_items ──────────────────────────────────────────────────────────
create table quote_line_items (
  id           uuid primary key default uuid_generate_v4(),
  quote_id     uuid not null references quotes(id) on delete cascade,
  type         text not null default 'other',
  reference_id uuid,
  description  text not null,
  unit_cost    numeric(12,2) not null default 0,
  quantity     numeric(10,2) not null default 1,
  total_cost   numeric(12,2) not null default 0,
  sort_order   int not null default 0
);
create index quote_line_items_quote_id_idx on quote_line_items(quote_id);

alter table quote_line_items enable row level security;
create policy "org members can manage quote line items"
  on quote_line_items for all
  using (quote_id in (
    select q.id from quotes q
    join events e on e.id = q.event_id
    where e.org_id = (select org_id from profiles where id = auth.uid())
  ))
  with check (quote_id in (
    select q.id from quotes q
    join events e on e.id = q.event_id
    where e.org_id = (select org_id from profiles where id = auth.uid())
  ));

-- ── contracts ─────────────────────────────────────────────────────────────────
create table contracts (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  quote_id   uuid references quotes(id) on delete set null,
  clauses    jsonb not null default '[]'::jsonb,
  status     text not null default 'borrador',
  signed_at  timestamptz,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger contracts_updated_at before update on contracts
  for each row execute procedure handle_updated_at();
create index contracts_event_id_idx on contracts(event_id);

alter table contracts enable row level security;
create policy "org members can manage contracts"
  on contracts for all
  using (event_id in (select id from events where org_id = (select org_id from profiles where id = auth.uid())))
  with check (event_id in (select id from events where org_id = (select org_id from profiles where id = auth.uid())));
