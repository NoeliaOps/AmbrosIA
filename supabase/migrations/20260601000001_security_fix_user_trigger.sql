-- Migration: 20260601000001_security_fix_user_trigger
-- Fix: handle_new_user trigger no longer trusts caller-supplied role from
-- raw_user_meta_data. Any user signing up could previously pass role='admin'
-- in the metadata and get promoted automatically. Now always defaults to
-- 'coordinator' — role elevation must be done server-side by an admin.

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_org_id uuid;
begin
  -- Find the default organization
  select id into v_org_id from organizations limit 1;

  if v_org_id is not null then
    insert into profiles (id, org_id, email, full_name, role)
    values (
      new.id,
      v_org_id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'coordinator'  -- Always default to coordinator; never trust client-supplied role
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;
