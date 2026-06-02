-- Migration: 20260601000004_db_organizations_rls_scope
-- Scope organizations SELECT policy to own org only (multi-tenant safety)

drop policy if exists "Authenticated users can read organizations" on organizations;

create policy "Users can read their own organization"
  on organizations for select to authenticated
  using (id = (select org_id from profiles where id = auth.uid()));
