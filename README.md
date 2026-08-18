# Present Please!

AI-powered classroom attendance — teachers point a camera or record a
roll-call, AI drafts who's present, the teacher reviews and confirms
before anything is saved. Students enroll their face and voice, join
classes with a code, and can sign in with their face instead of a
password.

A ground-up React + FastAPI + Supabase rewrite of an earlier Streamlit
prototype ("SnapClass") — same recognition pipelines, a proper web stack
around them.

## What it does

**Teachers** create subjects, share a join code, and take attendance two
ways:

- **Face** — capture one or more classroom photos; a linear-SVC classifier
  narrows the candidate, a Euclidean-distance check against the student's
  stored face embedding confirms the match.
- **Voice** — record a roll-call clip; it's split on silence, and each
  segment is matched against enrolled students by cosine similarity on
  Resemblyzer voice embeddings.

Either way, AI only ever produces a **draft**. The teacher sees an
editable present/absent table — confidence, method, which photo matched
whom — and nothing is written to the database until they confirm. After
that, they can review every past session per subject and export any
session to CSV.

**Students** enroll a few face photos and a short voice clip, join
subjects with a code from their teacher, sign in with their face instead
of a password, and see their own attendance history per subject.

## Architecture

The React app talks **directly to Supabase** for all normal data — auth,
subjects, enrollments, attendance history — under row-level security. It
talks to the **FastAPI backend only for AI work**: enrolling a face/voice
sample, scanning a classroom photo or roll-call recording, and face
login. The backend holds the Supabase `service_role` key and is the only
thing that can read biometric embeddings; those tables have RLS enabled
with zero policies, so every other client is denied by default.

```
React (Vite)  ──────────────►  Supabase (Postgres + Auth + Storage, RLS)
     │
     └──── AI only ──────────►  FastAPI  ──service_role──►  Supabase
```

Face login works without ever emailing a link: the backend matches the
face, then mints a Supabase magic-link token server-side, and the
frontend exchanges it for a real session via
`supabase.auth.verifyOtp(...)`.

## Tech stack

- **Frontend** — React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui,
  React Router, react-hook-form + zod.
- **Backend** — FastAPI, PyJWT (verifies Supabase JWTs via JWKS),
  supabase-py.
- **AI** — dlib + face_recognition_models + scikit-learn (face);
  resemblyzer + librosa + torch (voice).
- **Database / Auth / Storage** — Supabase (Postgres, Auth, Storage, RLS).

## Structure

- `frontend/` — the web app. See [`frontend/README.md`](frontend/README.md).
- `backend/` — the AI service. See [`backend/README.md`](backend/README.md).
- `supabase/` — schema + RLS SQL and the order to run it in. See
  [`supabase/README.md`](supabase/README.md).

## Running it locally

1. Create a Supabase project, then run the SQL in `supabase/` in order —
   see [`supabase/README.md`](supabase/README.md).
2. Set up and run the backend — see
   [`backend/README.md`](backend/README.md). It needs `SUPABASE_URL`,
   `SUPABASE_SECRET_KEY` (the `service_role` key), and `SUPABASE_JWKS_URL`
   in `backend/.env`.
3. Set up and run the frontend — see
   [`frontend/README.md`](frontend/README.md). It needs `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` (the anon/publishable key), and
   `VITE_API_URL` (the backend's URL) in `frontend/.env.local`.

Both `.env` files are gitignored — copy the checked-in `.env.example`
next to each and fill in your own Supabase project's values.

## Build status

Phases 0–8 are complete: auth, subjects & enrollment, face + voice AI
enrollment and face login, face attendance (scan → review → save), voice
attendance, teacher and student attendance history with CSV export, and
a documentation/polish pass. See `git log` for the phase-by-phase commit
history.

Not yet built: cross-subject/aggregate reports, and a deployed instance
(this has only run locally so far).

## Known limitations

- Voice matching has only been validated with synthetic tones, not real
  human voices in a live classroom.
- Deleting a Supabase auth user cascades their database rows but not
  their objects in the `student-photos` storage bucket — a manual
  cleanup step for now.
- The frontend's production bundle exceeds Vite's default 500KB
  chunk-size warning; no code-splitting has been introduced yet.
