-- ============================================================
-- Folkmons - banco online no Supabase
-- ============================================================
-- Como usar:
--   1. Abra o projeto no Supabase.
--   2. Entre em SQL Editor -> New query.
--   3. Cole TODO este arquivo e clique em Run.
--   4. Confira o resultado da ultima consulta (deve mostrar 1).
--
-- O script pode ser executado mais de uma vez sem apagar os saves.
--
-- O que ele cria:
--   - public.profiles: um perfil/save por conta do Supabase Auth;
--   - trigger que cria o perfil automaticamente no cadastro;
--   - trigger de updated_at;
--   - RLS: cada jogador so le e altera o proprio perfil;
--   - migracao dos saves antigos que estavam em user_metadata.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. Tabela de perfis/saves
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    trainer_name text not null default 'Treinador'
        constraint profiles_trainer_name_check
        check (char_length(btrim(trainer_name)) between 1 and 20),
    save jsonb not null default '{}'::jsonb
        constraint profiles_save_is_object
        check (jsonb_typeof(save) = 'object'),
    save_version integer not null default 1
        constraint profiles_save_version_check
        check (save_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.profiles is
    'Perfil e save do Folkmons. Cada linha pertence a um usuario do Supabase Auth.';
comment on column public.profiles.trainer_name is
    'Nome de treinador exibido no jogo (1 a 20 caracteres).';
comment on column public.profiles.save is
    'Save completo do jogo em JSON. O cliente so pode alterar o proprio perfil.';
comment on column public.profiles.save_version is
    'Versao do formato do save, para futuras migracoes.';

-- Garante que um perfil nao aceite um JSON gigante por engano.
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'profiles_save_size_check'
          and conrelid = 'public.profiles'::regclass
    ) then
        alter table public.profiles
            add constraint profiles_save_size_check
            check (pg_column_size(save) <= 2097152);
    end if;
end;
$$;

-- ------------------------------------------------------------
-- 2. updated_at automatico
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- 3. Cria o perfil automaticamente quando uma conta e criada
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_trainer_name text;
    v_initial_save jsonb;
begin
    v_trainer_name := btrim(coalesce(new.raw_user_meta_data ->> 'trainer_name', ''));

    if v_trainer_name = '' then
        v_trainer_name := btrim(split_part(coalesce(new.email, ''), '@', 1));
    end if;

    if v_trainer_name = '' then
        v_trainer_name := 'Treinador';
    end if;

    v_trainer_name := left(v_trainer_name, 20);

    if jsonb_typeof(new.raw_user_meta_data -> 'save') = 'object' then
        v_initial_save := new.raw_user_meta_data -> 'save';
    else
        v_initial_save := '{}'::jsonb;
    end if;

    insert into public.profiles (id, trainer_name, save)
    values (new.id, v_trainer_name, v_initial_save)
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 4. Migra contas antigas que ja tinham save em user_metadata
-- ------------------------------------------------------------
insert into public.profiles (id, trainer_name, save)
select
    u.id,
    left(
        coalesce(
            nullif(btrim(coalesce(u.raw_user_meta_data ->> 'trainer_name', '')), ''),
            nullif(btrim(split_part(coalesce(u.email, ''), '@', 1)), ''),
            'Treinador'
        ),
        20
    ),
    case
        when jsonb_typeof(u.raw_user_meta_data -> 'save') = 'object'
            then u.raw_user_meta_data -> 'save'
        else '{}'::jsonb
    end
from auth.users u
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 5. RLS: cada jogador acessa apenas o proprio perfil
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Sem policy de DELETE: o cliente nao apaga o perfil.
-- A exclusao da conta no Auth remove o perfil via ON DELETE CASCADE.

-- Anonimo nao acessa o banco. O cliente autenticado so faz o necessario.
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;

-- ------------------------------------------------------------
-- 6. Recarrega o cache da API REST e valida
-- ------------------------------------------------------------
notify pgrst, 'reload schema';

commit;

-- Deve retornar 1 e confirmar que a tabela existe.
select count(*) as profiles_table_ok
from information_schema.tables
where table_schema = 'public'
  and table_name = 'profiles';

-- Deve retornar 3 policies (select, insert e update).
select count(*) as policies_ok
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles';
