import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/types/database"

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode
  requiredRole: Role
}) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?role=${requiredRole}`} replace />
  }

  if (profile && profile.role !== requiredRole) {
    return <Navigate to={profile.role === "teacher" ? "/t" : "/s"} replace />
  }

  return <>{children}</>
}
