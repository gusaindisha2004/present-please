# Present Please!

AI-powered classroom attendance — face and voice recognition, built as a
React + FastAPI + Supabase rewrite of an earlier Streamlit prototype.

## Structure

- `frontend/` — React + TypeScript + Tailwind + shadcn/ui (Vite). Talks
  directly to Supabase for all normal data; talks to the backend only for
  AI work.
- `backend/` — FastAPI. Face recognition (dlib) and voice recognition
  (Resemblyzer), ported from the original pipelines. Holds the
  `service_role` key so it's the only thing that can read biometric
  embeddings.
- `supabase/` — schema + row-level-security SQL. See `supabase/README.md`
  for setup order.

## Setup

1. Run the SQL in `supabase/` (see `supabase/README.md`).
2. `cd backend`, follow `backend/README.md`.
3. `cd frontend && npm install && npm run dev`.

Full setup + architecture docs land in the last build phase.
