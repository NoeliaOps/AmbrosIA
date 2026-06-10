-- Migration: 20260610000000_harden_functions
-- Endurecimiento de funciones (Supabase security advisors 0011/0028/0029):
--  1) search_path inmutable → previene secuestro de resolución de nombres en
--     funciones SECURITY DEFINER (escalada vía objetos en un esquema atacante).
--  2) Esquema calificado (public.*) para que funcionen con search_path vacío.
--  3) Revoca EXECUTE a anon/authenticated: son funciones de TRIGGER, no deben ser
--     invocables como RPC vía /rest/v1/rpc/*. Los triggers siguen disparando igual.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;

  if v_org_id is not null then
    insert into public.profiles (id, org_id, email, full_name, role)
    values (
      new.id,
      v_org_id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'coordinator'  -- nunca confiar en un rol provisto por el cliente
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
