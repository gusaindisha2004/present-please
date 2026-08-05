import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Loader2, BookOpen, CheckCircle2, SearchX } from "lucide-react"
import { toast } from "sonner"

import { apiFetch, ApiError } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DotGridBackground } from "@/components/decoration/DotGridBackground"
import { Logo } from "@/components/branding/Logo"
import { BlobIllustration } from "@/components/illustrations/BlobIllustration"

interface SubjectLookup {
  id: string
  name: string
  code: string
  section: string
}

type Status = "loading" | "ready" | "already" | "not-found"

export default function JoinByCodePage() {
  const { code } = useParams<{ code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState<Status>("loading")
  const [subject, setSubject] = useState<SubjectLookup | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!code || !user) return

    let active = true
    ;(async () => {
      try {
        const found = await apiFetch<SubjectLookup>(
          `/api/subjects/lookup/${encodeURIComponent(code)}`
        )
        if (!active) return
        setSubject(found)

        const { data: existing } = await supabase
          .from("enrollments")
          .select("id")
          .eq("subject_id", found.id)
          .eq("student_id", user.id)
          .maybeSingle()

        if (!active) return
        setStatus(existing ? "already" : "ready")
      } catch (error) {
        if (!active) return
        setStatus(error instanceof ApiError ? "not-found" : "not-found")
      }
    })()

    return () => {
      active = false
    }
  }, [code, user])

  const handleJoin = async () => {
    if (!subject || !user) return
    setJoining(true)

    const { error } = await supabase
      .from("enrollments")
      .insert({ subject_id: subject.id, student_id: user.id })

    setJoining(false)

    if (error) {
      toast.error("Couldn't enroll — please try again")
      return
    }

    toast.success(`Joined ${subject.name}!`)
    navigate("/s/subjects", { replace: true })
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <DotGridBackground className="-z-10" />

      <Link to="/">
        <Logo />
      </Link>

      <Card className="w-full max-w-sm rounded-2xl">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="text-primary size-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Looking up your class…
              </p>
            </>
          )}

          {status === "not-found" && (
            <>
              <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
                <SearchX className="size-6" strokeWidth={1.75} />
              </span>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Class not found
                </h1>
                <p className="text-muted-foreground mt-1 text-sm text-balance">
                  That join code doesn't match any subject. Double-check the
                  link or code with your teacher.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/s/subjects">Go to your subjects</Link>
              </Button>
            </>
          )}

          {status === "already" && subject && (
            <>
              <span className="bg-success/15 text-success flex size-14 items-center justify-center rounded-2xl">
                <CheckCircle2 className="size-6" strokeWidth={1.75} />
              </span>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Already enrolled
                </h1>
                <p className="text-muted-foreground mt-1 text-sm text-balance">
                  You're already part of <strong>{subject.name}</strong>.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/s/subjects">Go to your subjects</Link>
              </Button>
            </>
          )}

          {status === "ready" && subject && (
            <>
              <BlobIllustration icon={BookOpen} className="scale-75" />
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  You've been invited to join
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight">
                  {subject.name}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {subject.code} · Section {subject.section}
                </p>
              </div>
              <Button onClick={handleJoin} disabled={joining} className="w-full">
                {joining && <Loader2 className="animate-spin" />}
                Join this class
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
