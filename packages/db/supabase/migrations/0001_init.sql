-- RECOMP — schéma initial. PostgreSQL 15+ / Supabase.
create extension if not exists "pgcrypto";

-- ---------- Profils & objectifs ----------
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  sex text check (sex in ('male','female','other')),
  age int check (age between 13 and 110),
  height_cm numeric(5,1),
  start_weight_kg numeric(5,1),
  level text check (level in ('beginner','intermediate','advanced')),
  years_training numeric(4,1) default 0,
  sessions_per_week int default 3,
  session_minutes int default 50,
  equipment text check (equipment in ('gym','home_basic','home_none')) default 'gym',
  occupation text check (occupation in ('sedentary','light','active','very_active')) default 'light',
  work_hours_per_week int default 40,
  steps_per_day int,
  mode text check (mode in ('simple','busy','performance')) default 'simple',
  nutrition_precision text check (nutrition_precision in ('precise','simple')) default 'simple',
  food_cultures text[] default '{europe}',
  dietary_preferences text[] default '{}',
  allergies text[] default '{}',
  disliked_foods text[] default '{}',
  limitations jsonb default '[]',
  risk jsonb default '{}',
  traits jsonb default '{}',
  fasting_window text,
  meals_per_day int default 3,
  training_time_of_day text default 'evening',
  training_days int[] default '{1,3,5}',
  fat_storage text[] default '{}',
  priority_statement text,
  response_profile jsonb default '{}',  -- Personal Response Profile (coefficients bornés)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  is_primary boolean default false,
  visual_goals text[] default '{}',
  inspiration_image_path text,
  created_at timestamptz default now()
);

-- ---------- Corps ----------
create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,1), waist_cm numeric(5,1), hips_cm numeric(5,1), chest_cm numeric(5,1),
  shoulders_cm numeric(5,1), arm_cm numeric(5,1), thigh_cm numeric(5,1), calf_cm numeric(5,1), neck_cm numeric(5,1),
  protocol_ok boolean default true,
  source text default 'manual',
  created_at timestamptz default now(),
  unique (user_id, date, source)
);

create table if not exists body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  view text check (view in ('front','side','back')) not null,
  storage_path text not null,            -- body-photos/{user_id}/{id}.jpg
  self_assessment text check (self_assessment in ('worse','same','better')),
  ai_observations jsonb,                 -- observations qualitatives prudentes, jamais de % de masse grasse
  ai_consent_at timestamptz,             -- consentement explicite à l'analyse de CETTE photo
  created_at timestamptz default now()
);

-- ---------- Nutrition ----------
create table if not exists nutrition_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  strategy text, energy_delta_pct numeric(4,3), protein_per_kg numeric(3,1),
  review_adjustment numeric(4,3) default 0,
  updated_at timestamptz default now()
);

create table if not exists foods (
  id text primary key,
  name text not null,
  category text not null,
  cultures text[] default '{all}',
  per100 jsonb not null,                 -- {kcal,p,c,f,fiber}
  serving_g int,
  tags text[] default '{}',
  note text,
  source text default 'approx',
  user_id uuid references auth.users(id) on delete cascade  -- null = aliment global ; sinon aliment ajouté par l'utilisateur
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  slot text,                              -- breakfast/lunch/snack/dinner
  items jsonb not null,                   -- [{food_id, grams}]
  macros jsonb,
  generated boolean default true,
  created_at timestamptz default now()
);

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  protein_servings int, veg_servings int, carb_servings int, fat_servings int, water_ml int,
  kcal int, protein_g int, carbs_g int, fat_g int, fiber_g int,
  flex_meal boolean default false,
  note text,
  created_at timestamptz default now()
);

-- ---------- Entraînement ----------
create table if not exists exercises (
  id text primary key,
  name text not null,
  pattern text not null,
  muscles text[] not null,
  equipment text[] not null,
  min_level text not null,
  stress text[] default '{}',
  rep_min int, rep_max int,
  compound boolean default true,
  lower_body boolean default false,
  cues text
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  split text not null,
  rationale text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists workout_days (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  focus text,
  weekday int,
  exercises jsonb not null                -- [{exercise_id, sets, rep_min, rep_max, rest_sec, rir_target}]
);

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid references workout_days(id) on delete set null,
  date date not null,
  planned boolean default true,
  completed boolean default false,
  duration_min int,
  readiness text check (readiness in ('push','normal','light','rest')),
  perceived_effort int,
  created_at timestamptz default now()
);

create table if not exists performance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references workout_sessions(id) on delete cascade,
  date date not null,
  exercise_id text not null references exercises(id),
  sets jsonb not null,                    -- [{weight_kg, reps, rir}]
  created_at timestamptz default now()
);

-- ---------- Sommeil, récupération, check-ins ----------
create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  hours numeric(3,1), quality int, bed_time time, wake_time time, night_wakings int,
  source text default 'manual',
  unique (user_id, date, source)
);

create table if not exists recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  score int, readiness text, reasons text[],
  unique (user_id, date)
);

create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  energy int, sleep_hours numeric(3,1), sleep_quality int, bed_time time, wake_time time, night_wakings int,
  stress int, soreness int, motivation int, hunger int, mood int, steps int,
  pain jsonb,
  unique (user_id, date)
);

