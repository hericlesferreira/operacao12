create extension if not exists "pgcrypto";

create type public.user_role as enum ('participant', 'admin');
create type public.access_status as enum ('ativo', 'pendente', 'expirado', 'cancelado', 'reembolsado');
create type public.biological_sex as enum ('homem', 'mulher', 'indefinido');
create type public.activity_level as enum ('sedentario', 'baixo', 'moderado', 'alto', 'muito_alto');
create type public.review_status as enum ('sem_revisao', 'revisao_recomendada', 'revisao_necessaria');
create type public.dietitian_status_type as enum ('pendente', 'cadastrado', 'plano_liberado', 'revisao_necessaria');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  whatsapp text,
  role public.user_role not null default 'participant',
  access_status public.access_status not null default 'pendente',
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  purchase_source text,
  transaction_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'admin'
  );
$$;

create table public.anamneses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  age integer not null check (age >= 16),
  biological_sex public.biological_sex not null,
  weight_kg numeric(6,2) not null check (weight_kg between 35 and 250),
  height_cm numeric(6,2) not null check (height_cm between 130 and 230),
  main_goal text not null,
  weight_loss_history text,
  main_difficulty text,
  activity_level public.activity_level not null,
  sleep_hours text,
  sleep_quality text,
  health_conditions text[] not null default '{}',
  food_preference text not null default 'onivoro',
  motivation integer not null check (motivation between 0 and 10),
  behavioral_answers jsonb not null default '{}'::jsonb,
  raw_answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  calories integer not null check (calories > 0),
  food_type text not null default 'onivoro',
  description text,
  pdf_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.metabolic_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anamnese_id uuid not null references public.anamneses(id) on delete cascade,
  basal_metabolic_rate integer,
  total_energy_expenditure integer,
  activity_factor numeric(5,3) not null,
  cut_target_calories integer,
  indicated_plan_id uuid references public.meal_plans(id) on delete set null,
  indicated_plan_code text,
  estimated_deficit integer,
  equation_name text not null default 'Harris-Benedict validada Operacao 12S',
  review_status public.review_status not null default 'sem_revisao',
  review_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anamnese_id uuid not null references public.anamneses(id) on delete cascade,
  abandonment_score integer not null default 0,
  abandonment_classification text not null default 'baixo risco',
  sleep_score integer not null default 0,
  sleep_classification text not null default 'sono adequado',
  activity_classification text not null default 'movimento minimo',
  metabolic_score integer not null default 0,
  metabolic_classification text not null default 'sem alerta relevante',
  eating_behavior_score integer not null default 0,
  eating_behavior_classification text not null default 'sem alerta relevante',
  personalized_messages jsonb not null default '{}'::jsonb,
  review_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operation_trails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anamnese_id uuid not null references public.anamneses(id) on delete cascade,
  calculation_id uuid references public.metabolic_calculations(id) on delete set null,
  pdf_url text,
  priorities jsonb not null default '[]'::jsonb,
  recommended_materials jsonb not null default '[]'::jsonb,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  display_order integer not null default 0,
  release_day integer not null default 0 check (release_day >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  support_text text,
  display_order integer not null default 0,
  release_day integer not null default 0 check (release_day >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bonus_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  file_url text,
  release_rule text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_bonus_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bonus_material_id uuid not null references public.bonus_materials(id) on delete cascade,
  release_reason text not null,
  released_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, bonus_material_id)
);

create table public.physical_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week integer not null check (week in (0, 4, 8, 12)),
  weight_kg numeric(6,2),
  waist_cm numeric(6,2),
  abdomen_cm numeric(6,2),
  arm_cm numeric(6,2),
  thigh_cm numeric(6,2),
  neck_cm numeric(6,2),
  calf_cm numeric(6,2),
  notes text,
  front_photo_url text,
  side_photo_url text,
  back_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week)
);

