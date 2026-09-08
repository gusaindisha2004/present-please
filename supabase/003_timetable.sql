-- Present Please! — timetable & scheduled classes
-- Run this in the Supabase SQL Editor after schema.sql and policies.sql.
--
-- Adds the "this class is supposed to happen" layer that sits between a
-- subject and an attendance session:
--
--   subject -> timetable_slot (recurring) -> scheduled_class (one date)
--           -> attendance_session (only once attendance is actually taken)
--
-- Nothing here changes how attendance itself works. attendance_sessions
-- gains one nullable column pointing back at the class it was taken for,
-- so attendance taken ad-hoc (no timetable) keeps working exactly as it
-- does today.

-- =========================================================
-- timetable_slots — a recurring weekly slot for a subject
-- =========================================================
create table public.timetable_slots (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time   time not null,
  end_time     time not null,
  room         text,
  created_at   timestamptz not null default now(),
  check (end_time > start_time),
  unique (subject_id, day_of_week, start_time)
);

-- =========================================================
-- scheduled_classes — one concrete occurrence on one date
--
-- Only 'scheduled' vs 'cancelled' is stored. Upcoming / attendance
-- pending / completed are *derived* at read time from the class date,
-- the current time, and whether an attendance session exists — so they
-- can never drift out of sync with reality.
-- =========================================================
create table public.scheduled_classes (
  id             uuid primary key default gen_random_uuid(),
  subject_id     uuid not null references public.subjects (id) on delete cascade,
  slot_id        uuid references public.timetable_slots (id) on delete set null,
  class_date     date not null,
  start_time     time not null,
  end_time       time not null,
  room           text,
  status         text not null default 'scheduled'
                   check (status in ('scheduled', 'cancelled')),
  cancel_reason  text,
  created_at     timestamptz not null default now(),
  unique (subject_id, class_date, start_time)
);

-- =========================================================
-- link an attendance session to the class it was taken for.
-- Nullable, so existing/ad-hoc sessions are unaffected. Unique, so one
-- scheduled class can never end up with two attendance sessions.
-- =========================================================
alter table public.attendance_sessions
  add column scheduled_class_id uuid unique
    references public.scheduled_classes (id) on delete set null;

-- =========================================================
-- indexes
-- =========================================================
create index idx_slots_subject on public.timetable_slots (subject_id);
create index idx_scheduled_subject on public.scheduled_classes (subject_id);
create index idx_scheduled_date on public.scheduled_classes (class_date);

-- =========================================================
-- row-level security — same ownership rules as the rest of the app:
-- a teacher manages the rows belonging to subjects they own, an
-- enrolled student may read them.
-- =========================================================
alter table public.timetable_slots enable row level security;
alter table public.scheduled_classes enable row level security;

create policy "slots_select_teacher_or_enrolled"
  on public.timetable_slots for select
  to authenticated
  using (public.owns_subject(subject_id) or public.is_enrolled(subject_id));

create policy "slots_insert_teacher"
  on public.timetable_slots for insert
  to authenticated
  with check (public.owns_subject(subject_id));

create policy "slots_update_teacher"
  on public.timetable_slots for update
  to authenticated
  using (public.owns_subject(subject_id));

create policy "slots_delete_teacher"
  on public.timetable_slots for delete
  to authenticated
  using (public.owns_subject(subject_id));

create policy "scheduled_select_teacher_or_enrolled"
  on public.scheduled_classes for select
  to authenticated
  using (public.owns_subject(subject_id) or public.is_enrolled(subject_id));

create policy "scheduled_insert_teacher"
  on public.scheduled_classes for insert
  to authenticated
  with check (public.owns_subject(subject_id));

create policy "scheduled_update_teacher"
  on public.scheduled_classes for update
  to authenticated
  using (public.owns_subject(subject_id));

create policy "scheduled_delete_teacher"
  on public.scheduled_classes for delete
  to authenticated
  using (public.owns_subject(subject_id));
