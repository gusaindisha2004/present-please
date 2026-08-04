-- Present Please! — row level security
-- Run after schema.sql. Short on purpose: a handful of SECURITY DEFINER
-- helper functions do the membership checks, so every policy below reads
-- as one line and there's no risk of recursive-RLS surprises.

-- =========================================================
-- helper functions (bypass RLS themselves; used *inside* policies)
-- =========================================================
create function public.owns_subject(sub_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subjects where id = sub_id and teacher_id = auth.uid()
  );
$$;

create function public.is_enrolled(sub_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments
    where subject_id = sub_id and student_id = auth.uid()
  );
$$;

create function public.owns_session(sess_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.attendance_sessions s
    where s.id = sess_id and public.owns_subject(s.subject_id)
  );
$$;

create function public.enrolled_session(sess_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.attendance_sessions s
    where s.id = sess_id and public.is_enrolled(s.subject_id)
  );
$$;

-- =========================================================
-- enable RLS everywhere (student_faces / student_voices get no policies
-- below, which — with RLS enabled — denies all client access to them)
-- =========================================================
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.student_faces enable row level security;
alter table public.student_voices enable row level security;

-- =========================================================
-- profiles
-- No biometric or password data lives here, just name/role/email, so a
-- shared classroom app can afford to let any signed-in user read it.
-- =========================================================
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- inserts happen only via the handle_new_user trigger (SECURITY DEFINER),
-- so no insert policy is needed for normal clients.

-- =========================================================
-- subjects
-- =========================================================
create policy "subjects_select_teacher_or_enrolled"
  on public.subjects for select
  to authenticated
  using (teacher_id = auth.uid() or public.is_enrolled(id));

create policy "subjects_insert_own"
  on public.subjects for insert
  to authenticated
  with check (teacher_id = auth.uid());

create policy "subjects_update_own"
  on public.subjects for update
  to authenticated
  using (teacher_id = auth.uid());

create policy "subjects_delete_own"
  on public.subjects for delete
  to authenticated
  using (teacher_id = auth.uid());

-- =========================================================
-- enrollments
-- =========================================================
create policy "enrollments_select_own_or_teacher"
  on public.enrollments for select
  to authenticated
  using (student_id = auth.uid() or public.owns_subject(subject_id));

create policy "enrollments_insert_self"
  on public.enrollments for insert
  to authenticated
  with check (student_id = auth.uid());

create policy "enrollments_delete_own_or_teacher"
  on public.enrollments for delete
  to authenticated
  using (student_id = auth.uid() or public.owns_subject(subject_id));

-- =========================================================
-- attendance_sessions
-- =========================================================
create policy "sessions_select_teacher_or_enrolled"
  on public.attendance_sessions for select
  to authenticated
  using (public.owns_subject(subject_id) or public.is_enrolled(subject_id));

create policy "sessions_insert_teacher"
  on public.attendance_sessions for insert
  to authenticated
  with check (public.owns_subject(subject_id) and taken_by = auth.uid());

create policy "sessions_update_teacher"
  on public.attendance_sessions for update
  to authenticated
  using (public.owns_subject(subject_id));

create policy "sessions_delete_teacher"
  on public.attendance_sessions for delete
  to authenticated
  using (public.owns_subject(subject_id));

-- =========================================================
-- attendance_records
-- =========================================================
create policy "records_select_own_or_teacher"
  on public.attendance_records for select
  to authenticated
  using (student_id = auth.uid() or public.owns_session(session_id));

create policy "records_insert_teacher"
  on public.attendance_records for insert
  to authenticated
  with check (public.owns_session(session_id));

create policy "records_update_teacher"
  on public.attendance_records for update
  to authenticated
  using (public.owns_session(session_id));

create policy "records_delete_teacher"
  on public.attendance_records for delete
  to authenticated
  using (public.owns_session(session_id));

-- student_faces / student_voices: RLS is enabled above with no policies,
-- so every client request is denied. Only the backend's service_role key
-- (which bypasses RLS entirely) can read or write these tables.

-- =========================================================
-- storage — student-photos bucket
-- Students upload into their own uuid-prefixed folder; only the backend
-- (service_role) reads them back for enrollment processing.
-- =========================================================
create policy "student_photos_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "student_photos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "student_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
