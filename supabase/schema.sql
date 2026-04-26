-- ============================================================
-- PsicoApp — Esquema completo de base de datos
-- Ejecutar en Supabase → SQL Editor → New Query
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TIPOS
-- ============================================================
create type appointment_status as enum (
  'pending_confirmation',
  'confirmed',
  'pending_reconfirmation',
  'reconfirmed',
  'cancelled_by_patient',
  'cancelled_by_psychologist',
  'completed'
);

create type appointment_modality as enum ('presencial', 'virtual');

-- ============================================================
-- TABLA: psychologists
-- ============================================================
create table public.psychologists (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null unique,
  full_name         text not null,
  license_number    text,
  email             text not null,
  phone             text,
  address           text,
  logo_url          text,
  brand_color       text default '#2563eb',
  default_duration  int default 50,
  reminder_hours    int default 24,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.psychologists enable row level security;

create policy "psychologists_select" on public.psychologists for select using (auth.uid() = user_id);
create policy "psychologists_insert" on public.psychologists for insert with check (auth.uid() = user_id);
create policy "psychologists_update" on public.psychologists for update using (auth.uid() = user_id);

-- ============================================================
-- TABLA: patients
-- ============================================================
create table public.patients (
  id               uuid primary key default uuid_generate_v4(),
  psychologist_id  uuid references public.psychologists(id) on delete cascade not null,
  first_name       text not null,
  last_name        text not null,
  email            text not null,
  phone            text,
  date_of_birth    date,
  admin_notes      text,
  tags             text[] default '{}',
  is_active        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.patients enable row level security;

create policy "patients_all" on public.patients
  using (psychologist_id in (select id from public.psychologists where user_id = auth.uid()))
  with check (psychologist_id in (select id from public.psychologists where user_id = auth.uid()));

-- ============================================================
-- TABLA: appointments
-- ============================================================
create table public.appointments (
  id                  uuid primary key default uuid_generate_v4(),
  psychologist_id     uuid references public.psychologists(id) on delete cascade not null,
  patient_id          uuid references public.patients(id) on delete cascade not null,
  scheduled_at        timestamptz not null,
  duration_minutes    int not null default 50,
  modality            appointment_modality not null default 'presencial',
  status              appointment_status not null default 'pending_confirmation',
  internal_notes      text,
  confirmation_token  uuid default uuid_generate_v4() unique,
  reminder_sent_at    timestamptz,
  cancelled_reason    text,
  cancelled_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.appointments enable row level security;

create policy "appointments_psychologist" on public.appointments
  using (psychologist_id in (select id from public.psychologists where user_id = auth.uid()))
  with check (psychologist_id in (select id from public.psychologists where user_id = auth.uid()));

-- Allow public (unauthenticated) token-based updates for patient confirmation
create policy "appointments_public_token_update" on public.appointments
  for update using (confirmation_token is not null);

-- ============================================================
-- TABLA: appointment_events
-- ============================================================
create table public.appointment_events (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid references public.appointments(id) on delete cascade not null,
  event_type      text not null,
  from_status     appointment_status,
  to_status       appointment_status,
  notes           text,
  created_at      timestamptz default now()
);

alter table public.appointment_events enable row level security;

create policy "events_select" on public.appointment_events for select
  using (appointment_id in (
    select a.id from public.appointments a
    join public.psychologists p on p.id = a.psychologist_id
    where p.user_id = auth.uid()
  ));

create policy "events_insert_authenticated" on public.appointment_events for insert
  with check (
    appointment_id in (
      select a.id from public.appointments a
      join public.psychologists p on p.id = a.psychologist_id
      where p.user_id = auth.uid()
    )
  );

-- Allow public insert for patient actions (token-based)
create policy "events_insert_public" on public.appointment_events for insert
  with check (true);

-- ============================================================
-- TABLA: session_notes
-- ============================================================
create table public.session_notes (
  id                  uuid primary key default uuid_generate_v4(),
  psychologist_id     uuid references public.psychologists(id) on delete cascade not null,
  patient_id          uuid references public.patients(id) on delete cascade not null,
  appointment_id      uuid references public.appointments(id) on delete set null,
  consultation_reason text,
  development         text,
  interventions       text,
  observations        text,
  next_steps          text,
  session_date        date not null default current_date,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.session_notes enable row level security;

create policy "notes_all" on public.session_notes
  using (psychologist_id in (select id from public.psychologists where user_id = auth.uid()))
  with check (psychologist_id in (select id from public.psychologists where user_id = auth.uid()));

-- ============================================================
-- STORAGE: logos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict do nothing;

create policy "logos_public_read" on storage.objects for select using (bucket_id = 'logos');
create policy "logos_auth_insert" on storage.objects for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');
create policy "logos_owner_update" on storage.objects for update using (bucket_id = 'logos' and auth.uid() = owner);
create policy "logos_owner_delete" on storage.objects for delete using (bucket_id = 'logos' and auth.uid() = owner);

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
create or replace function handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger psychologists_updated_at before update on public.psychologists for each row execute procedure handle_updated_at();
create trigger patients_updated_at       before update on public.patients       for each row execute procedure handle_updated_at();
create trigger appointments_updated_at   before update on public.appointments   for each row execute procedure handle_updated_at();
create trigger session_notes_updated_at  before update on public.session_notes  for each row execute procedure handle_updated_at();

-- ============================================================
-- TRIGGER: crear perfil al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.psychologists (user_id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Profesional'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_appointments_psychologist on public.appointments(psychologist_id);
create index idx_appointments_patient      on public.appointments(patient_id);
create index idx_appointments_scheduled    on public.appointments(scheduled_at);
create index idx_appointments_status       on public.appointments(status);
create index idx_appointments_token        on public.appointments(confirmation_token);
create index idx_patients_psychologist     on public.patients(psychologist_id);
create index idx_notes_psychologist        on public.session_notes(psychologist_id);
create index idx_notes_patient             on public.session_notes(patient_id);
