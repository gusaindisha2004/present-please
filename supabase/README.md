# Database setup

Run these in the Supabase SQL Editor (Project → SQL Editor → New query),
in order, against your project (`tbazxjxzyhyeuaxeftsk`).

1. **`000_drop_old_schema.sql`** — drops the old `teachers` / `students` /
   `subjects` / `subject_students` / `attendance_logs` tables from the
   original Streamlit app.
   **This is destructive.** The new schema's `subjects` table has the same
   name as the old one, so this step isn't really optional — it has to run
   before step 2 or `schema.sql` will fail with "relation already exists".
   If you have real data in the old tables you want to keep, export it
   first (Table Editor → export CSV).

2. **`schema.sql`** — creates the new tables (`profiles`, `subjects`,
   `enrollments`, `attendance_sessions`, `attendance_records`,
   `student_faces`, `student_voices`), the join-code generator, the
   auto-profile-on-signup trigger, and the private `student-photos`
   storage bucket.

3. **`policies.sql`** — enables row-level security and adds every policy.
   Biometric tables (`student_faces`, `student_voices`) get RLS enabled
   with **no** policies at all, which means every client request to them
   is denied — only the backend's `service_role` key (which bypasses RLS)
   can touch them.

## After running the SQL

In **Authentication → Settings**, you may want to turn off "Confirm email"
for local development so signup logs you in immediately (turn it back on
before sharing the deployed link). No other auth configuration is needed —
`profiles` rows are created automatically by the `on_auth_user_created`
trigger, reading `role` / `full_name` / `roll_number` from the signup
metadata the frontend sends.
