-- Fixes a bug from Phase 0: generate_join_code()'s local variable was
-- named `code`, which collides with the subjects.code column, so
-- Postgres can't tell them apart ("column reference \"code\" is
-- ambiguous"). This only surfaced now that Phase 2 actually inserts
-- subjects and the join_code DEFAULT fires for the first time.
--
-- Safe to run anytime — CREATE OR REPLACE, no data changes.

create or replace function public.generate_join_code()
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
