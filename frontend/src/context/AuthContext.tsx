import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"
import type { Profile } from "@/types/database"

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return data as Profile | null
}

// Every real account has a profile row, created by the handle_new_user
// trigger at signup — a session whose profile is missing means the
// account was deleted elsewhere while this browser still held a valid
// token. Treat that as signed out instead of letting ProtectedRoute's
// role check silently no-op for a null profile.
async function resolveSession(
  newSession: Session | null
): Promise<{ session: Session | null; profile: Profile | null }> {
  if (!newSession?.user) return { session: newSession, profile: null }

  const fetchedProfile = await fetchProfile(newSession.user.id)
  if (!fetchedProfile) {
    await supabase.auth.signOut()
    return { session: null, profile: null }
  }

  return { session: newSession, profile: fetchedProfile }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const resolved = await resolveSession(data.session)
      if (!active) return
      setSession(resolved.session)
      setProfile(resolved.profile)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return
        const resolved = await resolveSession(newSession)
        if (!active) return
        setSession(resolved.session)
        setProfile(resolved.profile)
        setLoading(false)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (session?.user) setProfile(await fetchProfile(session.user.id))
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
