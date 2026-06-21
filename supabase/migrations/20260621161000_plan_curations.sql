create type public.plan_curation_status as enum ('pendente', 'aprovado', 'revisar');

create table public.plan_curations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  calculation_id uuid references public.metabolic_calculations(id) on delete set null,
  suggested_plan_code text,
  approved_plan_code text,
  status public.plan_curation_status not null default 'pendente',
  admin_observation text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plan_curations_user_id_idx on public.plan_curations(user_id);
create trigger plan_curations_set_updated_at before update on public.plan_curations for each row execute function public.set_updated_at();

alter table public.plan_curations enable row level security;

create policy "plan_curations_select_own_or_admin" on public.plan_curations
  for select using (auth.uid() = user_id or public.is_admin());

create policy "plan_curations_admin_all" on public.plan_curations
  for all using (public.is_admin()) with check (public.is_admin());