create table public.dietitian_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status public.dietitian_status_type not null default 'pendente',
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index anamneses_user_id_idx on public.anamneses(user_id);
create index metabolic_calculations_user_id_idx on public.metabolic_calculations(user_id);
create index scores_user_id_idx on public.scores(user_id);
create index operation_trails_user_id_idx on public.operation_trails(user_id);
create index lessons_module_id_idx on public.lessons(module_id);
create index user_bonus_materials_user_id_idx on public.user_bonus_materials(user_id);
create index physical_assessments_user_id_idx on public.physical_assessments(user_id);
create index admin_notes_user_id_idx on public.admin_notes(user_id);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger anamneses_set_updated_at before update on public.anamneses for each row execute function public.set_updated_at();
create trigger meal_plans_set_updated_at before update on public.meal_plans for each row execute function public.set_updated_at();
create trigger metabolic_calculations_set_updated_at before update on public.metabolic_calculations for each row execute function public.set_updated_at();
create trigger scores_set_updated_at before update on public.scores for each row execute function public.set_updated_at();
create trigger operation_trails_set_updated_at before update on public.operation_trails for each row execute function public.set_updated_at();
create trigger modules_set_updated_at before update on public.modules for each row execute function public.set_updated_at();
create trigger lessons_set_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger bonus_materials_set_updated_at before update on public.bonus_materials for each row execute function public.set_updated_at();
create trigger physical_assessments_set_updated_at before update on public.physical_assessments for each row execute function public.set_updated_at();
create trigger dietitian_status_set_updated_at before update on public.dietitian_status for each row execute function public.set_updated_at();
create trigger admin_notes_set_updated_at before update on public.admin_notes for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.anamneses enable row level security;
alter table public.meal_plans enable row level security;
alter table public.metabolic_calculations enable row level security;
alter table public.scores enable row level security;
alter table public.operation_trails enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.bonus_materials enable row level security;
alter table public.user_bonus_materials enable row level security;
alter table public.physical_assessments enable row level security;
alter table public.dietitian_status enable row level security;
alter table public.admin_notes enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_admin_only" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

create policy "anamneses_select_own_or_admin" on public.anamneses
  for select using (auth.uid() = user_id or public.is_admin());

create policy "anamneses_insert_own" on public.anamneses
  for insert with check (auth.uid() = user_id);

create policy "anamneses_update_own_or_admin" on public.anamneses
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "meal_plans_select_active_or_admin" on public.meal_plans
  for select using (is_active = true or public.is_admin());

create policy "meal_plans_admin_all" on public.meal_plans
  for all using (public.is_admin()) with check (public.is_admin());

create policy "metabolic_select_own_or_admin" on public.metabolic_calculations
  for select using (auth.uid() = user_id or public.is_admin());

create policy "metabolic_insert_own_or_admin" on public.metabolic_calculations
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "metabolic_update_own_or_admin" on public.metabolic_calculations
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "scores_select_own_or_admin" on public.scores
  for select using (auth.uid() = user_id or public.is_admin());

create policy "scores_insert_own_or_admin" on public.scores
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "scores_update_own_or_admin" on public.scores
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "trails_select_own_or_admin" on public.operation_trails
  for select using (auth.uid() = user_id or public.is_admin());

create policy "trails_insert_own_or_admin" on public.operation_trails
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "trails_update_own_or_admin" on public.operation_trails
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "modules_select_active_or_admin" on public.modules
  for select using (is_active = true or public.is_admin());

create policy "modules_admin_all" on public.modules
  for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons_select_active_or_admin" on public.lessons
  for select using (is_active = true or public.is_admin());

create policy "lessons_admin_all" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "bonus_select_active_or_admin" on public.bonus_materials
  for select using (is_active = true or public.is_admin());

create policy "bonus_admin_all" on public.bonus_materials
  for all using (public.is_admin()) with check (public.is_admin());

create policy "user_bonus_select_own_or_admin" on public.user_bonus_materials
  for select using (auth.uid() = user_id or public.is_admin());

create policy "user_bonus_admin_all" on public.user_bonus_materials
  for all using (public.is_admin()) with check (public.is_admin());

create policy "assessments_select_own_or_admin" on public.physical_assessments
  for select using (auth.uid() = user_id or public.is_admin());

create policy "assessments_insert_own" on public.physical_assessments
  for insert with check (auth.uid() = user_id);

create policy "assessments_update_own_or_admin" on public.physical_assessments
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "dietitian_select_own_or_admin" on public.dietitian_status
  for select using (auth.uid() = user_id or public.is_admin());

create policy "dietitian_admin_all" on public.dietitian_status
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_notes_admin_only" on public.admin_notes
  for all using (public.is_admin()) with check (public.is_admin());
