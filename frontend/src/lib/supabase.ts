import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in the frontend environment"
  )
}

// NOTE: not passing the generated Database type here. The installed
// @supabase/supabase-js (2.112.0) has a generic-resolution bug where
// createClient<Database>(...) collapses every query builder's row type to
// `never` (reproduced with a minimal, textbook-correct Database type too —
// this isn't specific to our schema). Query results are typed manually at
// each call site instead (see src/types/database.ts for the row shapes).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
