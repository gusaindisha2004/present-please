import { supabase } from "@/lib/supabase"

const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {}

// Thin wrapper for the handful of things the backend does that Supabase's
// client-side RLS can't (see backend/app/routers/subjects.py for why).
// Attaches the current Supabase session as a bearer token.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(body?.detail ?? `Request failed (${response.status})`)
  }

  return response.json()
}
