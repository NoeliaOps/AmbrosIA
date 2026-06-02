-- Migration: 20260525000001_catalogs_phase1
-- Master catalog tables: suppliers, ingredients, dishes, menus, staff, indirect costs

-- ── suppliers ─────────────────────────────────────────────────────────────────
create table suppliers (
  id            uuid primary key default uuid_generate_v4(),
  org_id        uuid not null references organizations(id),
  name          text not null,
  contact_name  text,
  phone         text,
  email         text,
  category      text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger suppliers_updated_at before update on suppliers
  for each row execute procedure handle_updated_at();

-- ── ingredients ───────────────────────────────────────────────────────────────
create table ingredients (
  id                    uuid primary key default uuid_generate_v4(),
  org_id                uuid not null references organizations(id),
  name                  text not null,
  unit                  text not null,
  category              text,
  current_price         numeric(12,2) not null default 0,
  preferred_supplier_id uuid references suppliers(id) on delete set null,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger ingredients_updated_at before update on ingredients
  for each row execute procedure handle_updated_at();

-- ── ingredient_price_history ──────────────────────────────────────────────────
create table ingredient_price_history (
  id            uuid primary key default uuid_generate_v4(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  price         numeric(12,2) not null,
  recorded_at   timestamptz not null default now(),
  notes         text
);

-- ── dishes ────────────────────────────────────────────────────────────────────
create table dishes (
  id             uuid primary key default uuid_generate_v4(),
  org_id         uuid not null references organizations(id),
  name           text not null,
  category       text,
  servings_yield integer not null default 1,
  image_url      text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger dishes_updated_at before update on dishes
  for each row execute procedure handle_updated_at();

-- ── recipe_items ──────────────────────────────────────────────────────────────
create table recipe_items (
  id            uuid primary key default uuid_generate_v4(),
  dish_id       uuid not null references dishes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id),
  quantity      numeric(12,4) not null,
  notes         text,
  unique(dish_id, ingredient_id)
);

-- ── menus ─────────────────────────────────────────────────────────────────────
create table menus (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id),
  name        text not null,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger menus_updated_at before update on menus
  for each row execute procedure handle_updated_at();

-- ── menu_dishes ───────────────────────────────────────────────────────────────
create table menu_dishes (
  id         uuid primary key default uuid_generate_v4(),
  menu_id    uuid not null references menus(id) on delete cascade,
  dish_id    uuid not null references dishes(id),
  sort_order integer not null default 0,
  unique(menu_id, dish_id)
);

-- ── staff_members ─────────────────────────────────────────────────────────────
create table staff_members (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id),
  name       text not null,
  position   text not null,
  rate       numeric(12,2) not null default 0,
  rate_type  text not null default 'daily' check (rate_type in ('hourly', 'daily', 'event')),
  phone      text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger staff_members_updated_at before update on staff_members
  for each row execute procedure handle_updated_at();

-- ── indirect_cost_categories ──────────────────────────────────────────────────
create table indirect_cost_categories (
  id                uuid primary key default uuid_generate_v4(),
  org_id            uuid not null references organizations(id),
  name              text not null,
  description       text,
  allocation_method text not null default 'fixed'
    check (allocation_method in ('fixed', 'percentage', 'per_guest')),
  default_amount    numeric(12,2) not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger indirect_cost_categories_updated_at before update on indirect_cost_categories
  for each row execute procedure handle_updated_at();

-- RLS policies in apply_migration above
