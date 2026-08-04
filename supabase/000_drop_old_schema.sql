-- OPTIONAL. Run this FIRST, only if you want to remove the old
-- SnapClass-era tables (teachers, students, subjects, subject_students,
-- attendance_logs) before applying the new schema. Skip it if you'd rather
-- keep the old tables around for reference / already backed up their data.
--
-- This is destructive and cannot be undone — make sure you don't need
-- anything in these tables first.

drop table if exists public.attendance_logs cascade;
drop table if exists public.subject_students cascade;
drop table if exists public.subjects cascade;
drop table if exists public.students cascade;
drop table if exists public.teachers cascade;
