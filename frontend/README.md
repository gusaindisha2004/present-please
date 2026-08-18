# Present Please! — frontend

React + TypeScript + Vite app. Talks directly to Supabase for all normal
data (auth, subjects, enrollments, attendance history) under row-level
security; talks to the FastAPI backend only for AI work (face/voice
enrollment, attendance scans, face login). See the
[root README](../README.md) for the full picture and
[`backend/README.md`](../backend/README.md) for the API it calls.

## Setup

```bash
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your Supabase
project's values (Project Settings → API) plus the backend's URL:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
VITE_API_URL=http://localhost:8000
```

`VITE_SUPABASE_PUBLISHABLE_KEY` is the **anon/publishable** key, not the
`service_role` key — that one belongs only in the backend's `.env`, never
here.

## Run

```bash
npm run dev
```

Opens on `http://localhost:5173`. The backend (see
[`backend/README.md`](../backend/README.md)) and the Supabase SQL setup
(see [`supabase/README.md`](../supabase/README.md)) both need to be
running/applied first for the app to actually work — auth and normal
data will work without the backend, but anything face/voice-related
(enrollment, scans, face login) needs it.

## Checks

```bash
npx tsc -b      # type-check
npm run lint    # oxlint
npm run build   # production build
```

## Notes for contributors

- `createClient` in `src/lib/supabase.ts` is intentionally **not**
  generic (`createClient<Database>(...)`) — see the comment there for
  why. Row types are annotated manually at each call site instead.
- Don't re-add Redux/Zustand, an ORM, or a second data-fetching layer —
  TanStack Query is installed and available, but plain `useEffect` +
  Supabase calls is the established pattern across existing pages.
