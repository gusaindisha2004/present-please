-- Present Please! — branch & year on a timetable slot
-- Run this in the Supabase SQL Editor after 003_timetable.sql.
--
-- A teacher teaches the same subject to different groups: CSE 2nd year in
-- one slot, AIML 3rd year in another. Branch and year describe *which group
-- is in the room*, so they belong to the slot rather than to the subject.
--
-- Both columns are nullable: slots created before this migration keep
-- working and simply show no group label.
--
-- scheduled_classes gets its own copy, the same way it copies room — an
-- occurrence is a snapshot, so editing a slot later can't silently rewrite
-- the history of classes that already happened.

alter table public.timetable_slots
  add column branch text
    check (branch in ('CSE', 'ECE', 'AIML', 'AIDS', 'IIOT')),
  add column year smallint
    check (year between 1 and 4);

alter table public.scheduled_classes
  add column branch text
    check (branch in ('CSE', 'ECE', 'AIML', 'AIDS', 'IIOT')),
  add column year smallint
    check (year between 1 and 4);
