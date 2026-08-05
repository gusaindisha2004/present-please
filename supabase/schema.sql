-- Present Please! — database schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- Replaces the old teachers/students/subjects/subject_students/attendance_logs schema.

create extension if not exists pgcrypto;

-- =========================================================
-- profiles — one row per auth.users row, created by trigger
-- =========================================================
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('teacher', 'student')),
  full_name    text not null default '',
  email        text not null,
  roll_number  text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- Expects role/full_name/roll_number to be passed as auth signup metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, roll_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'roll_number'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- subjects
-- =========================================================
create table public.subjects (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  code        text not null,
  name        text not null,
  section     text not null default '',
  join_code   text not null unique,
  created_at  timestamptz not null default now(),
  unique (teacher_id, code)
);

-- 6-character, unambiguous (no 0/O/1/I) join code, collision-checked.
create function public.generate_join_code()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  taken boolean;
begin
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from public.subjects where subjects.join_code = new_code) into taken;
    exit when not taken;
  end loop;
  return new_code;
end;
$$;

alter table public.subjects
  alter column join_code set default public.generate_join_code();

-- =========================================================
-- enrollments — student <-> subject
-- =========================================================
create table public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (subject_id, student_id)
);

-- =========================================================
-- attendance_sessions — one "class taken" event
-- =========================================================
create table public.attendance_sessions (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid not null references public.subjects (id) on delete cascade,
  taken_by    uuid not null references public.profiles (id),
  method      text not null check (method in ('face', 'voice', 'manual')),
  taken_at    timestamptz not null default now(),
  note        text
);

-- =========================================================
-- attendance_records — per-student result within a session
-- =========================================================
create table public.attendance_records (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.attendance_sessions (id) on delete cascade,
  student_id   uuid not null references public.profiles (id) on delete cascade,
  is_present   boolean not null default false,
  detected_by  text check (detected_by in ('face', 'voice', 'manual')),
  confidence   float8,
  unique (session_id, student_id)
);

-- =========================================================
-- student_faces / student_voices — biometric embeddings.
-- No RLS policies are defined for these tables further down, which means
-- (with RLS enabled) NO client, however authenticated, can read or write
-- them. Only the backend service, using the service_role key, can.
-- =========================================================
create table public.student_faces (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  embedding   float8[] not null,
  image_path  text,
  created_at  timestamptz not null default now()
);

create table public.student_voices (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  embedding   float8[] not null,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- indexes
-- =========================================================
create index idx_subjects_teacher on public.subjects (teacher_id);
create index idx_enrollments_student on public.enrollments (student_id);
create index idx_enrollments_subject on public.enrollments (subject_id);
create index idx_sessions_subject on public.attendance_sessions (subject_id);
create index idx_records_session on public.attendance_records (session_id);
create index idx_records_student on public.attendance_records (student_id);
create index idx_faces_student on public.student_faces (student_id);
create index idx_voices_student on public.student_voices (student_id);

-- =========================================================
-- storage — private bucket for enrollment photos (raw images, not embeddings)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false)
on conflict (id) do nothing;