-- ---------- Revues, rapports, IA ----------
create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  payload jsonb not null,                 -- sortie complète du moteur (works/blocks/change/keep)
  energy_adjustment numeric(4,3) default 0,
  created_at timestamptz default now(),
  unique (user_id, week_start)
);

create table if not exists monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  payload jsonb not null,
  created_at timestamptz default now(),
  unique (user_id, month)
);

create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  intent text, source text, provider_id text, evidence_ids text[],
  created_at timestamptz default now()
);

create table if not exists ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  summary text not null,
  why text,
  evidence_id text,
  accepted boolean,
  created_at timestamptz default now()
);

-- ---------- Habitudes, événements, notifications ----------
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  key text not null, text text not null, why text, target text
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  done boolean default true,
  unique (habit_id, date)
);

create table if not exists life_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  start_date date not null,
  end_date date not null,
  note text
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, level text, text text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- ---------- Consentements, intégrations ----------
create table if not exists consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('photo_ai_analysis','product_improvement','notifications','terms','privacy')),
  granted boolean not null,
  granted_at timestamptz default now(),
  revoked_at timestamptz,
  primary key (user_id, kind)
);

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('apple_health','health_connect','garmin','fitbit','oura','withings')),
  scopes text[] default '{}',
  encrypted_tokens bytea,                  -- chiffré côté serveur (pgsodium / vault)
  last_sync_at timestamptz,
  unique (user_id, provider)
);

create table if not exists health_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                      -- steps, weight, sleep_duration, hrv, resting_hr, body_fat_scale...
  value numeric not null,
  unit text not null,
  source text not null,
  start_at timestamptz not null,
  end_at timestamptz,
  unique (user_id, type, source, start_at)
);
create index if not exists health_samples_user_type_idx on health_samples (user_id, type, start_at desc);

-- ---------- RLS ----------
do $$
declare t text;
begin
  for t in select unnest(array['profiles','goals','measurements','body_photos','nutrition_profiles','meals','meal_logs','workouts','workout_days','workout_sessions','performance_logs','sleep_logs','recovery_logs','daily_checkins','weekly_reviews','monthly_reports','ai_conversations','ai_messages','ai_recommendations','habits','habit_logs','life_events','notifications','consents','integrations','health_samples'])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "%s_owner" on %I', t, t);
    execute format('create policy "%s_owner" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- foods : lecture globale, écriture uniquement de ses propres aliments
alter table foods enable row level security;
drop policy if exists foods_read on foods;
create policy foods_read on foods for select using (user_id is null or auth.uid() = user_id);
drop policy if exists foods_write on foods;
create policy foods_write on foods for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table exercises enable row level security;
drop policy if exists exercises_read on exercises;
create policy exercises_read on exercises for select using (true);

-- ---------- Storage : photos privées ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('body-photos', 'body-photos', false, 5242880, '{image/jpeg,image/png,image/webp}') on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "body photos owner" on storage.objects;
create policy "body photos owner" on storage.objects for all
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Export / suppression (RGPD) ----------
create or replace function export_user_data() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.user_id = uid),
    'goals', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from goals x where x.user_id = uid),
    'measurements', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from measurements x where x.user_id = uid),
    'body_photos', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from body_photos x where x.user_id = uid),
    'meal_logs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from meal_logs x where x.user_id = uid),
    'workout_sessions', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from workout_sessions x where x.user_id = uid),
    'performance_logs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from performance_logs x where x.user_id = uid),
    'daily_checkins', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from daily_checkins x where x.user_id = uid),
    'weekly_reviews', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from weekly_reviews x where x.user_id = uid),
    'ai_messages', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from ai_messages x where x.user_id = uid),
    'consents', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from consents x where x.user_id = uid),
    'meals', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from meals x where x.user_id = uid),
    'sleep_logs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from sleep_logs x where x.user_id = uid),
    'recovery_logs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from recovery_logs x where x.user_id = uid),
    'monthly_reports', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from monthly_reports x where x.user_id = uid),
    'ai_recommendations', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from ai_recommendations x where x.user_id = uid),
    'habits', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from habits x where x.user_id = uid),
    'habit_logs', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from habit_logs x where x.user_id = uid),
    'life_events', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from life_events x where x.user_id = uid),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from notifications x where x.user_id = uid),
    'nutrition_profile', (select to_jsonb(x) from nutrition_profiles x where x.user_id = uid),
    'workouts', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from workouts x where x.user_id = uid),
    'workout_days', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from workout_days x where x.user_id = uid),
    'health_samples', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from health_samples x where x.user_id = uid)
  ) into result;
  return result;
end $$;

create or replace function delete_user_data() returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not authenticated'; end if;
  -- Les objets Storage doivent être supprimés via l'API Storage (Edge Function) AVANT cet appel,
  -- sinon des fichiers orphelins peuvent subsister sur le backend. Cette ligne nettoie l'index.
  delete from storage.objects where bucket_id = 'body-photos' and (storage.foldername(name))[1] = uid::text;
  delete from profiles where user_id = uid;  -- cascade sur toutes les tables utilisateur
  delete from auth.users where id = uid;     -- invalide les sessions
end $$;

revoke execute on function export_user_data() from public, anon;
revoke execute on function delete_user_data() from public, anon;
grant execute on function export_user_data() to authenticated;
grant execute on function delete_user_data() to authenticated;

-- updated_at
create or replace function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
