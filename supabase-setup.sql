-- Executar uma única vez no Supabase SQL Editor.
create table if not exists public.lifeos_documents (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb,
 version bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.lifeos_documents enable row level security;
revoke all on public.lifeos_documents from anon, authenticated;
grant select on public.lifeos_documents to authenticated;
create policy "read own lifeos document" on public.lifeos_documents for select to authenticated using ((select auth.uid()) = user_id);
create or replace function public.lifeos_save(p_data jsonb, p_expected_version bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_new bigint;
begin
 if auth.uid() is null then raise exception 'Login obrigatório'; end if;
 if jsonb_typeof(p_data) <> 'object' then raise exception 'Dados inválidos'; end if;
 if p_expected_version = 0 then
  insert into public.lifeos_documents(user_id,data,version) values(auth.uid(),p_data,1)
  on conflict (user_id) do nothing returning version into v_new;
 else
  update public.lifeos_documents set data=p_data,version=version+1,updated_at=now()
  where user_id=auth.uid() and version=p_expected_version returning version into v_new;
 end if;
 return v_new;
end $$;
revoke all on function public.lifeos_save(jsonb,bigint) from public, anon;
grant execute on function public.lifeos_save(jsonb,bigint) to authenticated;
