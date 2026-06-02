-- Migration: 20260601000000_security_rls_catalogs
-- Enable RLS and add org-scoped policies for all catalog tables that were missing them.
-- Uses a helper subquery to resolve the calling user's org_id from their profile.

-- ── Helper: current user's org_id ─────────────────────────────────────────────
-- Used in all policies below as: (select org_id from profiles where id = auth.uid())

-- ── suppliers ─────────────────────────────────────────────────────────────────
alter table suppliers enable row level security;

create policy "Users can read their org suppliers"
  on suppliers for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert suppliers for their org"
  on suppliers for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update their org suppliers"
  on suppliers for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can delete their org suppliers"
  on suppliers for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ── ingredients ───────────────────────────────────────────────────────────────
alter table ingredients enable row level security;

create policy "Users can read their org ingredients"
  on ingredients for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert ingredients for their org"
  on ingredients for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update their org ingredients"
  on ingredients for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can delete their org ingredients"
  on ingredients for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ── ingredient_price_history ──────────────────────────────────────────────────
-- No org_id column — scoped via ingredients.org_id
alter table ingredient_price_history enable row level security;

create policy "Users can read price history for their org ingredients"
  on ingredient_price_history for select to authenticated
  using (
    ingredient_id in (
      select id from ingredients
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can insert price history for their org ingredients"
  on ingredient_price_history for insert to authenticated
  with check (
    ingredient_id in (
      select id from ingredients
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can update price history for their org ingredients"
  on ingredient_price_history for update to authenticated
  using (
    ingredient_id in (
      select id from ingredients
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can delete price history for their org ingredients"
  on ingredient_price_history for delete to authenticated
  using (
    ingredient_id in (
      select id from ingredients
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

-- ── dishes ────────────────────────────────────────────────────────────────────
alter table dishes enable row level security;

create policy "Users can read their org dishes"
  on dishes for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert dishes for their org"
  on dishes for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update their org dishes"
  on dishes for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can delete their org dishes"
  on dishes for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ── recipe_items ──────────────────────────────────────────────────────────────
-- No org_id column — scoped via dishes.org_id
alter table recipe_items enable row level security;

create policy "Users can read recipe items for their org dishes"
  on recipe_items for select to authenticated
  using (
    dish_id in (
      select id from dishes
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can insert recipe items for their org dishes"
  on recipe_items for insert to authenticated
  with check (
    dish_id in (
      select id from dishes
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can update recipe items for their org dishes"
  on recipe_items for update to authenticated
  using (
    dish_id in (
      select id from dishes
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can delete recipe items for their org dishes"
  on recipe_items for delete to authenticated
  using (
    dish_id in (
      select id from dishes
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

-- ── menus ─────────────────────────────────────────────────────────────────────
alter table menus enable row level security;

create policy "Users can read their org menus"
  on menus for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert menus for their org"
  on menus for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update their org menus"
  on menus for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can delete their org menus"
  on menus for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ── menu_dishes ───────────────────────────────────────────────────────────────
-- No org_id column — scoped via menus.org_id
alter table menu_dishes enable row level security;

create policy "Users can read menu dishes for their org menus"
  on menu_dishes for select to authenticated
  using (
    menu_id in (
      select id from menus
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can insert menu dishes for their org menus"
  on menu_dishes for insert to authenticated
  with check (
    menu_id in (
      select id from menus
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can update menu dishes for their org menus"
  on menu_dishes for update to authenticated
  using (
    menu_id in (
      select id from menus
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

create policy "Users can delete menu dishes for their org menus"
  on menu_dishes for delete to authenticated
  using (
    menu_id in (
      select id from menus
      where org_id = (select org_id from profiles where id = auth.uid())
    )
  );

-- ── staff_members ─────────────────────────────────────────────────────────────
alter table staff_members enable row level security;

create policy "Users can read their org staff"
  on staff_members for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert staff for their org"
  on staff_members for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update their org staff"
  on staff_members for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can delete their org staff"
  on staff_members for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

-- ── indirect_cost_categories ──────────────────────────────────────────────────
alter table indirect_cost_categories enable row level security;

create policy "Users can read their org indirect cost categories"
  on indirect_cost_categories for select to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can insert indirect cost categories for their org"
  on indirect_cost_categories for insert to authenticated
  with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can update their org indirect cost categories"
  on indirect_cost_categories for update to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "Users can delete their org indirect cost categories"
  on indirect_cost_categories for delete to authenticated
  using (org_id = (select org_id from profiles where id = auth.uid()));
